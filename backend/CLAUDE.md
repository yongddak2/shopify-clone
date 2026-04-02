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
  - `admin/` — 상품 등록/수정/삭제, 주문 상태 변경, 회원 목록, 쿠폰 관리
  - `review/` — 리뷰 작성/삭제 (DELIVERED 상태에서만, 소프트 삭제)
  - `wishlist/` — 찜 토글
  - `coupon/` — 쿠폰 발급/미리보기
- **global/** — SecurityConfig, JwtProvider, JwtAuthenticationFilter, ErrorCode, BusinessException, ApiResponse
- **infra/** — Kafka, Redis, Elasticsearch, S3 설정 (Kafka/ES는 미사용)

## Code Patterns

- 인증: `(Long) authentication.getPrincipal()` → memberId
- 의존성 주입: `@RequiredArgsConstructor`
- 트랜잭션: 클래스 `@Transactional(readOnly=true)` + 쓰기 메서드 `@Transactional`
- 예외: `BusinessException(ErrorCode.XXX)`
- 응답: `ApiResponse.success(data)` + ResponseEntity
- DTO: 정적 팩토리 `from()`, 엔티티: `@Builder` + `@NoArgsConstructor(PROTECTED)`
- POST → 201, DELETE → 204

## Key Design Decisions

- 주문 스냅샷: ORDER_ITEM에 주문 시점 데이터 복사
- 옵션 2단 구조: OPTION_GROUP + OPTION_VALUE
- 소프트 삭제: MEMBER, PRODUCT, REVIEW에 deletedAt
- 결제 분리: ORDERS와 PAYMENT 분리 (PG 교체 용이)
- 재고: 주문 시 decreaseStock(), 취소 시 increaseStock() (비관적 락 미적용)
- 배송비: 50,000원 이상 무료, 미만 3,000원

## Infrastructure

- PostgreSQL 16: port 5432, db=shopdb, user=shop, pw=shop1234
- Redis 7: port 6379, pw=redis1234
- Swagger UI: http://localhost:8080/swagger-ui.html
- JPA: ddl-auto=update, open-in-view=false

## Tests (20개 통과)

- AuthServiceTest (5): 회원가입/로그인 성공·실패
- OrderServiceTest (8): 주문 생성/취소/배송비
- PaymentServiceTest (7): 결제 승인/실패 시나리오

## Known Issues

- PATCH /api/admin/products/{id}: 옵션 수정 미지원 (기본 정보만 수정 가능)
- Race Condition: 재고 동시 차감 시 락 미적용
- 쿠폰 주문 적용: 미리보기만 구현, 주문 시 실적용 미구현