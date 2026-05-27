package com.pantrka.backend.domain.admin.controller;

import com.pantrka.backend.global.common.ApiResponse;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.s3.S3Service;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@RestController
@RequestMapping("/api/admin/images")
@RequiredArgsConstructor
@Tag(name = "Admin Image", description = "관리자 이미지 관리 API")
public class AdminImageController {

    private final S3Service s3Service;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (갤러리/대표 이미지)
    private static final long MAX_DETAIL_FILE_SIZE = 10 * 1024 * 1024; // 10MB (상세 설명 이미지)

    @PostMapping
    public ResponseEntity<ApiResponse<String>> uploadImage(@RequestParam("file") MultipartFile file) {
        validateFile(file, MAX_FILE_SIZE);
        String imageUrl = s3Service.uploadFile(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(imageUrl));
    }

    // 상세 설명 이미지: 세로로 긴 이미지를 허용하기 위해 10MB까지
    @PostMapping("/detail")
    public ResponseEntity<ApiResponse<String>> uploadDetailImage(@RequestParam("file") MultipartFile file) {
        validateFile(file, MAX_DETAIL_FILE_SIZE);
        String imageUrl = s3Service.uploadFile(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(imageUrl));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteImage(@RequestParam("imageUrl") String imageUrl) {
        s3Service.deleteFile(imageUrl);
        return ResponseEntity.noContent().build();
    }

    private void validateFile(MultipartFile file, long maxSize) {
        if (file.getSize() > maxSize) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ErrorCode.INVALID_FILE_TYPE);
        }
    }
}
