package com.payflow.service.impl;

import com.payflow.entity.Notification;
import com.payflow.entity.Payment;
import com.payflow.entity.Refund;
import com.payflow.entity.User;
import com.payflow.enums.NotificationType;
import com.payflow.repository.NotificationRepository;
import com.payflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Async("notificationExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyPaymentSuccess(Payment payment) {
        Notification notification = Notification.builder()
            .user(payment.getUser())
            .type(NotificationType.PAYMENT_SUCCESS)
            .title("Payment Successful")
            .message(String.format("Your payment of %s %s was processed successfully. Reference: %s",
                payment.getAmount(), payment.getCurrency(), payment.getPaymentReference()))
            .payment(payment)
            .build();
        notificationRepository.save(notification);
        sendWebSocketNotification(payment.getUser(), "PAYMENT_SUCCESS", Map.of(
            "paymentId", payment.getId(),
            "reference", payment.getPaymentReference(),
            "amount", payment.getAmount(),
            "currency", payment.getCurrency()
        ));
        log.info("Payment success notification sent for: {}", payment.getPaymentReference());
    }

    @Override
    @Async("notificationExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyPaymentFailed(Payment payment) {
        Notification notification = Notification.builder()
            .user(payment.getUser())
            .type(NotificationType.PAYMENT_FAILED)
            .title("Payment Failed")
            .message(String.format("Your payment of %s %s could not be processed. Reason: %s",
                payment.getAmount(), payment.getCurrency(), payment.getFailureMessage()))
            .payment(payment)
            .build();
        notificationRepository.save(notification);
        sendWebSocketNotification(payment.getUser(), "PAYMENT_FAILED", Map.of(
            "paymentId", payment.getId(),
            "reference", payment.getPaymentReference(),
            "reason", payment.getFailureMessage() != null ? payment.getFailureMessage() : "Unknown"
        ));
    }

    @Override
    @Async("notificationExecutor")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyRefundCompleted(Refund refund) {
        Notification notification = Notification.builder()
            .user(refund.getUser())
            .type(NotificationType.REFUND_COMPLETED)
            .title("Refund Processed")
            .message(String.format("Your refund of %s %s has been processed. Reference: %s",
                refund.getAmount(), refund.getCurrency(), refund.getRefundReference()))
            .payment(refund.getPayment())
            .refund(refund)
            .build();
        notificationRepository.save(notification);
        sendWebSocketNotification(refund.getUser(), "REFUND_COMPLETED", Map.of(
            "refundId", refund.getId(),
            "reference", refund.getRefundReference(),
            "amount", refund.getAmount()
        ));
    }

    @Override
    public void sendWebSocketNotification(User user, String type, Object payload) {
        try {
            messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/notifications",
                Map.of("type", type, "data", payload)
            );
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification: {}", e.getMessage());
        }
    }
}
