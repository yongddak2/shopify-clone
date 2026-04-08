package com.shopify.backend.domain.order.controller;

import com.shopify.backend.domain.order.dto.ReturnExchangeCreateRequest;
import com.shopify.backend.domain.order.dto.ReturnExchangeResponse;
import com.shopify.backend.domain.order.service.ReturnExchangeService;
import com.shopify.backend.global.common.ApiResponse;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import com.shopify.backend.infra.s3.S3Service;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
@Tag(name = "Return/Exchange", description = "반품/교환 요청 API")
public class ReturnExchangeController {

    private final ReturnExchangeService returnExchangeService;
    private final S3Service s3Service;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 20L * 1024 * 1024; // 20MB

    @PostMapping("/api/orders/{orderId}/return-exchange")
    public ResponseEntity<ApiResponse<ReturnExchangeResponse>> createRequest(
            Authentication authentication,
            @PathVariable Long orderId,
            @Valid @RequestBody ReturnExchangeCreateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        ReturnExchangeResponse response = returnExchangeService.createRequest(memberId, orderId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/api/orders/{orderId}/return-exchange")
    public ResponseEntity<ApiResponse<List<ReturnExchangeResponse>>> getRequests(
            Authentication authentication,
            @PathVariable Long orderId) {
        Long memberId = (Long) authentication.getPrincipal();
        List<ReturnExchangeResponse> response = returnExchangeService.getRequestsByOrderId(memberId, orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/api/return-requests/images")
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestParam("file") MultipartFile file) {
        validateFile(file);
        String url = s3Service.uploadFile(file, "return-requests");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(url));
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }
        String ext = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }
    }
}
