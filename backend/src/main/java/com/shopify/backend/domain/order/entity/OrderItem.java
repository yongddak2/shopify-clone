package com.shopify.backend.domain.order.entity;

import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "order_item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_value_id")
    private ProductOptionValue optionValue;

    @Column(nullable = false)
    private String productNameSnapshot;

    private String optionInfoSnapshot;

    @Column(nullable = false)
    private BigDecimal priceSnapshot;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Builder
    public OrderItem(Order order, Product product, ProductOptionValue optionValue,
                     String productNameSnapshot, String optionInfoSnapshot,
                     BigDecimal priceSnapshot, int quantity, BigDecimal subtotal) {
        this.order = order;
        this.product = product;
        this.optionValue = optionValue;
        this.productNameSnapshot = productNameSnapshot;
        this.optionInfoSnapshot = optionInfoSnapshot;
        this.priceSnapshot = priceSnapshot;
        this.quantity = quantity;
        this.subtotal = subtotal;
    }
}
