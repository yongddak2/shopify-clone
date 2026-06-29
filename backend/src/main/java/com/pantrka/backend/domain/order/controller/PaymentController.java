package com.pantrka.backend.domain.order.controller;

import com.pantrka.backend.domain.order.dto.NicePaymentCallbackRequest;
import com.pantrka.backend.domain.order.dto.NicePaymentApiResponse;
import com.pantrka.backend.domain.order.dto.PaymentResponse;
import com.pantrka.backend.domain.order.service.PaymentService;
import com.pantrka.backend.global.config.NicePaymentsProperties;
import com.pantrka.backend.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final NicePaymentsProperties niceProperties;

    @PostMapping(value = "/nice/callback", consumes = "application/x-www-form-urlencoded")
    public ResponseEntity<Void> niceCallback(
            @ModelAttribute NicePaymentCallbackRequest request) {
        try {
            PaymentResponse payment = paymentService.confirmNicePayment(request);
            UriComponentsBuilder locationBuilder = UriComponentsBuilder
                    .fromUriString(niceProperties.getFrontendBaseUrl())
                    .path("/payment/success")
                    .queryParam("orderId", payment.getOrderId())
                    .queryParam("orderNumber", payment.getOrderNumber())
                    .queryParam("amount", payment.getAmount())
                    .queryParam("status", payment.getStatus());
            if ("VIRTUAL".equals(payment.getMethod())) {
                locationBuilder
                        .queryParam("vbankName", payment.getVbankName())
                        .queryParam("vbankNumber", payment.getVbankNumber())
                        .queryParam("vbankHolder", payment.getVbankHolder())
                        .queryParam("vbankExpiresAt", payment.getVbankExpiresAt());
            }
            URI location = locationBuilder.build()
                    .encode()
                    .toUri();
            return redirect(location);
        } catch (BusinessException e) {
            URI location = UriComponentsBuilder
                    .fromUriString(niceProperties.getFrontendBaseUrl())
                    .path("/payment/fail")
                    .queryParam("code", e.getErrorCode().name())
                    .queryParam("message", e.getMessage())
                    .build()
                    .encode()
                    .toUri();
            return redirect(location);
        }
    }

    @PostMapping(
            value = "/nice/webhook",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> niceWebhook(@RequestBody NicePaymentApiResponse event) {
        paymentService.processNiceWebhook(event);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body("OK");
    }

    private ResponseEntity<Void> redirect(URI location) {
        return ResponseEntity.status(HttpStatus.SEE_OTHER)
                .header(HttpHeaders.LOCATION, location.toString())
                .build();
    }
}
