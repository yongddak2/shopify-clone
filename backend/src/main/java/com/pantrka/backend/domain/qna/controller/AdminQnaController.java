package com.pantrka.backend.domain.qna.controller;

import com.pantrka.backend.domain.qna.dto.QnaAnswerRequest;
import com.pantrka.backend.domain.qna.dto.QnaDetailResponse;
import com.pantrka.backend.domain.qna.dto.QnaListResponse;
import com.pantrka.backend.domain.qna.service.AdminQnaService;
import com.pantrka.backend.global.common.ApiResponse;
import com.pantrka.backend.global.common.SupportCategory;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/qnas")
@RequiredArgsConstructor
@Tag(name = "Admin Q&A", description = "관리자 1:1 문의 API")
public class AdminQnaController {

    private final AdminQnaService adminQnaService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QnaListResponse>>> getQnas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) SupportCategory category,
            @RequestParam(required = false) Boolean answered) {
        return ResponseEntity.ok(ApiResponse.success(
                adminQnaService.getQnas(page, size, keyword, category, answered)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QnaDetailResponse>> getQna(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminQnaService.getQna(id)));
    }

    @PatchMapping("/{id}/answer")
    public ResponseEntity<ApiResponse<QnaDetailResponse>> answerQna(
            @PathVariable Long id,
            @Valid @RequestBody QnaAnswerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("답변이 등록되었습니다.", adminQnaService.answerQna(id, request)));
    }

    @DeleteMapping("/{id}/answer")
    public ResponseEntity<Void> deleteAnswer(@PathVariable Long id) {
        adminQnaService.deleteAnswer(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQna(@PathVariable Long id) {
        adminQnaService.deleteQna(id);
        return ResponseEntity.noContent().build();
    }
}
