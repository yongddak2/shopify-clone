package com.shopify.backend.domain.product.dto;

import com.shopify.backend.domain.product.entity.Category;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CategoryResponse {

    private final Long id;
    private final String name;
    private final Integer depth;
    private final List<CategoryResponse> children;

    public static CategoryResponse from(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .depth(category.getDepth())
                .children(category.getChildren().stream()
                        .map(CategoryResponse::from)
                        .toList())
                .build();
    }
}
