package com.payflow.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AnalyticsResponse {
    private BigDecimal totalRevenue;
    private BigDecimal revenueThisMonth;
    private BigDecimal revenueLastMonth;
    private Double revenueGrowthPercent;
    private long totalPayments;
    private long paymentsThisMonth;
    private long successfulPayments;
    private long failedPayments;
    private long pendingPayments;
    private Double successRate;
    private long totalUsers;
    private long newUsersThisMonth;
    private long fraudFlagsCount;
    private long unreviewedFraudFlags;
    private List<DailyRevenue> dailyRevenue;
    private Map<String, Long> paymentsByStatus;
    private Map<String, Long> paymentsByMethod;
    private Map<String, BigDecimal> revenueByMethod;

    @Getter
    @Builder
    public static class DailyRevenue {
        private String date;
        private BigDecimal revenue;
        private long count;
    }
}
