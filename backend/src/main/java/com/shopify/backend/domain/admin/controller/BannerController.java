package com.shopify.backend.domain.admin.controller;

import com.shopify.backend.domain.admin.dto.BannerResponse;
import com.shopify.backend.domain.admin.service.AdminBannerService;
import com.shopify.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
@Tag(name = "Banner", description = "배너 공개 API")
public class BannerController {

    private final AdminBannerService adminBannerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getActiveBanners() {
        List<BannerResponse> response = adminBannerService.getActiveBanners();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
