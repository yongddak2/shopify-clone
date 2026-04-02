package com.shopify.backend.domain.review.controller;

import com.shopify.backend.domain.review.dto.ReviewCreateRequest;
import com.shopify.backend.domain.review.dto.ReviewResponse;
import com.shopify.backend.domain.review.service.ReviewService;
import com.shopify.backend.global.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/api/products/{productId}/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewResponse> response = reviewService.getProductReviews(productId, page, size);
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
}
