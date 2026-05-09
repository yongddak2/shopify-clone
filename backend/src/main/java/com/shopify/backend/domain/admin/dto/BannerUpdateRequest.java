package com.shopify.backend.domain.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class BannerUpdateRequest {

    @NotBlank
    @Size(max = 100)
    private String title;
}
