package com.shopify.backend.domain.order.controller;

import com.shopify.backend.domain.order.dto.CartItemRequest;
import com.shopify.backend.domain.order.dto.CartItemResponse;
import com.shopify.backend.domain.order.dto.CartItemUpdateRequest;
import com.shopify.backend.domain.order.service.CartService;
import com.shopify.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "장바구니 API")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> getCartItems(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        List<CartItemResponse> response = cartService.getCartItems(memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartItemResponse>> addCartItem(
            Authentication authentication,
            @Valid @RequestBody CartItemRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        CartItemResponse response = cartService.addCartItem(memberId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateCartItem(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody CartItemUpdateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        CartItemResponse response = cartService.updateCartItem(memberId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCartItem(
            Authentication authentication,
            @PathVariable Long id) {
        Long memberId = (Long) authentication.getPrincipal();
        cartService.deleteCartItem(memberId, id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
