package com.payflow.service;

import com.payflow.dto.request.CreatePaymentRequest;
import com.payflow.dto.response.PaymentResponse;
import com.payflow.entity.User;
import com.payflow.enums.*;
import com.payflow.exception.PayFlowException;
import com.payflow.repository.*;
import com.payflow.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private RefundRepository refundRepository;
    @Mock private TransactionRepository transactionRepository;
    @Mock private UserRepository userRepository;
    @Mock private FraudDetectionService fraudDetectionService;
    @Mock private NotificationService notificationService;
    @Mock private KafkaTemplate<String, Object> kafkaTemplate;
    @InjectMocks private PaymentServiceImpl paymentService;

    private User testUser;
    private CreatePaymentRequest validRequest;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(UUID.randomUUID())
            .email("test@payflow.dev")
            .firstName("Test").lastName("User")
            .role(UserRole.USER).status(UserStatus.ACTIVE)
            .build();

        validRequest = new CreatePaymentRequest();
        validRequest.setAmount(new BigDecimal("100.00"));
        validRequest.setCurrency(Currency.USD);
        validRequest.setPaymentMethod(PaymentMethod.CARD);
        validRequest.setCardLastFour("4242");
        validRequest.setCardBrand("Visa");
    }

    @Test
    void createPayment_withValidRequest_returnsPaymentResponse() {
        when(fraudDetectionService.calculateRiskScore(any(), any(), any())).thenReturn(5);
        when(fraudDetectionService.getRiskLevel(5)).thenReturn(FraudRiskLevel.LOW);
        when(paymentRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(kafkaTemplate.send(any(), any(), any())).thenReturn(null);

        PaymentResponse response = paymentService.createPayment(validRequest, testUser, "127.0.0.1");

        assertThat(response).isNotNull();
        assertThat(response.getAmount()).isEqualByComparingTo("100.00");
        assertThat(response.getCurrency()).isEqualTo(Currency.USD);
        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(paymentRepository).save(any());
    }

    @Test
    void createPayment_withCriticalFraudRisk_throwsForbidden() {
        when(fraudDetectionService.calculateRiskScore(any(), any(), any())).thenReturn(90);
        when(fraudDetectionService.getRiskLevel(90)).thenReturn(FraudRiskLevel.CRITICAL);

        assertThatThrownBy(() -> paymentService.createPayment(validRequest, testUser, "1.2.3.4"))
            .isInstanceOf(PayFlowException.class)
            .hasMessageContaining("fraud risk");
    }

    @Test
    void createPayment_withIdempotencyKey_returnsExistingPayment() {
        validRequest.setIdempotencyKey("unique-key-123");
        var existingPayment = com.payflow.entity.Payment.builder()
            .id(UUID.randomUUID())
            .paymentReference("PAY20240101ABC123")
            .amount(new BigDecimal("100.00"))
            .currency(Currency.USD)
            .status(PaymentStatus.COMPLETED)
            .paymentMethod(PaymentMethod.CARD)
            .user(testUser)
            .build();

        when(paymentRepository.findByIdempotencyKey("unique-key-123"))
            .thenReturn(Optional.of(existingPayment));

        PaymentResponse response = paymentService.createPayment(validRequest, testUser, "127.0.0.1");

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.COMPLETED);
        verify(paymentRepository, never()).save(any());
    }
}
