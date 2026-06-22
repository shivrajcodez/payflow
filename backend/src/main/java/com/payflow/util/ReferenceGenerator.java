package com.payflow.util;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.UUID;

public final class ReferenceGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneOffset.UTC);

    private ReferenceGenerator() {}

    public static String generatePaymentReference() {
        return "PAY" + DATE_FMT.format(Instant.now()) + randomAlphanumeric(10);
    }

    public static String generateRefundReference() {
        return "REF" + DATE_FMT.format(Instant.now()) + randomAlphanumeric(10);
    }

    public static String generateTransactionReference() {
        return "TXN" + DATE_FMT.format(Instant.now()) + randomAlphanumeric(10);
    }

    public static String generateApiKey() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return "pk_live_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String generateEventId() {
        return "evt_" + UUID.randomUUID().toString().replace("-", "");
    }

    public static String generateGatewayTransactionId() {
        return "gtx_" + randomAlphanumeric(20).toLowerCase();
    }

    public static String generateEmailVerificationToken() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String randomAlphanumeric(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        }
        return sb.toString();
    }
}
