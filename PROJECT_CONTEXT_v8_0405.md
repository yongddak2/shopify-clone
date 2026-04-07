# 쇼핑몰 포트폴리오 프로젝트 — 전체 컨텍스트 v8

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
- **Claude Code**: 설치됨. 연속 작업 시 /clear 없이 프롬프트만 이어서 입력. 도메인 크게 바뀔 때만 /clear.
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
| Search | Elasticsearch 8.13.0 (3단계 예정) |
| Messaging | Apache Kafka (Confluent 7.6.0) (3단계 예정) |
| Payment | 토스페이먼츠 API (테스트 키, API 개별 연동 키 사용) |
| Infra | Docker, GitHub Actions, Nginx |
| Monitoring | Prometheus, Grafana (3단계 예정) |
| API 문서 | SpringDoc OpenAPI 3.0.2 (Swagger UI) |

---

## 현재 진행 상황

### 완료 요약 (0402~0404 오전)
헤더 리디자인, 다크 테마, 관리자 페이지(상품/주문/회원/쿠폰), 카카오 우편번호, 토스 결제 연동, 할인가 표시, 조합형 옵션, 장바구니 선택결제, S3 이미지 업로드, 마이페이지 전체(주문내역/배송지/찜/쿠폰함/리뷰관리/프로필), 찜 하트 버튼, GitHub 업로드

### 완료 (0404 오후~야간) — 이번 대화에서 작업
1. ✅ **리뷰 시스템 고도화**: 좋아요 토글(ReviewLike), 이미지 업로드(S3 reviews/, 최대 10장), 리뷰 목록 정렬/페이지네이션(latest/rating_high/rating_low/likes), GET /api/reviews/me, 마이페이지 리뷰 모달 방식 변경, 별점 필수, 수정/삭제
2. ✅ **검색 기능**: GET /api/products/search(키워드/카테고리/가격/정렬), /search 페이지, 헤더 검색바 연결
3. ✅ **메인 페이지 API 연동**: 하드코딩→실제 API(NEW ARRIVALS/BEST), Product.salesCount + 판매량순 정렬
4. ✅ **배너 슬라이더 + 관리자 배너 관리**: Banner 엔티티, CRUD API, 공개 GET /api/banners, fade 트랜지션, 최대 5개, 활성/비활성 토글
5. ✅ **비밀번호 변경**: PATCH /api/users/me/password, 30일 제한(passwordChangedAt), 비밀번호 조건 통일, 소셜 로그인 차단, 실시간 유효성 표시
6. ✅ **쿠폰 실적용**: Orders.memberCoupon FK, 주문 시 할인 적용(검증+계산+finalAmount), PAID 시 markUsed(), 취소 시 미만료 쿠폰 복원, 주문 페이지 쿠폰 선택 UI
7. ✅ **결제 완료 페이지**: 주문번호/금액 표시, "쇼핑 계속하기"/"주문 상세 보기" 버튼, 장바구니 정리
8. ✅ **주문 상태 한글화**: 마이페이지 색상 통일, 관리자 색상 유지
9. ✅ **기타**: 로그아웃→메인 이동, 전화번호 하이픈 포맷팅, 관리자 테이블 가로 스크롤, PaymentConfirmRequest orderId→orderNumber 변경

### 다음 작업
19. **구매 확정 API** ← 여기
20. 소셜 로그인 (카카오/구글)
21. 이용약관 + 회원가입 약관 동의 (법적 필수)
22. 3단계 기능 (Elasticsearch, Kafka, Prometheus/Grafana, CI/CD)
23. 배포

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
- **ORDERS**: id, member_id(FK), member_coupon_id(FK, nullable), order_number(UK), total_amount, discount_amount, delivery_fee, final_amount, status, recipient, phone, address, memo, created_at, updated_at
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
| POST | /api/auth/signup | 회원가입 (비밀번호 조건 통일) |
| POST | /api/auth/login | 로그인 → 토큰 발급 |
| POST | /api/auth/logout | 로그아웃 |
| POST | /api/auth/refresh | 액세스 토큰 재발급 |

### 회원 (Users) ✅
| GET | /api/users/me | 내 정보 (passwordChangedAt 포함) |
| PATCH | /api/users/me | 내 정보 수정 |
| PATCH | /api/users/me/password | 비밀번호 변경 (30일 제한) |
| DELETE | /api/users/me | 회원 탈퇴 |
| GET/POST/PATCH/DELETE | /api/users/me/addresses | 배송지 CRUD |

### 상품 (Products) ✅
| GET | /api/products | 상품 목록 (판매량순 포함) |
| GET | /api/products/{id} | 상품 상세 |
| GET | /api/products/search | 검색 (키워드/카테고리/가격/정렬 5종) |
| GET | /api/categories | 카테고리 트리 |

### 장바구니 (Cart) ✅
| GET/POST/PATCH/DELETE | /api/cart | 장바구니 CRUD |

### 주문 (Orders) ✅
| GET | /api/orders | 내 주문 목록 |
| GET | /api/orders/{id} | 주문 상세 (couponName, couponDiscountAmount 포함) |
| POST | /api/orders | 주문 생성 (memberCouponId 지원) |
| POST | /api/orders/{id}/cancel | 주문 취소 (쿠폰 복원) |

### 결제 (Payment) ✅
| POST | /api/payments/confirm | 결제 승인 (orderNumber 기반, 쿠폰 사용처리) |

### 리뷰 (Review) ✅
| GET | /api/products/{productId}/reviews | 리뷰 목록 (정렬/페이지네이션/좋아요) |
| GET | /api/reviews/me | 내 리뷰 목록 |
| POST | /api/reviews | 리뷰 작성 (이미지 URL 포함) |
| POST | /api/reviews/images | 리뷰 이미지 업로드 (S3 reviews/) |
| POST | /api/reviews/{reviewId}/like | 좋아요 토글 |
| DELETE | /api/reviews/{id} | 리뷰 삭제 (소프트) |

### 찜 (Wishlist) ✅
| GET | /api/wishlists | 찜 목록 |
| POST | /api/wishlists/{productId} | 찜 토글 |

### 쿠폰 (Coupon) ✅
| GET | /api/coupons/me | 내 쿠폰 전체 (usedAt 포함) |
| POST | /api/coupons/{couponId}/issue | 쿠폰 발급 |
| POST | /api/coupons/preview | 할인 미리보기 |

### 배너 (Banner) ✅
| GET | /api/banners | 활성 배너 (공개) |

### 관리자 (Admin) ✅
| 상품 | GET/POST/PATCH/DELETE /api/admin/products | 상품 CRUD (옵션 수정 미지원) |
| 이미지 | POST/DELETE /api/admin/images | S3 이미지 업로드/삭제 |
| 주문 | GET /api/admin/orders, PATCH .../status | 주문 조회/상태 변경 (쿠폰 복원) |
| 회원 | GET /api/admin/users | 회원 목록 |
| 쿠폰 | GET/POST /api/admin/coupons | 쿠폰 목록/생성 |
| 배너 | GET/POST/PUT/PATCH/DELETE /api/admin/banners | 배너 CRUD (최대 5개, 순서/토글) |

---

## 주요 비즈니스 로직

1. **재고**: 주문 시 차감, 취소 시 복구. 비관적 락 미적용.
2. **배송비**: 50,000원 이상 무료, 미만 3,000원
3. **주문 취소**: PENDING, PAID에서만 가능
4. **결제 흐름**: 주문 생성 → 토스 requestPayment() → /payment/success → confirm API (orderNumber 기반) → 토스 승인 → 쿠폰 사용처리 → 완료 UI
5. **리뷰**: DELIVERED + 구매확정 후 작성. 상품당 1회. 소프트 삭제. 삭제 후 재작성 가능 (deleted_at IS NULL).
6. **리뷰 좋아요**: 토글, ReviewLike 테이블. 리뷰 이미지 S3 reviews/ 최대 10장.
7. **쿠폰 실적용**: 검증(소유권/사용/만료/최소금액) → 할인 계산 → finalAmount → PAID 시 markUsed() + save() → 취소 시 미만료 복원
8. **판매량**: Product.salesCount. PAID 시 increase, 취소/환불 시 decrease (0 미만 방지)
9. **배너**: 최대 5개, sortOrder, 활성/비활성, S3 삭제 연동
10. **비밀번호 변경**: 30일 제한, 조건 통일 (8자+영문+숫자+특수문자), 소셜 로그인 차단
11. **검색**: LIKE (대소문자 무시), 카테고리 하위 포함, 가격 범위, 5종 정렬
12. **조합형 옵션**: 사이즈×색상 → 하나의 optionGroup("옵션")
13. **할인가 계산**: basePrice × (1 - discountRate / 100) + additionalPrice
14. **이미지 업로드**: S3 경로 분리 (products/, reviews/, banners/), UUID+확장자, 5MB
15. **썸네일**: isThumbnail=true 우선, sortOrder 최소값 fallback

---

## 코드 패턴 (전 도메인 공통)

- `Authentication` + `(Long) authentication.getPrincipal()` → memberId
- `@RequiredArgsConstructor` + 생성자 주입
- 클래스 `@Transactional(readOnly = true)` + 쓰기 메서드 `@Transactional`
- `BusinessException(ErrorCode.XXX)` + 커스텀 메시지 생성자
- `ApiResponse.success(data)` + `ResponseEntity`
- POST 201, DELETE 204
- DTO `from()` 정적 팩토리, 엔티티 `@Builder`
- `@EntityGraph` fetch join (images, memberCoupon 등)

---

## 알려진 이슈 및 해결 예정

1. Race Condition: 비관적 락 미적용
2. 프론트엔드 디자인: 관리자 요구사항 대기 중
3. 레거시 옵션 상품: 삭제 후 조합형 재등록 필요
4. 결제위젯 전환: 사업자등록 후 프론트만 수정
5. 소셜 로그인: 카카오/구글 API 키 발급 후
6. 백엔드 상품 옵션 수정: PATCH API 미지원
7. 토스 환불 API: 미연동
8. 구매 확정 API: 백엔드 미구현 (프론트 localStorage)
9. 반품/교환 API: 백엔드 미구현
10. 이용약관/개인정보처리방침: 법적 필수, 미구현
11. 비밀번호 찾기: 이메일 인증 필요, 미구현
12. 라이트 테마: 나중에

### 나중에 추가할 편의 기능 (출시 후)
쿠폰 다운로드 UI, 신규 가입 자동 쿠폰, 쿠폰 복원 알림, 최근 본 상품, 상품 문의(Q&A), 1:1 문의, 공지사항/FAQ, 회원 등급/적립금, 재입고 알림, 주문 상태 알림, 배송 추적, 관리자 통계, 엑셀 다운로드, 재고 부족 알림, 이벤트 페이지, 이메일 마케팅

---

## 해결한 이슈 기록 (최근)
27. 리뷰 이미지 미표시 → Review.imageUrls → Review.images 필드명 통일
28. 리뷰 정렬 파라미터 불일치 → ratingDesc→rating_high 등
29. 리뷰 수정 중복 체크 → existsByMemberIdAndOrderItemIdAndDeletedAtIsNull
30. GET /api/reviews/me 미존재 → 엔드포인트 추가
31. sales_count 컬럼 없음 → ALTER TABLE 수동 추가
32. 배너 슬라이더 연타 → isTransitioning 잠금
33. 배너 루프 → CSS transform → fade 전면 재작성
34. 로그아웃 무한 로딩 → window.location.href = "/"
35. 비밀번호 조건 불일치 → PASSWORD_PATTERN 통일
36. PaymentConfirmRequest → orderId(Long) → orderNumber(String)
37. 쿠폰 사용처리 미반영 → memberCouponRepository.save() 명시적 호출
38. getMyCoupons 필터 → findByMemberId 전체 반환
39. 결제 후 장바구니 리다이렉트 → invalidateQueries 시점 이동

(1~26번: v7에 기록. 주요 항목 — PowerShell→cmd, Docker wsl --update, SpringDoc 충돌, isDefault 직렬화, Hydration→mounted, 조합형 옵션, S3 키, @EntityGraph 추가, priceSnapshot 할인가 반영)

---

## 테스트 계정
```
관리자: test2@test.com / rladyddn00! (ADMIN)
일반: test@test.com / Test1234! (USER)
```
