package com.pantrka.backend.domain.admin.dto;

import com.pantrka.backend.domain.admin.entity.MainPageConfig;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MainPageConfigResponse {

    private String subText;

    public static MainPageConfigResponse from(MainPageConfig config) {
        return MainPageConfigResponse.builder()
                .subText(config.getSubText())
                .build();
    }
}
