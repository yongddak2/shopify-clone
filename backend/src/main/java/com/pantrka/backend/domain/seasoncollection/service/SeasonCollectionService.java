package com.pantrka.backend.domain.seasoncollection.service;

import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionDetailResponse;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionSummaryResponse;
import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollection;
import com.pantrka.backend.domain.seasoncollection.repository.SeasonCollectionRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeasonCollectionService {

    private final SeasonCollectionRepository repository;

    public List<SeasonCollectionSummaryResponse> getActiveSeasons() {
        return repository.findAllByDeletedAtIsNullAndIsActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(SeasonCollectionSummaryResponse::from)
                .toList();
    }

    public SeasonCollectionDetailResponse getBySlug(String slug) {
        SeasonCollection season = repository.findBySlugAndDeletedAtIsNullAndIsActiveTrue(slug)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
        return SeasonCollectionDetailResponse.from(season);
    }
}
