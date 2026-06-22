package com.pantrka.backend.domain.admin.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class InstagramItemRequest {

    @Size(max = 1000, message = "이미지 URL은 1000자 이하여야 합니다.")
    private String imageUrl;

    @Size(max = 500, message = "Instagram 링크는 500자 이하여야 합니다.")
    private String linkUrl;
}
