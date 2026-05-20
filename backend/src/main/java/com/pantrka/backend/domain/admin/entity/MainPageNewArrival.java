package com.pantrka.backend.domain.admin.entity;

import com.pantrka.backend.domain.product.entity.Product;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "main_page_new_arrival",
        uniqueConstraints = @UniqueConstraint(name = "uk_main_page_new_arrival_product", columnNames = "product_id")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class MainPageNewArrival {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer sortOrder;

    @CreatedDate
    private LocalDateTime createdAt;

    @Builder
    private MainPageNewArrival(Product product, Integer sortOrder) {
        this.product = product;
        this.sortOrder = sortOrder;
    }

    public void updateSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
