package com.pantrka.backend.domain.admin.repository;

import com.pantrka.backend.domain.admin.entity.MainPageNewArrival;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Set;

public interface MainPageNewArrivalRepository extends JpaRepository<MainPageNewArrival, Long> {

    @EntityGraph(attributePaths = {"product", "product.images"})
    List<MainPageNewArrival> findAllByOrderBySortOrderAsc();

    boolean existsByProductId(Long productId);

    List<MainPageNewArrival> findByProductIdIn(Set<Long> productIds);
}
