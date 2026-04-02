package com.shopify.backend.domain.product.repository;

import com.shopify.backend.domain.product.entity.ProductOptionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductOptionGroupRepository extends JpaRepository<ProductOptionGroup, Long> {
}
