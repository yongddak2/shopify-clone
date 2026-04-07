package com.shopify.backend.domain.admin.controller;

import com.shopify.backend.domain.admin.dto.*;
import com.shopify.backend.domain.admin.service.AdminMemberService;
import com.shopify.backend.domain.admin.service.AdminOrderService;
import com.shopify.backend.domain.admin.service.AdminProductService;
import com.shopify.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "관리자 API")
public class AdminController {

    private final AdminProductService adminProductService;
    private final AdminOrderService adminOrderService;
    private final AdminMemberService adminMemberService;

    // ── 상품 관리 ──

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<AdminProductResponse>>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AdminProductResponse> response = adminProductService.getProducts(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<AdminProductResponse>> createProduct(
            @Valid @RequestBody AdminProductCreateRequest request) {
        AdminProductResponse response = adminProductService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PatchMapping("/products/{id}")
    public ResponseEntity<ApiResponse<AdminProductResponse>> updateProduct(
            @PathVariable Long id,
            @RequestBody AdminProductUpdateRequest request) {
        AdminProductResponse response = adminProductService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        adminProductService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    // ── 주문 관리 ──

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<AdminOrderResponse>>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AdminOrderResponse> response = adminOrderService.getOrders(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminOrderStatusUpdateRequest request) {
        adminOrderService.updateOrderStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── 회원 관리 ──

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminMemberResponse>>> getMembers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<AdminMemberResponse> response = adminMemberService.getMembers(page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

}
