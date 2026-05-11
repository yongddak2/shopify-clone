package com.pantrka.backend.domain.product.repository;

import com.pantrka.backend.domain.product.entity.ProductOptionGroup;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductOptionGroupRepository extends JpaRepository<ProductOptionGroup, Long> {
}
