package com.payflow.controller;

import com.payflow.dto.response.AnalyticsResponse;
import com.payflow.dto.response.ApiResponse;
import com.payflow.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Analytics and reporting endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final PaymentService paymentService;

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get analytics overview (Admin only)")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getOverview() {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getAnalytics()));
    }
}
