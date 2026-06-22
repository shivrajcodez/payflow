package com.payflow.entity;

import com.payflow.enums.Currency;
import com.payflow.enums.PaymentMethod;
import com.payflow.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "payments")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "payment_reference", nullable = false, unique = true, length = 32)
    private String paymentReference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "currency", nullable = false)
    @Builder.Default
    private Currency currency = Currency.USD;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "idempotency_key", unique = true, length = 255)
    private String idempotencyKey;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Column(name = "card_last_four", length = 4)
    private String cardLastFour;

    @Column(name = "card_brand", length = 20)
    private String cardBrand;

    @Column(name = "card_exp_month")
    private Integer cardExpMonth;

    @Column(name = "card_exp_year")
    private Integer cardExpYear;

    @Column(name = "bank_account_last_four", length = 4)
    private String bankAccountLastFour;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "gateway_transaction_id", length = 255)
    private String gatewayTransactionId;

    @Column(name = "failure_code", length = 50)
    private String failureCode;

    @Column(name = "failure_message", length = 500)
    private String failureMessage;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;

    @Column(name = "webhook_sent_at")
    private Instant webhookSentAt;

    @Column(name = "webhook_response_code")
    private Integer webhookResponseCode;

    @Column(name = "processing_fee", precision = 19, scale = 4)
    private BigDecimal processingFee;

    @Column(name = "net_amount", precision = 19, scale = 4)
    private BigDecimal netAmount;

    @Column(name = "statement_descriptor", length = 100)
    private String statementDescriptor;

    @Column(name = "receipt_url", length = 500)
    private String receiptUrl;

    @Column(name = "risk_score")
    @Builder.Default
    private Integer riskScore = 0;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public boolean isRefundable() {
        return status == PaymentStatus.COMPLETED;
    }

    public boolean isCancellable() {
        return status == PaymentStatus.PENDING || status == PaymentStatus.PROCESSING;
    }
}
