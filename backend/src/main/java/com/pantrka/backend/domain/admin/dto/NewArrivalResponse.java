package com.pantrka.backend.domain.admin.dto;

import com.pantrka.backend.domain.admin.entity.MainPageNewArrival;
import com.pantrka.backend.domain.product.dto.ProductSummaryResponse;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NewArrivalResponse {

    private final Long id;
    private final Integer sortOrder;
    private final ProductSummaryResponse product;

    public static NewArrivalResponse from(MainPageNewArrival entry) {
        return NewArrivalResponse.builder()
                .id(entry.getId())
                .sortOrder(entry.getSortOrder())
                .product(ProductSummaryResponse.from(entry.getProduct()))
                .build();
    }
}
