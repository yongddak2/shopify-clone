package com.shopify.backend.domain.order.entity;

import com.shopify.backend.domain.product.entity.ProductOptionValue;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "return_exchange_request")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ReturnExchangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReasonType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReasonCategory reasonCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReasonDetail reasonDetail;

    @Column(nullable = false, length = 500)
    private String reasonText;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    @Column(length = 500)
    private String adminMemo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "desired_option_value_id")
    private ProductOptionValue desiredOptionValue;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReturnExchangeImage> images = new ArrayList<>();

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder
    public ReturnExchangeRequest(Order order, ReasonType type, ReasonCategory reasonCategory,
                                 ReasonDetail reasonDetail, String reasonText, RequestStatus status,
                                 ProductOptionValue desiredOptionValue) {
        this.order = order;
        this.type = type;
        this.reasonCategory = reasonCategory;
        this.reasonDetail = reasonDetail;
        this.reasonText = reasonText;
        this.status = status;
        this.desiredOptionValue = desiredOptionValue;
    }

    public void approve(String adminMemo) {
        this.status = RequestStatus.APPROVED;
        this.adminMemo = adminMemo;
    }

    public void reject(String adminMemo) {
        this.status = RequestStatus.REJECTED;
        this.adminMemo = adminMemo;
    }

    public void complete() {
        this.status = RequestStatus.COMPLETED;
    }

    public void addImage(ReturnExchangeImage image) {
        this.images.add(image);
    }
}
