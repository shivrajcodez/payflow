package com.payflow.service;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.entity.FraudFlag;
import com.payflow.entity.Payment;
import com.payflow.entity.User;
import com.payflow.enums.FraudRiskLevel;

public interface FraudDetectionService {
    int calculateRiskScore(CreatePaymentRequest request, User user, String ipAddress);
    FraudRiskLevel getRiskLevel(int riskScore);
    void saveFraudFlag(Payment payment, User user, int riskScore, FraudRiskLevel riskLevel, String ipAddress);
}
