# 쇼핑몰 포트폴리오 프로젝트 — 전체 컨텍스트 v2

## 프로젝트 개요
- **목적**: 취업용 포트폴리오 + 실서비스 운영 목표 의류 쇼핑몰
- **포지션**: 백엔드 위주 (풀스택 이해도 어필)
- **운영자**: 별도 존재 (요구사항은 약 1개월 후 수령 예정)
- **출시 목표**: 2025년 6월 말
- **프로젝트명**: shopify-clone
- **프로젝트 경로**: `C:\Users\KYW\projects\shopify-clone`

---

## 개발자 환경
- **OS**: Windows
- **IDE**: IntelliJ IDEA
- **JDK**: 17.0.12
- **Node.js**: v24.14.1
- **Git**: 설치됨
- **Docker Desktop**: v4.66.0 (WSL 업데이트 완료)
- **터미널**: cmd 기준 (PowerShell 아님)
- **Claude Code**: v2.1.81 설치됨 (`C:\Users\KYW\.local\bin\claude.exe`)
- **개발 수준**: Spring Boot 입문. 초보자 기준으로 설명 필요.

---

## 기술 스택 (확정)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, React Query |
| Backend | Spring Boot 4.0.4, Java 17, Spring Security |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Search | Elasticsearch 8.13.0 |
| Messaging | Apache Kafka (Confluent 7.6.0) |
| Infra | Docker, GitHub Actions, Nginx |
| Monitoring | Prometheus, Grafana |
| API 문서 | SpringDoc OpenAPI 3.0.2 (Swagger UI) |

---

## 개발 전략 (핵심)

### 3단계 개발 순서
- **1단계** (현재): PostgreSQL + Spring Boot + Spring Security(JWT)로 핵심 기능 완성
  - 회원, 상품, 주문, 결제 API
  - Redis는 세션/토큰 저장 용도로만 가볍게 사용
- **2단계**: Elasticsearch 검색 고도화 + 리뷰/찜/쿠폰 기능 추가
- **3단계**: Kafka 비동기 처리 + Prometheus/Grafana 모니터링 + CI/CD 완성

### AI 활용 방식
- **웹 채팅(Claude.ai)**: 설계, 방향 결정, 개념 질문
- **Claude Code(터미널)**: 실제 코드 파일 생성 및 수정
- Claude Code 실행 위치: `cd C:\Users\KYW\projects\shopify-clone\backend` → `claude`

---

## 시스템 아키텍처

### 4-Layer 구조
1. **Client Layer**: Next.js 15 (SSR, SEO 최적화)
2. **Application Layer**: Spring Boot 4개 도메인 모듈
   - Auth (JWT, OAuth2 인증/회원)
   - Product (상품 CRUD, 검색)
   - Order (장바구니, 주문, 결제)
   - Admin (관리자 대시보드)
3. **Data Layer**: PostgreSQL(메인 DB) + Redis(캐시/세션) + Elasticsearch(상품 검색)
4. **Infra Layer**: AWS S3/MinIO(이미지), Docker + GitHub Actions(CI/CD), Prometheus + Grafana(모니터링)

### 외부 연동
- 결제: 토스페이먼츠 API
- 이미지 저장: AWS S3 / MinIO

---

## 패키지 구조 (확정 및 생성 완료)

```
src/main/java/com/shopify/backend/
├── global/
│   ├── config/        ← SecurityConfig 등 전역 설정
│   ├── exception/     ← 공통 예외 처리
│   └── common/        ← 공통 유틸, ApiResponse
├── domain/
│   ├── auth/          (controller, service, repository, entity, dto)
│   ├── product/       (controller, service, repository, entity, dto)
│   ├── order/         (controller, service, repository, entity, dto)
│   └── admin/         (controller, service, repository, entity, dto)
└── infra/
    ├── kafka/
    ├── redis/
    ├── elasticsearch/
    └── s3/
```

---

## DB 스키마 설계 (확정) — 16개 테이블

### Member 도메인
- **MEMBER**: id, email(UK), password, name, phone, role(USER/ADMIN), provider(LOCAL/KAKAO/GOOGLE), provider_id, created_at, updated_at, deleted_at
- **MEMBER_ADDRESS**: id, member_id(FK), label, recipient, phone, zipcode, address, address_detail, is_default

### Product 도메인
- **CATEGORY**: id, parent_id(FK 자기참조), name, depth, sort_order
- **PRODUCT**: id, category_id(FK), name, description, base_price, discount_rate, status(ACTIVE/SOLDOUT/INACTIVE), view_count, created_at, updated_at, deleted_at
- **PRODUCT_IMAGE**: id, product_id(FK), url, sort_order, is_thumbnail
- **PRODUCT_OPTION_GROUP**: id, product_id(FK), name (예: 색상, 사이즈)
- **PRODUCT_OPTION_VALUE**: id, option_group_id(FK), value (예: 빨강/XL), additional_price, stock_quantity

### Order 도메인
- **CART_ITEM**: id, member_id(FK), product_id(FK), option_value_id(FK), quantity, created_at
- **ORDERS**: id, member_id(FK), order_number(UK), total_amount, discount_amount, delivery_fee, final_amount, status(PENDING/PAID/PREPARING/SHIPPED/DELIVERED/CANCELLED/REFUNDED), recipient, phone, address, memo, created_at, updated_at
- **ORDER_ITEM**: id, order_id(FK), product_id(FK), option_value_id(FK), product_name_snapshot, option_info_snapshot, price_snapshot, quantity, subtotal
- **PAYMENT**: id, order_id(FK), payment_key(UK), method(CARD/TRANSFER/VIRTUAL), amount, status(READY/DONE/CANCELLED/FAILED), paid_at, cancelled_at, created_at

### 부가 도메인
- **REVIEW**: id, member_id(FK), product_id(FK), order_item_id(FK), rating, content, created_at, updated_at, deleted_at
- **REVIEW_IMAGE**: id, review_id(FK), url, sort_order
- **WISHLIST**: id, member_id(FK), product_id(FK), created_at
- **COUPON**: id, name, discount_type(FIXED/PERCENT), discount_value, min_order_amount, max_discount_amount, total_quantity, issued_quantity, start_date, end_date
- **MEMBER_COUPON**: id, member_id(FK), coupon_id(FK), used_at, expired_at, created_at

### 핵심 설계 의사결정
1. **주문 스냅샷**: ORDER_ITEM에 주문 시점 데이터 복사 저장 (상품 변경 시 과거 주문 보호)
2. **상품 옵션 2단 구조**: OPTION_GROUP + OPTION_VALUE 분리 (옵션 조합별 가격/재고 독립 관리)
3. **소프트 삭제**: MEMBER, PRODUCT, REVIEW에 deleted_at 컬럼
4. **계층형 카테고리**: parent_id 자기참조 + depth 컬럼
5. **결제 분리**: ORDERS와 PAYMENT 분리 (PG사 교체 시 Order 도메인 영향 없음)

---

## API 설계 (확정)

### 인증 (Auth)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 → 토큰 발급 |
| POST | /api/auth/logout | 로그아웃 |
| POST | /api/auth/refresh | 액세스 토큰 재발급 |
| POST | /api/auth/oauth/{provider} | 소셜 로그인 |

### 회원 (Users)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/users/me | 내 정보 조회 |
| PATCH | /api/users/me | 내 정보 수정 |
| DELETE | /api/users/me | 회원 탈퇴 |
| GET | /api/users/me/addresses | 배송지 목록 |
| POST | /api/users/me/addresses | 배송지 추가 |
| PATCH | /api/users/me/addresses/{id} | 배송지 수정 |
| DELETE | /api/users/me/addresses/{id} | 배송지 삭제 |

### 상품 (Products)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/products | 상품 목록 (필터/정렬/페이지) |
| GET | /api/products/{id} | 상품 상세 |
| GET | /api/products/search | 상품 검색 |
| GET | /api/categories | 카테고리 트리 조회 |

### 장바구니 (Cart)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/cart | 장바구니 조회 |
| POST | /api/cart | 장바구니 담기 |
| PATCH | /api/cart/{id} | 수량 변경 |
| DELETE | /api/cart/{id} | 항목 삭제 |

### 주문/결제 (Orders)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/orders | 내 주문 목록 |
| GET | /api/orders/{id} | 주문 상세 |
| POST | /api/orders | 주문 생성 |
| POST | /api/orders/{id}/cancel | 주문 취소 |
| POST | /api/payments/confirm | 결제 최종 승인 |

### 2순위 기능
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/products/{id}/reviews | 상품 리뷰 목록 |
| POST | /api/reviews | 리뷰 작성 |
| GET | /api/wishlists | 찜 목록 |
| POST | /api/wishlists/{productId} | 찜 추가/해제 (토글) |
| GET | /api/coupons/me | 내 쿠폰 목록 |

### 관리자 (Admin)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/admin/products | 상품 전체 목록 |
| POST | /api/admin/products | 상품 등록 |
| PATCH | /api/admin/products/{id} | 상품 수정 |
| DELETE | /api/admin/products/{id} | 상품 삭제 |
| GET | /api/admin/orders | 전체 주문 조회 |
| PATCH | /api/admin/orders/{id}/status | 주문 상태 변경 |
| GET | /api/admin/users | 회원 목록 조회 |

---

## 현재 개발 환경 셋업 상태

### 완료된 항목 ✅
1. 프로젝트 폴더 생성
2. Spring Boot 프로젝트 생성 (Gradle, Java 17, 주요 의존성 포함)
3. build.gradle 수동 의존성 추가 (SpringDoc, JWT, P6Spy)
4. application.yml 설정 완료
5. Next.js 15 프론트엔드 생성
6. Docker Compose 6개 컨테이너 실행 확인
7. gradlew bootRun 서버 실행 확인
8. .gitignore, README.md 배치
9. CLAUDE.md 생성 (Claude Code 프로젝트 설명서)
10. 패키지 구조 생성 완료 (27개 디렉토리)

### 미완료 항목 ❌ (다음 작업 순서)
1. global/config/SecurityConfig.java
   - JWT stateless, CORS(localhost:3000), 공개경로 permitAll, ADMIN 권한 설정
   - JWT 필터 자리는 주석으로만 표시
2. global/exception/ErrorCode.java
3. global/exception/BusinessException.java
4. global/exception/GlobalExceptionHandler.java
5. global/common/ApiResponse.java
6. domain/auth/controller/HealthController.java (GET /health → {"status":"ok"})
7. 도메인 엔티티 코드 (Member, Product, Order 등 ERD 기반)
8. API 엔드포인트 개발
9. 비즈니스 로직 구현
10. 테스트 → 배포

---

## Docker Compose 주요 설정값
```
postgres: postgres:16-alpine, 포트 5432, DB=shopdb, user=shop, pw=shop1234
redis: redis:7-alpine, 포트 6379, pw=redis1234
elasticsearch: 8.13.0, 포트 9200
zookeeper: confluent 7.6.0, 포트 2181
kafka: confluent 7.6.0, 포트 9092
kafka-ui: provectuslabs/kafka-ui, 포트 8989
```

## application.yml 주요 설정값
```
datasource: jdbc:postgresql://localhost:5432/shopdb (shop/shop1234)
redis: localhost:6379 (pw: redis1234)
kafka: localhost:9092, group-id: shop-group
elasticsearch: http://localhost:9200
server.port: 8080
jwt.access-token-expiry: 1800000 (30분)
jwt.refresh-token-expiry: 604800000 (7일)
springdoc: swagger-ui path /swagger-ui.html
jpa: ddl-auto=update, show-sql=true, open-in-view=false
```

---

## 해결한 이슈 기록
1. **PowerShell 스크립트 실행 오류** → cmd 모드로 전환 후 실행
2. **Docker Desktop 시작 실패** → `wsl --update` 실행 후 해결
3. **SpringDoc + QueryDSL 호환 충돌** → QueryDSL 의존성 제거 (나중에 재추가 예정)
4. **docker-compose.yml version 경고** → 첫 줄 `version: '3.8'` 삭제

---

## 커뮤니케이션 참고사항
- 터미널 명령어는 **cmd 기준** (PowerShell 아님)
- 초보자 수준에 맞춰 **왜 이걸 하는지** 설명 포함
- 코드 작성은 **Claude Code**로 진행 (웹에서는 설계/방향 결정)
- Claude Code 실행: `cd C:\Users\KYW\projects\shopify-clone\backend` → `claude`
