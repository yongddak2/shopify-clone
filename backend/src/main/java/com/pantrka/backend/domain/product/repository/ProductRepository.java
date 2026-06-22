package com.pantrka.backend.domain.product.repository;

import com.pantrka.backend.domain.product.entity.Product;
import com.pantrka.backend.domain.product.entity.ProductStatus;
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
    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.deletedAt IS NULL " +
            "AND (:categoryId IS NULL OR p.category.id = :categoryId)")
    Page<Product> findActiveProducts(@Param("status") ProductStatus status,
                                     @Param("categoryId") Long categoryId,
                                     Pageable pageable);

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

    @EntityGraph(attributePaths = {"images"})
    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND p.salesCount > 0 " +
            "ORDER BY p.salesCount DESC, p.id ASC")
    List<Product> findTopBySales(Pageable pageable);

    @Query("SELECT p FROM Product p " +
            "WHERE p.deletedAt IS NULL " +
            "AND LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "AND (:categoryId IS NULL OR p.category.id = :categoryId)")
    Page<Product> findAdminProducts(@Param("keyword") String keyword,
                                    @Param("categoryId") Long categoryId,
                                    Pageable pageable);
}
