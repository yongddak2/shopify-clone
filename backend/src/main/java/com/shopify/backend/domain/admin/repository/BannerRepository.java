package com.shopify.backend.domain.admin.repository;

import com.shopify.backend.domain.admin.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findAllByOrderBySortOrderAsc();

    List<Banner> findAllByIsActiveTrueOrderBySortOrderAsc();

    long countByIsActiveTrue();
}
