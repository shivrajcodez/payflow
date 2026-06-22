package com.payflow.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.payflow.dto.response.ApiResponse;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;
    private final Map<String, Bucket> bucketCache = new ConcurrentHashMap<>();

    @Value("${payflow.rate-limit.api-requests-per-minute:100}")
    private int apiRequestsPerMinute;

    @Value("${payflow.rate-limit.payment-requests-per-minute:10}")
    private int paymentRequestsPerMinute;

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String clientIp = getClientIp(request);
        String path = request.getRequestURI();

        boolean isPaymentEndpoint = path.contains("/v1/payments");
        Bucket bucket = bucketCache.computeIfAbsent(
            clientIp + ":" + (isPaymentEndpoint ? "payment" : "api"),
            k -> createBucket(isPaymentEndpoint)
        );

        if (bucket.tryConsume(1)) {
            long remainingTokens = bucket.getAvailableTokens();
            response.setHeader("X-RateLimit-Remaining", String.valueOf(remainingTokens));
            response.setHeader("X-RateLimit-Limit", String.valueOf(isPaymentEndpoint ? paymentRequestsPerMinute : apiRequestsPerMinute));
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for IP: {} on path: {}", clientIp, path);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("X-RateLimit-Remaining", "0");
            response.setHeader("Retry-After", "60");

            ApiResponse<Void> errorResponse = ApiResponse.error(
                "Rate limit exceeded. Please try again later.",
                "RATE_LIMIT_EXCEEDED"
            );
            objectMapper.writeValue(response.getWriter(), errorResponse);
        }
    }

    private Bucket createBucket(boolean isPaymentEndpoint) {
        int limit = isPaymentEndpoint ? paymentRequestsPerMinute : apiRequestsPerMinute;
        Bandwidth bandwidth = Bandwidth.classic(
            limit,
            Refill.intervally(limit, Duration.ofMinutes(1))
        );
        return Bucket.builder().addLimit(bandwidth).build();
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v3/api-docs") ||
               path.startsWith("/api/swagger-ui") ||
               path.startsWith("/api/actuator");
    }
}
