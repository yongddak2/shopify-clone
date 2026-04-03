package com.shopify.backend.domain.product.repository;

import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByStatusAndDeletedAtIsNull(ProductStatus status, Pageable pageable);
}
