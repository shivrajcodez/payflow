package com.payflow.config;

import com.payflow.event.PaymentEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;

@Configuration
public class KafkaConfig {

    public static final String PAYMENT_EVENTS_TOPIC = "payment-events";
    public static final String REFUND_EVENTS_TOPIC = "refund-events";
    public static final String FRAUD_EVENTS_TOPIC = "fraud-events";
    public static final String NOTIFICATION_EVENTS_TOPIC = "notification-events";
    public static final String WEBHOOK_EVENTS_TOPIC = "webhook-events";
    public static final String AUDIT_EVENTS_TOPIC = "audit-events";

    @Bean
    public NewTopic paymentEventsTopic() {
        return TopicBuilder.name(PAYMENT_EVENTS_TOPIC)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic refundEventsTopic() {
        return TopicBuilder.name(REFUND_EVENTS_TOPIC)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic fraudEventsTopic() {
        return TopicBuilder.name(FRAUD_EVENTS_TOPIC)
            .partitions(2)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic notificationEventsTopic() {
        return TopicBuilder.name(NOTIFICATION_EVENTS_TOPIC)
            .partitions(2)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic webhookEventsTopic() {
        return TopicBuilder.name(WEBHOOK_EVENTS_TOPIC)
            .partitions(3)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic auditEventsTopic() {
        return TopicBuilder.name(AUDIT_EVENTS_TOPIC)
            .partitions(2)
            .replicas(1)
            .build();
    }
}
