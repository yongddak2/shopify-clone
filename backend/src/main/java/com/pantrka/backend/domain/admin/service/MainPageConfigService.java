package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.AboutImageUpdateRequest;
import com.pantrka.backend.domain.admin.dto.MainPageConfigResponse;
import com.pantrka.backend.domain.admin.dto.MainPageConfigUpdateRequest;
import com.pantrka.backend.domain.admin.dto.InstagramItemRequest;
import com.pantrka.backend.domain.admin.dto.InstagramSectionUpdateRequest;
import com.pantrka.backend.domain.admin.entity.MainPageConfig;
import com.pantrka.backend.domain.admin.repository.MainPageConfigRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import com.pantrka.backend.infra.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainPageConfigService {

    private final MainPageConfigRepository repository;
    private final S3Service s3Service;

    public MainPageConfigResponse getConfig() {
        return MainPageConfigResponse.from(getOrInit());
    }

    @Transactional
    public MainPageConfigResponse updateConfig(MainPageConfigUpdateRequest request) {
        MainPageConfig config = getOrInit();
        String trimmed = request.getSubText() == null ? null : request.getSubText().trim();
        config.updateSubText(trimmed == null || trimmed.isEmpty() ? null : trimmed);
        return MainPageConfigResponse.from(config);
    }

    @Transactional
    public MainPageConfigResponse updateAboutImage(AboutImageUpdateRequest request) {
        MainPageConfig config = getOrInit();
        String newUrl = request.getImageUrl();
        if (newUrl != null && newUrl.isBlank()) {
            newUrl = null;
        }
        // 새 URL이 기존과 다르면 기존 S3 파일 삭제
        String oldUrl = config.getAboutImageUrl();
        if (oldUrl != null && !oldUrl.equals(newUrl)) {
            try {
                s3Service.deleteFile(oldUrl);
            } catch (Exception ignored) {
                // S3 삭제 실패해도 메타 변경은 진행 — 고아 파일은 별도 정리 정책
            }
        }
        config.updateAboutImageUrl(newUrl);
        return MainPageConfigResponse.from(config);
    }

    @Transactional
    public MainPageConfigResponse updateInstagram(InstagramSectionUpdateRequest request) {
        MainPageConfig config = getOrInit();
        List<NormalizedItem> items = request.getItems().stream()
                .map(this::normalizeItem)
                .toList();

        long configuredCount = items.stream().filter(NormalizedItem::configured).count();
        if (configuredCount != 0 && configuredCount != 3) {
            throw invalidInstagram("이미지와 Instagram 링크를 3개 모두 입력해주세요.");
        }

        String handle = normalize(request.getHandle());
        if (handle != null && handle.startsWith("@")) {
            handle = handle.substring(1);
        }
        if (configuredCount == 3 && (handle == null || !handle.matches("^[A-Za-z0-9._]{1,100}$"))) {
            throw invalidInstagram("올바른 Instagram 계정명을 입력해주세요.");
        }
        if (configuredCount == 0) {
            handle = null;
        }

        List<String> oldImageUrls = Arrays.asList(
                config.getInstagramImageUrl1(),
                config.getInstagramImageUrl2(),
                config.getInstagramImageUrl3());

        config.updateInstagram(
                handle,
                items.get(0).imageUrl(), items.get(0).linkUrl(),
                items.get(1).imageUrl(), items.get(1).linkUrl(),
                items.get(2).imageUrl(), items.get(2).linkUrl());

        List<String> newImageUrls = items.stream().map(NormalizedItem::imageUrl).toList();
        for (String oldUrl : oldImageUrls) {
            if (oldUrl != null && !newImageUrls.contains(oldUrl)) {
                try {
                    s3Service.deleteFile(oldUrl);
                } catch (Exception ignored) {
                    // S3 cleanup failure must not prevent the saved section update.
                }
            }
        }

        return MainPageConfigResponse.from(config);
    }

    private NormalizedItem normalizeItem(InstagramItemRequest item) {
        if (item == null) {
            throw invalidInstagram("Instagram 항목이 올바르지 않습니다.");
        }
        String imageUrl = normalize(item.getImageUrl());
        String linkUrl = normalize(item.getLinkUrl());
        if ((imageUrl == null) != (linkUrl == null)) {
            throw invalidInstagram("각 이미지에 Instagram 링크를 함께 입력해주세요.");
        }
        if (imageUrl != null && !isHttpUrl(imageUrl)) {
            throw invalidInstagram("이미지 URL이 올바르지 않습니다.");
        }
        if (linkUrl != null && !isInstagramUrl(linkUrl)) {
            throw invalidInstagram("링크는 Instagram HTTPS 주소여야 합니다.");
        }
        return new NormalizedItem(imageUrl, linkUrl);
    }

    private boolean isHttpUrl(String value) {
        try {
            URI uri = URI.create(value);
            String scheme = uri.getScheme();
            return ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme))
                    && uri.getHost() != null;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isInstagramUrl(String value) {
        try {
            URI uri = URI.create(value);
            String host = uri.getHost();
            return "https".equalsIgnoreCase(uri.getScheme())
                    && host != null
                    && (host.equalsIgnoreCase("instagram.com")
                    || host.toLowerCase().endsWith(".instagram.com"));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private BusinessException invalidInstagram(String message) {
        return new BusinessException(ErrorCode.INVALID_INPUT, message);
    }

    private record NormalizedItem(String imageUrl, String linkUrl) {
        boolean configured() {
            return imageUrl != null && linkUrl != null;
        }
    }

    private MainPageConfig getOrInit() {
        return repository.findById(MainPageConfig.SINGLETON_ID)
                .orElseGet(() -> repository.save(MainPageConfig.empty()));
    }
}
