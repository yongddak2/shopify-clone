package com.shopify.backend.domain.product.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal basePrice;

    private BigDecimal discountRate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status;

    private int viewCount;

    @Column(nullable = false)
    private int salesCount;

    @OneToMany(mappedBy = "product")
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product")
    private List<ProductOptionGroup> optionGroups = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @Builder
    public Product(Category category, String name, String description, BigDecimal basePrice,
                   BigDecimal discountRate, ProductStatus status) {
        this.category = category;
        this.name = name;
        this.description = description;
        this.basePrice = basePrice;
        this.discountRate = discountRate;
        this.status = status;
    }

    public void update(String name, String description, BigDecimal basePrice,
                       BigDecimal discountRate, ProductStatus status) {
        if (name != null) this.name = name;
        if (description != null) this.description = description;
        if (basePrice != null) this.basePrice = basePrice;
        if (discountRate != null) this.discountRate = discountRate;
        if (status != null) this.status = status;
    }

    public void updateCategory(Category category) {
        this.category = category;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void increaseSalesCount(int quantity) {
        this.salesCount += quantity;
    }

    public void decreaseSalesCount(int quantity) {
        this.salesCount = Math.max(0, this.salesCount - quantity);
    }
}
