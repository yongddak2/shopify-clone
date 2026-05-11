package com.pantrka.backend.domain.order.service;

import com.pantrka.backend.domain.admin.service.AdminProductService;
import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.domain.auth.entity.Role;
import com.pantrka.backend.domain.auth.repository.MemberRepository;
import com.pantrka.backend.domain.order.dto.OrderCreateRequest;
import com.pantrka.backend.domain.order.dto.OrderResponse;
import com.pantrka.backend.domain.order.entity.CartItem;
import com.pantrka.backend.domain.order.entity.OrderItem;
import com.pantrka.backend.domain.order.repository.CartItemRepository;
import com.pantrka.backend.domain.order.repository.OrderItemRepository;
import com.pantrka.backend.domain.order.repository.OrderRepository;
import com.pantrka.backend.domain.product.entity.Product;
import com.pantrka.backend.domain.product.entity.ProductOptionGroup;
import com.pantrka.backend.domain.product.entity.ProductOptionValue;
import com.pantrka.backend.domain.product.entity.ProductStatus;
import com.pantrka.backend.domain.product.repository.ProductOptionGroupRepository;
import com.pantrka.backend.domain.product.repository.ProductOptionValueRepository;
import com.pantrka.backend.domain.product.repository.ProductRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@DisplayName("재고 비관적 락 동시성 테스트")
class OrderConcurrencyTest {

    @Autowired private OrderService orderService;
    @Autowired private AdminProductService adminProductService;
    @Autowired private MemberRepository memberRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductOptionGroupRepository productOptionGroupRepository;
    @Autowired private ProductOptionValueRepository productOptionValueRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;

    private final List<Long> createdOrderIds = new ArrayList<>();
    private final List<Long> createdCartItemIds = new ArrayList<>();
    private final List<Long> createdMemberIds = new ArrayList<>();
    private final List<Long> createdOptionValueIds = new ArrayList<>();
    private Product product;
    private ProductOptionGroup optionGroup;

    @BeforeEach
    void setUp() {
        product = Product.builder()
                .name("동시성테스트상품-" + UUID.randomUUID())
                .basePrice(new BigDecimal("10000"))
                .discountRate(BigDecimal.ZERO)
                .status(ProductStatus.ACTIVE)
                .build();
        productRepository.save(product);

        optionGroup = ProductOptionGroup.builder()
                .product(product)
                .name("옵션")
                .build();
        productOptionGroupRepository.save(optionGroup);
    }

    @AfterEach
    void cleanup() {
        for (Long orderId : createdOrderIds) {
            try {
                List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
                orderItemRepository.deleteAll(items);
                orderRepository.deleteById(orderId);
            } catch (Exception ignored) {}
        }
        for (Long cartItemId : createdCartItemIds) {
            try { cartItemRepository.deleteById(cartItemId); } catch (Exception ignored) {}
        }
        for (Long ovId : createdOptionValueIds) {
            try { productOptionValueRepository.deleteById(ovId); } catch (Exception ignored) {}
        }
        try { productOptionGroupRepository.deleteById(optionGroup.getId()); } catch (Exception ignored) {}
        try { productRepository.deleteById(product.getId()); } catch (Exception ignored) {}
        for (Long memberId : createdMemberIds) {
            try { memberRepository.deleteById(memberId); } catch (Exception ignored) {}
        }

        createdOrderIds.clear();
        createdCartItemIds.clear();
        createdOptionValueIds.clear();
        createdMemberIds.clear();
    }

    private Member createMember() {
        Member m = Member.builder()
                .email("concurrent-" + UUID.randomUUID() + "@test.com")
                .password("pw")
                .name("user")
                .phone("010-0000-0000")
                .role(Role.USER)
                .provider(Provider.LOCAL)
                .build();
        memberRepository.save(m);
        createdMemberIds.add(m.getId());
        return m;
    }

    private ProductOptionValue createOption(int initialStock) {
        ProductOptionValue ov = ProductOptionValue.builder()
                .optionGroup(optionGroup)
                .value("S-" + UUID.randomUUID().toString().substring(0, 6))
                .additionalPrice(BigDecimal.ZERO)
                .stockQuantity(initialStock)
                .build();
        productOptionValueRepository.save(ov);
        createdOptionValueIds.add(ov.getId());
        return ov;
    }

    private CartItem createCart(Member m, ProductOptionValue ov, int quantity) {
        CartItem ci = CartItem.builder()
                .member(m)
                .product(product)
                .optionValue(ov)
                .quantity(quantity)
                .build();
        cartItemRepository.save(ci);
        createdCartItemIds.add(ci.getId());
        return ci;
    }

    private OrderCreateRequest buildRequest(Long cartItemId) {
        OrderCreateRequest req = new OrderCreateRequest();
        ReflectionTestUtils.setField(req, "cartItemIds", List.of(cartItemId));
        ReflectionTestUtils.setField(req, "recipient", "테스트");
        ReflectionTestUtils.setField(req, "phone", "010-0000-0000");
        ReflectionTestUtils.setField(req, "address", "서울");
        ReflectionTestUtils.setField(req, "memo", "");
        return req;
    }

    @Test
    @DisplayName("시나리오1: 재고 10에 20명 동시 주문 → 10건만 성공, 최종 재고 0")
    void 동시_주문_재고_정합성() throws InterruptedException {
        int initialStock = 10;
        int concurrency = 20;
        ProductOptionValue optionValue = createOption(initialStock);

        List<Long> memberIds = new ArrayList<>();
        List<Long> cartItemIds = new ArrayList<>();
        for (int i = 0; i < concurrency; i++) {
            Member m = createMember();
            CartItem c = createCart(m, optionValue, 1);
            memberIds.add(m.getId());
            cartItemIds.add(c.getId());
        }

        ExecutorService es = Executors.newFixedThreadPool(concurrency);
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(concurrency);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger failure = new AtomicInteger();

        for (int i = 0; i < concurrency; i++) {
            final int idx = i;
            es.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    OrderResponse resp = orderService.createOrder(memberIds.get(idx), buildRequest(cartItemIds.get(idx)));
                    synchronized (createdOrderIds) {
                        createdOrderIds.add(resp.getId());
                    }
                    success.incrementAndGet();
                } catch (Exception e) {
                    failure.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        start.countDown();
        boolean finished = done.await(60, TimeUnit.SECONDS);
        es.shutdown();
        es.awaitTermination(5, TimeUnit.SECONDS);

        ProductOptionValue refreshed = productOptionValueRepository.findById(optionValue.getId()).orElseThrow();

        assertThat(finished).isTrue();
        assertThat(success.get()).isEqualTo(initialStock);
        assertThat(failure.get()).isEqualTo(concurrency - initialStock);
        assertThat(refreshed.getStockQuantity()).isZero();
    }

    @Test
    @DisplayName("시나리오2: 주문 취소 + 신규 주문 동시 실행 → lost update 없음")
    void 주문_취소와_신규_주문_동시() throws InterruptedException {
        int initialStock = 5;
        ProductOptionValue optionValue = createOption(initialStock);

        // 1단계: 미리 5건 주문 생성 (재고 0 상태)
        List<Long> existingMemberIds = new ArrayList<>();
        List<Long> existingOrderIds = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Member m = createMember();
            CartItem c = createCart(m, optionValue, 1);
            OrderResponse resp = orderService.createOrder(m.getId(), buildRequest(c.getId()));
            createdOrderIds.add(resp.getId());
            existingMemberIds.add(m.getId());
            existingOrderIds.add(resp.getId());
        }
        ProductOptionValue afterPrep = productOptionValueRepository.findById(optionValue.getId()).orElseThrow();
        assertThat(afterPrep.getStockQuantity()).isZero();

        // 2단계: 신규 주문용 멤버/카트 5개 미리 준비
        List<Long> newMemberIds = new ArrayList<>();
        List<Long> newCartItemIds = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Member m = createMember();
            CartItem c = createCart(m, optionValue, 1);
            newMemberIds.add(m.getId());
            newCartItemIds.add(c.getId());
        }

        int totalThreads = 10;
        ExecutorService es = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch ready = new CountDownLatch(totalThreads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(totalThreads);
        AtomicInteger cancelSuccess = new AtomicInteger();
        AtomicInteger createSuccess = new AtomicInteger();
        AtomicInteger createFailure = new AtomicInteger();

        // 취소 5건
        for (int i = 0; i < 5; i++) {
            final int idx = i;
            es.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    orderService.cancelOrder(existingMemberIds.get(idx), existingOrderIds.get(idx));
                    cancelSuccess.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    done.countDown();
                }
            });
        }
        // 신규 주문 5건
        for (int i = 0; i < 5; i++) {
            final int idx = i;
            es.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    OrderResponse resp = orderService.createOrder(newMemberIds.get(idx), buildRequest(newCartItemIds.get(idx)));
                    synchronized (createdOrderIds) {
                        createdOrderIds.add(resp.getId());
                    }
                    createSuccess.incrementAndGet();
                } catch (Exception e) {
                    createFailure.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        start.countDown();
        boolean finished = done.await(60, TimeUnit.SECONDS);
        es.shutdown();
        es.awaitTermination(5, TimeUnit.SECONDS);

        ProductOptionValue refreshed = productOptionValueRepository.findById(optionValue.getId()).orElseThrow();

        assertThat(finished).isTrue();
        // lost update 검증: 초기재고(0) + 취소성공 - 신규성공 == 최종재고
        // 최종재고 = 0 + cancelSuccess - createSuccess
        int expectedStock = 0 + cancelSuccess.get() - createSuccess.get();
        assertThat(refreshed.getStockQuantity()).isEqualTo(expectedStock);
        assertThat(refreshed.getStockQuantity()).isGreaterThanOrEqualTo(0);
        // 취소 5건은 이미 PAID가 아닌 PENDING이므로 모두 성공해야 함
        assertThat(cancelSuccess.get()).isEqualTo(5);
    }

    @Test
    @DisplayName("시나리오3: 관리자 재고 수정 + 사용자 주문 동시 → 락이 있으면 일관된 결과")
    void 관리자_재고_수정과_사용자_주문_동시() throws InterruptedException {
        int initialStock = 100;
        int adminTargetStock = 50;
        int userCount = 10;
        ProductOptionValue optionValue = createOption(initialStock);

        List<Long> memberIds = new ArrayList<>();
        List<Long> cartItemIds = new ArrayList<>();
        for (int i = 0; i < userCount; i++) {
            Member m = createMember();
            CartItem c = createCart(m, optionValue, 1);
            memberIds.add(m.getId());
            cartItemIds.add(c.getId());
        }

        int totalThreads = userCount + 1;
        ExecutorService es = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch ready = new CountDownLatch(totalThreads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(totalThreads);
        AtomicInteger userSuccess = new AtomicInteger();
        AtomicInteger userFailure = new AtomicInteger();
        AtomicInteger adminSuccess = new AtomicInteger();

        // 관리자: 재고 절대값 세팅 1번
        es.submit(() -> {
            try {
                ready.countDown();
                start.await();
                adminProductService.updateStock(optionValue.getId(), adminTargetStock);
                adminSuccess.incrementAndGet();
            } catch (Exception ignored) {
            } finally {
                done.countDown();
            }
        });
        // 사용자 10명: 1개씩 차감
        for (int i = 0; i < userCount; i++) {
            final int idx = i;
            es.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    OrderResponse resp = orderService.createOrder(memberIds.get(idx), buildRequest(cartItemIds.get(idx)));
                    synchronized (createdOrderIds) {
                        createdOrderIds.add(resp.getId());
                    }
                    userSuccess.incrementAndGet();
                } catch (Exception e) {
                    userFailure.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        start.countDown();
        boolean finished = done.await(60, TimeUnit.SECONDS);
        es.shutdown();
        es.awaitTermination(5, TimeUnit.SECONDS);

        ProductOptionValue refreshed = productOptionValueRepository.findById(optionValue.getId()).orElseThrow();

        assertThat(finished).isTrue();
        assertThat(adminSuccess.get()).isEqualTo(1);
        // 재고가 충분(100, 50)하므로 모든 사용자 차감이 성공해야 함
        assertThat(userSuccess.get()).isEqualTo(userCount);
        // 락이 있을 때 가능한 결과 범위:
        //   - 관리자가 제일 먼저 → 50 → 사용자 10명 차감 → 40
        //   - 사용자 i명 차감 → 관리자 50 세팅 → 사용자 (10-i)명 차감 → 40+i
        //   - 관리자가 제일 나중 → 100 - 10 = 90 → 50 (사용자 차감 lost!)
        //
        // 관리자 절대값 세팅이 중간/처음에 들어가면 [40, 50] 범위
        // 관리자가 사용자 차감 모두 끝난 뒤 호출되면 50 (이 케이스는 관리자가 사용자 차감을 덮어씀 — 기능적으로 의도된 동작)
        // → 락이 있으면 최종 재고는 [40, 50] 범위 또는 정확히 50
        // → 락이 없으면 lost update로 41, 42, ... 99 등 임의 값 가능
        int finalStock = refreshed.getStockQuantity();
        assertThat(finalStock).isBetween(40, 50);
    }
}
