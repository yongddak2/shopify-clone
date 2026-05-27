package com.pantrka.backend.domain.product.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Comparator;
import java.util.List;

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

    // 갤러리(false) vs 상세 설명 이미지(true) 구분
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isDetail;

    @Builder
    public ProductImage(Product product, String url, int sortOrder, boolean isThumbnail, boolean isDetail) {
        this.product = product;
        this.url = url;
        this.sortOrder = sortOrder;
        this.isThumbnail = isThumbnail;
        this.isDetail = isDetail;
    }

    public void update(int sortOrder, boolean isThumbnail, boolean isDetail) {
        this.sortOrder = sortOrder;
        this.isThumbnail = isThumbnail;
        this.isDetail = isDetail;
    }

    /**
     * 목록/장바구니/찜/주문 등에 노출할 대표 썸네일 URL 결정.
     * 상세 설명 이미지(isDetail)는 제외 → isThumbnail=true 우선 → sortOrder 최소값 fallback.
     */
    public static String resolveThumbnailUrl(List<ProductImage> images) {
        List<ProductImage> gallery = images.stream()
                .filter(img -> !img.isDetail())
                .toList();
        return gallery.stream()
                .filter(ProductImage::isThumbnail)
                .findFirst()
                .or(() -> gallery.stream()
                        .min(Comparator.comparingInt(ProductImage::getSortOrder)))
                .map(ProductImage::getUrl)
                .orElse(null);
    }
}
