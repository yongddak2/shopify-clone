package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.MainPageConfigResponse;
import com.pantrka.backend.domain.admin.dto.MainPageConfigUpdateRequest;
import com.pantrka.backend.domain.admin.entity.MainPageConfig;
import com.pantrka.backend.domain.admin.repository.MainPageConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MainPageConfigService {

    private final MainPageConfigRepository repository;

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

    private MainPageConfig getOrInit() {
        return repository.findById(MainPageConfig.SINGLETON_ID)
                .orElseGet(() -> repository.save(MainPageConfig.empty()));
    }
}
