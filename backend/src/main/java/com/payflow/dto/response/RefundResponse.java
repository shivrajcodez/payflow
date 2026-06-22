package com.payflow.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.payflow.enums.Currency;
import com.payflow.enums.RefundStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RefundResponse {
    private UUID id;
    private String refundReference;
    private UUID paymentId;
    private String paymentReference;
    private BigDecimal amount;
    private Currency currency;
    private RefundStatus status;
    private String reason;
    private String notes;
    private Instant processedAt;
    private Instant createdAt;
}
