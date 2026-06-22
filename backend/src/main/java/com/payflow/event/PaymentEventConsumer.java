package com.payflow.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

import static com.payflow.config.KafkaConfig.PAYMENT_EVENTS_TOPIC;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventConsumer {

    @KafkaListener(
        topics = PAYMENT_EVENTS_TOPIC,
        groupId = "payflow-payment-processor",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumePaymentEvent(
        @Payload PaymentEvent event,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.info("Consumed payment event: type={} paymentId={} partition={} offset={}",
            event.getEventType(), event.getPaymentId(), partition, offset);

        try {
            switch (event.getEventType()) {
                case PaymentEvent.PAYMENT_CREATED ->
                    log.info("Payment created: {} amount: {} {}", event.getPaymentReference(),
                        event.getAmount(), event.getCurrency());
                case PaymentEvent.PAYMENT_COMPLETED ->
                    log.info("Payment completed: {} revenue: {} {}", event.getPaymentReference(),
                        event.getAmount(), event.getCurrency());
                case PaymentEvent.PAYMENT_FAILED ->
                    log.warn("Payment failed: {} user: {}", event.getPaymentReference(), event.getUserEmail());
                case PaymentEvent.REFUND_COMPLETED ->
                    log.info("Refund completed for payment: {}", event.getPaymentReference());
                default ->
                    log.debug("Unknown event type: {}", event.getEventType());
            }
        } catch (Exception e) {
            log.error("Error processing payment event: {}", e.getMessage(), e);
        }
    }
}
