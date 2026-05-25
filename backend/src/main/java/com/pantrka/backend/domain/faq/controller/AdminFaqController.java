package com.pantrka.backend.domain.faq.controller;

import com.pantrka.backend.domain.faq.dto.FaqCreateRequest;
import com.pantrka.backend.domain.faq.dto.FaqResponse;
import com.pantrka.backend.domain.faq.dto.FaqSortRequest;
import com.pantrka.backend.domain.faq.dto.FaqUpdateRequest;
import com.pantrka.backend.domain.faq.service.AdminFaqService;
import com.pantrka.backend.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/faqs")
@RequiredArgsConstructor
@Tag(name = "Admin FAQ", description = "관리자 FAQ API")
public class AdminFaqController {

    private final AdminFaqService adminFaqService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FaqResponse>>> getFaqs() {
        return ResponseEntity.ok(ApiResponse.success(adminFaqService.getFaqs()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FaqResponse>> createFaq(@Valid @RequestBody FaqCreateRequest request) {
        FaqResponse response = adminFaqService.createFaq(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<FaqResponse>> updateFaq(
            @PathVariable Long id,
            @Valid @RequestBody FaqUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(adminFaqService.updateFaq(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaq(@PathVariable Long id) {
        adminFaqService.deleteFaq(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/sort")
    public ResponseEntity<Void> reorderFaqs(@Valid @RequestBody FaqSortRequest request) {
        adminFaqService.reorderFaqs(request);
        return ResponseEntity.noContent().build();
    }
}
