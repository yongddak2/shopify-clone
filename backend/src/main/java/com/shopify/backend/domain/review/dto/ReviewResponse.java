package com.shopify.backend.domain.review.dto;

import com.shopify.backend.domain.review.entity.Review;
import com.shopify.backend.domain.review.entity.ReviewImage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Getter
@Builder
public class ReviewResponse {

    private final Long id;
    private final Long orderItemId;
    private final String memberName;
    private final int rating;
    private final String content;
    private final String optionInfo;
    private final List<String> images;
    private final long likeCount;
    private final boolean liked;
    private final LocalDateTime createdAt;

    public static ReviewResponse from(Review review, long likeCount, boolean liked) {
        List<String> imageUrls = review.getImages().stream()
                .sorted(Comparator.comparingInt(ReviewImage::getSortOrder))
                .map(ReviewImage::getUrl)
                .toList();

        String optionInfo = review.getOrderItem() != null
                ? review.getOrderItem().getOptionInfoSnapshot()
                : null;

        Long orderItemId = review.getOrderItem() != null
                ? review.getOrderItem().getId()
                : null;

        return ReviewResponse.builder()
                .id(review.getId())
                .orderItemId(orderItemId)
                .memberName(review.getMember().getName())
                .rating(review.getRating())
                .content(review.getContent())
                .optionInfo(optionInfo)
                .images(imageUrls)
                .likeCount(likeCount)
                .liked(liked)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
