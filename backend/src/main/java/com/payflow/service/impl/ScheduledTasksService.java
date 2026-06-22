package com.payflow.service.impl;

import com.payflow.entity.Payment;
import com.payflow.enums.PaymentStatus;
import com.payflow.repository.PaymentRepository;
import com.payflow.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasksService {

    private final PaymentRepository paymentRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    @Transactional
    public void expirePendingPayments() {
        List<Payment> expiredPayments = paymentRepository.findExpiredPendingPayments(Instant.now());
        expiredPayments.forEach(payment -> {
            payment.setStatus(PaymentStatus.CANCELLED);
            payment.setFailureMessage("Payment expired due to timeout");
            paymentRepository.save(payment);
        });
        if (!expiredPayments.isEmpty()) {
            log.info("Expired {} pending payments", expiredPayments.size());
        }
    }

    @Scheduled(cron = "0 0 2 * * ?") // Every day at 2 AM
    @Transactional
    public void cleanupExpiredRefreshTokens() {
        refreshTokenRepository.deleteExpiredTokens(Instant.now());
        log.info("Cleaned up expired refresh tokens");
    }
}
