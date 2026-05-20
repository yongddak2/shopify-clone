package com.pantrka.backend.domain.admin.controller;

import com.pantrka.backend.domain.admin.dto.NewArrivalAddRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalMoveRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalReorderRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalReplaceRequest;
import com.pantrka.backend.domain.admin.dto.NewArrivalResponse;
import com.pantrka.backend.domain.admin.service.MainPageNewArrivalService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/main-page/new-arrivals")
@RequiredArgsConstructor
@Tag(name = "Admin Main Page New Arrivals", description = "관리자 메인페이지 NEW ARRIVALS 큐레이션 API")
public class AdminMainPageNewArrivalController {

    private final MainPageNewArrivalService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NewArrivalResponse>>> getList() {
        return ResponseEntity.ok(ApiResponse.success(service.getAdminList()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<List<NewArrivalResponse>>> add(
            @Valid @RequestBody NewArrivalAddRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.addProducts(request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<ApiResponse<List<NewArrivalResponse>>> move(
            @PathVariable Long id,
            @Valid @RequestBody NewArrivalMoveRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.move(id, request)));
    }

    @PutMapping("/order")
    public ResponseEntity<ApiResponse<List<NewArrivalResponse>>> reorder(
            @Valid @RequestBody NewArrivalReorderRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.reorder(request)));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<List<NewArrivalResponse>>> replace(
            @Valid @RequestBody NewArrivalReplaceRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.replace(request)));
    }
}
