package com.shopify.backend.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class TossPaymentsConfig {

    @Bean
    public RestTemplate tossRestTemplate() {
        return new RestTemplate();
    }
}
