package com.payflow.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.payflow.enums.*;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentResponse {
    private UUID id;
    private String paymentReference;
    private BigDecimal amount;
    private Currency currency;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private String description;
    private String customerEmail;
    private String customerName;
    private String cardLastFour;
    private String cardBrand;
    private String bankName;
    private String failureCode;
    private String failureMessage;
    private BigDecimal processingFee;
    private BigDecimal netAmount;
    private String statementDescriptor;
    private String receiptUrl;
    private Integer riskScore;
    private Instant processedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private UserResponse user;
}
