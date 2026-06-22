package com.payflow.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payflow.dto.request.LoginRequest;
import com.payflow.dto.request.RegisterRequest;
import com.payflow.dto.response.AuthResponse;
import com.payflow.dto.response.UserResponse;
import com.payflow.enums.UserRole;
import com.payflow.enums.UserStatus;
import com.payflow.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @MockBean private AuthService authService;

    @Test
    void register_withValidRequest_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("new@payflow.dev");
        req.setPassword("Password@123");
        req.setFirstName("New");
        req.setLastName("User");

        AuthResponse mockResponse = AuthResponse.builder()
            .accessToken("mock.access.token")
            .refreshToken("mock.refresh.token")
            .tokenType("Bearer")
            .expiresIn(900)
            .user(UserResponse.builder()
                .id(UUID.randomUUID())
                .email("new@payflow.dev")
                .firstName("New").lastName("User")
                .role(UserRole.USER).status(UserStatus.ACTIVE)
                .build())
            .build();

        when(authService.register(any(), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").value("mock.access.token"));
    }

    @Test
    void register_withInvalidEmail_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("not-an-email");
        req.setPassword("Password@123");
        req.setFirstName("Test");
        req.setLastName("User");

        mockMvc.perform(post("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void login_withValidCredentials_returns200() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@payflow.dev");
        req.setPassword("Admin@123");

        AuthResponse mockResponse = AuthResponse.builder()
            .accessToken("access.token.here")
            .refreshToken("refresh.token.here")
            .tokenType("Bearer")
            .expiresIn(900)
            .build();

        when(authService.login(any(), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.accessToken").exists());
    }
}
