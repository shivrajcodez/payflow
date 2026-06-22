package com.payflow.service;

import com.payflow.dto.request.LoginRequest;
import com.payflow.dto.request.RefreshTokenRequest;
import com.payflow.dto.request.RegisterRequest;
import com.payflow.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request, String ipAddress);
    AuthResponse login(LoginRequest request, String ipAddress);
    AuthResponse refreshToken(RefreshTokenRequest request, String ipAddress);
    void logout(String email);
}
