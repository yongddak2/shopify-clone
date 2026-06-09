package com.pantrka.backend.domain.auth.dto;

/**
 * 소셜 제공자(userinfo) 응답에서 추출한 공통 사용자 정보.
 */
public record OAuthUserInfo(String providerId, String email, String name) {
}
