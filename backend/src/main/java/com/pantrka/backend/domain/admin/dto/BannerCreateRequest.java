package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class BannerCreateRequest {

    @NotBlank
    private String imageUrl;

    @NotNull
    private Integer sortOrder;

    @NotBlank
    @Size(max = 100)
    private String title;
}
