package com.pantrka.backend.domain.qna.controller;

import com.pantrka.backend.domain.qna.dto.QnaCreateRequest;
import com.pantrka.backend.domain.qna.dto.QnaDetailResponse;
import com.pantrka.backend.domain.qna.dto.QnaListResponse;
import com.pantrka.backend.domain.qna.dto.QnaUpdateRequest;
import com.pantrka.backend.domain.qna.service.QnaService;
import com.pantrka.backend.global.common.ApiResponse;
import com.pantrka.backend.global.common.SupportCategory;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.s3.S3Service;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@RestController
@RequestMapping("/api/qnas")
@RequiredArgsConstructor
@Tag(name = "Q&A", description = "1:1 문의 API")
public class QnaController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    private final QnaService qnaService;
    private final S3Service s3Service;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<QnaListResponse>>> getQnas(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) SupportCategory category,
            Authentication authentication) {
        Long viewerId = authentication != null ? (Long) authentication.getPrincipal() : null;
        boolean isAdmin = viewerId != null && qnaService.isAdminMember(viewerId);
        return ResponseEntity.ok(ApiResponse.success(qnaService.getQnas(page, size, category, viewerId, isAdmin)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Page<QnaListResponse>>> getMyQnas(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long memberId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(qnaService.getMyQnas(memberId, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QnaDetailResponse>> getQna(
            @PathVariable Long id,
            Authentication authentication) {
        Long viewerId = authentication != null ? (Long) authentication.getPrincipal() : null;
        boolean isAdmin = viewerId != null && qnaService.isAdminMember(viewerId);
        return ResponseEntity.ok(ApiResponse.success(qnaService.getQna(id, viewerId, isAdmin)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<QnaDetailResponse>> createQna(
            Authentication authentication,
            @Valid @RequestBody QnaCreateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        QnaDetailResponse response = qnaService.createQna(memberId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("문의가 등록되었습니다.", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<QnaDetailResponse>> updateQna(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody QnaUpdateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(qnaService.updateQna(id, memberId, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQna(
            @PathVariable Long id,
            Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        boolean isAdmin = qnaService.isAdminMember(memberId);
        qnaService.deleteQna(id, memberId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/images")
    public ResponseEntity<ApiResponse<String>> uploadImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        validateFile(file);
        String url = s3Service.uploadFile(file, "qnas");
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(url));
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }
    }
}
