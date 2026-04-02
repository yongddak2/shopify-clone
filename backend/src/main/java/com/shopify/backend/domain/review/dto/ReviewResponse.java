package com.shopify.backend.domain.review.dto;

import com.shopify.backend.domain.review.entity.Review;
import com.shopify.backend.domain.review.entity.ReviewImage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ReviewResponse {

    private final Long id;
    private final String memberName;
    private final int rating;
    private final String content;
    private final List<String> images;
    private final LocalDateTime createdAt;

    public static ReviewResponse from(Review review) {
        List<String> imageUrls = review.getImages().stream()
                .map(ReviewImage::getUrl)
                .toList();

        return ReviewResponse.builder()
                .id(review.getId())
                .memberName(review.getMember().getName())
                .rating(review.getRating())
                .content(review.getContent())
                .images(imageUrls)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
