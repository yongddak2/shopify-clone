package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.AboutImageUpdateRequest;
import com.pantrka.backend.domain.admin.dto.MainPageConfigResponse;
import com.pantrka.backend.domain.admin.dto.MainPageConfigUpdateRequest;
import com.pantrka.backend.domain.admin.entity.MainPageConfig;
import com.pantrka.backend.domain.admin.repository.MainPageConfigRepository;
import com.pantrka.backend.infra.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private MainPageConfig getOrInit() {
        return repository.findById(MainPageConfig.SINGLETON_ID)
                .orElseGet(() -> repository.save(MainPageConfig.empty()));
    }
}
