package com.pantrka.backend.domain.seasoncollection.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollection;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SeasonCollectionSummaryResponse {

    private final Long id;
    private final String name;
    private final String slug;

    @JsonProperty("isActive")
    private final boolean isActive;

    private final int sortOrder;
    private final int imageCount;

    public static SeasonCollectionSummaryResponse from(SeasonCollection s) {
        return SeasonCollectionSummaryResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .slug(s.getSlug())
                .isActive(s.isActive())
                .sortOrder(s.getSortOrder())
                .imageCount(s.getImages() == null ? 0 : s.getImages().size())
                .build();
    }
}
