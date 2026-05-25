package com.pantrka.backend.domain.seasoncollection.dto;

import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollectionImage;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SeasonImageResponse {

    private final Long id;
    private final String imageUrl;
    private final int sortOrder;

    public static SeasonImageResponse from(SeasonCollectionImage img) {
        return SeasonImageResponse.builder()
                .id(img.getId())
                .imageUrl(img.getImageUrl())
                .sortOrder(img.getSortOrder())
                .build();
    }
}
