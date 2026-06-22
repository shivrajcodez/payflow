package com.payflow.controller;

import com.payflow.dto.response.ApiResponse;
import com.payflow.dto.response.PagedResponse;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.dto.response.UserResponse;
import com.payflow.entity.FraudFlag;
import com.payflow.entity.User;
import com.payflow.exception.PayFlowException;
import com.payflow.repository.AuditLogRepository;
import com.payflow.repository.FraudFlagRepository;
import com.payflow.repository.UserRepository;
import com.payflow.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin-only management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final UserRepository userRepository;
    private final FraudFlagRepository fraudFlagRepository;
    private final PaymentService paymentService;

    @GetMapping("/users")
    @Operation(summary = "List all users")
    public ResponseEntity<ApiResponse<PagedResponse<UserResponse>>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String query
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var users = query != null
            ? userRepository.searchUsers(query, pageable)
            : userRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(
            PagedResponse.of(users.map(this::mapToUserResponse))));
    }

    @GetMapping("/payments")
    @Operation(summary = "List all payments")
    public ResponseEntity<ApiResponse<PagedResponse<PaymentResponse>>> getAllPayments(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(paymentService.getAllPayments(pageable)));
    }

    @GetMapping("/fraud-flags")
    @Operation(summary = "List fraud flags")
    public ResponseEntity<?> getFraudFlags(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) Boolean reviewed
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var flags = reviewed != null
            ? fraudFlagRepository.findByReviewedOrderByCreatedAtDesc(reviewed, pageable)
            : fraudFlagRepository.findAllByOrderByCreatedAtDesc(pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.of(flags)));
    }

    @PutMapping("/fraud-flags/{flagId}/review")
    @Operation(summary = "Review a fraud flag")
    public ResponseEntity<ApiResponse<Void>> reviewFraudFlag(
        @PathVariable UUID flagId,
        @RequestParam String notes,
        @RequestParam(defaultValue = "true") boolean approved,
        @RequestParam(required = false) String reviewerEmail
    ) {
        FraudFlag flag = fraudFlagRepository.findById(flagId)
            .orElseThrow(() -> PayFlowException.notFound("Fraud flag not found"));
        flag.setReviewed(true);
        flag.setReviewNotes(notes);
        fraudFlagRepository.save(flag);
        return ResponseEntity.ok(ApiResponse.success(null, "Fraud flag reviewed"));
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .phone(user.getPhone())
            .role(user.getRole())
            .status(user.getStatus())
            .emailVerified(user.getEmailVerified())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
