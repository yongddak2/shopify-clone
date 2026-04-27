package com.shopify.backend.domain.product.repository;

import com.shopify.backend.domain.product.entity.ProductOptionValue;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pov FROM ProductOptionValue pov WHERE pov.id = :id")
    Optional<ProductOptionValue> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT pov FROM ProductOptionValue pov " +
            "JOIN FETCH pov.optionGroup pog " +
            "JOIN FETCH pog.product p " +
            "WHERE pov.stockQuantity <= :threshold AND p.deletedAt IS NULL " +
            "ORDER BY pov.stockQuantity ASC, p.id ASC")
    List<ProductOptionValue> findLowStock(@Param("threshold") int threshold);
}
