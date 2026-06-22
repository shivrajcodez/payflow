package com.payflow.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.payflow.enums.UserRole;
import com.payflow.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private UserRole role;
    private UserStatus status;
    private String apiKey;
    private Boolean emailVerified;
    private String avatarUrl;
    private String timezone;
    private Instant lastLoginAt;
    private Instant createdAt;
}
