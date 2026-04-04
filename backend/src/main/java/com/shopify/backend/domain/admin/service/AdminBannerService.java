package com.shopify.backend.domain.admin.service;

import com.shopify.backend.domain.admin.dto.BannerCreateRequest;
import com.shopify.backend.domain.admin.dto.BannerOrderRequest;
import com.shopify.backend.domain.admin.dto.BannerResponse;
import com.shopify.backend.domain.admin.entity.Banner;
import com.shopify.backend.domain.admin.repository.BannerRepository;
import com.shopify.backend.global.exception.BusinessException;
import com.shopify.backend.global.exception.ErrorCode;
import com.shopify.backend.infra.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBannerService {

    private final BannerRepository bannerRepository;
    private final S3Service s3Service;

    private static final int MAX_BANNER_COUNT = 5;

    public List<BannerResponse> getBanners() {
        return bannerRepository.findAllByOrderBySortOrderAsc().stream()
                .map(BannerResponse::from)
                .toList();
    }

    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findAllByIsActiveTrueOrderBySortOrderAsc().stream()
                .map(BannerResponse::from)
                .toList();
    }

    @Transactional
    public BannerResponse createBanner(BannerCreateRequest request) {
        if (bannerRepository.count() >= MAX_BANNER_COUNT) {
            throw new BusinessException(ErrorCode.BANNER_LIMIT_EXCEEDED);
        }

        Banner banner = Banner.builder()
                .imageUrl(request.getImageUrl())
                .sortOrder(request.getSortOrder())
                .build();

        return BannerResponse.from(bannerRepository.save(banner));
    }

    @Transactional
    public void updateBannerOrder(List<BannerOrderRequest> requests) {
        for (BannerOrderRequest request : requests) {
            Banner banner = bannerRepository.findById(request.getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
            banner.updateSortOrder(request.getSortOrder());
        }
    }

    @Transactional
    public BannerResponse toggleBannerActive(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
        banner.toggleActive();
        return BannerResponse.from(banner);
    }

    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
        s3Service.deleteFile(banner.getImageUrl());
        bannerRepository.delete(banner);
    }
}
