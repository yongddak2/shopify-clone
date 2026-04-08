# 쇼핑몰 포트폴리오 프로젝트 — 전체 컨텍스트 v4

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
- **1단계** (진행 중): PostgreSQL + Spring Boot + Spring Security(JWT)로 핵심 기능 완성
  - 회원, 상품, 주문 API 완료 ✅
  - Payment(토스페이먼츠) 연동만 남음
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
│   ├── config/        ← SecurityConfig, JwtProperties, JwtProvider
│   ├── filter/        ← JwtAuthenticationFilter
│   ├── exception/     ← ErrorCode, BusinessException, GlobalExceptionHandler
│   └── common/        ← ApiResponse
├── domain/
│   ├── auth/          (controller, service, repository, entity, dto) ✅ 완료
│   ├── product/       (controller, service, repository, entity, dto) ✅ 완료
│   ├── order/         (controller, service, repository, entity, dto) ✅ 완료
│   └── admin/         (controller, service, repository, entity, dto) ✅ 완료
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

### 인증 (Auth) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 → 토큰 발급 |
| POST | /api/auth/logout | 로그아웃 |
| POST | /api/auth/refresh | 액세스 토큰 재발급 |
| POST | /api/auth/oauth/{provider} | 소셜 로그인 |

### 회원 (Users) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/users/me | 내 정보 조회 |
| PATCH | /api/users/me | 내 정보 수정 |
| DELETE | /api/users/me | 회원 탈퇴 |
| GET | /api/users/me/addresses | 배송지 목록 |
| POST | /api/users/me/addresses | 배송지 추가 |
| PATCH | /api/users/me/addresses/{id} | 배송지 수정 |
| DELETE | /api/users/me/addresses/{id} | 배송지 삭제 |

### 상품 (Products) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/products | 상품 목록 (필터/정렬/페이지) |
| GET | /api/products/{id} | 상품 상세 |
| GET | /api/products/search | 상품 검색 (2단계 예정) |
| GET | /api/categories | 카테고리 트리 조회 |

### 장바구니 (Cart) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/cart | 장바구니 조회 |
| POST | /api/cart | 장바구니 담기 |
| PATCH | /api/cart/{id} | 수량 변경 |
| DELETE | /api/cart/{id} | 항목 삭제 |

### 주문 (Orders) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/orders | 내 주문 목록 |
| GET | /api/orders/{id} | 주문 상세 |
| POST | /api/orders | 주문 생성 |
| POST | /api/orders/{id}/cancel | 주문 취소 |

### 결제 (Payment) ❌ 미구현
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/payments/confirm | 결제 최종 승인 (토스페이먼츠 연동) |

### 2순위 기능 (2단계 예정)
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/products/{id}/reviews | 상품 리뷰 목록 |
| POST | /api/reviews | 리뷰 작성 |
| GET | /api/wishlists | 찜 목록 |
| POST | /api/wishlists/{productId} | 찜 추가/해제 (토글) |
| GET | /api/coupons/me | 내 쿠폰 목록 |

### 관리자 (Admin) ✅ 구현 완료
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
11. global/config/SecurityConfig.java (JWT stateless, CORS, 권한 설정, JWT 필터 연결 완료)
12. global/exception/ErrorCode.java, BusinessException.java, GlobalExceptionHandler.java
13. global/common/ApiResponse.java
14. global/config/JwtProperties.java, JwtProvider.java
15. global/filter/JwtAuthenticationFilter.java
16. domain/auth/entity/ 전체 (Member, MemberAddress, Role, Provider)
17. domain/product/entity/ 전체 (Category, Product, ProductImage, ProductOptionGroup, ProductOptionValue, ProductStatus)
18. domain/order/entity/ 전체 (Order, OrderItem, CartItem, Payment, OrderStatus, PaymentMethod, PaymentStatus)
19. domain/auth/ 전체 레이어 구현 완료 (Repository, DTO, Service, Controller) + API 테스트 완료
20. domain/product/ 전체 레이어 구현 완료 + API 테스트 완료
21. domain/order/ Cart + Order 전체 레이어 구현 완료 + API 테스트 완료
22. domain/admin/ 전체 레이어 구현 완료 + API 테스트 완료
23. domain/auth/UserController + UserService 구현 완료 + API 테스트 완료
24. Swagger UI 정상 작동 확인 (http://localhost:8080/swagger-ui.html)
25. 전 도메인 curl 기반 실제 API 테스트 완료

### 미완료 항목 ❌ (다음 작업 순서)
1. **Payment 도메인 API** — 토스페이먼츠 연동 (POST /api/payments/confirm)
   - 토스페이먼츠 개발자 계정에서 테스트 클라이언트 키, 시크릿 키 발급 필요
   - 프론트엔드 결제 위젯 연동과 함께 진행하는 것이 자연스러움
2. **2단계 기능** — Elasticsearch 검색, 리뷰/찜/쿠폰
3. **3단계 기능** — Kafka, Prometheus/Grafana, CI/CD
4. **프론트엔드 연동**
5. **배포**

---

## 주요 비즈니스 로직 결정사항

1. **재고 관리**: 주문 생성 시 `decreaseStock()` 차감, 취소 시 `increaseStock()` 복구. Race Condition 처리(비관적 락)는 추후 리팩토링 예정.
2. **배송비 정책**: 총액 50,000원 이상 무료, 미만 시 3,000원
3. **주문 취소 가능 상태**: PENDING, PAID 상태에서만 가능
4. **주문번호 생성**: "ORD-" + System.currentTimeMillis()
5. **기본 배송지 중복 방지**: 새 배송지를 기본값으로 추가/수정 시 기존 기본 배송지를 `clearDefault()`로 해제
6. **관리자 권한**: DB에서 직접 role을 ADMIN으로 변경 후 재로그인 필요 (JWT 토큰에 role이 박혀있어서 재발급 필수)

---

## 코드 패턴 (전 도메인 공통)

- **인증 추출**: `Authentication authentication` + `(Long) authentication.getPrincipal()` → memberId
- **의존성 주입**: `@RequiredArgsConstructor` + 생성자 주입
- **트랜잭션**: 클래스 레벨 `@Transactional(readOnly = true)` + 쓰기 메서드에 `@Transactional`
- **예외 처리**: `BusinessException(ErrorCode.XXX)` 패턴
- **응답 형식**: `ApiResponse.success(data)` + `ResponseEntity` 반환
- **HTTP 상태**: POST 생성 → 201 Created, DELETE → 204 No Content
- **DTO 생성**: 정적 팩토리 메서드 `from()` 패턴
- **엔티티 빌더**: `@NoArgsConstructor(access = AccessLevel.PROTECTED)` + 생성자 레벨 `@Builder` 조합

---

## 알려진 이슈 및 해결 예정 항목

1. **Race Condition (재고 동시 차감)**: 현재 락 처리 없음. 추후 `@Lock(LockModeType.PESSIMISTIC_WRITE)` 추가 예정.
2. **AdminProductService.createProduct 최적화**: 현재 images/optionGroups를 직접 리스트에 추가하는 방식으로 처리. 향후 리팩토링 가능.
3. **boolean isDefault 직렬화**: DTO에서 `isDefault` 필드명 대신 `defaultAddress`로 변경하여 Jackson 직렬화 문제 해결함. 프론트엔드 연동 시 `defaultAddress` 키로 통신해야 함.

---

## Docker Compose 주요 설정값
```
컨테이너 이름 규칙: shop-{서비스명} (예: shop-postgres, shop-redis)
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

## 테스트 계정 정보 (개발용)
```
이메일: test2@test.com
비밀번호: Test1234!
권한: ADMIN (DB에서 직접 변경됨)
```

## 서버 실행 방법 (매번 작업 시작 시)
```
1. Docker Desktop 실행
2. cd C:\Users\KYW\projects\shopify-clone
3. docker compose up -d
4. cd backend
5. gradlew bootRun
```

## 토큰 발급 방법 (API 테스트 시)
```
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test2@test.com\",\"password\":\"Test1234!\"}"
→ 응답의 accessToken 값을 복사해서 메모장에 보관
→ 이후 요청 시: -H "Authorization: Bearer {토큰값}"
```

## PostgreSQL 직접 접속 방법
```
docker exec -it shop-postgres psql -U shop -d shopdb
종료: \q
```

---

## 해결한 이슈 기록
1. **PowerShell 스크립트 실행 오류** → cmd 모드로 전환 후 실행
2. **Docker Desktop 시작 실패** → `wsl --update` 실행 후 해결
3. **SpringDoc + QueryDSL 호환 충돌** → QueryDSL 의존성 제거 (나중에 재추가 예정)
4. **docker-compose.yml version 경고** → 첫 줄 `version: '3.8'` 삭제
5. **SpringDoc 버전 충돌** → build.gradle에 중복 선언된 2.5.0 제거, 3.0.2만 유지
6. **서버 실행 순서 중요** → Docker Desktop 켜기 → docker compose up -d → gradlew bootRun
7. **서버는 반드시 cmd 터미널에서 포그라운드로 실행** → 백그라운드 실행 시 확인 후 자동 종료됨
8. **포트 8080 충돌 시** → IntelliJ 또는 기존 프로세스를 먼저 종료 후 재실행
9. **ProductOptionValue.decreaseStock() 예외 타입** → IllegalStateException 대신 BusinessException(ErrorCode.OUT_OF_STOCK)으로 수정
10. **AdminProductService 연관관계 반영** → 저장 후 findById() 재조회 대신 product.getImages().addAll() 방식으로 수정
11. **boolean isDefault 직렬화 문제** → Lombok @Getter가 isDefault()를 생성하면 Jackson이 "default"로 직렬화. DTO 필드명을 defaultAddress로 변경하여 해결
12. **hasRole vs hasAuthority 일치 확인** → JwtAuthenticationFilter에서 "ROLE_" + role로 생성, SecurityConfig에서 hasRole("ADMIN") 사용 → 정상 일치 확인

---

## 커뮤니케이션 참고사항
- 터미널 명령어는 **cmd 기준** (PowerShell 아님)
- 초보자 수준에 맞춰 **왜 이걸 하는지** 설명 포함
- 코드 작성은 **Claude Code**로 진행 (웹에서는 설계/방향 결정)
- Claude Code 실행: `cd C:\Users\KYW\projects\shopify-clone\backend` → `claude`
- API 테스트는 curl 명령어로 진행 (Swagger Authorize 버튼 대신)
