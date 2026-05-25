package com.pantrka.backend.domain.seasoncollection.controller;

import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionCreateRequest;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionSummaryResponse;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionUpdateRequest;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonImageOrderRequest;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonImageResponse;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonOrderRequest;
import com.pantrka.backend.domain.seasoncollection.service.AdminSeasonCollectionService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/season-collections")
@RequiredArgsConstructor
@Tag(name = "Admin Season Collection", description = "관리자 PNTK 시즌 컬렉션 API")
public class AdminSeasonCollectionController {

    private final AdminSeasonCollectionService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SeasonCollectionSummaryResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SeasonCollectionSummaryResponse>> create(
            @Valid @RequestBody SeasonCollectionCreateRequest request) {
        SeasonCollectionSummaryResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<SeasonCollectionSummaryResponse>> updateName(
            @PathVariable Long id,
            @Valid @RequestBody SeasonCollectionUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.updateName(id, request)));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<SeasonCollectionSummaryResponse>> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.toggleActive(id)));
    }

    @PutMapping("/order")
    public ResponseEntity<Void> reorder(@Valid @RequestBody List<SeasonOrderRequest> requests) {
        service.reorder(requests);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<ApiResponse<List<SeasonImageResponse>>> getImages(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getImages(id)));
    }

    @PostMapping(value = "/{id}/images", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<List<SeasonImageResponse>>> addImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {
        List<SeasonImageResponse> response = service.addImages(id, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PutMapping("/{id}/images/order")
    public ResponseEntity<Void> reorderImages(
            @PathVariable Long id,
            @Valid @RequestBody List<SeasonImageOrderRequest> requests) {
        service.reorderImages(id, requests);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        service.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}
