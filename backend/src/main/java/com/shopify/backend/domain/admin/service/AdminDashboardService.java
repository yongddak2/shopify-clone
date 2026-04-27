package com.shopify.backend.domain.admin.service;

import com.shopify.backend.domain.admin.dto.AdminDashboardResponse;
import com.shopify.backend.domain.admin.dto.AdminDashboardResponse.DailyRevenueDto;
import com.shopify.backend.domain.admin.dto.AdminDashboardResponse.LowStockDto;
import com.shopify.backend.domain.admin.dto.AdminDashboardResponse.OrderStatusCountDto;
import com.shopify.backend.domain.admin.dto.AdminDashboardResponse.RecentOrderDto;
import com.shopify.backend.domain.admin.dto.AdminDashboardResponse.TopProductDto;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.order.entity.Order;
import com.shopify.backend.domain.order.entity.OrderStatus;
import com.shopify.backend.domain.order.entity.RequestStatus;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.domain.order.repository.ReturnExchangeRequestRepository;
import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import com.shopify.backend.domain.product.repository.ProductOptionValueRepository;
import com.shopify.backend.domain.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDashboardService {

    private static final int LOW_STOCK_THRESHOLD = 5;
    private static final int DAILY_REVENUE_DAYS = 7;
    private static final int TOP_PRODUCT_LIMIT = 5;

    private final OrderRepository orderRepository;
    private final MemberRepository memberRepository;
    private final ReturnExchangeRequestRepository returnExchangeRequestRepository;
    private final ProductOptionValueRepository productOptionValueRepository;
    private final ProductRepository productRepository;

    public AdminDashboardResponse getDashboard() {
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime sevenDaysAgoStart = today.minusDays(DAILY_REVENUE_DAYS - 1L).atStartOfDay();

        long todayOrderCount = orderRepository.countByCreatedAtBetween(todayStart, tomorrowStart);

        BigDecimal monthlyRevenue = nullToZero(orderRepository.sumFinalAmountByStatusAndCreatedAtBetween(
                OrderStatus.PAID, monthStart, tomorrowStart));

        long monthlyPaidOrderCount = orderRepository.countByStatusAndCreatedAtBetween(
                OrderStatus.PAID, monthStart, tomorrowStart);

        BigDecimal aov = monthlyPaidOrderCount > 0
                ? monthlyRevenue.divide(BigDecimal.valueOf(monthlyPaidOrderCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        long totalMemberCount = memberRepository.countByDeletedAtIsNull();
        long newMembersThisMonth = memberRepository.countByCreatedAtBetweenAndDeletedAtIsNull(
                monthStart, tomorrowStart);
        long pendingRequestCount = returnExchangeRequestRepository.countByStatus(RequestStatus.REQUESTED);

        return AdminDashboardResponse.builder()
                .todayOrderCount(todayOrderCount)
                .monthlyRevenue(monthlyRevenue)
                .totalMemberCount(totalMemberCount)
                .pendingRequestCount(pendingRequestCount)
                .monthlyAverageOrderValue(aov)
                .newMembersThisMonth(newMembersThisMonth)
                .dailyRevenue(buildDailyRevenue(today, sevenDaysAgoStart, tomorrowStart))
                .lowStockProducts(buildLowStock())
                .recentOrders(buildRecentOrders())
                .topProducts(buildTopProducts())
                .orderStatusCounts(buildOrderStatusCounts())
                .build();
    }

    private List<DailyRevenueDto> buildDailyRevenue(LocalDate today, LocalDateTime start, LocalDateTime end) {
        List<Order> paidOrders = orderRepository.findByStatusAndCreatedAtBetween(
                OrderStatus.PAID, start, end);

        Map<LocalDate, BigDecimal> grouped = new HashMap<>();
        for (Order order : paidOrders) {
            LocalDate day = order.getCreatedAt().toLocalDate();
            grouped.merge(day, order.getFinalAmount(), BigDecimal::add);
        }

        List<DailyRevenueDto> result = new ArrayList<>(DAILY_REVENUE_DAYS);
        for (int i = DAILY_REVENUE_DAYS - 1; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            result.add(DailyRevenueDto.of(day, grouped.getOrDefault(day, BigDecimal.ZERO)));
        }
        return result;
    }

    private List<LowStockDto> buildLowStock() {
        List<ProductOptionValue> lowStock = productOptionValueRepository.findLowStock(LOW_STOCK_THRESHOLD);
        return lowStock.stream().map(LowStockDto::from).toList();
    }

    private List<RecentOrderDto> buildRecentOrders() {
        return orderRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(RecentOrderDto::from)
                .toList();
    }

    private List<TopProductDto> buildTopProducts() {
        List<Product> top = productRepository.findTopBySales(PageRequest.of(0, TOP_PRODUCT_LIMIT));
        return top.stream().map(TopProductDto::from).toList();
    }

    private List<OrderStatusCountDto> buildOrderStatusCounts() {
        List<Object[]> rows = orderRepository.countGroupByStatus();
        List<OrderStatusCountDto> result = new ArrayList<>(rows.size());
        for (Object[] row : rows) {
            OrderStatus status = (OrderStatus) row[0];
            long count = ((Number) row[1]).longValue();
            result.add(OrderStatusCountDto.of(status, count));
        }
        return result;
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
