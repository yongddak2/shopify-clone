package com.shopify.backend.domain.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class BannerCreateRequest {

    @NotBlank
    private String imageUrl;

    @NotNull
    private Integer sortOrder;
}
