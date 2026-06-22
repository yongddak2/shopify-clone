package com.pantrka.backend.domain.admin.controller;

import com.pantrka.backend.domain.admin.dto.AboutImageUpdateRequest;
import com.pantrka.backend.domain.admin.dto.MainPageConfigResponse;
import com.pantrka.backend.domain.admin.dto.MainPageConfigUpdateRequest;
import com.pantrka.backend.domain.admin.dto.InstagramSectionUpdateRequest;
import com.pantrka.backend.domain.admin.service.MainPageConfigService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/main-page-config")
@RequiredArgsConstructor
@Tag(name = "Admin Main Page Config", description = "관리자 메인 페이지 설정 API")
public class AdminMainPageConfigController {

    private final MainPageConfigService mainPageConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<MainPageConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(mainPageConfigService.getConfig()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<MainPageConfigResponse>> updateConfig(
            @Valid @RequestBody MainPageConfigUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(mainPageConfigService.updateConfig(request)));
    }

    @PutMapping("/about-image")
    public ResponseEntity<ApiResponse<MainPageConfigResponse>> updateAboutImage(
            @RequestBody AboutImageUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(mainPageConfigService.updateAboutImage(request)));
    }

    @PutMapping("/instagram")
    public ResponseEntity<ApiResponse<MainPageConfigResponse>> updateInstagram(
            @Valid @RequestBody InstagramSectionUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(mainPageConfigService.updateInstagram(request)));
    }
}
