package com.shopify.backend.domain.product.repository;

import com.shopify.backend.domain.product.entity.ProductOptionValue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductOptionValueRepository extends JpaRepository<ProductOptionValue, Long> {
}
