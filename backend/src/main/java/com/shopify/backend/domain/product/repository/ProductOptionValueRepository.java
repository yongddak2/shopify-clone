package com.shopify.backend.domain.product.repository;

import com.shopify.backend.domain.product.entity.ProductOptionValue;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pov FROM ProductOptionValue pov WHERE pov.id = :id")
    Optional<ProductOptionValue> findByIdWithLock(@Param("id") Long id);
}
