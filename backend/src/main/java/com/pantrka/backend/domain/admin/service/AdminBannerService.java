package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.AdminBannerResponse;
import com.pantrka.backend.domain.admin.dto.BannerCreateRequest;
import com.pantrka.backend.domain.admin.dto.BannerOrderRequest;
import com.pantrka.backend.domain.admin.dto.BannerResponse;
import com.pantrka.backend.domain.admin.dto.BannerUpdateRequest;
import com.pantrka.backend.domain.admin.entity.Banner;
import com.pantrka.backend.domain.admin.repository.BannerRepository;
import com.pantrka.backend.domain.product.entity.Product;
import com.pantrka.backend.domain.product.repository.ProductRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBannerService {

    private final BannerRepository bannerRepository;
    private final ProductRepository productRepository;
    private final S3Service s3Service;

    private static final int MAX_BANNER_COUNT = 5;

    public List<AdminBannerResponse> getBanners() {
        List<Banner> banners = bannerRepository.findAllByOrderBySortOrderAsc();
        Map<Long, Product> productMap = loadLinkedProducts(banners);
        return banners.stream()
                .map(b -> {
                    Product linked = b.getProductId() != null
                            ? productMap.get(b.getProductId())
                            : null;
                    return AdminBannerResponse.from(b, linked);
                })
                .toList();
    }

    public List<BannerResponse> getActiveBanners() {
        return bannerRepository.findAllByIsActiveTrueOrderBySortOrderAsc().stream()
                .map(BannerResponse::from)
                .toList();
    }

    @Transactional
    public AdminBannerResponse createBanner(BannerCreateRequest request) {
        if (bannerRepository.count() >= MAX_BANNER_COUNT) {
            throw new BusinessException(ErrorCode.BANNER_LIMIT_EXCEEDED);
        }

        String normalizedLinkUrl = normalizeLinkUrl(request.getLinkUrl());
        validateLink(request.getProductId(), normalizedLinkUrl);

        Banner banner = Banner.builder()
                .imageUrl(request.getImageUrl())
                .sortOrder(request.getSortOrder())
                .title(request.getTitle())
                .productId(request.getProductId())
                .linkUrl(normalizedLinkUrl)
                .build();

        Banner saved = bannerRepository.save(banner);
        return AdminBannerResponse.from(saved, findProductOrNull(saved.getProductId()));
    }

    @Transactional
    public AdminBannerResponse updateBanner(Long id, BannerUpdateRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));

        String normalizedLinkUrl = normalizeLinkUrl(request.getLinkUrl());
        validateLink(request.getProductId(), normalizedLinkUrl);

        banner.updateTitle(request.getTitle());
        banner.updateLink(request.getProductId(), normalizedLinkUrl);

        return AdminBannerResponse.from(banner, findProductOrNull(banner.getProductId()));
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
    public AdminBannerResponse toggleBannerActive(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
        banner.toggleActive();
        return AdminBannerResponse.from(banner, findProductOrNull(banner.getProductId()));
    }

    @Transactional
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.BANNER_NOT_FOUND));
        s3Service.deleteFile(banner.getImageUrl());
        bannerRepository.delete(banner);
    }

    private void validateLink(Long productId, String linkUrl) {
        boolean hasProduct = productId != null;
        boolean hasUrl = linkUrl != null && !linkUrl.isBlank();

        if (hasProduct && hasUrl) {
            throw new BusinessException(ErrorCode.BANNER_LINK_CONFLICT);
        }
        if (hasUrl && !isValidLinkUrl(linkUrl)) {
            throw new BusinessException(ErrorCode.BANNER_LINK_URL_INVALID);
        }
        if (hasProduct && !productRepository.existsById(productId)) {
            throw new BusinessException(ErrorCode.PRODUCT_NOT_FOUND);
        }
    }

    private boolean isValidLinkUrl(String url) {
        return url.startsWith("/")
                || url.startsWith("http://")
                || url.startsWith("https://");
    }

    private String normalizeLinkUrl(String linkUrl) {
        if (linkUrl == null) return null;
        String trimmed = linkUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Map<Long, Product> loadLinkedProducts(List<Banner> banners) {
        Set<Long> ids = banners.stream()
                .map(Banner::getProductId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        return productRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
    }

    private Product findProductOrNull(Long productId) {
        if (productId == null) return null;
        return productRepository.findById(productId).orElse(null);
    }
}
