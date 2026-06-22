package com.payflow.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.payflow.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NotificationResponse {
    private UUID id;
    private NotificationType type;
    private String title;
    private String message;
    private Boolean read;
    private Instant readAt;
    private UUID paymentId;
    private Instant createdAt;
}
