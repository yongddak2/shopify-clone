package com.shopify.backend.domain.order.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "return_exchange_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReturnExchangeImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ReturnExchangeRequest request;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public ReturnExchangeImage(ReturnExchangeRequest request, String url, int sortOrder) {
        this.request = request;
        this.url = url;
        this.sortOrder = sortOrder;
    }
}
