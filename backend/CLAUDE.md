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
./gradlew test                                    # 전체 테스트 (20개)
```

## Architecture

`src/main/java/com/shopify/backend/` 도메인 주도 패키지 구조:

- **domain/**
  - `auth/` — JWT 인증, 회원관리 (signup/login/logout/refresh, UserController)
  - `product/` — 상품 CRUD, 카테고리 트리
  - `order/` — 장바구니, 주문 생성/취소, 결제(토스페이먼츠 연동)
  - `admin/` — 상품 등록/수정/삭제, 주문 상태 변경, 회원 목록, 쿠폰 관리, 이미지 업로드/삭제(AdminImageController)
  - `review/` — 리뷰 작성/삭제 (DELIVERED 상태에서만, 소프트 삭제)
  - `wishlist/` — 찜 토글
  - `coupon/` — 쿠폰 발급/미리보기
- **global/** — SecurityConfig, JwtProvider, JwtAuthenticationFilter, ErrorCode, BusinessException, ApiResponse
- **infra/** — Kafka, Redis, Elasticsearch, S3 설정 (Kafka/ES는 미사용)
  - `s3/S3Config.java` — S3Client 빈 (리전, 자격증명)
  - `s3/S3Service.java` — `uploadFile(MultipartFile)`: UUID 파일명으로 S3 업로드 후 URL 반환, `deleteFile(String imageUrl)`: URL에서 key 추출 후 S3 삭제

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
- 결제 분리: ORDERS와 PAYMENT 분리 (PG 교체 용이), 토스페이먼츠 confirm API는 백엔드, 결제 위젯 키는 프론트에서 개별 관리
- 재고: 주문 시 decreaseStock(), 취소 시 increaseStock() (비관적 락 미적용)
- 배송비: 50,000원 이상 무료, 미만 3,000원
- 썸네일 추출: isThumbnail=true 우선, 없으면 sortOrder 최소값 fallback (ProductSummaryResponse, CartItemResponse, WishlistResponse, OrderItemResponse)
- 이미지 fetch join: ProductRepository, CartItemRepository, WishlistRepository, OrderItemRepository에 `@EntityGraph(attributePaths)` 적용
- 주문 가격: priceSnapshot = basePrice × (100 - discountRate) / 100 + additionalPrice (할인가 반영)
- 이미지 업로드: POST /api/admin/images (MultipartFile, 5MB 제한, jpg/jpeg/png/gif/webp), DELETE /api/admin/images (imageUrl 파라미터)
- AWS S3: 버킷 yong-byeong-shop-images, 리전 ap-southeast-2, 저장 경로 products/

## Infrastructure

- PostgreSQL 16: port 5432, db=shopdb, user=shop, pw=shop1234
- Redis 7: port 6379, pw=redis1234
- AWS S3: 버킷 yong-byeong-shop-images, 리전 ap-southeast-2
- Swagger UI: http://localhost:8080/swagger-ui.html
- JPA: ddl-auto=update, open-in-view=false
- Multipart: max-file-size=5MB, max-request-size=5MB

## Tests (20개 통과)

- AuthServiceTest (5): 회원가입/로그인 성공·실패
- OrderServiceTest (8): 주문 생성/취소/배송비
- PaymentServiceTest (7): 결제 승인/실패 시나리오

## Recent Changes (2026-04-04)

- S3 이미지 업로드 기능 추가: S3Config, S3Service, AdminImageController
- ErrorCode에 INVALID_FILE_TYPE, FILE_UPLOAD_FAILED, FILE_SIZE_EXCEEDED 추가
- 썸네일 fallback 로직 추가 (isThumbnail 우선, sortOrder 최소값 fallback): ProductSummaryResponse, CartItemResponse, WishlistResponse, OrderItemResponse
- @EntityGraph 추가: ProductRepository, CartItemRepository, WishlistRepository, OrderItemRepository (images fetch join)
- OrderService.createOrder() 할인가 반영: priceSnapshot = basePrice × (100 - discountRate) / 100 + additionalPrice
- OrderItemResponse에 thumbnailUrl 필드 추가
- OrderResponse 필드명 변경: items → orderItems (프론트엔드 호환)
- application.yml에 cloud.aws.s3 설정 추가, multipart max 10MB → 5MB 변경
- application-example.yml에 S3 설정 placeholder 추가

## Known Issues

- PATCH /api/admin/products/{id}: 옵션 수정 미지원 (기본 정보만 수정 가능)
- Race Condition: 재고 동시 차감 시 락 미적용
- 쿠폰 주문 적용: 미리보기만 구현, 주문 시 실적용 미구현
- 기존 주문 데이터: 할인가 반영 전에 생성된 주문의 priceSnapshot은 원가 기준 (소급 수정 불가)