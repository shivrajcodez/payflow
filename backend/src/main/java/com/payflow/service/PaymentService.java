package com.payflow.service;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.request.CreateRefundRequest;
import com.payflow.dto.response.AnalyticsResponse;
import com.payflow.dto.response.PagedResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.RefundResponse;
import com.payflow.entity.User;
import com.payflow.enums.Currency;
import com.payflow.enums.PaymentStatus;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface PaymentService {
    PaymentResponse createPayment(CreatePaymentRequest request, User user, String ipAddress);
    RefundResponse refundPayment(UUID paymentId, CreateRefundRequest request, User user);
    PaymentResponse getPayment(UUID paymentId, User user);
    PagedResponse<PaymentResponse> getPayments(User user, PaymentStatus status, Currency currency,
        Instant from, Instant to, BigDecimal minAmount, BigDecimal maxAmount, String query, Pageable pageable);
    PagedResponse<PaymentResponse> getAllPayments(Pageable pageable);
    List<RefundResponse> getPaymentRefunds(UUID paymentId, User user);
    AnalyticsResponse getAnalytics();
}
