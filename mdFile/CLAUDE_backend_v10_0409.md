# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Shopify Clone backend — 의류 쇼핑몰 백엔드. Spring Boot 4, Java 17, Gradle 9.4.
프론트엔드(Next.js)와 함께 `shopify-clone/` 모노레포 구성.

## Commands

```bash
docker compose -f ../docker-compose.yml up -d   # 인프라 시작
./gradlew build                                   # 빌드
./gradlew bootRun                                 # 서버 실행 (포트 8080)
./gradlew test                                    # 전체 테스트 (21개)
```

## Architecture

`src/main/java/com/shopify/backend/` 도메인 주도 패키지 구조:

- **domain/**
  - `auth/` — JWT 인증, 회원관리 (signup/login/logout/refresh, 비밀번호 변경/찾기)
  - `product/` — 상품 CRUD, 카테고리 트리, 검색
  - `order/` — 장바구니, 주문 생성/취소/구매확정, 결제(토스페이먼츠), 쿠폰 할인 적용, 반품/교환 요청(ReturnExchangeService)
  - `admin/` — 상품 CRUD(옵션/이미지 동기화 포함), 재고 관리(InventoryResponse), 주문 상태 변경, 회원 목록, 쿠폰 CRUD, 배너 CRUD, 반품/교환 관리
  - `review/` — 리뷰 작성/삭제(소프트), 좋아요 토글, 이미지 업로드, 정렬/페이지네이션
  - `wishlist/` — 찜 토글
  - `coupon/` — 쿠폰 발급/미리보기/주문 실적용/다운로드 목록
- **global/** — SecurityConfig, JwtProvider, JwtAuthenticationFilter, ErrorCode, BusinessException, ApiResponse
- **infra/** — S3(uploadFile/deleteFile), Email(Gmail SMTP), Redis, Kafka/ES(미사용)

## Code Patterns

- 인증: `(Long) authentication.getPrincipal()` → memberId
- 의존성 주입: `@RequiredArgsConstructor`
- 트랜잭션: 클래스 `@Transactional(readOnly=true)` + 쓰기 메서드 `@Transactional`
- 예외: `BusinessException(ErrorCode.XXX)`
- 응답: `ApiResponse.success(data)` + ResponseEntity
- DTO: 정적 팩토리 `from()`, 엔티티: `@Builder` + `@NoArgsConstructor(PROTECTED)`
- POST → 201, DELETE → 204

## Key Design Decisions

- **옵션 조합형**: OPTION_GROUP("옵션") + OPTION_VALUE("S-블랙" 등 조합값). 레거시 분리형 하위 호환 유지
- **재고**: 주문 시 decreaseStock(), 취소 시 increaseStock(). 비관적 락(PESSIMISTIC_WRITE) — `findByIdWithLock()`으로 Race Condition 방지
- **배송비**: 50,000원 이상 무료, 미만 3,000원
- **주문 취소 가능**: PENDING, PAID에서만
- **구매 확정**: Orders.confirmedAt, POST /api/orders/{id}/confirm (본인/DELIVERED/중복 검증)
- **반품/교환**: DELIVERED + confirmedAt=null 상태에서만 신청, type 무관 중복 차단, 신청 즉시 OrderStatus 변경
  - RETURN → RETURN_REQUESTED, EXCHANGE → EXCHANGE_REQUESTED
  - COMPLETED 시: RETURN→REFUNDED, EXCHANGE→DELIVERED + 재고 복구
- **쿠폰**: Orders.memberCoupon FK, PAID 시 markUsed(), 취소/환불 시 미만료 복원
- **썸네일**: isThumbnail=true 우선, sortOrder 최소값 fallback. @EntityGraph fetch join 적용
- **주문 가격**: priceSnapshot = basePrice × (100 - discountRate) / 100 + additionalPrice
- **이미지**: products/(5MB), reviews/(5MB), return-requests/(20MB), banners/ — UUID+확장자
- **상품 수정 이미지 동기화**: images 배열 전체 전달, null=미수정, 빈배열=전체삭제. 삭제 후 flush() 필수
- **배너**: 최대 5개, sortOrder, isActive
- **비밀번호**: 8자+영문+숫자+특수문자. 변경 30일 제한(passwordChangedAt). 소셜 로그인 차단
- **비밀번호 찾기**: Gmail SMTP → Redis 인증번호 3분 → verified 10분 → 재설정. 재발송 30초 이중 방어
- **재고 관리 API**: GET /api/admin/inventory (전체 옵션 flat 목록), PATCH /api/admin/inventory/{optionValueId} (단건 수정)

## API 전체 목록

### Auth
- POST /api/auth/signup|login|logout|refresh
- POST /api/auth/password-reset/send|verify|reset

### Users
- GET/PATCH /api/users/me, PATCH /api/users/me/password, DELETE /api/users/me
- GET/POST/PATCH/DELETE /api/users/me/addresses

### Products
- GET /api/products (판매량순 포함), GET /api/products/{id}, GET /api/products/search
- GET /api/categories

### Cart
- GET/POST/PATCH/DELETE /api/cart

### Orders
- GET /api/orders, GET /api/orders/{id}
- POST /api/orders (쿠폰 적용 포함)
- POST /api/orders/{id}/cancel|confirm
- POST /api/orders/{orderId}/return-exchange, GET /api/orders/{orderId}/return-exchange

### Payment
- POST /api/payments/confirm (orderNumber 기반)

### Review
- GET /api/products/{productId}/reviews, GET /api/reviews/me
- POST /api/reviews, POST /api/reviews/images, POST /api/reviews/{id}/like, DELETE /api/reviews/{id}

### Wishlist
- GET /api/wishlists, POST /api/wishlists/{productId}

### Coupon
- GET /api/coupons (isIssued 포함), GET /api/coupons/me
- POST /api/coupons/{id}/issue, POST /api/coupons/preview

### Banner
- GET /api/banners

### Return/Exchange Images
- POST /api/return-requests/images (S3 return-requests/, 20MB)

### Admin
- GET/POST/PATCH/DELETE /api/admin/products
- GET /api/admin/products/{id} (단건, 옵션/이미지 포함)
- POST/DELETE /api/admin/images
- GET /api/admin/orders, PATCH /api/admin/orders/{id}/status
- GET /api/admin/users
- GET/POST/PATCH/DELETE /api/admin/coupons
- GET/POST/PUT/PATCH/DELETE /api/admin/banners
- GET /api/admin/requests, PATCH /api/admin/requests/{id}/approve|reject|complete
- GET /api/admin/inventory, PATCH /api/admin/inventory/{optionValueId}

## Infrastructure

- PostgreSQL 16: port 5432, db=shopdb, user=shop, pw=shop1234
- Redis 7: port 6379, pw=redis1234
- AWS S3: 버킷 yong-byeong-shop-images, 리전 ap-southeast-2
- Gmail SMTP: happywe2931@gmail.com
- Swagger UI: http://localhost:8080/swagger-ui.html
- JPA: ddl-auto=update, open-in-view=false
- Multipart: max-file-size=20MB, max-request-size=20MB

## Tests (21개)

- AuthServiceTest (5): 회원가입/로그인 성공·실패
- OrderServiceTest (9): 주문 생성/취소/배송비
- PaymentServiceTest (7): 결제 승인/실패 시나리오

## Known Issues

- 기존 주문 데이터: priceSnapshot 원가 기준 (소급 수정 불가)
- 테스트 6개 실패 (Product.discountRate null, PaymentServiceTest mock 누락 등)
- 토스 환불 API: 미연동
- 소셜 로그인: 사업자 정보 확정 후 진행 예정
- 상품 옵션 수정: AdminProductService에서 cascade 없어 productOptionValueRepository.save()/delete() 직접 호출 필요

## Next Up

- 소셜 로그인 (사업자 정보 확정 후)
- 3단계: Elasticsearch, Kafka, CI/CD, 배포
