package com.pantrka.backend.domain.seasoncollection.repository;

import com.pantrka.backend.domain.seasoncollection.entity.SeasonCollectionImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SeasonCollectionImageRepository extends JpaRepository<SeasonCollectionImage, Long> {

    List<SeasonCollectionImage> findAllByCollectionIdOrderBySortOrderAsc(Long collectionId);

    @Query("SELECT COALESCE(MAX(i.sortOrder), 0) FROM SeasonCollectionImage i WHERE i.collection.id = :collectionId")
    int findMaxSortOrderByCollectionId(@Param("collectionId") Long collectionId);
}
