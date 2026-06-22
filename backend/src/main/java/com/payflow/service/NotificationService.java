package com.payflow.service;

import com.payflow.entity.Payment;
import com.payflow.entity.Refund;
import com.payflow.entity.User;

public interface NotificationService {
    void notifyPaymentSuccess(Payment payment);
    void notifyPaymentFailed(Payment payment);
    void notifyRefundCompleted(Refund refund);
    void sendWebSocketNotification(User user, String type, Object payload);
}
