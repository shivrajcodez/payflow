package com.payflow.controller;

import com.payflow.dto.response.ApiResponse;
import com.payflow.dto.response.PagedResponse;
import com.payflow.dto.response.UserResponse;
import com.payflow.entity.User;
import com.payflow.exception.PayFlowException;
import com.payflow.repository.TransactionRepository;
import com.payflow.repository.UserRepository;
import com.payflow.util.ReferenceGenerator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and account management")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(user)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestBody Map<String, String> updates
    ) {
        User user = getUser(userDetails);
        if (updates.containsKey("firstName")) user.setFirstName(updates.get("firstName"));
        if (updates.containsKey("lastName")) user.setLastName(updates.get("lastName"));
        if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
        if (updates.containsKey("timezone")) user.setTimezone(updates.get("timezone"));
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(mapToResponse(user), "Profile updated"));
    }

    @PostMapping("/me/api-key")
    @Operation(summary = "Generate a new API key")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateApiKey(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        String apiKey = ReferenceGenerator.generateApiKey();
        user.setApiKey(apiKey);
        user.setApiKeyCreatedAt(Instant.now());
        userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(Map.of("apiKey", apiKey), "API key generated"));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> PayFlowException.notFound("User not found"));
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .phone(user.getPhone())
            .role(user.getRole())
            .status(user.getStatus())
            .apiKey(user.getApiKey())
            .emailVerified(user.getEmailVerified())
            .avatarUrl(user.getAvatarUrl())
            .timezone(user.getTimezone())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
