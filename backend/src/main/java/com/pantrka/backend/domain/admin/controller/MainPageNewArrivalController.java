package com.pantrka.backend.domain.admin.controller;

import com.pantrka.backend.domain.admin.service.MainPageNewArrivalService;
import com.pantrka.backend.domain.product.dto.ProductSummaryResponse;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/main-page/new-arrivals")
@RequiredArgsConstructor
@Tag(name = "Main Page New Arrivals", description = "메인 페이지 NEW ARRIVALS 공개 API")
public class MainPageNewArrivalController {

    private final MainPageNewArrivalService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductSummaryResponse>>> getList() {
        return ResponseEntity.ok(ApiResponse.success(service.getPublicList()));
    }
}
