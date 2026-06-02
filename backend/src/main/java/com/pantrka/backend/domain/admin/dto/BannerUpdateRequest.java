package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class BannerUpdateRequest {

    @NotBlank
    @Size(max = 100)
    private String title;

    // 둘 다 nullable. 동시 입력 금지 (서비스에서 검증).
    private Long productId;

    @Size(max = 500)
    private String linkUrl;
}
