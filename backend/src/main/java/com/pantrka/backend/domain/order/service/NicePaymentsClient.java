package com.pantrka.backend.domain.order.service;

import com.pantrka.backend.domain.order.dto.NicePaymentApiResponse;
import com.pantrka.backend.global.config.NicePaymentsProperties;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class NicePaymentsClient {

    private final RestTemplate nicePaymentsRestTemplate;
    private final NicePaymentsProperties properties;

    public NicePaymentApiResponse approve(String tid, BigDecimal amount) {
        return post("/v1/payments/" + tid, Map.of("amount", amount));
    }

    public NicePaymentApiResponse cancel(String tid, String orderId, String reason) {
        return post("/v1/payments/" + tid + "/cancel", Map.of(
                "orderId", orderId,
                "reason", reason));
    }

    private NicePaymentApiResponse post(String path, Map<String, Object> body) {
        if (isBlank(properties.getClientKey()) || isBlank(properties.getSecretKey())) {
            throw new BusinessException(ErrorCode.NICEPAY_NOT_CONFIGURED);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String credentials = properties.getClientKey() + ":" + properties.getSecretKey();
        headers.setBasicAuth(Base64.getEncoder().encodeToString(
                credentials.getBytes(StandardCharsets.UTF_8)));

        try {
            NicePaymentApiResponse response = nicePaymentsRestTemplate.exchange(
                    properties.getApiBaseUrl() + path,
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    NicePaymentApiResponse.class
            ).getBody();
            if (response == null || !"0000".equals(response.getResultCode())) {
                throw new BusinessException(
                        ErrorCode.NICEPAY_API_FAILED,
                        response == null ? "NICE Payments 응답이 없습니다." : response.getResultMsg());
            }
            return response;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.NICEPAY_API_FAILED);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
