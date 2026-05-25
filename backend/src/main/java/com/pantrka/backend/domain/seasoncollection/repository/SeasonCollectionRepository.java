package com.pantrka.backend.domain.seasoncollection.repository;

import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SeasonCollectionRepository extends JpaRepository<SeasonCollection, Long> {

    List<SeasonCollection> findAllByDeletedAtIsNullAndIsActiveTrueOrderBySortOrderAsc();

    List<SeasonCollection> findAllByDeletedAtIsNullOrderBySortOrderAsc();

    Optional<SeasonCollection> findBySlugAndDeletedAtIsNullAndIsActiveTrue(String slug);

    Optional<SeasonCollection> findByIdAndDeletedAtIsNull(Long id);

    boolean existsByNameAndDeletedAtIsNull(String name);

    boolean existsBySlugAndDeletedAtIsNull(String slug);

    @Query("SELECT COALESCE(MAX(s.sortOrder), 0) FROM SeasonCollection s WHERE s.deletedAt IS NULL")
    int findMaxSortOrder();
}
