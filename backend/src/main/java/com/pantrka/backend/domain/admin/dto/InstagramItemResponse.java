package com.pantrka.backend.domain.admin.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class InstagramItemResponse {
    private String imageUrl;
    private String linkUrl;
}
