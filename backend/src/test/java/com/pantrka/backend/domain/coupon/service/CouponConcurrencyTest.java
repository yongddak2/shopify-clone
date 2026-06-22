package com.pantrka.backend.domain.coupon.service;

import com.pantrka.backend.domain.auth.entity.Member;
import com.pantrka.backend.domain.auth.entity.Provider;
import com.pantrka.backend.domain.auth.entity.Role;
import com.pantrka.backend.domain.auth.repository.MemberRepository;
import com.pantrka.backend.domain.coupon.entity.Coupon;
import com.pantrka.backend.domain.coupon.entity.DiscountType;
import com.pantrka.backend.domain.coupon.repository.CouponRepository;
import com.pantrka.backend.domain.coupon.repository.MemberCouponRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
@DisplayName("쿠폰 발급 비관적 락 동시성 테스트")
class CouponConcurrencyTest {

    @Autowired private CouponService couponService;
    @Autowired private CouponRepository couponRepository;
    @Autowired private MemberCouponRepository memberCouponRepository;
    @Autowired private MemberRepository memberRepository;

    private final List<Long> createdMemberIds = new ArrayList<>();
    private Long couponId;

    @AfterEach
    void cleanup() {
        for (Long memberId : createdMemberIds) {
            try {
                memberCouponRepository.deleteAll(memberCouponRepository.findByMemberId(memberId));
            } catch (Exception ignored) {}
            try { memberRepository.deleteById(memberId); } catch (Exception ignored) {}
        }
        if (couponId != null) {
            try { couponRepository.deleteById(couponId); } catch (Exception ignored) {}
        }
        createdMemberIds.clear();
        couponId = null;
    }

    private Member createMember() {
        Member m = Member.builder()
                .email("coupon-concurrent-" + UUID.randomUUID() + "@test.com")
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

    private Long createCoupon(int totalQuantity) {
        Coupon c = Coupon.builder()
                .name("동시성쿠폰-" + UUID.randomUUID())
                .discountType(DiscountType.FIXED)
                .discountValue(new BigDecimal("1000"))
                .minOrderAmount(BigDecimal.ZERO)
                .totalQuantity(totalQuantity)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .isWelcome(false)
                .build();
        couponRepository.save(c);
        return c.getId();
    }

    @Test
    @DisplayName("시나리오1: 수량 1개 쿠폰에 10명 동시 다운로드 → 1건만 성공, issuedQuantity=1")
    void 한정수량_쿠폰_동시_발급() throws InterruptedException {
        int totalQuantity = 1;
        int concurrency = 10;
        couponId = createCoupon(totalQuantity);

        List<Long> memberIds = new ArrayList<>();
        for (int i = 0; i < concurrency; i++) {
            memberIds.add(createMember().getId());
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
                    couponService.issueCoupon(memberIds.get(idx), couponId);
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

        Coupon refreshed = couponRepository.findById(couponId).orElseThrow();

        assertThat(finished).isTrue();
        assertThat(success.get()).isEqualTo(totalQuantity);
        assertThat(failure.get()).isEqualTo(concurrency - totalQuantity);
        // 락이 없으면 lost update로 issuedQuantity가 1을 초과하거나 발급 건수가 한도를 넘김
        assertThat(refreshed.getIssuedQuantity()).isEqualTo(totalQuantity);
    }

    @Test
    @DisplayName("시나리오2: 같은 회원이 동시에 5번 다운로드 → 1건만 성공 (중복 발급 방지)")
    void 동일_회원_중복_발급_방지() throws InterruptedException {
        int concurrency = 5;
        couponId = createCoupon(100); // 수량은 충분, 중복만 검증
        Member member = createMember();

        ExecutorService es = Executors.newFixedThreadPool(concurrency);
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(concurrency);
        AtomicInteger success = new AtomicInteger();
        AtomicInteger failure = new AtomicInteger();

        for (int i = 0; i < concurrency; i++) {
            es.submit(() -> {
                try {
                    ready.countDown();
                    start.await();
                    couponService.issueCoupon(member.getId(), couponId);
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

        long issuedToMember = memberCouponRepository.findByMemberId(member.getId()).size();
        Coupon refreshed = couponRepository.findById(couponId).orElseThrow();

        assertThat(finished).isTrue();
        assertThat(success.get()).isEqualTo(1);
        assertThat(issuedToMember).isEqualTo(1);
        assertThat(refreshed.getIssuedQuantity()).isEqualTo(1);
    }
}
