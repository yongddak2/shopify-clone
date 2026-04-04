package com.shopify.backend.domain.review.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReviewLikeResponse {

    private final boolean liked;
    private final long likeCount;
}
