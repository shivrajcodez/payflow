package com.payflow.event;

import com.payflow.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent {
    private String eventId;
    private String eventType;
    private UUID paymentId;
    private String paymentReference;
    private UUID userId;
    private String userEmail;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String paymentMethod;
    private String customerEmail;
    private String webhookUrl;
    private String ipAddress;
    private Integer riskScore;
    private Instant occurredAt;

    public static final String PAYMENT_CREATED = "payment.created";
    public static final String PAYMENT_COMPLETED = "payment.completed";
    public static final String PAYMENT_FAILED = "payment.failed";
    public static final String PAYMENT_CANCELLED = "payment.cancelled";
    public static final String REFUND_INITIATED = "refund.initiated";
    public static final String REFUND_COMPLETED = "refund.completed";
}
