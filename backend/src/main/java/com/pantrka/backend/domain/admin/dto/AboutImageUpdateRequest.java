package com.pantrka.backend.domain.admin.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class AboutImageUpdateRequest {

    // null 또는 빈 문자열 → 기존 이미지 제거
    private String imageUrl;
}
