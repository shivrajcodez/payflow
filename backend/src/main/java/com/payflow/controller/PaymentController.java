package com.payflow.controller;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.request.CreateRefundRequest;
import com.payflow.dto.response.ApiResponse;
import com.payflow.dto.response.PagedResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.RefundResponse;
import com.payflow.entity.User;
import com.payflow.enums.Currency;
import com.payflow.enums.PaymentStatus;
import com.payflow.exception.PayFlowException;
import com.payflow.repository.UserRepository;
import com.payflow.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    @PostMapping
    @Operation(summary = "Create a new payment")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
        @Valid @RequestBody CreatePaymentRequest request,
        @AuthenticationPrincipal UserDetails userDetails,
        HttpServletRequest httpRequest
    ) {
        User user = getUser(userDetails);
        String ip = getClientIp(httpRequest);
        PaymentResponse response = paymentService.createPayment(request, user, ip);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Payment initiated"));
    }

    @GetMapping
    @Operation(summary = "List payments with filtering and pagination")
    public ResponseEntity<ApiResponse<PagedResponse<PaymentResponse>>> getPayments(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "createdAt") String sortBy,
        @RequestParam(defaultValue = "desc") String sortDir,
        @RequestParam(required = false) PaymentStatus status,
        @RequestParam(required = false) Currency currency,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
        @RequestParam(required = false) BigDecimal minAmount,
        @RequestParam(required = false) BigDecimal maxAmount,
        @RequestParam(required = false) String query
    ) {
        User user = getUser(userDetails);
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PageRequest pageable = PageRequest.of(page, Math.min(size, 100), sort);
        PagedResponse<PaymentResponse> response = paymentService.getPayments(
            user, status, currency, from, to, minAmount, maxAmount, query, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment by ID")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPayment(
        @PathVariable UUID paymentId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        PaymentResponse response = paymentService.getPayment(paymentId, user);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{paymentId}/refund")
    @Operation(summary = "Refund a payment (full or partial)")
    public ResponseEntity<ApiResponse<RefundResponse>> refundPayment(
        @PathVariable UUID paymentId,
        @Valid @RequestBody CreateRefundRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        RefundResponse response = paymentService.refundPayment(paymentId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(response, "Refund initiated successfully"));
    }

    @GetMapping("/{paymentId}/refunds")
    @Operation(summary = "List refunds for a payment")
    public ResponseEntity<ApiResponse<List<RefundResponse>>> getRefunds(
        @PathVariable UUID paymentId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        List<RefundResponse> refunds = paymentService.getPaymentRefunds(paymentId, user);
        return ResponseEntity.ok(ApiResponse.success(refunds));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> PayFlowException.notFound("User not found"));
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) ip = request.getRemoteAddr();
        return ip != null && ip.contains(",") ? ip.split(",")[0].trim() : ip;
    }
}
