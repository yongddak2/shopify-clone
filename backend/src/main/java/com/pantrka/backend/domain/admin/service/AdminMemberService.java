package com.pantrka.backend.domain.admin.service;

import com.pantrka.backend.domain.admin.dto.AdminMemberDetailResponse;
import com.pantrka.backend.domain.admin.dto.AdminMemberResponse;
import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.auth.entity.MemberAddress;
import com.pantrka.backend.domain.auth.entity.Role;
import com.pantrka.backend.domain.auth.repository.MemberAddressRepository;
import com.pantrka.backend.domain.auth.repository.MemberRepository;
import com.pantrka.backend.domain.coupon.entity.MemberCoupon;
import com.pantrka.backend.domain.coupon.repository.MemberCouponRepository;
import com.pantrka.backend.domain.order.entity.Order;
import com.pantrka.backend.domain.order.entity.OrderStatus;
import com.pantrka.backend.domain.order.repository.OrderRepository;
import com.pantrka.backend.domain.order.repository.ReturnExchangeRequestRepository;
import com.pantrka.backend.domain.review.repository.ReviewRepository;
import com.pantrka.backend.domain.wishlist.repository.WishlistRepository;
import com.pantrka.backend.global.exception.BusinessException;
import com.pantrka.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private static final List<OrderStatus> CANCELLED_OR_REFUNDED =
            List.of(OrderStatus.CANCELLED, OrderStatus.REFUNDED);

    private final MemberRepository memberRepository;
    private final MemberAddressRepository memberAddressRepository;
    private final OrderRepository orderRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final ReviewRepository reviewRepository;
    private final WishlistRepository wishlistRepository;
    private final ReturnExchangeRequestRepository returnExchangeRequestRepository;

    public Page<AdminMemberResponse> getMembers(int page, int size, String filter) {
        if ("newThisMonth".equals(filter)) {
            LocalDate today = LocalDate.now();
            LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
            LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();
            return memberRepository.findAllByCreatedAtBetweenAndDeletedAtIsNull(
                            monthStart, tomorrowStart,
                            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                    .map(AdminMemberResponse::from);
        }
        return memberRepository.findAllByDeletedAtIsNull(
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                .map(AdminMemberResponse::from);
    }

    public AdminMemberDetailResponse getMemberDetail(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));

        long totalOrderCount = orderRepository.countByMemberId(memberId);
        long paidOrderCount = orderRepository.countByMemberIdAndStatus(memberId, OrderStatus.PAID);
        long cancelledOrRefundedCount = orderRepository.countByMemberIdAndStatusIn(
                memberId, CANCELLED_OR_REFUNDED);

        BigDecimal totalPaidAmount = nullToZero(
                orderRepository.sumFinalAmountByMemberIdAndStatus(memberId, OrderStatus.PAID));
        BigDecimal aov = paidOrderCount > 0
                ? totalPaidAmount.divide(BigDecimal.valueOf(paidOrderCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Optional<Order> lastOrder = orderRepository.findFirstByMemberIdOrderByCreatedAtDesc(memberId);
        LocalDateTime lastOrderAt = lastOrder.map(Order::getCreatedAt).orElse(null);

        List<MemberCoupon> coupons = memberCouponRepository.findByMemberId(memberId);
        long usable = coupons.stream().filter(MemberCoupon::isUsable).count();
        long used = coupons.stream().filter(c -> c.getUsedAt() != null).count();
        LocalDateTime now = LocalDateTime.now();
        long expired = coupons.stream()
                .filter(c -> c.getUsedAt() == null && c.getExpiredAt().isBefore(now))
                .count();

        long reviewCount = reviewRepository.countByMemberIdAndDeletedAtIsNull(memberId);
        Double reviewAverageRating = reviewRepository.findAverageRatingByMemberId(memberId);
        long wishlistCount = wishlistRepository.countByMemberId(memberId);
        long returnExchangeCount = returnExchangeRequestRepository.countByMemberId(memberId);

        List<MemberAddress> addresses = memberAddressRepository.findByMemberId(memberId);
        List<Order> recentOrders = orderRepository
                .findByMemberIdOrderByCreatedAtDesc(memberId, PageRequest.of(0, 10))
                .getContent();

        return AdminMemberDetailResponse.build(
                member,
                totalOrderCount,
                paidOrderCount,
                cancelledOrRefundedCount,
                totalPaidAmount,
                aov,
                lastOrderAt,
                coupons.size(),
                usable,
                used,
                expired,
                reviewCount,
                reviewAverageRating,
                wishlistCount,
                returnExchangeCount,
                addresses,
                recentOrders
        );
    }

    @Transactional
    public AdminMemberDetailResponse updateRole(Long memberId, Long actingMemberId, Role role) {
        if (memberId.equals(actingMemberId)) {
            throw new BusinessException(ErrorCode.CANNOT_MODIFY_SELF);
        }
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.changeRole(role);
        return getMemberDetail(memberId);
    }

    @Transactional
    public AdminMemberDetailResponse updateAdminMemo(Long memberId, String memo) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        member.updateAdminMemo(memo);
        return getMemberDetail(memberId);
    }

    @Transactional
    public void withdrawMember(Long memberId, Long actingMemberId) {
        if (memberId.equals(actingMemberId)) {
            throw new BusinessException(ErrorCode.CANNOT_MODIFY_SELF);
        }
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        if (member.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_WITHDRAWN);
        }
        member.withdraw();
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
