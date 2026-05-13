# backend/CLAUDE.md

백엔드 전용 컨텍스트. 루트 CLAUDE.md와 함께 로드됨.

---

## 패키지 구조

```
src/main/java/com/pantrka/backend/
├── global/
│   ├── config/       ← SecurityConfig, JwtProvider, TossPaymentsConfig
│   ├── filter/       ← JwtAuthenticationFilter
│   ├── exception/    ← ErrorCode, BusinessException, GlobalExceptionHandler
│   └── common/       ← ApiResponse
├── domain/
│   ├── auth/         ← controller, service, repository, entity, dto
│   ├── product/      ← controller, service, repository, entity, dto
│   ├── order/        ← controller, service, repository, entity, dto
│   │                    (PaymentService, ReturnExchangeService 포함)
│   ├── admin/        ← controller, service
│   │                    AdminDashboardService / AdminMemberService / MainPageConfigService 포함
│   │                    (대시보드/상품/주문/회원/쿠폰/배너/재고/반품교환 관리)
│   ├── review/       ← controller, service, repository, entity, dto
│   ├── wishlist/     ← controller, service, repository, entity, dto
│   └── coupon/       ← controller, service, repository, entity, dto
└── infra/
    ├── s3/           ← S3Config, S3Service (uploadFile/deleteFile)
    ├── email/        ← EmailService (Gmail SMTP, @Async, OrderEmailContext 스냅샷)
    └── redis/
```

---

## DB 스키마

```
MEMBER: id, email(UK), password, name, phone, role(USER/ADMIN),
        provider(LOCAL/KAKAO/GOOGLE), provider_id, password_changed_at,
        admin_memo(VARCHAR 500 nullable),
        created_at, updated_at, deleted_at

MEMBER_ADDRESS: id, member_id(FK), label, recipient, phone,
                zipcode, address, address_detail, is_default

CATEGORY: id, parent_id(FK 자기참조), name, depth, sort_order

PRODUCT: id, category_id(FK), name, description, base_price,
         discount_rate, sales_count, status(ACTIVE/SOLDOUT/INACTIVE),
         view_count, created_at, updated_at, deleted_at

PRODUCT_IMAGE: id, product_id(FK), url, sort_order, is_thumbnail

PRODUCT_OPTION_GROUP: id, product_id(FK), name → 항상 "옵션"

PRODUCT_OPTION_VALUE: id, option_group_id(FK),
                      value → "S-블랙" 형태 조합값,
                      additional_price, stock_quantity

CART_ITEM: id, member_id(FK), product_id(FK), option_value_id(FK),
           quantity, created_at

ORDERS: id, member_id(FK), member_coupon_id(FK nullable),
        order_number(UK), total_amount, discount_amount,
        delivery_fee, final_amount, status, confirmed_at(nullable),
        recipient, phone, address, memo,
        carrier(VARCHAR 50 nullable),
        tracking_number(VARCHAR 100 nullable),
        created_at, updated_at

ORDER_ITEM: id, order_id(FK), product_id(FK), option_value_id(FK),
            product_name_snapshot, option_info_snapshot,
            price_snapshot, quantity, subtotal

PAYMENT: id, order_id(FK), payment_key(UK),
         method(CARD/TRANSFER/VIRTUAL),
         amount, status(READY/DONE/CANCELLED/FAILED),
         paid_at, cancelled_at, created_at

REVIEW: id, member_id(FK), product_id(FK), order_item_id(FK),
        rating, content, created_at, updated_at, deleted_at

REVIEW_IMAGE: id, review_id(FK), url, sort_order

REVIEW_LIKE: id, review_id(FK), member_id, created_at
             (review_id + member_id UNIQUE)

WISHLIST: id, member_id(FK), product_id(FK), created_at

COUPON: id, name, discount_type(FIXED/PERCENT), discount_value,
        min_order_amount, max_discount_amount,
        total_quantity(nullable — 웰컴 쿠폰이면 null=무제한),
        issued_quantity, start_date, end_date,
        is_welcome(boolean, default false),
        valid_days(integer nullable — 웰컴 쿠폰의 가입일+N일 만료)

MEMBER_COUPON: id, member_id(FK), coupon_id(FK),
               used_at, expired_at, created_at

BANNER: id, image_url, sort_order, is_active, link_url(nullable),
        title(VARCHAR 100 nullable — 메인 슬라이드 큰 글씨),
        created_at, updated_at

RETURN_EXCHANGE_REQUEST: id, order_item_id(FK), member_id(FK),
                         type(RETURN/EXCHANGE), reason, detail,
                         desired_option_value_id(FK nullable),
                         status(REQUESTED/APPROVED/REJECTED/COMPLETED),
                         image_urls, created_at, updated_at
```

---

## 인프라 설정값

```
PostgreSQL: localhost:5432 / DB=shopdb / user=shop / pw=shop1234
Redis: localhost:6379 / pw=redis1234
S3: 버킷=yong-byeong-shop-images / 리전=ap-southeast-2
Gmail: happywe2931@gmail.com
JPA: ddl-auto=update, open-in-view=false
Multipart: max-file-size=20MB, max-request-size=20MB
JWT: access 30분 / refresh 7일
TossPayments: confirm-url = https://api.tosspayments.com/v1/payments/confirm
```

---

## 재고 락 정책

재고를 변경하는 모든 지점은 다음 패턴 필수:

```java
ProductOptionValue locked = productOptionValueRepository.findByIdWithLock(id)
        .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_OPTION_NOT_FOUND));
entityManager.refresh(locked, LockModeType.PESSIMISTIC_WRITE);
locked.decreaseStock(quantity); // 또는 increaseStock / updateStockQuantity
```

- `findByIdWithLock` 만으론 부족: 같은 트랜잭션의 lazy load로 1차 캐시에 stale 객체가 있으면 SELECT FOR UPDATE 후에도 객체 identity 유지로 stale `stockQuantity` 가 사용됨 → dirty checking이 stale 기반 update 발행 → **lost update**
- `EntityManager.refresh(_, PESSIMISTIC_WRITE)` 로 1차 캐시 강제 갱신 (락 모드 유지)

### 적용 위치 4곳

- `OrderService.createOrder()` — refresh 필수
- `OrderService.cancelOrder()` — refresh 필수. 다중 옵션 시 **optionValueId 오름차순 정렬** 후 락 획득 (데드락 방지)
- `ReturnExchangeService.completeRequest()` — refresh 필수
- `AdminProductService.updateStock()` — refresh **불필요** (단일 진입점, 1차 캐시 비어있음)

### 주문번호 형식

`"ORD-" + System.currentTimeMillis() + "-" + UUID 앞 8자`. millis만 쓰면 동시 호출 시 `UNIQUE` 충돌 발생.

---

## 테스트 (27개)

- BackendApplicationTests (1): 컨텍스트 로드
- AuthServiceTest (5): 회원가입(웰컴 쿠폰 자동 발급 분기 포함)/로그인 성공·실패
- OrderServiceTest (8): 주문 생성/취소/배송비/구매확정
- PaymentServiceTest (7): 결제 승인/실패 시나리오
- OrderConcurrencyTest (3): **Service 레벨 동시성** — 동시 주문(재고 정합성) / 취소+신규 주문 동시(lost update 방어) / 관리자 재고 수정+사용자 주문 동시
  - 위치: `backend/src/test/java/com/pantrka/backend/domain/order/service/OrderConcurrencyTest.java`
- OrderApiConcurrencyTest (3): **HTTP API 레벨 통합 동시성** — 동일 옵션 동시 주문 / 관리자 재고 수정+사용자 주문 / 인증·권한 검증
  - 위치: `backend/src/test/java/com/pantrka/backend/integration/OrderApiConcurrencyTest.java`
  - JDK `java.net.http.HttpClient` 사용 (Spring Boot 4.0.4의 `TestRestTemplate` 자동 설정 버그 — `TestRestTemplateTestAutoConfiguration` 의 `@ConditionalOnMissingBean` 타입 추론 실패 — 우회용)

---

## Spring Boot 4.0.4 / Hibernate 환경 함정

새 빈을 주입하려는데 startup 에서 `No qualifying bean of type ...` 으로 실패하면 자동 설정 누락부터 의심. 새 사례 발견 시 이 섹션에 누적.

### 알려진 사례

- **TestRestTemplate**: 패키지 이동(`org.springframework.boot.resttestclient`) + `@ConditionalOnMissingBean` 타입 추론 실패. 통합 테스트는 JDK `java.net.http.HttpClient` 로 우회. 참고: `OrderApiConcurrencyTest`
- **ObjectMapper**: `spring-boot-starter-webmvc` 만 있는 환경에서 `JacksonAutoConfiguration` 의 `ObjectMapper` 빈 자동 등록 안 됨. 주입 시 startup fail. 핸들러 등에서는 직접 인스턴스화:
```java
private static final ObjectMapper MAPPER = new ObjectMapper();
```
  참고: `CustomAuthenticationEntryPoint`, `CustomAccessDeniedHandler`
- **PostgreSQL `IS NULL` 파라미터 타입 추론 실패** (SQLState 42P18): `@Query` 의 `(:param IS NULL OR col = :param)` 패턴 시 Hibernate가 타입 못 잡음. `col = COALESCE(:param, col)` 로 우회 (컬럼 타입에서 자동 추론). 참고: `OrderRepository.searchForAdmin`

### 가이드

- 새 컴포넌트가 자동 설정 빈을 주입할 때 → starter 의존성 + 자동 설정 활성화 여부부터 확인
- 깨지면 직접 인스턴스화 또는 명시적 `@Bean` 등록으로 우회
- 동적 쿼리 nullable 파라미터는 `IS NULL` 분기 대신 `COALESCE` 사용 (PostgreSQL 한정 이슈)

---

## 검증 스크립트 작성 시 주의

`backend/scripts/{도메인}-test/` 는 **Windows native `curl.exe`** 로 실행됨. Git Bash single-quote 안 한글 UTF-8 바이트가 인자 변환에서 **CP949 로 변환**되어 백엔드 도달 → Jackson UTF-8 파싱 실패 → `HttpMessageNotReadableException` → catch-all 500.

**회피**: JSON 페이로드는 **ASCII 만** 사용. 한글 `name`/`reason`/`address` 등은 `"TEST"`/`"X"` 로 치환. DB 에서 한글 컬럼을 읽어 페이로드에 끼우는 것도 금지(예: `SELECT name FROM coupon` → PATCH body) — 필요하면 PG 로 직접 UPDATE.

검증 결과 / 이슈 / 리팩토링 백로그는 `docs/VERIFICATION_LOG.md` 참고 (RETURN-001 · COUPON-002 가 이 패턴).
