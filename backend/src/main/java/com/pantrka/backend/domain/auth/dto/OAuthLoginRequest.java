package com.pantrka.backend.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class OAuthLoginRequest {

    @NotBlank(message = "인가 코드는 필수입니다.")
    private String code;

    @NotBlank(message = "리다이렉트 URI는 필수입니다.")
    private String redirectUri;

    // 네이버 토큰 교환에 사용 (카카오·구글은 미사용)
    private String state;
}
