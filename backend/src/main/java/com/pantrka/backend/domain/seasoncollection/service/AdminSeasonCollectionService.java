package com.pantrka.backend.domain.seasoncollection.service;

import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionCreateRequest;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionSummaryResponse;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonCollectionUpdateRequest;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonImageOrderRequest;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonImageResponse;
import com.pantrka.backend.domain.seasoncollection.dto.SeasonOrderRequest;
import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollection;
import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollectionImage;
import com.pantrka.backend.domain.seasoncollection.repository.SeasonCollectionImageRepository;
import com.pantrka.backend.domain.seasoncollection.repository.SeasonCollectionRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSeasonCollectionService {

    private static final String S3_DIRECTORY = "season-collections";

    private final SeasonCollectionRepository repository;
    private final SeasonCollectionImageRepository imageRepository;
    private final S3Service s3Service;

    public List<SeasonCollectionSummaryResponse> getAll() {
        return repository.findAllByDeletedAtIsNullOrderBySortOrderAsc()
                .stream()
                .map(SeasonCollectionSummaryResponse::from)
                .toList();
    }

    @Transactional
    public SeasonCollectionSummaryResponse create(SeasonCollectionCreateRequest request) {
        String name = request.getName().trim();
        validateNameFormat(name);
        if (repository.existsByNameAndDeletedAtIsNull(name)) {
            throw new BusinessException(ErrorCode.SEASON_NAME_DUPLICATED);
        }
        String slug = generateUniqueSlug(name);
        int sortOrder = repository.findMaxSortOrder() + 1;
        SeasonCollection season = SeasonCollection.builder()
                .name(name)
                .slug(slug)
                .sortOrder(sortOrder)
                .build();
        return SeasonCollectionSummaryResponse.from(repository.save(season));
    }

    @Transactional
    public SeasonCollectionSummaryResponse updateName(Long id, SeasonCollectionUpdateRequest request) {
        SeasonCollection season = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
        String name = request.getName().trim();
        validateNameFormat(name);
        if (!season.getName().equals(name)
                && repository.existsByNameAndDeletedAtIsNull(name)) {
            throw new BusinessException(ErrorCode.SEASON_NAME_DUPLICATED);
        }
        String slug = season.getName().equals(name)
                ? season.getSlug()
                : generateUniqueSlug(name);
        season.updateName(name, slug);
        return SeasonCollectionSummaryResponse.from(season);
    }

    @Transactional
    public SeasonCollectionSummaryResponse toggleActive(Long id) {
        SeasonCollection season = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
        season.toggleActive();
        return SeasonCollectionSummaryResponse.from(season);
    }

    @Transactional
    public void reorder(List<SeasonOrderRequest> requests) {
        for (SeasonOrderRequest req : requests) {
            SeasonCollection season = repository.findByIdAndDeletedAtIsNull(req.getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
            season.updateSortOrder(req.getSortOrder());
        }
    }

    @Transactional
    public void delete(Long id) {
        SeasonCollection season = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
        for (SeasonCollectionImage image : season.getImages()) {
            try {
                s3Service.deleteFile(image.getImageUrl());
            } catch (Exception ignored) {
                // S3 삭제 실패해도 DB는 정리
            }
        }
        season.markDeleted();
    }

    public List<SeasonImageResponse> getImages(Long seasonId) {
        repository.findByIdAndDeletedAtIsNull(seasonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
        return imageRepository.findAllByCollectionIdOrderBySortOrderAsc(seasonId)
                .stream()
                .map(SeasonImageResponse::from)
                .toList();
    }

    @Transactional
    public List<SeasonImageResponse> addImages(Long seasonId, List<MultipartFile> files) {
        SeasonCollection season = repository.findByIdAndDeletedAtIsNull(seasonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
        int nextSortOrder = imageRepository.findMaxSortOrderByCollectionId(seasonId) + 1;
        for (MultipartFile file : files) {
            String url = s3Service.uploadFile(file, S3_DIRECTORY);
            SeasonCollectionImage image = SeasonCollectionImage.builder()
                    .imageUrl(url)
                    .sortOrder(nextSortOrder++)
                    .build();
            season.addImage(image);
        }
        return imageRepository.findAllByCollectionIdOrderBySortOrderAsc(seasonId)
                .stream()
                .map(SeasonImageResponse::from)
                .toList();
    }

    @Transactional
    public void reorderImages(Long seasonId, List<SeasonImageOrderRequest> requests) {
        repository.findByIdAndDeletedAtIsNull(seasonId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_NOT_FOUND));
        List<SeasonCollectionImage> existing = imageRepository.findAllByCollectionIdOrderBySortOrderAsc(seasonId);
        Map<Long, SeasonCollectionImage> byId = new HashMap<>();
        for (SeasonCollectionImage img : existing) {
            byId.put(img.getId(), img);
        }
        for (SeasonImageOrderRequest req : requests) {
            SeasonCollectionImage img = byId.get(req.getId());
            if (img == null) {
                throw new BusinessException(ErrorCode.SEASON_IMAGE_NOT_FOUND);
            }
            img.updateSortOrder(req.getSortOrder());
        }
    }

    @Transactional
    public void deleteImage(Long imageId) {
        SeasonCollectionImage img = imageRepository.findById(imageId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SEASON_IMAGE_NOT_FOUND));
        try {
            s3Service.deleteFile(img.getImageUrl());
        } catch (Exception ignored) {
        }
        imageRepository.delete(img);
    }

    private void validateNameFormat(String name) {
        if (!name.matches("^[A-Za-z0-9 /]+$")) {
            throw new BusinessException(ErrorCode.SEASON_NAME_INVALID);
        }
    }

    private String generateUniqueSlug(String name) {
        String base = name.toLowerCase()
                .replace("/", "-")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        String slug = base;
        int suffix = 2;
        while (repository.existsBySlugAndDeletedAtIsNull(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }
}
