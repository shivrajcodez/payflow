package com.payflow.controller;

import com.payflow.dto.response.ApiResponse;
import com.payflow.dto.response.NotificationResponse;
import com.payflow.dto.response.PagedResponse;
import com.payflow.entity.Notification;
import com.payflow.entity.User;
import com.payflow.exception.PayFlowException;
import com.payflow.repository.NotificationRepository;
import com.payflow.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping
    @Operation(summary = "Get user notifications")
    public ResponseEntity<ApiResponse<PagedResponse<NotificationResponse>>> getNotifications(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) Boolean read
    ) {
        User user = getUser(userDetails);
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notifications = read != null
            ? notificationRepository.findByUserAndReadOrderByCreatedAtDesc(user, read, pageable)
            : notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);

        PagedResponse<NotificationResponse> response = PagedResponse.of(notifications.map(this::mapToResponse));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User user = getUser(userDetails);
        long count = notificationRepository.countByUserAndRead(user, false);
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PutMapping("/mark-all-read")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        notificationRepository.markAllReadByUser(user, Instant.now());
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> PayFlowException.notFound("User not found"));
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .type(n.getType())
            .title(n.getTitle())
            .message(n.getMessage())
            .read(n.getRead())
            .readAt(n.getReadAt())
            .paymentId(n.getPayment() != null ? n.getPayment().getId() : null)
            .createdAt(n.getCreatedAt())
            .build();
    }
}
