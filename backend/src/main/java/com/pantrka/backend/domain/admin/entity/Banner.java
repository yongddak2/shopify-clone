package com.pantrka.backend.domain.admin.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "banner")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String imageUrl;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean isActive = true;

    @Column(name = "product_id")
    private Long productId;

    private String linkUrl;

    @Column(length = 100)
    private String title;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Builder
    public Banner(String imageUrl, int sortOrder, Long productId, String linkUrl, String title) {
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
        this.productId = productId;
        this.linkUrl = linkUrl;
        this.title = title;
        this.isActive = true;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void toggleActive() {
        this.isActive = !this.isActive;
    }

    public void updateTitle(String title) {
        this.title = title;
    }

    public void updateLink(Long productId, String linkUrl) {
        this.productId = productId;
        this.linkUrl = linkUrl;
    }
}
