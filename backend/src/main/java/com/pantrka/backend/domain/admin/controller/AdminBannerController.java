package com.pantrka.backend.domain.admin.controller;

import com.pantrka.backend.domain.admin.dto.BannerCreateRequest;
import com.pantrka.backend.domain.admin.dto.BannerOrderRequest;
import com.pantrka.backend.domain.admin.dto.BannerResponse;
import com.pantrka.backend.domain.admin.dto.BannerUpdateRequest;
import com.pantrka.backend.domain.admin.service.AdminBannerService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
@Tag(name = "Admin Banner", description = "관리자 배너 관리 API")
public class AdminBannerController {

    private final AdminBannerService adminBannerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getBanners() {
        List<BannerResponse> response = adminBannerService.getBanners();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BannerResponse>> createBanner(
            @Valid @RequestBody BannerCreateRequest request) {
        BannerResponse response = adminBannerService.createBanner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @PutMapping("/order")
    public ResponseEntity<ApiResponse<Void>> updateBannerOrder(
            @Valid @RequestBody List<BannerOrderRequest> requests) {
        adminBannerService.updateBannerOrder(requests);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BannerResponse>> updateBanner(
            @PathVariable Long id,
            @Valid @RequestBody BannerUpdateRequest request) {
        BannerResponse response = adminBannerService.updateBanner(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<BannerResponse>> toggleBannerActive(@PathVariable Long id) {
        BannerResponse response = adminBannerService.toggleBannerActive(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        adminBannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }
}
