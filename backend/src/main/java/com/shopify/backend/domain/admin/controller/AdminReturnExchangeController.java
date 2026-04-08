package com.shopify.backend.domain.admin.controller;

import com.shopify.backend.domain.order.dto.AdminRequestActionRequest;
import com.shopify.backend.domain.order.dto.ReturnExchangeResponse;
import com.shopify.backend.domain.order.service.ReturnExchangeService;
import com.shopify.backend.global.common.ApiResponse;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/requests")
@RequiredArgsConstructor
@Tag(name = "Admin Return/Exchange", description = "관리자 반품/교환 요청 관리 API")
public class AdminReturnExchangeController {

    private final ReturnExchangeService returnExchangeService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReturnExchangeResponse>>> getAllRequests(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ReturnExchangeResponse> response = returnExchangeService.getAllRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ReturnExchangeResponse>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) AdminRequestActionRequest request) {
        String memo = request != null ? request.getAdminMemo() : null;
        ReturnExchangeResponse response = returnExchangeService.approveRequest(id, memo);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ReturnExchangeResponse>> reject(
            @PathVariable Long id,
            @RequestBody AdminRequestActionRequest request) {
        if (request == null || request.getAdminMemo() == null || request.getAdminMemo().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        ReturnExchangeResponse response = returnExchangeService.rejectRequest(id, request.getAdminMemo());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<ReturnExchangeResponse>> complete(@PathVariable Long id) {
        ReturnExchangeResponse response = returnExchangeService.completeRequest(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
