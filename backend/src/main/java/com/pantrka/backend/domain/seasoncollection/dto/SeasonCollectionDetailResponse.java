package com.pantrka.backend.domain.seasoncollection.dto;

import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollection;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class SeasonCollectionDetailResponse {

    private final Long id;
    private final String name;
    private final String slug;
    private final List<SeasonImageResponse> images;

    public static SeasonCollectionDetailResponse from(SeasonCollection s) {
        return SeasonCollectionDetailResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .slug(s.getSlug())
                .images(s.getImages().stream()
                        .map(SeasonImageResponse::from)
                        .toList())
                .build();
    }
}
