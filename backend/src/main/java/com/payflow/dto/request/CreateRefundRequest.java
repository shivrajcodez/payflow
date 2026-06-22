package com.payflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateRefundRequest {
    @DecimalMin("0.01")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal amount;

    @Size(max = 255)
    private String reason;

    @Size(max = 1000)
    private String notes;
}
