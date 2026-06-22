package com.payflow.service.impl;

import com.payflow.dto.request.LoginRequest;
import com.payflow.dto.request.RefreshTokenRequest;
import com.payflow.dto.request.RegisterRequest;
import com.payflow.dto.response.AuthResponse;
import com.payflow.dto.response.UserResponse;
import com.payflow.entity.RefreshToken;
import com.payflow.entity.User;
import com.payflow.enums.AuditAction;
import com.payflow.exception.PayFlowException;
import com.payflow.repository.RefreshTokenRepository;
import com.payflow.repository.UserRepository;
import com.payflow.security.CustomUserDetails;
import com.payflow.security.JwtService;
import com.payflow.service.AuditService;
import com.payflow.service.AuthService;
import com.payflow.util.ReferenceGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

    @Value("${payflow.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Value("${payflow.jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw PayFlowException.conflict("Email already registered");
        }

        User user = User.builder()
            .email(request.getEmail().toLowerCase().trim())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName().trim())
            .lastName(request.getLastName().trim())
            .phone(request.getPhone())
            .emailVerificationToken(ReferenceGenerator.generateEmailVerificationToken())
            .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        auditService.log(user, AuditAction.CREATE, "User", user.getId().toString(),
            "New user registration", null, null, ipAddress);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = createRefreshToken(user, userDetails, null, ipAddress);

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase(), request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getUserId())
            .orElseThrow(() -> PayFlowException.notFound("User not found"));

        if (user.isLocked()) {
            throw PayFlowException.forbidden("Account is temporarily locked");
        }

        userRepository.updateLastLogin(user.getId(), Instant.now(), ipAddress);
        refreshTokenRepository.revokeAllUserTokens(user, Instant.now());

        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = createRefreshToken(user, userDetails, request.getDeviceInfo(), ipAddress);

        auditService.log(user, AuditAction.LOGIN, "User", user.getId().toString(),
            "User login from " + ipAddress, null, null, ipAddress);

        log.info("User logged in: {} from {}", user.getEmail(), ipAddress);
        return buildAuthResponse(accessToken, refreshToken, user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, String ipAddress) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(request.getRefreshToken())
            .orElseThrow(() -> PayFlowException.unauthorized("Invalid refresh token"));

        if (!storedToken.isValid()) {
            throw PayFlowException.unauthorized("Refresh token expired or revoked");
        }

        storedToken.setRevoked(true);
        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);

        User user = storedToken.getUser();
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String newAccessToken = jwtService.generateAccessToken(userDetails);
        String newRefreshToken = createRefreshToken(user, userDetails, storedToken.getDeviceInfo(), ipAddress);

        return buildAuthResponse(newAccessToken, newRefreshToken, user);
    }

    @Override
    @Transactional
    public void logout(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            refreshTokenRepository.revokeAllUserTokens(user, Instant.now());
            auditService.log(user, AuditAction.LOGOUT, "User", user.getId().toString(),
                "User logout", null, null, null);
        });
    }

    private String createRefreshToken(User user, CustomUserDetails userDetails, String deviceInfo, String ipAddress) {
        String rawToken = jwtService.generateRefreshToken(userDetails);
        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .token(rawToken)
            .expiresAt(Instant.now().plusMillis(refreshTokenExpiration))
            .deviceInfo(deviceInfo)
            .ipAddress(ipAddress)
            .build();
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(accessTokenExpiration / 1000)
            .user(mapToUserResponse(user))
            .build();
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
            .avatarUrl(user.getAvatarUrl())
            .timezone(user.getTimezone())
            .lastLoginAt(user.getLastLoginAt())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
