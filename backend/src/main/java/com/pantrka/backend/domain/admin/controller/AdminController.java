package com.pantrka.backend.domain.admin.controller;

import com.pantrka.backend.domain.admin.dto.*;
import java.time.LocalDate;
import java.util.List;
import com.pantrka.backend.domain.admin.service.AdminMemberService;
import com.pantrka.backend.domain.admin.service.AdminOrderService;
import com.pantrka.backend.domain.admin.service.AdminProductService;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId) {
        Page<AdminProductResponse> response = adminProductService.getProducts(page, size, keyword, categoryId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ApiResponse<AdminProductResponse>> getProduct(@PathVariable Long id) {
        AdminProductResponse response = adminProductService.getProduct(id);
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

    // ── 재고 관리 ──

    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getInventory() {
        List<InventoryResponse> response = adminProductService.getInventory();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/inventory/{optionValueId}")
    public ResponseEntity<ApiResponse<InventoryResponse>> updateStock(
            @PathVariable Long optionValueId,
            @RequestBody InventoryUpdateRequest request) {
        InventoryResponse response = adminProductService.updateStock(optionValueId, request.getStockQuantity());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── 주문 관리 ──

    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<Page<AdminOrderResponse>>> getOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String searchType,
            @RequestParam(required = false) String keyword) {
        Page<AdminOrderResponse> response = adminOrderService.getOrders(
                page, size, status, startDate, endDate, searchType, keyword);
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
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String filter) {
        Page<AdminMemberResponse> response = adminMemberService.getMembers(page, size, filter);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminMemberDetailResponse>> getMember(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminMemberService.getMemberDetail(id)));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<AdminMemberDetailResponse>> updateMemberRole(
            @PathVariable Long id,
            @Valid @RequestBody AdminMemberRoleUpdateRequest request,
            Authentication authentication) {
        Long actingMemberId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                adminMemberService.updateRole(id, actingMemberId, request.getRole())));
    }

    @PatchMapping("/users/{id}/memo")
    public ResponseEntity<ApiResponse<AdminMemberDetailResponse>> updateMemberMemo(
            @PathVariable Long id,
            @Valid @RequestBody AdminMemberMemoUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                adminMemberService.updateAdminMemo(id, request.getAdminMemo())));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> withdrawMember(
            @PathVariable Long id,
            Authentication authentication) {
        Long actingMemberId = (Long) authentication.getPrincipal();
        adminMemberService.withdrawMember(id, actingMemberId);
        return ResponseEntity.noContent().build();
    }

}
