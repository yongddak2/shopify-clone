package com.shopify.backend.domain.product.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private String url;

    private int sortOrder;

    @Column(nullable = false)
    private boolean isThumbnail;

    @Builder
    public ProductImage(Product product, String url, int sortOrder, boolean isThumbnail) {
        this.product = product;
        this.url = url;
        this.sortOrder = sortOrder;
        this.isThumbnail = isThumbnail;
    }
}
