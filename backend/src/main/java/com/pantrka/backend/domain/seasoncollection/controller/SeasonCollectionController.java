package com.pantrka.backend.domain.seasoncollection.controller;

import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionDetailResponse;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionSummaryResponse;
import com.pantrka.backend.domain.seasoncollection.service.SeasonCollectionService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/season-collections")
@RequiredArgsConstructor
@Tag(name = "Season Collection", description = "PNTK 시즌 컬렉션 공개 API")
public class SeasonCollectionController {

    private final SeasonCollectionService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SeasonCollectionSummaryResponse>>> getActiveSeasons() {
        return ResponseEntity.ok(ApiResponse.success(service.getActiveSeasons()));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ApiResponse<SeasonCollectionDetailResponse>> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(service.getBySlug(slug)));
    }
}
