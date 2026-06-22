package com.pantrka.backend.domain.admin.dto;

import com.pantrka.backend.domain.admin.entity.MainPageConfig;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class MainPageConfigResponse {

    private String subText;
    private String aboutImageUrl;
    private String instagramHandle;
    private List<InstagramItemResponse> instagramItems;

    public static MainPageConfigResponse from(MainPageConfig config) {
        return MainPageConfigResponse.builder()
                .subText(config.getSubText())
                .aboutImageUrl(config.getAboutImageUrl())
                .instagramHandle(config.getInstagramHandle())
                .instagramItems(List.of(
                        item(config.getInstagramImageUrl1(), config.getInstagramLinkUrl1()),
                        item(config.getInstagramImageUrl2(), config.getInstagramLinkUrl2()),
                        item(config.getInstagramImageUrl3(), config.getInstagramLinkUrl3())))
                .build();
    }

    private static InstagramItemResponse item(String imageUrl, String linkUrl) {
        return InstagramItemResponse.builder()
                .imageUrl(imageUrl)
                .linkUrl(linkUrl)
                .build();
    }
}
