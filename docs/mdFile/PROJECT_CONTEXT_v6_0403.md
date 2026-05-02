# 쇼핑몰 포트폴리오 프로젝트 — 전체 컨텍스트 v6

## 프로젝트 개요
- **목적**: 취업용 포트폴리오 + 실서비스 운영 목표 의류 쇼핑몰
- **포지션**: 백엔드 위주 (풀스택 이해도 어필)
- **운영자**: 별도 존재 (요구사항은 약 1개월 후 수령 예정)
- **출시 목표**: 2025년 6월 말
- **프로젝트명**: shopify-clone
- **프로젝트 경로**: `C:\Users\KYW\projects\shopify-clone`
- **GitHub**: https://github.com/yongddak2/shopify-clone (Public)

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
| Frontend | Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4, React Query, zustand |
| Backend | Spring Boot 4.0.4, Java 17, Spring Security |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Search | Elasticsearch 8.13.0 (3단계 예정) |
| Messaging | Apache Kafka (Confluent 7.6.0) (3단계 예정) |
| Payment | 토스페이먼츠 API (테스트 키 발급 완료, API 개별 연동 키 사용) |
| Infra | Docker, GitHub Actions, Nginx |
| Monitoring | Prometheus, Grafana (3단계 예정) |
| API 문서 | SpringDoc OpenAPI 3.0.2 (Swagger UI) |

---

## 개발 전략 (핵심)

### 3단계 개발 순서
- **1단계** ✅ 완료: PostgreSQL + Spring Boot + Spring Security(JWT)로 핵심 기능 완성
  - 회원, 상품, 주문, 결제(토스페이먼츠), 관리자 API 전부 완료
  - Redis는 세션/토큰 저장 용도로만 가볍게 사용
- **2단계** ✅ 완료: 리뷰/찜/쿠폰 구현 완료. Elasticsearch 검색은 3단계로 이동.
- **3단계** ❌ 미시작: Kafka 비동기 처리 + Elasticsearch 검색 + Prometheus/Grafana 모니터링 + CI/CD

### 현재 진행 상황
1. ~~프론트엔드 핵심 페이지~~ ✅ 완료
2. ~~백엔드 테스트 코드~~ ✅ 완료 (20개 통과)
3. ~~2단계 기능 (리뷰/찜/쿠폰)~~ ✅ 완료
4. ~~관리자 페이지~~ ✅ 완료
5. ~~토스페이먼츠 결제 연동~~ ✅ 완료 (API 개별 연동 방식)
6. ~~카카오 우편번호 API~~ ✅ 완료
7. ~~배송지 관리 모달~~ ✅ 완료
8. ~~장바구니 체크박스 선택 결제~~ ✅ 완료
9. ~~할인가 표시 버그 수정~~ ✅ 완료
10. ~~조합형 옵션 구조 변경~~ ✅ 완료
11. **다음 작업: 상품 이미지 업로드** ← 여기
12. 프론트엔드 디자인 수정 (관리자 요구사항 대기 중)
13. 소셜 로그인 (카카오/구글)
14. 3단계 기능
15. 배포

### AI 활용 방식
- **웹 채팅(Claude.ai)**: 설계, 방향 결정, 개념 질문
- **Claude Code(터미널)**: 실제 코드 파일 생성 및 수정
- Claude Code 백엔드: `cd C:\Users\KYW\projects\shopify-clone\backend` → `claude`
- Claude Code 프론트엔드: `cd C:\Users\KYW\projects\shopify-clone\frontend` → `claude`

---

## 시스템 아키텍처

### 4-Layer 구조
1. **Client Layer**: Next.js 16 (SSR, SEO 최적화)
2. **Application Layer**: Spring Boot 7개 도메인 모듈
   - Auth (JWT, OAuth2 인증/회원)
   - Product (상품 CRUD, 검색)
   - Order (장바구니, 주문, 결제)
   - Admin (관리자 대시보드)
   - Review (상품 리뷰)
   - Wishlist (찜)
   - Coupon (쿠폰 발급/적용)
3. **Data Layer**: PostgreSQL(메인 DB) + Redis(캐시/세션) + Elasticsearch(상품 검색, 3단계)
4. **Infra Layer**: AWS S3/MinIO(이미지), Docker + GitHub Actions(CI/CD), Prometheus + Grafana(모니터링)

### 외부 연동
- 결제: 토스페이먼츠 API (API 개별 연동 키 사용, 결제위젯 키는 사업자등록 후 발급 예정)
- 이미지 저장: AWS S3 / MinIO (미구현)
- 주소 검색: 카카오 우편번호 API (Daum Postcode)

---

## 백엔드 패키지 구조

```
src/main/java/com/shopify/backend/
├── global/
│   ├── config/        ← SecurityConfig, JwtProperties, JwtProvider, TossPaymentsProperties, TossPaymentsConfig
│   ├── filter/        ← JwtAuthenticationFilter
│   ├── exception/     ← ErrorCode, BusinessException, GlobalExceptionHandler
│   └── common/        ← ApiResponse
├── domain/
│   ├── auth/          (controller, service, repository, entity, dto) ✅ 완료
│   ├── product/       (controller, service, repository, entity, dto) ✅ 완료
│   ├── order/         (controller, service, repository, entity, dto) ✅ 완료 (Payment 포함)
│   ├── admin/         (controller, service, repository, entity, dto) ✅ 완료 (쿠폰 관리 포함)
│   ├── review/        (controller, service, repository, entity, dto) ✅ 완료
│   ├── wishlist/      (controller, service, repository, entity, dto) ✅ 완료
│   └── coupon/        (controller, service, repository, entity, dto) ✅ 완료
└── infra/
    ├── kafka/
    ├── redis/
    ├── elasticsearch/
    └── s3/

src/main/resources/
├── application.yml              ← 실제 설정 (gitignore됨)
└── application-example.yml      ← GitHub 공유용 (민감 키 제외)

src/test/java/com/shopify/backend/
├── domain/
│   ├── auth/service/AuthServiceTest.java        ✅ 5개 테스트
│   └── order/service/
│       ├── OrderServiceTest.java                ✅ 8개 테스트
│       └── PaymentServiceTest.java              ✅ 7개 테스트
```

---

## 프론트엔드 구조

```
src/
├── app/
│   ├── globals.css          ← Tailwind v4 (@import "tailwindcss")
│   ├── layout.tsx           ← RootLayout (Header/Footer/Providers)
│   ├── page.tsx             ← 메인 (히어로 + BEST 상품)
│   ├── login/page.tsx       ← 로그인
│   ├── signup/page.tsx      ← 회원가입
│   ├── products/
│   │   ├── page.tsx         ← 상품 목록 (카테고리 필터/정렬/페이지네이션)
│   │   └── [id]/
│   │       ├── page.tsx     ← 서버 컴포넌트 (params await)
│   │       └── ProductDetailClient.tsx ← 상품 상세 (옵션/장바구니, 커스텀 담기 모달)
│   ├── cart/page.tsx        ← 장바구니 (체크박스 선택, 할인가 표시, 선택 결제)
│   ├── order/page.tsx       ← 주문/결제 (배송지 모달, 카카오 우편번호, 토스 결제창)
│   ├── payment/
│   │   ├── success/page.tsx ← 토스 결제 승인 처리
│   │   └── fail/page.tsx    ← 결제 실패/취소 처리
│   ├── orders/
│   │   ├── page.tsx         ← 주문 내역
│   │   └── [id]/
│   │       ├── page.tsx     ← 서버 컴포넌트 (params await)
│   │       └── OrderDetailClient.tsx ← 주문 상세
│   └── admin/
│       ├── layout.tsx       ← 관리자 레이아웃 (사이드바)
│       ├── page.tsx         ← 대시보드
│       ├── products/
│       │   ├── page.tsx     ← 상품 관리
│       │   └── new/page.tsx ← 상품 등록 (조합형 옵션, 커스텀 색상)
│       ├── orders/page.tsx  ← 주문 관리
│       ├── users/page.tsx   ← 회원 관리
│       └── coupons/
│           ├── page.tsx     ← 쿠폰 관리
│           └── new/page.tsx ← 쿠폰 생성
├── components/
│   ├── layout/
│   │   ├── Header.tsx       ← sticky 헤더, 사이드바(ADMIN 메뉴 포함), mounted 처리
│   │   └── Footer.tsx       ← 더미 회사 정보
│   ├── common/
│   │   └── Button.tsx       ← primary/outline variant
│   └── Providers.tsx        ← QueryClientProvider 래퍼
├── lib/
│   ├── api.ts               ← axios 인스턴스, 토큰 인터셉터, 401 자동 재발급
│   ├── auth.ts              ← signup/login/logout/refresh
│   ├── product.ts           ← getProducts/getProductDetail/getCategories
│   ├── cart.ts              ← getCart/addToCart/updateCartQuantity/removeCartItem
│   ├── order.ts             ← getOrders/getOrderDetail/createOrder/cancelOrder
│   ├── user.ts              ← getMyInfo/getMyAddresses/addMyAddress/updateMyAddress/deleteMyAddress
│   ├── payment.ts           ← confirmPayment (토스 결제 승인)
│   └── admin.ts             ← 관리자 API (상품/주문/회원/쿠폰 CRUD)
├── stores/
│   └── authStore.ts         ← zustand + persist, SSR 안전 처리
└── types/
    └── index.ts             ← 공통 타입 (ApiResponse, User, Product, Cart, Order 등)
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
- **PRODUCT_OPTION_GROUP**: id, product_id(FK), name (조합형: "옵션")
- **PRODUCT_OPTION_VALUE**: id, option_group_id(FK), value (조합형: "S-블랙"), additional_price, stock_quantity

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
2. **조합형 옵션**: 사이즈×색상 조합을 하나의 OPTION_VALUE로 저장 (예: "S-블랙"). CartItem이 optionValueId 하나만 참조하므로 조합 구분 가능. 기존 분리형 옵션(레거시)도 하위 호환 유지.
3. **소프트 삭제**: MEMBER, PRODUCT, REVIEW에 deleted_at 컬럼
4. **계층형 카테고리**: parent_id 자기참조 + depth 컬럼
5. **결제 분리**: ORDERS와 PAYMENT 분리 (PG사 교체 시 Order 도메인 영향 없음)

---

## API 설계 (전체)

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
| GET | /api/products/search | 상품 검색 (ES 연동 시 고도화 예정) |
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

### 결제 (Payment) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/payments/confirm | 결제 최종 승인 (토스페이먼츠 연동) |

### 리뷰 (Review) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/products/{productId}/reviews | 상품 리뷰 목록 (공개) |
| POST | /api/reviews | 리뷰 작성 (인증) |
| DELETE | /api/reviews/{id} | 리뷰 삭제 (인증, 소프트 삭제) |

### 찜 (Wishlist) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/wishlists | 찜 목록 (인증) |
| POST | /api/wishlists/{productId} | 찜 토글 — 추가/해제 (인증) |

### 쿠폰 (Coupon) ✅ 구현 완료
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/coupons/me | 내 쿠폰 목록 (인증) |
| POST | /api/coupons/{couponId}/issue | 쿠폰 발급 (인증) |
| POST | /api/coupons/preview | 쿠폰 할인 미리보기 (인증) |

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
| GET | /api/admin/coupons | 쿠폰 전체 목록 |
| POST | /api/admin/coupons | 쿠폰 생성 |

---

## 백엔드 테스트 현황

### Service 단위 테스트 (JUnit 5 + Mockito) — 총 20개 통과 ✅

#### OrderServiceTest (8개)
- 주문_생성_성공, 장바구니_비어있으면_예외, 품절_상품_주문_시_예외
- 배송비_무료_조건_확인, 배송비_유료_조건_확인
- 주문_취소_성공, 주문_취소_불가_상태_예외, 다른_사용자_주문_취소_시_예외

#### PaymentServiceTest (7개)
- 결제_승인_성공, 존재하지_않는_주문_예외, 다른_사용자_주문_결제_시_예외
- PENDING_아닌_상태_결제_시_예외, 이미_결제된_주문_예외, 금액_불일치_예외, 토스_API_실패_시_예외

#### AuthServiceTest (5개)
- 회원가입_성공, 중복_이메일_회원가입_예외
- 로그인_성공, 로그인_실패_이메일_없음, 로그인_실패_비밀번호_불일치

---

## 주요 비즈니스 로직 결정사항

1. **재고 관리**: 주문 생성 시 `decreaseStock()` 차감, 취소 시 `increaseStock()` 복구. Race Condition 처리(비관적 락)는 추후 리팩토링 예정.
2. **배송비 정책**: 총액 50,000원 이상 무료, 미만 시 3,000원
3. **주문 취소 가능 상태**: PENDING, PAID 상태에서만 가능
4. **주문번호 생성**: "ORD-" + System.currentTimeMillis()
5. **기본 배송지 중복 방지**: 새 배송지를 기본값으로 추가/수정 시 기존 기본 배송지를 `clearDefault()`로 해제
6. **관리자 권한**: DB에서 직접 role을 ADMIN으로 변경 후 재로그인 필요 (JWT 토큰에 role이 박혀있어서 재발급 필수)
7. **결제 흐름**: 프론트 주문 생성 → 토스 SDK requestPayment() 결제창 → paymentKey/orderId/amount 콜백 → /payment/success 페이지 → 백엔드 confirm API → 토스 API 최종 승인 → Payment 저장 + Order PAID 전환
8. **토스 인증**: 시크릿키 + ":" Base64 인코딩 → Basic 헤더. 시크릿 키는 application.yml에 ${TOSS_SECRET_KEY:기본값} 환경변수 폴백 방식.
9. **리뷰**: 배송 완료(DELIVERED) 상태에서만 작성 가능. 주문 상품당 1회. 소프트 삭제.
10. **찜**: 토글 방식 (찜 추가/해제를 같은 엔드포인트로 처리)
11. **쿠폰 할인 계산**: FIXED는 고정 금액, PERCENT는 비율 계산 후 maxDiscountAmount 초과 시 캡. 쿠폰 적용은 미리보기만 구현 (주문 시 실제 적용은 추후 리팩토링).
12. **조합형 옵션**: 프론트에서 사이즈×색상 조합을 만들어 하나의 optionGroup("옵션")으로 전송. 백엔드는 그대로 저장. 기존 분리형 옵션(레거시) 하위 호환 유지.
13. **장바구니 선택 결제**: sessionStorage로 선택된 cartItemId 목록을 주문 페이지에 전달. 주문 페이지에서 해당 항목만 표시/결제.
14. **할인가 계산**: basePrice × (1 - discountRate / 100) + additionalPrice. CartItemResponse에 discountRate 필드 포함.

---

## 코드 패턴 (전 도메인 공통)

- **인증 추출**: `Authentication authentication` + `(Long) authentication.getPrincipal()` → memberId
- **의존성 주입**: `@RequiredArgsConstructor` + 생성자 주입
- **트랜잭션**: 클래스 레벨 `@Transactional(readOnly = true)` + 쓰기 메서드에 `@Transactional`
- **예외 처리**: `BusinessException(ErrorCode.XXX)` 패턴
- **응답 형식**: `ApiResponse.success(data)` 또는 `ApiResponse.success(message, data)` + `ResponseEntity` 반환
- **HTTP 상태**: POST 생성 → 201 Created, DELETE → 204 No Content
- **DTO 생성**: 정적 팩토리 메서드 `from()` 패턴
- **엔티티 빌더**: `@NoArgsConstructor(access = AccessLevel.PROTECTED)` + 생성자 레벨 `@Builder` 조합

---

## 프론트엔드 주요 패턴

- **상태 관리**: zustand (인증 토큰, 유저 정보) + React Query (서버 상태)
- **API 호출**: axios 인스턴스 + 토큰 인터셉터 + 401 자동 재발급
- **Next.js 16 동적 라우트**: params가 Promise이므로 서버 컴포넌트에서 await 후 클라이언트 컴포넌트에 id 전달
- **SSR Hydration 방지**: Header 등에서 mounted state로 클라이언트 마운트 전까지 인증 UI 숨김
- **인증 보호 페이지**: cart, order, orders에서 비로그인 시 /login redirect
- **디자인**: 미니멀 의류 쇼핑몰 다크 테마 (배경 #2a2a2a, 헤더/푸터 #1e1e1e)
- **외부 스크립트**: next/script로 로드 (카카오 Postcode, 토스 SDK)
- **배송지 관리**: 모달 기반 (목록 선택/추가/수정/삭제) — 무신사 스타일
- **장바구니 → 주문 데이터 전달**: sessionStorage에 orderCartItemIds 저장
- **환경변수**: NEXT_PUBLIC_TOSS_CLIENT_KEY (기본값: 테스트 키)

---

## 알려진 이슈 및 해결 예정 항목

1. **Race Condition (재고 동시 차감)**: 현재 락 처리 없음. 추후 `@Lock(LockModeType.PESSIMISTIC_WRITE)` 추가 예정.
2. **쿠폰 주문 적용**: 현재 미리보기만 구현. OrderService에서 주문 생성 시 쿠폰 할인 적용 로직 추가 필요.
3. **프론트엔드 디자인**: 관리자 요구사항 대기 중. 레퍼런스 사이트(coolsis, kaposhka, hieta) 참고 예정.
4. **프론트엔드 리뷰/찜/쿠폰 페이지**: 백엔드 API는 완료. 프론트엔드에 해당 UI 추가 필요.
5. **상품 이미지 업로드**: 현재 URL 직접 입력 방식. S3/MinIO 연동 후 파일 업로드로 변경 필요.
6. **레거시 옵션 상품**: 이전에 분리형 옵션으로 등록된 상품은 옵션 조합 구분 불가. 삭제 후 조합형으로 재등록 필요.
7. **결제위젯 전환**: 현재 API 개별 연동 키 사용. 사업자등록 후 결제위젯 키 발급 시 프론트 결제 호출 부분만 수정하면 전환 가능.
8. **검색바**: UI만 구현, 기능 미연결.
9. **소셜 로그인**: 카카오/구글 API 키 발급 후 구현 예정.
10. **백엔드 PATCH /api/admin/products/{id}**: 옵션 수정 미지원. 나중에 리팩토링 시 추가.

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
toss.payments.secret-key: ${TOSS_SECRET_KEY:test_sk_...}
toss.payments.confirm-url: https://api.tosspayments.com/v1/payments/confirm
```

---

## 테스트 계정 정보 (개발용)
```
관리자: test2@test.com / Test1234! (ADMIN)
일반: test@test.com / Test1234! (USER)
```

## 서버 실행 방법 (매번 작업 시작 시)
```
[백엔드]
1. Docker Desktop 실행
2. cd C:\Users\KYW\projects\shopify-clone
3. docker compose up -d
4. cd backend
5. gradlew bootRun
→ http://localhost:8080/swagger-ui.html 로 확인

[프론트엔드]
1. cd C:\Users\KYW\projects\shopify-clone\frontend
2. npm run dev
→ http://localhost:3000 접속
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
13. **Next.js 16 Hydration Error** → Header.tsx에서 zustand 인증 상태가 SSR/CSR 불일치 → mounted state + useEffect로 클라이언트 마운트 후 인증 UI 렌더링
14. **ProductDetailClient.tsx TypeError** → group.optionValues가 undefined일 때 .map() 에러 → 옵셔널 체이닝 + ?? [] 폴백 처리
15. **쿠폰 관리 발급/총수량 미표시** → CouponResponse DTO에 totalQuantity, issuedQuantity 필드 누락 → 추가하여 해결
16. **장바구니 할인가 미적용** → CartItemResponse DTO에 discountRate 필드 누락 → 추가하여 해결
17. **같은 상품 다른 옵션 미분리** → 분리형 옵션 구조에서 마지막 optionValueId만 전송됨 → 조합형 옵션으로 구조 변경
18. **주문 생성 시 cartItemIds null** → 프론트에서 cartItemIds를 전송하지 않음 → 장바구니 데이터에서 id 추출하여 포함하도록 수정
19. **admin/products/new 페이지 404** → 파일이 git에 커밋된 적 없음 (유실) → 새로 생성

---

## 커뮤니케이션 참고사항
- 터미널 명령어는 **cmd 기준** (PowerShell 아님)
- 초보자 수준에 맞춰 **왜 이걸 하는지** 설명 포함
- 코드 작성은 **Claude Code**로 진행 (웹에서는 설계/방향 결정)
- Claude Code 백엔드: `cd C:\Users\KYW\projects\shopify-clone\backend` → `claude`
- Claude Code 프론트엔드: `cd C:\Users\KYW\projects\shopify-clone\frontend` → `claude`
- API 테스트는 curl 명령어로 진행 (Swagger Authorize 버튼 대신)
- 프론트엔드 디자인 참고 사이트: coolsis.kr, kaposhka.com, hieta.co.kr (미니멀 의류 쇼핑몰)
- 백엔드 확인 주소: http://localhost:8080/swagger-ui.html (http://localhost:8080 은 매핑 없음)
- Git 커밋은 의미 있는 작업 단위로, 용딱이가 직접 타이밍 결정
