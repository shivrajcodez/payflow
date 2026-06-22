package com.payflow.service.impl;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.request.CreateRefundRequest;
import com.payflow.dto.response.AnalyticsResponse;
import com.payflow.dto.response.PagedResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.RefundResponse;
import com.payflow.entity.*;
import com.payflow.enums.*;
import com.payflow.event.PaymentEvent;
import com.payflow.exception.PayFlowException;
import com.payflow.repository.*;
import com.payflow.service.FraudDetectionService;
import com.payflow.service.NotificationService;
import com.payflow.service.PaymentService;
import com.payflow.util.ReferenceGenerator;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static com.payflow.config.KafkaConfig.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private static final BigDecimal PROCESSING_FEE_RATE = new BigDecimal("0.029");
    private static final BigDecimal PROCESSING_FEE_FIXED = new BigDecimal("0.30");

    private final PaymentRepository paymentRepository;
    private final RefundRepository refundRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final FraudDetectionService fraudDetectionService;
    private final NotificationService notificationService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    @Transactional
    @CircuitBreaker(name = "paymentService", fallbackMethod = "createPaymentFallback")
    @Retry(name = "paymentService")
    @CacheEvict(value = {"payments", "analytics"}, allEntries = true)
    public PaymentResponse createPayment(CreatePaymentRequest request, User user, String ipAddress) {
        // Idempotency check
        if (request.getIdempotencyKey() != null) {
            Optional<Payment> existing = paymentRepository.findByIdempotencyKey(request.getIdempotencyKey());
            if (existing.isPresent()) {
                log.info("Returning existing payment for idempotency key: {}", request.getIdempotencyKey());
                return mapToPaymentResponse(existing.get());
            }
        }

        // Fraud check
        int riskScore = fraudDetectionService.calculateRiskScore(request, user, ipAddress);
        FraudRiskLevel riskLevel = fraudDetectionService.getRiskLevel(riskScore);

        if (riskLevel == FraudRiskLevel.CRITICAL) {
            throw PayFlowException.forbidden("Transaction blocked due to high fraud risk");
        }

        // Calculate fees
        BigDecimal processingFee = request.getAmount()
            .multiply(PROCESSING_FEE_RATE)
            .add(PROCESSING_FEE_FIXED)
            .setScale(4, RoundingMode.HALF_UP);
        BigDecimal netAmount = request.getAmount().subtract(processingFee);

        Payment payment = Payment.builder()
            .paymentReference(ReferenceGenerator.generatePaymentReference())
            .user(user)
            .amount(request.getAmount())
            .currency(request.getCurrency())
            .status(PaymentStatus.PENDING)
            .paymentMethod(request.getPaymentMethod())
            .description(request.getDescription())
            .idempotencyKey(request.getIdempotencyKey())
            .customerEmail(request.getCustomerEmail())
            .customerName(request.getCustomerName())
            .cardLastFour(request.getCardLastFour())
            .cardBrand(request.getCardBrand())
            .cardExpMonth(request.getCardExpMonth())
            .cardExpYear(request.getCardExpYear())
            .bankAccountLastFour(request.getBankAccountLastFour())
            .bankName(request.getBankName())
            .webhookUrl(request.getWebhookUrl())
            .statementDescriptor(request.getStatementDescriptor())
            .processingFee(processingFee)
            .netAmount(netAmount)
            .ipAddress(ipAddress)
            .riskScore(riskScore)
            .expiresAt(Instant.now().plus(30, ChronoUnit.MINUTES))
            .build();

        payment = paymentRepository.save(payment);

        // Save fraud flag if medium or higher risk
        if (riskLevel != FraudRiskLevel.LOW) {
            fraudDetectionService.saveFraudFlag(payment, user, riskScore, riskLevel, ipAddress);
        }

        // Process payment asynchronously (simulate gateway call)
        processPaymentAsync(payment);

        // Publish event to Kafka
        publishPaymentEvent(payment, PaymentEvent.PAYMENT_CREATED);

        log.info("Payment created: {} for user: {} amount: {} {}", 
            payment.getPaymentReference(), user.getEmail(), request.getAmount(), request.getCurrency());

        return mapToPaymentResponse(payment);
    }

    @Async("paymentExecutor")
    @Transactional
    public void processPaymentAsync(Payment payment) {
        try {
            Thread.sleep(500 + new Random().nextInt(1000)); // Simulate gateway latency

            payment.setStatus(PaymentStatus.PROCESSING);
            paymentRepository.save(payment);

            Thread.sleep(200 + new Random().nextInt(500));

            // Simulate 92% success rate
            boolean success = new Random().nextDouble() > 0.08;

            if (success) {
                payment.setStatus(PaymentStatus.COMPLETED);
                payment.setGatewayTransactionId(ReferenceGenerator.generateGatewayTransactionId());
                payment.setProcessedAt(Instant.now());
                payment.setReceiptUrl("https://payflow.dev/receipts/" + payment.getPaymentReference());
                paymentRepository.save(payment);

                createTransaction(payment, null, TransactionType.PAYMENT);
                notificationService.notifyPaymentSuccess(payment);
                publishPaymentEvent(payment, PaymentEvent.PAYMENT_COMPLETED);
                log.info("Payment completed: {}", payment.getPaymentReference());
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                payment.setFailureCode("card_declined");
                payment.setFailureMessage("Your card was declined. Please try a different payment method.");
                paymentRepository.save(payment);

                notificationService.notifyPaymentFailed(payment);
                publishPaymentEvent(payment, PaymentEvent.PAYMENT_FAILED);
                log.warn("Payment failed: {}", payment.getPaymentReference());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Payment processing interrupted: {}", payment.getPaymentReference());
        } catch (Exception e) {
            log.error("Payment processing error for {}: {}", payment.getPaymentReference(), e.getMessage());
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureCode("processing_error");
            payment.setFailureMessage("An error occurred during payment processing");
            paymentRepository.save(payment);
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = {"payments", "analytics"}, allEntries = true)
    public RefundResponse refundPayment(UUID paymentId, CreateRefundRequest request, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> PayFlowException.notFound("Payment not found"));

        if (!payment.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Cannot refund another user's payment");
        }

        if (!payment.isRefundable()) {
            throw PayFlowException.unprocessable(
                "Payment cannot be refunded. Current status: " + payment.getStatus());
        }

        BigDecimal refundAmount = request.getAmount() != null ? request.getAmount() : payment.getNetAmount();
        BigDecimal alreadyRefunded = refundRepository.sumRefundedAmountByPayment(payment)
            .orElse(BigDecimal.ZERO);
        BigDecimal refundableAmount = payment.getAmount().subtract(alreadyRefunded);

        if (refundAmount.compareTo(refundableAmount) > 0) {
            throw PayFlowException.badRequest(
                "Refund amount exceeds refundable amount. Maximum refundable: " + refundableAmount);
        }

        Refund refund = Refund.builder()
            .refundReference(ReferenceGenerator.generateRefundReference())
            .payment(payment)
            .user(user)
            .amount(refundAmount)
            .currency(payment.getCurrency())
            .status(RefundStatus.PENDING)
            .reason(request.getReason())
            .notes(request.getNotes())
            .initiatedBy(user)
            .build();

        refund = refundRepository.save(refund);

        // Update payment status
        if (refundAmount.compareTo(payment.getAmount()) >= 0) {
            payment.setStatus(PaymentStatus.REFUNDED);
        } else {
            payment.setStatus(PaymentStatus.PARTIALLY_REFUNDED);
        }
        paymentRepository.save(payment);

        // Process refund asynchronously
        processRefundAsync(refund, payment);

        log.info("Refund initiated: {} for payment: {}", refund.getRefundReference(), payment.getPaymentReference());
        return mapToRefundResponse(refund);
    }

    @Async("paymentExecutor")
    @Transactional
    public void processRefundAsync(Refund refund, Payment payment) {
        try {
            Thread.sleep(300 + new Random().nextInt(700));

            refund.setStatus(RefundStatus.COMPLETED);
            refund.setGatewayRefundId("rfd_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16));
            refund.setProcessedAt(Instant.now());
            refundRepository.save(refund);

            createTransaction(payment, refund, TransactionType.REFUND);
            notificationService.notifyRefundCompleted(refund);
            publishPaymentEvent(payment, PaymentEvent.REFUND_COMPLETED);
        } catch (Exception e) {
            log.error("Refund processing error: {}", e.getMessage());
            refund.setStatus(RefundStatus.FAILED);
            refund.setFailureMessage(e.getMessage());
            refundRepository.save(refund);
        }
    }

    @Override
    @Cacheable(value = "payments", key = "#paymentId")
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> PayFlowException.notFound("Payment not found"));

        if (!payment.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Access denied to this payment");
        }

        return mapToPaymentResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PaymentResponse> getPayments(User user, PaymentStatus status, Currency currency,
                                                       Instant from, Instant to, BigDecimal minAmount,
                                                       BigDecimal maxAmount, String query, Pageable pageable) {
        Page<Payment> payments = paymentRepository.findWithFilters(
            user, status, currency, from, to, minAmount, maxAmount, query, pageable);
        return PagedResponse.of(payments.map(this::mapToPaymentResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PaymentResponse> getAllPayments(Pageable pageable) {
        Page<Payment> payments = paymentRepository.findAllOrderByCreatedAtDesc(pageable);
        return PagedResponse.of(payments.map(this::mapToPaymentResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<RefundResponse> getPaymentRefunds(UUID paymentId, User user) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> PayFlowException.notFound("Payment not found"));

        if (!payment.getUser().getId().equals(user.getId()) && user.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Access denied");
        }

        return refundRepository.findByPayment(payment)
            .stream().map(this::mapToRefundResponse).toList();
    }

    @Override
    @Cacheable(value = "analytics", key = "'overview'")
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {
        Instant now = Instant.now();
        Instant monthStart = now.minus(30, ChronoUnit.DAYS);
        Instant prevMonthStart = now.minus(60, ChronoUnit.DAYS);
        Instant weekStart = now.minus(7, ChronoUnit.DAYS);

        BigDecimal totalRevenue = paymentRepository.sumCompletedAmountSince(Instant.EPOCH).orElse(BigDecimal.ZERO);
        BigDecimal revenueThisMonth = paymentRepository.sumCompletedAmountSince(monthStart).orElse(BigDecimal.ZERO);
        BigDecimal revenuePrevMonth = paymentRepository.sumCompletedAmountSince(prevMonthStart)
            .orElse(BigDecimal.ZERO).subtract(revenueThisMonth);

        double growthPercent = revenuePrevMonth.compareTo(BigDecimal.ZERO) > 0
            ? revenueThisMonth.subtract(revenuePrevMonth)
                .divide(revenuePrevMonth, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue()
            : 0.0;

        long totalPayments = paymentRepository.count();
        long successfulPayments = paymentRepository.countByStatusAndCreatedAtAfter(PaymentStatus.COMPLETED, Instant.EPOCH);
        long failedPayments = paymentRepository.countByStatusAndCreatedAtAfter(PaymentStatus.FAILED, Instant.EPOCH);
        long pendingPayments = paymentRepository.countByStatusAndCreatedAtAfter(PaymentStatus.PENDING, monthStart);

        double successRate = totalPayments > 0 ? (double) successfulPayments / totalPayments * 100 : 0.0;

        long totalUsers = userRepository.count();
        long newUsersThisMonth = userRepository.countNewUsersSince(monthStart);

        List<Object[]> rawDailyRevenue = paymentRepository.getDailyRevenueSince(weekStart);
        List<AnalyticsResponse.DailyRevenue> dailyRevenue = rawDailyRevenue.stream()
            .map(row -> AnalyticsResponse.DailyRevenue.builder()
                .date(row[0].toString())
                .revenue((BigDecimal) row[1])
                .count(((Number) row[2]).longValue())
                .build())
            .toList();

        List<Object[]> statusGroups = paymentRepository.countGroupedByStatus();
        Map<String, Long> paymentsByStatus = new LinkedHashMap<>();
        for (Object[] row : statusGroups) {
            paymentsByStatus.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        return AnalyticsResponse.builder()
            .totalRevenue(totalRevenue)
            .revenueThisMonth(revenueThisMonth)
            .revenueLastMonth(revenuePrevMonth)
            .revenueGrowthPercent(Math.round(growthPercent * 100.0) / 100.0)
            .totalPayments(totalPayments)
            .paymentsThisMonth(paymentRepository.countByStatusAndCreatedAtAfter(PaymentStatus.COMPLETED, monthStart))
            .successfulPayments(successfulPayments)
            .failedPayments(failedPayments)
            .pendingPayments(pendingPayments)
            .successRate(Math.round(successRate * 100.0) / 100.0)
            .totalUsers(totalUsers)
            .newUsersThisMonth(newUsersThisMonth)
            .dailyRevenue(dailyRevenue)
            .paymentsByStatus(paymentsByStatus)
            .build();
    }

    private void createTransaction(Payment payment, Refund refund, TransactionType type) {
        Transaction transaction = Transaction.builder()
            .transactionReference(ReferenceGenerator.generateTransactionReference())
            .user(payment.getUser())
            .payment(payment)
            .refund(refund)
            .type(type)
            .amount(refund != null ? refund.getAmount() : payment.getAmount())
            .currency(payment.getCurrency())
            .description(type == TransactionType.PAYMENT
                ? "Payment: " + payment.getPaymentReference()
                : "Refund: " + (refund != null ? refund.getRefundReference() : ""))
            .build();
        transactionRepository.save(transaction);
    }

    private void publishPaymentEvent(Payment payment, String eventType) {
        try {
            PaymentEvent event = PaymentEvent.builder()
                .eventId(ReferenceGenerator.generateEventId())
                .eventType(eventType)
                .paymentId(payment.getId())
                .paymentReference(payment.getPaymentReference())
                .userId(payment.getUser().getId())
                .userEmail(payment.getUser().getEmail())
                .amount(payment.getAmount())
                .currency(payment.getCurrency().name())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod().name())
                .customerEmail(payment.getCustomerEmail())
                .webhookUrl(payment.getWebhookUrl())
                .ipAddress(payment.getIpAddress())
                .riskScore(payment.getRiskScore())
                .occurredAt(Instant.now())
                .build();
            kafkaTemplate.send(PAYMENT_EVENTS_TOPIC, payment.getId().toString(), event);
        } catch (Exception e) {
            log.error("Failed to publish payment event: {}", e.getMessage());
        }
    }

    public PaymentResponse createPaymentFallback(CreatePaymentRequest request, User user, String ipAddress, Exception ex) {
        log.error("Circuit breaker triggered for payment creation: {}", ex.getMessage());
        throw PayFlowException.unprocessable("Payment service is temporarily unavailable. Please try again later.");
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
            .id(payment.getId())
            .paymentReference(payment.getPaymentReference())
            .amount(payment.getAmount())
            .currency(payment.getCurrency())
            .status(payment.getStatus())
            .paymentMethod(payment.getPaymentMethod())
            .description(payment.getDescription())
            .customerEmail(payment.getCustomerEmail())
            .customerName(payment.getCustomerName())
            .cardLastFour(payment.getCardLastFour())
            .cardBrand(payment.getCardBrand())
            .bankName(payment.getBankName())
            .failureCode(payment.getFailureCode())
            .failureMessage(payment.getFailureMessage())
            .processingFee(payment.getProcessingFee())
            .netAmount(payment.getNetAmount())
            .statementDescriptor(payment.getStatementDescriptor())
            .receiptUrl(payment.getReceiptUrl())
            .riskScore(payment.getRiskScore())
            .processedAt(payment.getProcessedAt())
            .createdAt(payment.getCreatedAt())
            .updatedAt(payment.getUpdatedAt())
            .build();
    }

    private RefundResponse mapToRefundResponse(Refund refund) {
        return RefundResponse.builder()
            .id(refund.getId())
            .refundReference(refund.getRefundReference())
            .paymentId(refund.getPayment().getId())
            .paymentReference(refund.getPayment().getPaymentReference())
            .amount(refund.getAmount())
            .currency(refund.getCurrency())
            .status(refund.getStatus())
            .reason(refund.getReason())
            .notes(refund.getNotes())
            .processedAt(refund.getProcessedAt())
            .createdAt(refund.getCreatedAt())
            .build();
    }
}
