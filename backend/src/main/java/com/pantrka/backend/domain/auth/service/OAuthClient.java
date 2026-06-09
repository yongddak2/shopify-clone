package com.pantrka.backend.domain.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pantrka.backend.domain.auth.dto.OAuthLoginRequest;
import com.pantrka.backend.domain.auth.dto.OAuthUserInfo;
import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.global.config.OAuthProperties;
import com.pantrka.backend.global.config.OAuthProperties.Registration;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

/**
 * 소셜 제공자(카카오·구글·네이버)와의 통신 담당.
 * 인가 코드 → 액세스 토큰 교환 → userinfo 조회 → 공통 모델(OAuthUserInfo) 변환.
 *
 * RestClient / ObjectMapper 는 webmvc 전용 환경에서 자동 빈 등록이 보장되지 않으므로 직접 인스턴스화.
 * (backend/CLAUDE.md "Spring Boot 4.0.4 / Hibernate 환경 함정" 참고)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OAuthClient {

    private final OAuthProperties oAuthProperties;

    private static final RestClient REST_CLIENT = RestClient.create();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public OAuthUserInfo fetchUserInfo(Provider provider, OAuthLoginRequest request) {
        Registration reg = oAuthProperties.get(provider);
        if (!StringUtils.hasText(reg.getClientId()) || !StringUtils.hasText(reg.getClientSecret())) {
            throw new BusinessException(ErrorCode.OAUTH_NOT_CONFIGURED);
        }

        String accessToken = requestAccessToken(provider, reg, request);
        JsonNode userInfo = requestUserInfo(reg, accessToken);
        return parseUserInfo(provider, userInfo);
    }

    private String requestAccessToken(Provider provider, Registration reg, OAuthLoginRequest request) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", reg.getClientId());
        form.add("client_secret", reg.getClientSecret());
        form.add("code", request.getCode());
        form.add("redirect_uri", request.getRedirectUri());
        if (StringUtils.hasText(request.getState())) {
            form.add("state", request.getState());
        }

        try {
            String body = REST_CLIENT.post()
                    .uri(reg.getTokenUri())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(String.class);

            JsonNode node = MAPPER.readTree(body);
            String accessToken = node.path("access_token").asText(null);
            if (!StringUtils.hasText(accessToken)) {
                log.warn("[OAuth] {} 토큰 응답에 access_token 없음: {}", provider, body);
                throw new BusinessException(ErrorCode.OAUTH_TOKEN_FAILED);
            }
            return accessToken;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("[OAuth] {} 토큰 교환 실패", provider, e);
            throw new BusinessException(ErrorCode.OAUTH_TOKEN_FAILED);
        }
    }

    private JsonNode requestUserInfo(Registration reg, String accessToken) {
        try {
            String body = REST_CLIENT.get()
                    .uri(reg.getUserInfoUri())
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(String.class);

            return MAPPER.readTree(body);
        } catch (Exception e) {
            log.warn("[OAuth] userinfo 조회 실패", e);
            throw new BusinessException(ErrorCode.OAUTH_USER_INFO_FAILED);
        }
    }

    private OAuthUserInfo parseUserInfo(Provider provider, JsonNode node) {
        String providerId;
        String email;
        String name;

        switch (provider) {
            case KAKAO -> {
                JsonNode account = node.path("kakao_account");
                providerId = node.path("id").asText(null);
                email = account.path("email").asText(null);
                name = account.path("profile").path("nickname").asText(null);
            }
            case GOOGLE -> {
                providerId = node.path("id").asText(null);
                email = node.path("email").asText(null);
                name = node.path("name").asText(null);
            }
            case NAVER -> {
                JsonNode response = node.path("response");
                providerId = response.path("id").asText(null);
                email = response.path("email").asText(null);
                name = response.path("name").asText(null);
            }
            default -> throw new BusinessException(ErrorCode.OAUTH_PROVIDER_NOT_SUPPORTED);
        }

        if (!StringUtils.hasText(providerId)) {
            log.warn("[OAuth] {} userinfo 에 식별자 없음: {}", provider, node);
            throw new BusinessException(ErrorCode.OAUTH_USER_INFO_FAILED);
        }
        if (!StringUtils.hasText(email)) {
            throw new BusinessException(ErrorCode.OAUTH_EMAIL_REQUIRED);
        }

        return new OAuthUserInfo(providerId, email, name);
    }
}
