package com.pantrka.backend.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "nice.payments")
@Getter
@Setter
public class NicePaymentsProperties {

    private String clientKey;
    private String secretKey;
    private String apiBaseUrl;
    private String frontendBaseUrl;
}
