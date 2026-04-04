package com.shopify.backend.domain.review.controller;

import com.shopify.backend.domain.review.dto.ReviewCreateRequest;
import com.shopify.backend.domain.review.dto.ReviewLikeResponse;
import com.shopify.backend.domain.review.dto.ReviewResponse;
import com.shopify.backend.domain.review.service.ReviewService;
import com.shopify.backend.global.common.ApiResponse;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import com.shopify.backend.infra.s3.S3Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final S3Service s3Service;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @GetMapping("/api/reviews/me")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getMyReviews(Authentication authentication) {
        Long memberId = (Long) authentication.getPrincipal();
        List<ReviewResponse> response = reviewService.getMyReviews(memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/api/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "latest") String sort,
            Authentication authentication) {
        Long memberId = authentication != null ? (Long) authentication.getPrincipal() : null;
        Page<ReviewResponse> response = reviewService.getProductReviews(productId, page, size, sort, memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/api/reviews")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            Authentication authentication,
            @Valid @RequestBody ReviewCreateRequest request) {
        Long memberId = (Long) authentication.getPrincipal();
        ReviewResponse response = reviewService.createReview(memberId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("리뷰가 등록되었습니다.", response));
    }

    @DeleteMapping("/api/reviews/{id}")
    public ResponseEntity<Void> deleteReview(
            Authentication authentication,
            @PathVariable Long id) {
        Long memberId = (Long) authentication.getPrincipal();
        reviewService.deleteReview(memberId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/reviews/images")
    public ResponseEntity<ApiResponse<String>> uploadReviewImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        validateFile(file);
        String imageUrl = s3Service.uploadFile(file, "reviews");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(imageUrl));
    }

    @PostMapping("/api/reviews/{reviewId}/like")
    public ResponseEntity<ApiResponse<ReviewLikeResponse>> toggleLike(
            Authentication authentication,
            @PathVariable Long reviewId) {
        Long memberId = (Long) authentication.getPrincipal();
        ReviewLikeResponse response = reviewService.toggleLike(reviewId, memberId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private void validateFile(MultipartFile file) {
        if (file.getSize() > MAX_FILE_SIZE) {
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
