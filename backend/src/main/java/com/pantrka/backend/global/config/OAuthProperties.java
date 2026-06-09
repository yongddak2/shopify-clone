package com.pantrka.backend.global.config;

import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "oauth")
public class OAuthProperties {

    private Registration kakao = new Registration();
    private Registration google = new Registration();
    private Registration naver = new Registration();

    public Registration get(Provider provider) {
        return switch (provider) {
            case KAKAO -> kakao;
            case GOOGLE -> google;
            case NAVER -> naver;
            default -> throw new BusinessException(ErrorCode.OAUTH_PROVIDER_NOT_SUPPORTED);
        };
    }

    @Getter
    @Setter
    public static class Registration {
        private String clientId;
        private String clientSecret;
        private String tokenUri;
        private String userInfoUri;
    }
}
