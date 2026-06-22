package com.payflow.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer",
    bearerFormat = "JWT"
)
public class OpenApiConfig {

    @Bean
    public OpenAPI payFlowOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("PayFlow API")
                .description("Production-grade Payment Gateway Simulator — Stripe-like REST API")
                .version("v1.0.0")
                .contact(new Contact()
                    .name("PayFlow Team")
                    .email("dev@payflow.dev")
                    .url("https://payflow.dev"))
                .license(new License()
                    .name("MIT")
                    .url("https://opensource.org/licenses/MIT")))
            .servers(List.of(
                new Server().url("/api").description("Current server")
            ));
    }
}
