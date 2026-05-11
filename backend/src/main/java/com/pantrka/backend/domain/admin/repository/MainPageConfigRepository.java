package com.pantrka.backend.domain.admin.repository;

import com.pantrka.backend.domain.admin.entity.MainPageConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MainPageConfigRepository extends JpaRepository<MainPageConfig, Long> {
}
