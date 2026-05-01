package com.shopify.backend.integration;

import com.shopify.backend.domain.auth.entity.Member;
import com.shopify.backend.domain.auth.entity.Provider;
import com.shopify.backend.domain.auth.entity.Role;
import com.shopify.backend.domain.auth.repository.MemberRepository;
import com.shopify.backend.domain.order.entity.CartItem;
import com.shopify.backend.domain.order.entity.OrderItem;
import com.shopify.backend.domain.order.repository.CartItemRepository;
import com.shopify.backend.domain.order.repository.OrderItemRepository;
import com.shopify.backend.domain.order.repository.OrderRepository;
import com.shopify.backend.domain.product.entity.Product;
import com.shopify.backend.domain.product.entity.ProductOptionGroup;
import com.shopify.backend.domain.product.entity.ProductOptionValue;
import com.shopify.backend.domain.product.entity.ProductStatus;
import com.shopify.backend.domain.product.repository.ProductOptionGroupRepository;
import com.shopify.backend.domain.product.repository.ProductOptionValueRepository;
import com.shopify.backend.domain.product.repository.ProductRepository;
import com.shopify.backend.global.config.JwtProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DisplayName("재고 락 HTTP 통합 동시성 테스트")
class OrderApiConcurrencyTest {

    @LocalServerPort private int port;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Autowired private JwtProvider jwtProvider;
    @Autowired private PasswordEncoder passwordEncoder;

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
                .name("API동시성테스트상품-" + UUID.randomUUID())
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

    // ───────── 유틸 ─────────

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private Member createUser() {
        return createMember(Role.USER);
    }

    private Member createAdmin() {
        return createMember(Role.ADMIN);
    }

    private Member createMember(Role role) {
        Member m = Member.builder()
                .email("api-concurrent-" + UUID.randomUUID() + "@test.com")
                .password(passwordEncoder.encode("Test1234!"))
                .name(role == Role.ADMIN ? "관리자" : "유저")
                .phone("010-0000-0000")
                .role(role)
                .provider(Provider.LOCAL)
                .build();
        memberRepository.save(m);
        createdMemberIds.add(m.getId());
        return m;
    }

    private String issueToken(Member member) {
        return jwtProvider.generateAccessToken(member);
    }

    private HttpResponse<String> sendJson(HttpRequest.Builder reqBuilder, String token) {
        try {
            HttpRequest req = reqBuilder
                    .header("Content-Type", "application/json")
                    .header("Authorization", token == null ? "" : ("Bearer " + token))
                    .timeout(Duration.ofSeconds(60))
                    .build();
            return httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private HttpResponse<String> postOrder(String token, Long cartItemId) {
        HttpRequest.Builder b = HttpRequest.newBuilder()
                .uri(URI.create(url("/api/orders")))
                .POST(HttpRequest.BodyPublishers.ofString(orderCreateBody(cartItemId)));
        return sendJson(b, token);
    }

    private HttpResponse<String> patchInventory(String token, Long optionValueId, int stockQuantity) {
        String body = "{\"stockQuantity\":" + stockQuantity + "}";
        HttpRequest.Builder b = HttpRequest.newBuilder()
                .uri(URI.create(url("/api/admin/inventory/" + optionValueId)))
                .method("PATCH", HttpRequest.BodyPublishers.ofString(body));
        return sendJson(b, token);
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

    private CartItem putInCart(Member m, ProductOptionValue ov, int quantity) {
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

    private String orderCreateBody(Long cartItemId) {
        return "{"
                + "\"cartItemIds\":[" + cartItemId + "],"
                + "\"recipient\":\"홍길동\","
                + "\"phone\":\"010-1234-5678\","
                + "\"address\":\"서울시 강남구 테스트로 1\","
                + "\"memo\":\"\""
                + "}";
    }

    // ───────── 시나리오 ─────────

    @Test
    @DisplayName("시나리오1: 재고 10에 20명 동시 POST /api/orders → 10건 201, 10건 4xx, 최종재고 0")
    void 동일_옵션_동시_주문_재고_정합성() throws InterruptedException {
        int initialStock = 10;
        int concurrency = 20;
        ProductOptionValue optionValue = createOption(initialStock);

        List<String> tokens = new ArrayList<>();
        List<Long> cartItemIds = new ArrayList<>();
        for (int i = 0; i < concurrency; i++) {
            Member m = createUser();
            tokens.add(issueToken(m));
            cartItemIds.add(putInCart(m, optionValue, 1).getId());
        }

        ExecutorService es = Executors.newFixedThreadPool(concurrency);
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(concurrency);
        AtomicInteger created = new AtomicInteger();
        AtomicInteger badRequest = new AtomicInteger();
        AtomicInteger outOfStockMessage = new AtomicInteger();
        AtomicInteger other = new AtomicInteger();

        for (int i = 0; i < concurrency; i++) {
            final int idx = i;
            es.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    HttpResponse<String> resp = postOrder(tokens.get(idx), cartItemIds.get(idx));
                    int sc = resp.statusCode();
                    if (sc == 201) {
                        created.incrementAndGet();
                    } else if (sc >= 400 && sc < 500) {
                        badRequest.incrementAndGet();
                        if (resp.body() != null && resp.body().contains("재고가 부족합니다")) {
                            outOfStockMessage.incrementAndGet();
                        }
                    } else {
                        other.incrementAndGet();
                    }
                } catch (Exception e) {
                    other.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        start.countDown();
        boolean finished = done.await(120, TimeUnit.SECONDS);
        es.shutdown();
        es.awaitTermination(5, TimeUnit.SECONDS);

        ProductOptionValue refreshed = productOptionValueRepository.findById(optionValue.getId()).orElseThrow();
        long createdOrderCount = orderRepository.findAll().stream()
                .filter(o -> o.getOrderNumber() != null)
                .filter(o -> {
                    List<OrderItem> items = orderItemRepository.findByOrderId(o.getId());
                    return items.stream().anyMatch(it ->
                            it.getOptionValue() != null && it.getOptionValue().getId().equals(optionValue.getId()));
                })
                .peek(o -> createdOrderIds.add(o.getId()))
                .count();

        assertThat(finished).isTrue();
        assertThat(created.get()).isEqualTo(initialStock);
        assertThat(badRequest.get()).isEqualTo(concurrency - initialStock);
        assertThat(outOfStockMessage.get()).isEqualTo(concurrency - initialStock);
        assertThat(other.get()).isZero();
        assertThat(refreshed.getStockQuantity()).isZero();
        assertThat(createdOrderCount).isEqualTo(initialStock);
    }

    @Test
    @DisplayName("시나리오2: 관리자 PATCH /api/admin/inventory + 사용자 10명 동시 POST /api/orders")
    void 관리자_재고_수정과_사용자_주문_동시() throws InterruptedException {
        int initialStock = 100;
        int adminTargetStock = 50;
        int userCount = 10;
        ProductOptionValue optionValue = createOption(initialStock);

        Member admin = createAdmin();
        String adminToken = issueToken(admin);

        List<String> userTokens = new ArrayList<>();
        List<Long> cartItemIds = new ArrayList<>();
        for (int i = 0; i < userCount; i++) {
            Member m = createUser();
            userTokens.add(issueToken(m));
            cartItemIds.add(putInCart(m, optionValue, 1).getId());
        }

        int totalThreads = userCount + 1;
        ExecutorService es = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch ready = new CountDownLatch(totalThreads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(totalThreads);
        AtomicInteger userSuccess = new AtomicInteger();
        AtomicInteger userFailure = new AtomicInteger();
        AtomicInteger adminSuccess = new AtomicInteger();
        AtomicInteger adminFailure = new AtomicInteger();

        // 관리자 1명: 재고 절대값 세팅
        es.submit(() -> {
            try {
                ready.countDown();
                start.await();
                HttpResponse<String> resp = patchInventory(adminToken, optionValue.getId(), adminTargetStock);
                if (resp.statusCode() == 200) adminSuccess.incrementAndGet();
                else adminFailure.incrementAndGet();
            } catch (Exception e) {
                adminFailure.incrementAndGet();
            } finally {
                done.countDown();
            }
        });
        // 사용자 10명: 1개씩 주문
        for (int i = 0; i < userCount; i++) {
            final int idx = i;
            es.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    HttpResponse<String> resp = postOrder(userTokens.get(idx), cartItemIds.get(idx));
                    if (resp.statusCode() == 201) userSuccess.incrementAndGet();
                    else userFailure.incrementAndGet();
                } catch (Exception e) {
                    userFailure.incrementAndGet();
                } finally {
                    done.countDown();
                }
            });
        }

        ready.await();
        start.countDown();
        boolean finished = done.await(120, TimeUnit.SECONDS);
        es.shutdown();
        es.awaitTermination(5, TimeUnit.SECONDS);

        ProductOptionValue refreshed = productOptionValueRepository.findById(optionValue.getId()).orElseThrow();
        // cleanup용 order id 수집
        orderRepository.findAll().stream()
                .filter(o -> {
                    List<OrderItem> items = orderItemRepository.findByOrderId(o.getId());
                    return items.stream().anyMatch(it ->
                            it.getOptionValue() != null && it.getOptionValue().getId().equals(optionValue.getId()));
                })
                .forEach(o -> createdOrderIds.add(o.getId()));

        assertThat(finished).isTrue();
        assertThat(adminSuccess.get()).isEqualTo(1);
        assertThat(adminFailure.get()).isZero();
        // 재고가 충분(100, 50 모두 ≥ 10)하므로 사용자 10명 모두 성공해야 함
        assertThat(userSuccess.get()).isEqualTo(userCount);
        assertThat(userFailure.get()).isZero();
        // 락이 있을 때 가능한 결과:
        //   - 관리자가 사용자보다 먼저 락 획득: 100 → 50 → 10명 차감 → 40
        //   - 사용자 i명 차감 후 관리자 적용 후 (10-i)명 차감: 50 - (10-i) = 40+i, i ∈ [0..10] → [40..50]
        // 락이 없었다면 관리자의 절대값 세팅이 사용자 차감을 덮어써 51 이상으로 튀거나
        // 사용자 차감 자체에 lost update 가 발생해 [40..50] 범위를 벗어남.
        int finalStock = refreshed.getStockQuantity();
        assertThat(finalStock).isBetween(40, 50);
    }

    @Test
    @DisplayName("시나리오3: 비로그인 → 401, USER 권한으로 admin 호출 → 403")
    void 인증_권한_검증() {
        ProductOptionValue optionValue = createOption(10);
        Member user = createUser();
        Member admin = createAdmin();
        String userToken = issueToken(user);
        String adminToken = issueToken(admin);

        // 비로그인 POST /api/orders → 인증 차단 (Spring Security 기본은 401, 본 프로젝트는 403)
        HttpRequest.Builder noAuth = HttpRequest.newBuilder()
                .uri(URI.create(url("/api/orders")))
                .POST(HttpRequest.BodyPublishers.ofString(orderCreateBody(0L)));
        HttpResponse<String> r1 = sendJson(noAuth, null);
        assertThat(r1.statusCode()).isIn(401, 403);

        // USER 권한으로 PATCH /api/admin/inventory/{id} → 403
        HttpResponse<String> r2 = patchInventory(userToken, optionValue.getId(), 5);
        assertThat(r2.statusCode()).isEqualTo(403);

        // ADMIN 권한이면 정상 200 (sanity check, 락 동작과 무관)
        HttpResponse<String> r3 = patchInventory(adminToken, optionValue.getId(), 5);
        assertThat(r3.statusCode()).isEqualTo(200);
        assertThat(productOptionValueRepository.findById(optionValue.getId()).orElseThrow().getStockQuantity()).isEqualTo(5);
    }
}
