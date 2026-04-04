package com.shopify.backend.domain.product.repository;

import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByIdAndDeletedAtIsNull(Long id);

    @EntityGraph(attributePaths = {"images"})
    Page<Product> findByStatusAndDeletedAtIsNull(ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"images"})
    @Query("SELECT p FROM Product p WHERE p.status = 'ACTIVE' AND p.deletedAt IS NULL " +
            "AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:filterCategory = false OR p.category.id IN :categoryIds) " +
            "AND (:minPrice IS NULL OR p.basePrice >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice)")
    Page<Product> searchProducts(@Param("keyword") String keyword,
                                 @Param("filterCategory") boolean filterCategory,
                                 @Param("categoryIds") List<Long> categoryIds,
                                 @Param("minPrice") BigDecimal minPrice,
                                 @Param("maxPrice") BigDecimal maxPrice,
                                 Pageable pageable);
}
