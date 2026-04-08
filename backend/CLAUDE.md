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
  - `auth/` — JWT 인증, 회원관리 (signup/login/logout/refresh, UserController, 비밀번호 변경, 비밀번호 찾기 PasswordResetController)
  - `product/` — 상품 CRUD, 카테고리 트리, 검색 (키워드/카테고리/가격/정렬)
  - `order/` — 장바구니, 주문 생성/취소/구매확정, 결제(토스페이먼츠 연동), 쿠폰 할인 적용, 반품/교환 요청(ReturnExchangeService)
  - `admin/` — 상품 등록/수정/삭제, 주문 상태 변경, 회원 목록, 쿠폰 관리(CRUD), 이미지 업로드/삭제(AdminImageController), 배너 관리(AdminBannerController), 반품/교환 관리(AdminReturnExchangeController)
  - `review/` — 리뷰 작성/삭제 (DELIVERED 상태에서만, 소프트 삭제), 좋아요 토글, 이미지 업로드, 정렬/페이지네이션
  - `wishlist/` — 찜 토글
  - `coupon/` — 쿠폰 발급/미리보기/주문 실적용/다운로드 가능 목록(GET /api/coupons)
- **global/** — SecurityConfig, JwtProvider, JwtAuthenticationFilter, ErrorCode, BusinessException, ApiResponse
- **infra/** — Kafka, Redis, Elasticsearch, S3, Email(Gmail SMTP) 설정 (Kafka/ES는 미사용)
  - `s3/S3Config.java` — S3Client 빈 (리전, 자격증명)
  - `s3/S3Service.java` — `uploadFile(MultipartFile)`: UUID 파일명으로 S3 업로드 후 URL 반환, `uploadFile(MultipartFile, String folder)`: 지정 폴더로 업로드, `deleteFile(String imageUrl)`: URL에서 key 추출 후 S3 삭제

## Code Patterns

- 인증: `(Long) authentication.getPrincipal()` → memberId
- 의존성 주입: `@RequiredArgsConstructor`
- 트랜잭션: 클래스 `@Transactional(readOnly=true)` + 쓰기 메서드 `@Transactional`
- 예외: `BusinessException(ErrorCode.XXX)` — 파일 관련: INVALID_FILE_TYPE, FILE_UPLOAD_FAILED, FILE_SIZE_EXCEEDED
- 응답: `ApiResponse.success(data)` + ResponseEntity
- DTO: 정적 팩토리 `from()`, 엔티티: `@Builder` + `@NoArgsConstructor(PROTECTED)`
- POST → 201, DELETE → 204

## Key Design Decisions

- 주문 스냅샷: ORDER_ITEM에 주문 시점 데이터 복사
- 옵션 조합형 구조: OPTION_GROUP("옵션") + OPTION_VALUE("S-블랙" 등 조합값)
  - 프론트에서 사이즈×색상 조합을 만들어 하나의 optionGroup으로 전송
  - 기존 분리형 옵션(사이즈/색상 별도 그룹)으로 등록된 레거시 상품도 하위 호환 유지
- 소프트 삭제: MEMBER, PRODUCT, REVIEW에 deletedAt
- 결제 분리: ORDERS와 PAYMENT 분리 (PG 교체 용이), 토스페이먼츠 confirm API는 백엔드, 결제 위젯 키는 프론트에서 개별 관리, PaymentConfirmRequest는 orderNumber(String) 기준
- 쿠폰 실적용: Orders.memberCoupon FK로 사용 쿠폰 기록, 주문 생성 시 할인 계산(FIXED/PERCENT), 결제 완료(PAID) 시 usedAt 기록, 취소/환불 시 미만료 쿠폰 복원
- 재고: 주문 시 decreaseStock(), 취소 시 increaseStock() (비관적 락 미적용)
- 배송비: 50,000원 이상 무료, 미만 3,000원
- 썸네일 추출: isThumbnail=true 우선, 없으면 sortOrder 최소값 fallback (ProductSummaryResponse, CartItemResponse, WishlistResponse, OrderItemResponse)
- 이미지 fetch join: ProductRepository, CartItemRepository, WishlistRepository, OrderItemRepository에 `@EntityGraph(attributePaths)` 적용
- 주문 가격: priceSnapshot = basePrice × (100 - discountRate) / 100 + additionalPrice (할인가 반영)
- 이미지 업로드: POST /api/admin/images (상품, products/ 경로), POST /api/reviews/images (리뷰, reviews/ 경로), MultipartFile 5MB 제한, jpg/jpeg/png/gif/webp
- AWS S3: 버킷 yong-byeong-shop-images, 리전 ap-southeast-2, 저장 경로 products/, reviews/
- 리뷰 좋아요: ReviewLike 엔티티 (review_id + member_id unique), POST /api/reviews/{id}/like 토글
- 리뷰 정렬: GET /api/products/{id}/reviews?sort=latest|rating_high|rating_low|likes
- 상품 검색: GET /api/products/search?keyword=&category=&minPrice=&maxPrice=&sort=latest|price_low|price_high|sales&page=&size=
- Product.salesCount: 결제 완료 시 증가, 취소/환불 시 감소, 판매량순 정렬 지원
- 배너: Banner 엔티티 (imageUrl, linkUrl, sortOrder, isActive), 최대 5개, GET /api/banners (공개), Admin CRUD /api/admin/banners
- 비밀번호 변경: PATCH /api/users/me/password, 30일 제한 (Member.passwordChangedAt), 소셜 로그인 사용자 차단
- 비밀번호 찾기: POST /api/auth/password-reset/send (이메일 발송), /verify (인증번호 확인), /reset (비밀번호 재설정), Redis에 인증번호 3분/verified 토큰 10분 저장, 재발송 30초 쿨타임 (프론트+백엔드 이중 방어), Gmail SMTP (happywe2931@gmail.com)
- 구매 확정: Orders.confirmedAt 필드, POST /api/orders/{id}/confirm, 본인/DELIVERED/중복 확정 검증
- 쿠폰 다운로드: GET /api/coupons (전체 발급 가능 쿠폰 목록, isIssued 플래그 포함)
- 관리자 쿠폰 CRUD: AdminCouponController/AdminCouponService, GET/POST/PATCH/DELETE /api/admin/coupons

## Infrastructure

- PostgreSQL 16: port 5432, db=shopdb, user=shop, pw=shop1234
- Redis 7: port 6379, pw=redis1234
- AWS S3: 버킷 yong-byeong-shop-images, 리전 ap-southeast-2
- Swagger UI: http://localhost:8080/swagger-ui.html
- JPA: ddl-auto=update, open-in-view=false
- Multipart: max-file-size=5MB, max-request-size=5MB

## Tests (21개)

- AuthServiceTest (5): 회원가입/로그인 성공·실패
- OrderServiceTest (9): 주문 생성/취소/배송비
- PaymentServiceTest (7): 결제 승인/실패 시나리오

## Recent Changes (2026-04-08) — 반품/교환 요청 시스템

### 반품/교환 요청 API
- **엔티티**: ReturnExchangeRequest, ReturnExchangeImage (domain/order/entity)
- **Enum**:
  - ReasonType: RETURN, EXCHANGE
  - ReasonCategory: CHANGE_OF_MIND, SELLER_FAULT
  - ReasonDetail: 9종 (DISLIKE/WRONG_SIZE/WRONG_ORDER/FOUND_CHEAPER/WRONG_ITEM_SENT/WRONG_OPTION_SENT/PRODUCT_DEFECT/DIFFERENT_FROM_DESC/SEWING_DEFECT) — category/label 매핑 보유
  - RequestStatus: REQUESTED, APPROVED, REJECTED, COMPLETED
- **API**:
  - POST /api/orders/{orderId}/return-exchange (사용자 신청)
  - GET /api/orders/{orderId}/return-exchange (사용자 조회)
  - POST /api/return-requests/images (S3 업로드, return-requests/ 경로, 20MB)
  - GET /api/admin/requests (관리자 목록, Pageable)
  - PATCH /api/admin/requests/{id}/approve|reject|complete
- **비즈니스 로직**:
  - DELIVERED + confirmedAt === null 상태에서만 신청 가능
  - type 무관 중복 신청 차단 (existsByOrderIdAndStatusIn)
  - 교환 신청 시 desiredOptionValueId 필수 (ProductOptionValue ManyToOne)
  - 이미지 최대 3장 (Service에서 검증)
  - 신청 즉시 OrderStatus 변경: RETURN→RETURN_REQUESTED, EXCHANGE→EXCHANGE_REQUESTED
  - 처리완료(COMPLETED) 시: RETURN→REFUNDED, EXCHANGE→DELIVERED + 재고 복구(orderItems의 optionValue.increaseStock)
- **OrderStatus 추가**: RETURN_REQUESTED, EXCHANGE_REQUESTED
- **OrderResponse 확장**: returnRequested, exchangeRequested boolean (OrderService에서 ReturnExchangeRequestRepository.findByOrderIdIn 일괄 조회 후 플래그 계산)
- **ErrorCode 추가**: RETURN_REQUEST_NOT_FOUND, DUPLICATE_RETURN_REQUEST, CONFIRMED_ORDER_CANNOT_REQUEST, INVALID_REQUEST_STATUS, EXCHANGE_OPTION_REQUIRED, TOO_MANY_IMAGES
- **multipart 한도**: 5MB → 20MB (application.yml)
- **DB**: orders.status CHECK 제약 조건 수동 삭제 후 재생성 (신규 enum 값 추가 위함)

### 기존 (이전 작업)
- 구매 확정 API: Orders.confirmedAt + POST /api/orders/{id}/confirm (본인/DELIVERED/중복 검증)
- 쿠폰 다운로드: GET /api/coupons (isIssued 플래그)
- 관리자 쿠폰 수정/삭제: AdminCouponController, AdminCouponService 신규 (GET/POST/PATCH/DELETE)
- 비밀번호 찾기: PasswordResetController + Service, Gmail SMTP 연동, Redis 인증번호 3분/verified 10분, 재발송 30초 쿨타임, infra/email 패키지 신규
- ErrorCode/SecurityConfig: password-reset 엔드포인트 permitAll, 관련 에러코드 추가
- 찜 목록 정렬: WishlistRepository.findByMemberIdOrderByCreatedAtDesc (최신 찜 먼저)

## Recent Changes (2026-04-04)

- S3 이미지 업로드: S3Config, S3Service, AdminImageController, 리뷰 이미지 업로드 (reviews/ 경로)
- 썸네일 fallback 로직: isThumbnail 우선, sortOrder 최소값 fallback
- @EntityGraph: ProductRepository, CartItemRepository, WishlistRepository, OrderItemRepository (images fetch join)
- 주문 가격 할인가 반영: priceSnapshot = basePrice × (100 - discountRate) / 100 + additionalPrice
- OrderResponse 필드명 변경: items → orderItems
- 리뷰 좋아요 토글: ReviewLike 엔티티, POST /api/reviews/{id}/like
- 리뷰 이미지 업로드: POST /api/reviews/images (S3 reviews/ 경로)
- 리뷰 목록 정렬/페이지네이션: latest/rating_high/rating_low/likes
- 내 리뷰 목록: GET /api/reviews/me
- 상품 검색: GET /api/products/search (키워드/카테고리/가격/정렬)
- Product.salesCount 필드 + 판매량순 정렬
- 배너 관리: Banner 엔티티, Admin CRUD, GET /api/banners 공개 API
- 비밀번호 변경: PATCH /api/users/me/password (30일 제한, 소셜 로그인 차단)
- 쿠폰 실적용: Orders.memberCoupon FK, 주문 시 할인 적용, 결제 시 사용처리, 취소/환불 시 미만료 복원
- PaymentConfirmRequest: orderId → orderNumber(String) 변경

## Known Issues

- PATCH /api/admin/products/{id}: 옵션 수정 미지원 (기본 정보만 수정 가능)
- Race Condition: 재고 동시 차감 시 락 미적용 (비관적 락 적용 예정)
- 기존 주문 데이터: 할인가 반영 전에 생성된 주문의 priceSnapshot은 원가 기준 (소급 수정 불가)
- 테스트 6개 실패 중 (Product.discountRate null 처리 미비, PaymentServiceTest OrderItemRepository mock 누락 등 기존 이슈)
- 토스 환불 API: 미연동
- 소셜 로그인: 쇼핑몰 사업자 정보 확정 후 진행 예정

## Next Up

- 재고 비관적 락 (Race Condition 처리)
- 상품 옵션 수정 API
- 소셜 로그인 (사업자 정보 확정 후)
- 3단계: Elasticsearch, Kafka, CI/CD, 배포