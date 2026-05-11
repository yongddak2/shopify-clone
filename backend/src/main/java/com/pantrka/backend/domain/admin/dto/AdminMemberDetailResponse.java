package com.pantrka.backend.domain.admin.dto;

import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.auth.entity.MemberAddress;
import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.domain.auth.entity.Role;
import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminMemberDetailResponse {

    // 기본 정보
    private final Long id;
    private final String email;
    private final String name;
    private final String phone;
    private final Role role;
    private final Provider provider;
    private final LocalDateTime createdAt;
    private final LocalDateTime deletedAt;
    private final LocalDateTime passwordChangedAt;
    private final String adminMemo;

    // 주문 통계
    private final long totalOrderCount;
    private final long paidOrderCount;
    private final long cancelledOrCancelRefundCount;
    private final BigDecimal totalPaidAmount;
    private final BigDecimal averageOrderValue;
    private final LocalDateTime lastOrderAt;

    // 활동 카운트
    private final long couponTotalCount;
    private final long couponUsableCount;
    private final long couponUsedCount;
    private final long couponExpiredCount;
    private final long reviewCount;
    private final Double reviewAverageRating;
    private final long wishlistCount;
    private final long returnExchangeCount;

    // 배송지
    private final List<AddressDto> addresses;

    // 최근 주문 10건
    private final List<RecentOrderDto> recentOrders;

    public static AdminMemberDetailResponse build(
            Member member,
            long totalOrderCount,
            long paidOrderCount,
            long cancelledOrRefundedCount,
            BigDecimal totalPaidAmount,
            BigDecimal averageOrderValue,
            LocalDateTime lastOrderAt,
            long couponTotalCount,
            long couponUsableCount,
            long couponUsedCount,
            long couponExpiredCount,
            long reviewCount,
            Double reviewAverageRating,
            long wishlistCount,
            long returnExchangeCount,
            List<MemberAddress> addresses,
            List<Order> recentOrders) {
        return AdminMemberDetailResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .phone(member.getPhone())
                .role(member.getRole())
                .provider(member.getProvider())
                .createdAt(member.getCreatedAt())
                .deletedAt(member.getDeletedAt())
                .passwordChangedAt(member.getPasswordChangedAt())
                .adminMemo(member.getAdminMemo())
                .totalOrderCount(totalOrderCount)
                .paidOrderCount(paidOrderCount)
                .cancelledOrCancelRefundCount(cancelledOrRefundedCount)
                .totalPaidAmount(totalPaidAmount)
                .averageOrderValue(averageOrderValue)
                .lastOrderAt(lastOrderAt)
                .couponTotalCount(couponTotalCount)
                .couponUsableCount(couponUsableCount)
                .couponUsedCount(couponUsedCount)
                .couponExpiredCount(couponExpiredCount)
                .reviewCount(reviewCount)
                .reviewAverageRating(reviewAverageRating)
                .wishlistCount(wishlistCount)
                .returnExchangeCount(returnExchangeCount)
                .addresses(addresses.stream().map(AddressDto::from).toList())
                .recentOrders(recentOrders.stream().map(RecentOrderDto::from).toList())
                .build();
    }

    @Getter
    @Builder
    public static class AddressDto {
        private final Long id;
        private final String label;
        private final String recipient;
        private final String phone;
        private final String zipcode;
        private final String address;
        private final String addressDetail;
        private final boolean defaultAddress;

        public static AddressDto from(MemberAddress a) {
            return AddressDto.builder()
                    .id(a.getId())
                    .label(a.getLabel())
                    .recipient(a.getRecipient())
                    .phone(a.getPhone())
                    .zipcode(a.getZipcode())
                    .address(a.getAddress())
                    .addressDetail(a.getAddressDetail())
                    .defaultAddress(a.isDefault())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class RecentOrderDto {
        private final Long orderId;
        private final String orderNumber;
        private final OrderStatus status;
        private final BigDecimal finalAmount;
        private final LocalDateTime createdAt;

        public static RecentOrderDto from(Order o) {
            return RecentOrderDto.builder()
                    .orderId(o.getId())
                    .orderNumber(o.getOrderNumber())
                    .status(o.getStatus())
                    .finalAmount(o.getFinalAmount())
                    .createdAt(o.getCreatedAt())
                    .build();
        }
    }
}
