# API Reference

PanTrKa 전체 REST API 목록. 공통 응답은 `ApiResponse` (`{success, message, data}`).

> 인증 실패 401 / 권한 부족 403 / 비즈니스 예외 / 검증 실패 모두 동일 포맷.

---

## Auth

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/signup | 회원가입 (성공 시 활성 웰컴 쿠폰 자동 발급 — 내부 처리) |
| POST | /api/auth/login | 로그인 → 토큰 발급 |
| POST | /api/auth/logout | 로그아웃 |
| POST | /api/auth/refresh | 액세스 토큰 재발급 (body: `{refreshToken}`) |
| POST | /api/auth/password-reset/send | 비밀번호 찾기 인증번호 발송 |
| POST | /api/auth/password-reset/verify | 인증번호 확인 |
| POST | /api/auth/password-reset/reset | 비밀번호 재설정 |

## Users

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/users/me | 내 정보 (passwordChangedAt 포함) |
| PATCH | /api/users/me | 내 정보 수정 |
| PATCH | /api/users/me/password | 비밀번호 변경 (30일 제한) |
| DELETE | /api/users/me | 회원 탈퇴 |
| GET | /api/users/me/addresses | 배송지 목록 |
| POST | /api/users/me/addresses | 배송지 추가 |
| PATCH | /api/users/me/addresses/{id} | 배송지 수정 |
| DELETE | /api/users/me/addresses/{id} | 배송지 삭제 |

## Products

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/products | 상품 목록 (필터/정렬/페이지, 판매량순 포함) |
| GET | /api/products/{id} | 상품 상세 (optionGroups, images 포함) |
| GET | /api/products/search | 검색 (키워드/카테고리/가격/정렬 5종) |
| GET | /api/categories | 카테고리 트리 |

## Cart

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/cart | 장바구니 조회 (stockQuantity, discountRate 포함) |
| POST | /api/cart | 장바구니 담기 |
| PATCH | /api/cart/{id} | 수량 변경 |
| DELETE | /api/cart/{id} | 항목 삭제 |

## Orders

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/orders | 내 주문 목록 |
| GET | /api/orders/{id} | 주문 상세 (couponName, couponDiscountAmount, returnRequested, exchangeRequested, confirmedAt 포함) |
| POST | /api/orders | 주문 생성 (memberCouponId 포함 가능) |
| POST | /api/orders/{id}/cancel | 주문 취소 (PENDING/PAID만 가능) |
| POST | /api/orders/{id}/confirm | 구매 확정 (DELIVERED만 가능) |
| POST | /api/orders/{orderId}/return-exchange | 반품/교환 신청 |
| GET | /api/orders/{orderId}/return-exchange | 반품/교환 내역 조회 |

> 주문 상태 전환 시 자동 이메일 발송 (내부 처리, 별도 API 없음): PAID(결제 완료) / SHIPPED(관리자 변경) / CANCELLED(관리자 취소만)

## Payment

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/payments/confirm | 결제 승인 (orderNumber 기반, 토스페이먼츠 연동) |

## Review

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/products/{productId}/reviews | 상품 리뷰 목록 (정렬/페이지네이션) |
| GET | /api/reviews/me | 내 리뷰 목록 |
| POST | /api/reviews | 리뷰 작성 (imageUrls 배열 포함 가능) |
| POST | /api/reviews/images | 리뷰 이미지 업로드 (S3, 최대 10장) |
| POST | /api/reviews/{id}/like | 좋아요 토글 |
| DELETE | /api/reviews/{id} | 리뷰 삭제 (소프트) |

## Wishlist

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/wishlists | 찜 목록 |
| POST | /api/wishlists/{productId} | 찜 토글 (추가/해제) |

## Coupon

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/coupons | 다운로드 가능 쿠폰 목록 (isIssued 포함) |
| GET | /api/coupons/me | 내 쿠폰 목록 (usedAt, expiredAt 포함) |
| POST | /api/coupons/{couponId}/issue | 쿠폰 발급 |
| POST | /api/coupons/preview | 쿠폰 할인 미리보기 |

## Banner

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/banners | 활성 배너 목록 (공개) |

## Main Page Config (메인 페이지 설정)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/main-page-config | 메인 텍스트 조회 (공개) |
| GET | /api/main-page/new-arrivals | 메인 NEW ARRIVALS 큐레이션 상품 목록 (공개, 비활성·삭제 자동 필터링) |

## Return/Exchange Images

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/return-requests/images | 반품/교환 이미지 업로드 (S3, 최대 3장, 20MB) |

---

## Admin

### Admin — 상품/이미지/재고

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/admin/products | 상품 전체 목록 |
| GET | /api/admin/products/{id} | 상품 단건 (옵션/이미지 포함) |
| POST | /api/admin/products | 상품 등록 |
| PATCH | /api/admin/products/{id} | 상품 수정 (⚠️ 옵션 수정 미지원) |
| DELETE | /api/admin/products/{id} | 상품 삭제 |
| POST | /api/admin/images | S3 이미지 업로드 → URL 반환 |
| DELETE | /api/admin/images | S3 이미지 삭제 |
| GET | /api/admin/inventory | 전체 옵션 재고 목록 (flat) |
| PATCH | /api/admin/inventory/{optionValueId} | 재고 단건 수정 |

### Admin — 대시보드

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/admin/dashboard | 대시보드 통계 (카드 6개 + 차트 + 인기상품 + 재고부족 + 최근주문) |

### Admin — 주문/회원/쿠폰/배너/반품교환

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/admin/orders | 주문 조회 (status·startDate·endDate·searchType·keyword 필터 지원) |
| PATCH | /api/admin/orders/{id}/status | 주문 상태 변경 (SHIPPED 시 carrier/trackingNumber 필수) |
| GET | /api/admin/users | 회원 목록 (filter=newThisMonth 지원) |
| GET | /api/admin/users/{id} | 회원 상세 (통계 + 최근주문 + 배송지) |
| PATCH | /api/admin/users/{id}/role | 회원 권한 변경 (본인 변경 차단) |
| PATCH | /api/admin/users/{id}/memo | 관리자 메모 수정 (500자) |
| DELETE | /api/admin/users/{id} | 회원 강제 탈퇴 (소프트 딜리트, 본인 차단) |
| GET | /api/admin/coupons | 쿠폰 목록 |
| POST | /api/admin/coupons | 쿠폰 생성 |
| PATCH | /api/admin/coupons/{id} | 쿠폰 수정 (name / totalQuantity / 날짜 / isWelcome / validDays) |
| DELETE | /api/admin/coupons/{id} | 쿠폰 삭제 (issuedQuantity > 0 시 차단) |
| GET | /api/admin/banners | 배너 목록 |
| POST | /api/admin/banners | 배너 추가 (최대 5개) |
| PUT | /api/admin/banners/{id} | 배너 수정 |
| PATCH | /api/admin/banners/{id} | 배너 순서/활성화 토글 |
| DELETE | /api/admin/banners/{id} | 배너 삭제 (S3 연동) |
| GET | /api/admin/main-page-config | 메인 페이지 텍스트 조회 |
| PUT | /api/admin/main-page-config | 메인 페이지 텍스트 갱신 |
| GET | /api/admin/main-page/new-arrivals | NEW ARRIVALS 큐레이션 목록 |
| POST | /api/admin/main-page/new-arrivals | NEW ARRIVALS 일괄 추가 (최대 10개, 중복 차단) |
| PUT | /api/admin/main-page/new-arrivals | NEW ARRIVALS 전체 교체 (productIds 순서대로) |
| PUT | /api/admin/main-page/new-arrivals/order | NEW ARRIVALS 순서 재정렬 (orderedIds) |
| PATCH | /api/admin/main-page/new-arrivals/{id}/move | NEW ARRIVALS 단일 항목 이동 (UP/DOWN) |
| DELETE | /api/admin/main-page/new-arrivals/{id} | NEW ARRIVALS 단일 항목 제거 |
| GET | /api/admin/requests | 반품/교환 목록 (5탭) |
| PATCH | /api/admin/requests/{id}/approve | 반품/교환 승인 |
| PATCH | /api/admin/requests/{id}/reject | 반품/교환 거절 |
| PATCH | /api/admin/requests/{id}/complete | 반품/교환 처리완료 |
