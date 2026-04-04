package com.shopify.backend.domain.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class BannerOrderRequest {

    @NotNull
    private Long id;

    @NotNull
    private Integer sortOrder;
}
