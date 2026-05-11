package com.pantrka.backend.domain.admin.controller;

import com.pantrka.backend.domain.admin.dto.MainPageConfigResponse;
import com.pantrka.backend.domain.admin.service.MainPageConfigService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/main-page-config")
@RequiredArgsConstructor
@Tag(name = "Main Page Config", description = "메인 페이지 설정 공개 API")
public class MainPageConfigController {

    private final MainPageConfigService mainPageConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<MainPageConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(mainPageConfigService.getConfig()));
    }
}
