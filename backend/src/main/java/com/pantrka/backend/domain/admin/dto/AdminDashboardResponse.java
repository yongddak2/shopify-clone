package com.pantrka.backend.domain.admin.dto;

import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import com.pantrka.backend.domain.product.entity.Product;
import com.pantrka.backend.domain.product.entity.ProductImage;
import com.pantrka.backend.domain.product.entity.ProductOptionValue;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Getter
@Builder
public class AdminDashboardResponse {

    private final long todayOrderCount;
    private final BigDecimal monthlyRevenue;
    private final long totalMemberCount;
    private final long pendingRequestCount;

    private final BigDecimal monthlyAverageOrderValue;
    private final long newMembersThisMonth;
    private final long unansweredQnaCount;

    private final List<DailyRevenueDto> dailyRevenue;
    private final List<LowStockDto> lowStockProducts;
    private final List<RecentOrderDto> recentOrders;
    private final List<TopProductDto> topProducts;
    private final List<OrderStatusCountDto> orderStatusCounts;

    @Getter
    @Builder
    public static class DailyRevenueDto {
        private final LocalDate date;
        private final BigDecimal amount;

        public static DailyRevenueDto of(LocalDate date, BigDecimal amount) {
            return DailyRevenueDto.builder()
                    .date(date)
                    .amount(amount != null ? amount : BigDecimal.ZERO)
                    .build();
        }
    }

    @Getter
    @Builder
    public static class LowStockDto {
        private final Long productId;
        private final String productName;
        private final Long optionValueId;
        private final String optionValue;
        private final int stockQuantity;

        public static LowStockDto from(ProductOptionValue optionValue) {
            Product product = optionValue.getOptionGroup().getProduct();
            return LowStockDto.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .optionValueId(optionValue.getId())
                    .optionValue(optionValue.getValue())
                    .stockQuantity(optionValue.getStockQuantity())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class RecentOrderDto {
        private final Long orderId;
        private final String orderNumber;
        private final String memberEmail;
        private final BigDecimal finalAmount;
        private final OrderStatus status;
        private final LocalDateTime createdAt;

        public static RecentOrderDto from(Order order) {
            return RecentOrderDto.builder()
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .memberEmail(order.getMember().getEmail())
                    .finalAmount(order.getFinalAmount())
                    .status(order.getStatus())
                    .createdAt(order.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class TopProductDto {
        private final Long productId;
        private final String productName;
        private final int salesCount;
        private final String thumbnailUrl;

        public static TopProductDto from(Product product) {
            return TopProductDto.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .salesCount(product.getSalesCount())
                    .thumbnailUrl(resolveThumbnail(product))
                    .build();
        }

        private static String resolveThumbnail(Product product) {
            if (product.getImages() == null || product.getImages().isEmpty()) return null;
            return product.getImages().stream()
                    .filter(ProductImage::isThumbnail)
                    .findFirst()
                    .or(() -> product.getImages().stream()
                            .min(Comparator.comparingInt(ProductImage::getSortOrder)))
                    .map(ProductImage::getUrl)
                    .orElse(null);
        }
    }

    @Getter
    @Builder
    public static class OrderStatusCountDto {
        private final OrderStatus status;
        private final long count;

        public static OrderStatusCountDto of(OrderStatus status, long count) {
            return OrderStatusCountDto.builder()
                    .status(status)
                    .count(count)
                    .build();
        }
    }
}
