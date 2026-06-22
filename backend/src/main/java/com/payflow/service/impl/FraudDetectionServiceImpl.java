package com.payflow.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.entity.FraudFlag;
import com.payflow.entity.Payment;
import com.payflow.entity.User;
import com.payflow.enums.FraudRiskLevel;
import com.payflow.repository.FraudFlagRepository;
import com.payflow.repository.PaymentRepository;
import com.payflow.service.FraudDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class FraudDetectionServiceImpl implements FraudDetectionService {

    private final PaymentRepository paymentRepository;
    private final FraudFlagRepository fraudFlagRepository;
    private final ObjectMapper objectMapper;

    @Value("${payflow.fraud.max-transactions-per-minute:5}")
    private int maxTransactionsPerMinute;

    @Value("${payflow.fraud.max-transaction-amount:50000}")
    private double maxTransactionAmount;

    @Value("${payflow.fraud.suspicious-amount-threshold:10000}")
    private double suspiciousAmountThreshold;

    @Override
    public int calculateRiskScore(CreatePaymentRequest request, User user, String ipAddress) {
        int score = 0;
        List<String> flags = new ArrayList<>();

        // Check 1: High transaction amount
        if (request.getAmount().compareTo(BigDecimal.valueOf(maxTransactionAmount)) > 0) {
            score += 40;
            flags.add("EXCEEDS_MAX_AMOUNT");
        } else if (request.getAmount().compareTo(BigDecimal.valueOf(suspiciousAmountThreshold)) > 0) {
            score += 20;
            flags.add("HIGH_AMOUNT");
        }

        // Check 2: High frequency from same user
        Instant oneMinuteAgo = Instant.now().minus(1, ChronoUnit.MINUTES);
        List<Payment> recentUserPayments = paymentRepository.findByUserAndCreatedAtAfter(user, oneMinuteAgo);
        if (recentUserPayments.size() >= maxTransactionsPerMinute) {
            score += 35;
            flags.add("HIGH_FREQUENCY_USER");
        }

        // Check 3: Rapid repeat same amount
        boolean hasDuplicateAmount = recentUserPayments.stream()
            .anyMatch(p -> p.getAmount().compareTo(request.getAmount()) == 0);
        if (hasDuplicateAmount && !recentUserPayments.isEmpty()) {
            score += 15;
            flags.add("DUPLICATE_AMOUNT");
        }

        // Check 4: Round number transactions (often fraudulent)
        if (request.getAmount().stripTrailingZeros().scale() <= 0 &&
            request.getAmount().compareTo(BigDecimal.valueOf(1000)) > 0) {
            score += 10;
            flags.add("ROUND_NUMBER_LARGE");
        }

        // Check 5: New account making large transaction
        if (user.getCreatedAt() != null) {
            long hoursSinceCreation = ChronoUnit.HOURS.between(user.getCreatedAt(), Instant.now());
            if (hoursSinceCreation < 24 && request.getAmount().compareTo(BigDecimal.valueOf(500)) > 0) {
                score += 20;
                flags.add("NEW_ACCOUNT_HIGH_VALUE");
            }
        }

        // Check 6: Missing customer info for large amount
        if (request.getAmount().compareTo(BigDecimal.valueOf(1000)) > 0 &&
            (request.getCustomerEmail() == null || request.getCustomerEmail().isBlank())) {
            score += 10;
            flags.add("MISSING_CUSTOMER_INFO");
        }

        log.debug("Fraud score for user {}: {} flags: {}", user.getEmail(), score, flags);
        return Math.min(score, 100);
    }

    @Override
    public FraudRiskLevel getRiskLevel(int riskScore) {
        if (riskScore >= 75) return FraudRiskLevel.CRITICAL;
        if (riskScore >= 50) return FraudRiskLevel.HIGH;
        if (riskScore >= 25) return FraudRiskLevel.MEDIUM;
        return FraudRiskLevel.LOW;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveFraudFlag(Payment payment, User user, int riskScore, FraudRiskLevel riskLevel, String ipAddress) {
        try {
            FraudFlag flag = FraudFlag.builder()
                .payment(payment)
                .user(user)
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .flags("{\"level\":\"" + riskLevel + "\",\"score\":" + riskScore + "}")
                .ipAddress(ipAddress)
                .autoBlocked(riskLevel == FraudRiskLevel.CRITICAL)
                .build();
            fraudFlagRepository.save(flag);
            log.warn("Fraud flag saved for payment: {} risk: {} score: {}",
                payment.getPaymentReference(), riskLevel, riskScore);
        } catch (Exception e) {
            log.error("Failed to save fraud flag: {}", e.getMessage());
        }
    }
}
