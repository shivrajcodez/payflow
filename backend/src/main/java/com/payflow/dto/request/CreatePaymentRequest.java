package com.payflow.dto.request;

import com.payflow.enums.Currency;
import com.payflow.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePaymentRequest {
    @NotNull @DecimalMin("0.01") @DecimalMax("999999.99")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal amount;

    @NotNull
    private Currency currency;

    @NotNull
    private PaymentMethod paymentMethod;

    @Size(max = 500)
    private String description;

    @Size(max = 255)
    private String idempotencyKey;

    @Email @Size(max = 255)
    private String customerEmail;

    @Size(max = 255)
    private String customerName;

    // Card details (for CARD method)
    @Pattern(regexp = "\\d{4}", message = "Card last four must be 4 digits")
    private String cardLastFour;

    @Size(max = 20)
    private String cardBrand;

    @Min(1) @Max(12)
    private Integer cardExpMonth;

    @Min(2024) @Max(2040)
    private Integer cardExpYear;

    // Bank details (for BANK_TRANSFER method)
    @Pattern(regexp = "\\d{4}", message = "Bank account last four must be 4 digits")
    private String bankAccountLastFour;

    @Size(max = 100)
    private String bankName;

    @Size(max = 500)
    private String webhookUrl;

    @Size(max = 100)
    private String statementDescriptor;
}
