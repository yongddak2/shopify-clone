# 쇼핑몰 포트폴리오 프로젝트 — 전체 컨텍스트 v9

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
- **OS**: Windows / **IDE**: IntelliJ IDEA / **JDK**: 17.0.12 / **Node.js**: v24.14.1
- **Docker Desktop**: v4.66.0 / **터미널**: cmd 기준 (PowerShell 아님)
- **Claude Code**: Cursor 루트 폴더에서 실행 (shopify-clone 루트). 도메인 크게 바뀔 때만 /clear.
- **개발 수준**: Spring Boot 입문. 초보자 기준으로 설명 필요.
- **디자인 참고**: coolsis.kr, kaposhka.com, hieta.co.kr

---

## 기술 스택 (확정)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4, React Query, zustand |
| Backend | Spring Boot 4.0.4, Java 17, Spring Security |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Storage | AWS S3 (버킷: yong-byeong-shop-images, 리전: ap-southeast-2) |
| Email | Gmail SMTP (happywe2931@gmail.com, 앱 비밀번호) |
| Search | Elasticsearch 8.13.0 (3단계 예정) |
| Messaging | Apache Kafka (Confluent 7.6.0) (3단계 예정) |
| Payment | 토스페이먼츠 API (테스트 키, API 개별 연동 키 사용) |
| Infra | Docker, GitHub Actions, Nginx |
| Monitoring | Prometheus, Grafana (3단계 예정) |
| API 문서 | SpringDoc OpenAPI 3.0.2 (Swagger UI) |

---

## 현재 진행 상황

### 완료 요약 (0402~0404)
헤더 리디자인, 다크 테마, 관리자 페이지(상품/주문/회원/쿠폰/배너), 카카오 우편번호, 토스 결제 연동, 할인가 표시, 조합형 옵션, 장바구니 선택결제, S3 이미지 업로드, 마이페이지 전체, 찜 하트 버튼, 리뷰 시스템 고도화, 검색 기능, 메인 페이지 API 연동, 배너 슬라이더, 비밀번호 변경, 쿠폰 실적용, 결제 완료 페이지, 주문 상태 한글화

### 완료 (0408) — 오늘 작업
1. ✅ **구매 확정 API**
   - Orders 엔티티 confirmedAt 필드 추가
   - POST /api/orders/{id}/confirm (본인/DELIVERED/중복 검증)
   - 프론트 localStorage → API 호출로 완전 교체
   - mypage/orders, mypage/reviews localStorage 코드 전부 제거

2. ✅ **회원가입 약관 동의 UI**
   - signup/page.tsx에 이용약관/개인정보/마케팅 3종 체크박스
   - 전체 동의 토글, 필수 미동의 시 가입 버튼 비활성화
   - 약관 내용 모달 (플레이스홀더, 추후 실제 내용 교체 예정)

3. ✅ **쿠폰 다운로드 UI**
   - GET /api/coupons 엔드포인트 추가 (isIssued 포함)
   - CouponListResponse.java 신규 (@JsonProperty("isIssued") 처리)
   - 마이페이지 쿠폰함 상단 다운로드 가능 쿠폰 섹션 추가
   - 버튼 3종: 다운로드 / 다운로드 완료 / 마감

4. ✅ **관리자 쿠폰 수정/삭제 + 누락 API 구현**
   - AdminCouponController.java, AdminCouponService.java 신규 생성
   - GET/POST/PATCH/DELETE /api/admin/coupons 전체 구현
   - 수정: name/totalQuantity/startDate/endDate (할인 타입·금액 제외)
   - 삭제: issuedQuantity > 0 시 차단
   - 프론트 인라인 수정 폼 + 삭제 확인 모달

5. ✅ **비밀번호 찾기 기능**
   - Gmail SMTP 연동 (spring-boot-starter-mail, @EnableAsync, @Async)
   - POST /api/auth/password-reset/send (이메일 검증 + 소셜 차단 + 6자리 코드 + Redis 3분)
   - POST /api/auth/password-reset/verify (코드 검증 + verified 키 10분 저장)
   - POST /api/auth/password-reset/reset (verified 확인 + 동일 비번 차단 + 변경)
   - 재발송 30초 쿨타임 (프론트 카운트다운 + 백엔드 Redis 이중 방어)
   - forgot-password/page.tsx 3단계 스텝 UI
   - login/page.tsx "비밀번호를 잊으셨나요?" 링크 추가

### 다음 작업
- **반품/교환 요청 API** ← 여기
- 소셜 로그인 (쇼핑몰 사업자 정보 확정 후)
- Race Condition 처리 (재고 비관적 락)
- 상품 옵션 수정 API
- 3단계 기능 (Elasticsearch, Kafka, Prometheus/Grafana, CI/CD)
- 배포

---

## DB 스키마 설계 — 18개 테이블

### Member 도메인
- **MEMBER**: id, email(UK), password, name, phone, role(USER/ADMIN), provider(LOCAL/KAKAO/GOOGLE), provider_id, password_changed_at, created_at, updated_at, deleted_at
- **MEMBER_ADDRESS**: id, member_id(FK), label, recipient, phone, zipcode, address, address_detail, is_default

### Product 도메인
- **CATEGORY**: id, parent_id(FK 자기참조), name, depth, sort_order
- **PRODUCT**: id, category_id(FK), name, description, base_price, discount_rate, sales_count, status(ACTIVE/SOLDOUT/INACTIVE), view_count, created_at, updated_at, deleted_at
- **PRODUCT_IMAGE**: id, product_id(FK), url, sort_order, is_thumbnail
- **PRODUCT_OPTION_GROUP**: id, product_id(FK), name (조합형: "옵션")
- **PRODUCT_OPTION_VALUE**: id, option_group_id(FK), value (조합형: "S-블랙"), additional_price, stock_quantity

### Order 도메인
- **CART_ITEM**: id, member_id(FK), product_id(FK), option_value_id(FK), quantity, created_at
- **ORDERS**: id, member_id(FK), member_coupon_id(FK, nullable), order_number(UK), total_amount, discount_amount, delivery_fee, final_amount, status, confirmed_at(nullable), recipient, phone, address, memo, created_at, updated_at
- **ORDER_ITEM**: id, order_id(FK), product_id(FK), option_value_id(FK), product_name_snapshot, option_info_snapshot, price_snapshot, quantity, subtotal
- **PAYMENT**: id, order_id(FK), payment_key(UK), method(CARD/TRANSFER/VIRTUAL), amount, status(READY/DONE/CANCELLED/FAILED), paid_at, cancelled_at, created_at

### 부가 도메인
- **REVIEW**: id, member_id(FK), product_id(FK), order_item_id(FK), rating, content, created_at, updated_at, deleted_at
- **REVIEW_IMAGE**: id, review_id(FK), url, sort_order
- **REVIEW_LIKE**: id, review_id(FK), member_id, created_at (review_id + member_id 유니크)
- **WISHLIST**: id, member_id(FK), product_id(FK), created_at
- **COUPON**: id, name, discount_type(FIXED/PERCENT), discount_value, min_order_amount, max_discount_amount, total_quantity, issued_quantity, start_date, end_date
- **MEMBER_COUPON**: id, member_id(FK), coupon_id(FK), used_at, expired_at, created_at
- **BANNER**: id, image_url, sort_order, is_active, link_url(nullable), created_at, updated_at

---

## API 설계 (전체)

### 인증 (Auth) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 → 토큰 발급 |
| POST | /api/auth/logout | 로그아웃 |
| POST | /api/auth/refresh | 액세스 토큰 재발급 |
| POST | /api/auth/password-reset/send | 비밀번호 찾기 인증번호 발송 |
| POST | /api/auth/password-reset/verify | 인증번호 확인 |
| POST | /api/auth/password-reset/reset | 비밀번호 재설정 |

### 회원 (Users) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/users/me | 내 정보 |
| PATCH | /api/users/me | 내 정보 수정 |
| PATCH | /api/users/me/password | 비밀번호 변경 (30일 제한) |
| DELETE | /api/users/me | 회원 탈퇴 |
| GET/POST/PATCH/DELETE | /api/users/me/addresses | 배송지 CRUD |

### 상품 (Products) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/products | 상품 목록 (판매량순 포함) |
| GET | /api/products/{id} | 상품 상세 |
| GET | /api/products/search | 검색 |
| GET | /api/categories | 카테고리 트리 |

### 장바구니 (Cart) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET/POST/PATCH/DELETE | /api/cart | 장바구니 CRUD |

### 주문 (Orders) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/orders | 내 주문 목록 |
| GET | /api/orders/{id} | 주문 상세 |
| POST | /api/orders | 주문 생성 |
| POST | /api/orders/{id}/cancel | 주문 취소 |
| POST | /api/orders/{id}/confirm | 구매 확정 |

### 결제 (Payment) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/payments/confirm | 결제 승인 |

### 리뷰 (Review) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/products/{productId}/reviews | 리뷰 목록 |
| GET | /api/reviews/me | 내 리뷰 목록 |
| POST | /api/reviews | 리뷰 작성 |
| POST | /api/reviews/images | 리뷰 이미지 업로드 |
| POST | /api/reviews/{reviewId}/like | 좋아요 토글 |
| DELETE | /api/reviews/{id} | 리뷰 삭제 |

### 찜 (Wishlist) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/wishlists | 찜 목록 |
| POST | /api/wishlists/{productId} | 찜 토글 |

### 쿠폰 (Coupon) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/coupons | 다운로드 가능 쿠폰 목록 (isIssued 포함) |
| GET | /api/coupons/me | 내 쿠폰 목록 |
| POST | /api/coupons/{couponId}/issue | 쿠폰 발급 |
| POST | /api/coupons/preview | 할인 미리보기 |

### 배너 (Banner) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/banners | 활성 배너 (공개) |

### 관리자 (Admin) ✅
| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET/POST/PATCH/DELETE | /api/admin/products | 상품 CRUD |
| POST/DELETE | /api/admin/images | S3 이미지 업로드/삭제 |
| GET | /api/admin/orders | 주문 조회 |
| PATCH | /api/admin/orders/{id}/status | 주문 상태 변경 |
| GET | /api/admin/users | 회원 목록 |
| GET/POST/PATCH/DELETE | /api/admin/coupons | 쿠폰 전체 CRUD |
| GET/POST/PUT/PATCH/DELETE | /api/admin/banners | 배너 CRUD |

---

## 주요 비즈니스 로직

1. **재고**: 주문 시 차감, 취소 시 복구. 비관적 락 미적용.
2. **배송비**: 50,000원 이상 무료, 미만 3,000원
3. **주문 취소**: PENDING, PAID에서만 가능
4. **구매 확정**: DELIVERED 상태에서만 가능, 중복 확정 불가, confirmedAt 저장
5. **결제 흐름**: 주문 생성 → 토스 requestPayment() → /payment/success → confirm API → 토스 승인 → 쿠폰 사용처리
6. **리뷰**: DELIVERED + 구매확정(confirmedAt != null) 후 작성 가능
7. **리뷰 좋아요**: 토글, ReviewLike 테이블
8. **쿠폰 실적용**: 검증 → 할인 계산 → finalAmount → PAID 시 markUsed() → 취소 시 미만료 복원
9. **판매량**: PAID 시 increase, 취소/환불 시 decrease
10. **배너**: 최대 5개, sortOrder, 활성/비활성
11. **비밀번호 변경**: 30일 제한, 8자+영문+숫자+특수문자, 소셜 로그인 차단
12. **비밀번호 찾기**: Gmail SMTP → Redis 인증번호 3분 → verified 키 10분 → 재설정. 재발송 30초 쿨타임 이중 방어.
13. **쿠폰 다운로드**: GET /api/coupons에서 isIssued로 발급 여부 구분
14. **관리자 쿠폰 수정**: name/totalQuantity/startDate/endDate만 가능. totalQuantity < issuedQuantity 불가.
15. **관리자 쿠폰 삭제**: issuedQuantity > 0 시 차단
16. **검색**: LIKE, 카테고리 하위 포함, 가격 범위, 5종 정렬
17. **조합형 옵션**: 사이즈×색상 → 하나의 optionGroup("옵션")
18. **이미지 업로드**: S3 경로 분리 (products/, reviews/, banners/), UUID+확장자, 5MB

---

## 코드 패턴 (전 도메인 공통)

- `Authentication` + `(Long) authentication.getPrincipal()` → memberId
- `@RequiredArgsConstructor` + 생성자 주입
- 클래스 `@Transactional(readOnly = true)` + 쓰기 메서드 `@Transactional`
- `BusinessException(ErrorCode.XXX)`
- `ApiResponse.success(data)` + `ResponseEntity`
- POST 201, DELETE 204
- DTO `from()` 정적 팩토리, 엔티티 `@Builder`
- `@EntityGraph` fetch join
- 이메일 발송: `@Async` (BackendApplication에 `@EnableAsync`)

---

## 알려진 이슈 및 해결 예정

1. Race Condition: 비관적 락 미적용
2. 프론트엔드 디자인: 관리자 요구사항 대기 중
3. 레거시 옵션 상품: 삭제 후 조합형 재등록 필요
4. 결제위젯 전환: 사업자등록 후 프론트만 수정
5. 소셜 로그인: 쇼핑몰 사업자 정보 확정 후 (카카오 앱 이름/회사명 필요)
6. 백엔드 상품 옵션 수정: PATCH API 미지원
7. 토스 환불 API: 미연동
8. 반품/교환 API: 백엔드 미구현 (버튼만 존재)
9. 이용약관 실제 내용: 사업자 정보 확정 후 플레이스홀더 교체 필요
10. 라이트 테마: 나중에

### 나중에 추가할 편의 기능 (출시 후)
신규 가입 자동 쿠폰, 최근 본 상품, 상품 문의(Q&A), 1:1 문의, 공지사항/FAQ, 회원 등급/적립금, 재입고 알림, 주문 상태 알림(Kafka), 배송 추적, 관리자 통계, 엑셀 다운로드, 이벤트 페이지, 이메일 마케팅

---

## 해결한 이슈 기록

40. isIssued boolean 직렬화 → @JsonProperty("isIssued") 명시
41. AdminCouponController 미존재 → 신규 생성 (기존 CouponService.createCoupon 이동)
42. 구매 확정 localStorage → confirmedAt API 기반으로 교체
43. 비밀번호 찾기 재발송 연타 방지 → 프론트 30초 쿨타임 + 백엔드 Redis 이중 방어

(1~39번: v7/v8에 기록)

---

## 테스트 계정
```
관리자: test2@test.com / rladyddn00! (ADMIN)
일반: test@test.com / Test1234! (USER)
```

## 서버 실행 방법
```
[백엔드]
1. Docker Desktop 실행
2. cd C:\Users\KYW\projects\shopify-clone
3. docker compose up -d
4. cd backend
5. gradlew bootRun
→ http://localhost:8080/swagger-ui.html

[프론트엔드]
1. cd C:\Users\KYW\projects\shopify-clone\frontend
2. npm run dev
→ http://localhost:3000
```
