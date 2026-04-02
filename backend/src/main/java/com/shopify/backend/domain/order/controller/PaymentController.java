package com.shopify.backend.domain.order.controller;

import com.shopify.backend.domain.order.dto.PaymentConfirmRequest;
import com.shopify.backend.domain.order.dto.PaymentResponse;
import com.shopify.backend.domain.order.service.PaymentService;
import com.shopify.backend.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/confirm")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            Authentication authentication,
            @Valid @RequestBody PaymentConfirmRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        PaymentResponse response = paymentService.confirmPayment(memberId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
