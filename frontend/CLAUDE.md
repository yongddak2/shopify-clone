# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Shopify Clone frontend — 의류 쇼핑몰 프론트엔드. Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4.
백엔드(Spring Boot, localhost:8080)와 통신.

## Commands

```bash
npm run dev      # 개발 서버 (포트 3000)
npm run build    # 프로덕션 빌드
```

## Tech Stack

- Next.js 16.2.1 + React 19 + TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` 방식)
- React Query (서버 상태), zustand + persist (인증 상태)
- axios (API 호출, 토큰 인터셉터, 401 자동 재발급)
- lucide-react (아이콘)

## Architecture

```
src/
├── app/                    # 페이지 (Next.js App Router)
│   ├── layout.tsx          # 루트 레이아웃 (Header/Footer/Providers)
│   ├── page.tsx            # 메인 (배너 슬라이더 + NEW ARRIVALS + BEST)
│   ├── login/, signup/     # 인증 페이지
│   ├── products/           # 상품 목록 + 상품 상세 (리뷰 섹션 포함)
│   ├── search/             # 검색 결과 페이지 (키워드/카테고리/가격 필터)
│   ├── cart/, order/, orders/  # 장바구니, 주문, 주문내역
│   ├── payment/            # 결제 성공/실패 페이지
│   ├── mypage/             # 마이페이지 (사이드메뉴 + 대시보드 레이아웃)
│   │   ├── layout.tsx      # 사이드메뉴(200px) + 대시보드 카드(배송중/배송완료/쿠폰/찜) + 모바일 탭
│   │   ├── page.tsx        # /mypage → /mypage/orders 리다이렉트
│   │   ├── orders/         # 주문내역 (5탭: 전체/주문결제/배송중/배송완료/취소환불 + 기간필터 + 액션버튼)
│   │   ├── addresses/      # 배송지 관리 (인라인 수정, 10개 제한, 카카오 주소 API)
│   │   ├── wishlist/       # 찜 목록 (하트 토글, 장바구니 담기)
│   │   ├── coupons/        # 쿠폰함 (3탭: 사용가능/사용완료/만료)
│   │   ├── reviews/        # 리뷰 관리 (모달 방식 작성/수정/삭제, 사진 S3 업로드, 별점 필수)
│   │   └── profile/        # 회원정보 수정 + 비밀번호 변경 + 회원 탈퇴
│   └── admin/              # 관리자 페이지 (별도 레이아웃)
│       ├── layout.tsx      # 사이드바 + 권한 체크 (ADMIN only)
│       ├── page.tsx        # 대시보드
│       ├── products/       # 상품 관리 (등록/수정/삭제, S3 이미지 업로드)
│       ├── orders/         # 주문 관리 (상태 변경, 한글 상태 뱃지)
│       ├── users/          # 회원 관리 (읽기 전용)
│       ├── coupons/        # 쿠폰 관리 (생성)
│       └── banners/        # 배너 관리 (등록/삭제/순서변경, S3 이미지 업로드)
├── components/
│   ├── layout/             # Header, Footer
│   └── common/             # Button 등 공통 컴포넌트
├── lib/                    # API 호출 (api.ts, auth.ts, product.ts, cart.ts, order.ts, user.ts, admin.ts, wishlist.ts, coupon.ts, review.ts, payment.ts)
├── stores/authStore.ts     # zustand 인증 스토어
└── types/index.ts          # 공통 타입
```

## Design & Theme

- 전체 다크 테마 (차콜): CSS 변수 기반 (globals.css)
- 배경: #2a2a2a (페이지), #1e1e1e (헤더/푸터)
- 헤더: 햄버거 사이드바(왼쪽 슬라이드) + 중앙 로고 + 검색바(연결 완료) + 로그인/로그아웃 + 쇼핑백 + 마이페이지
- 비로그인 시에도 쇼핑백/마이페이지 아이콘 표시 (클릭 → /login)
- 마이페이지(👤) 아이콘 → /mypage로 이동
- 로그아웃: 확인 모달 후 실행 → window.location.href = "/" 로 메인 이동
- 관리자 페이지: 240px 사이드바 + 콘텐츠, 일반 Header/Footer 미사용
- 관리자 테이블: overflow-x-auto + min-w 설정으로 가로 스크롤 처리

## Code Patterns

- SSR Hydration 방지: mounted state 패턴 (`useState(false)` + `useEffect`)
- 인증 보호: 비로그인 → /login 리다이렉트, 관리자 → role 체크
- 에러 표시: alert() 대신 빨간 텍스트 (버튼 위 공간 미리 확보)
- 가격: 할인 적용 시 `Math.round(basePrice * (1 - discountRate / 100)) + additionalPrice`, 천단위 콤마
- 장바구니: productId 기준 그룹핑, 옵션별 수량 조절, 최근 담은 순 정렬, 체크박스 선택 결제
- 폼 유효성: noValidate + 커스텀 검증 + 빨간 텍스트
- 전화번호: 숫자만 입력 + 자동 하이픈 포맷팅 (010-1234-5678), 전송 시 하이픈 제거
- 주문 상태 한글화: 프론트에서 STATUS_LABELS 매핑 (백엔드 영문 그대로 유지)
  - 마이페이지: 색상 구분 없이 통일 스타일
  - 관리자: 색상 뱃지 유지 + 한글

## Product Options (상품 옵션)

- 사이즈: S, M, L, XL, XXL, FREE (체크박스)
- 색상: 블랙, 화이트, 네이비, 그레이, 베이지 + 커스텀 색상 추가 가능
- 선택 시 조합별 재고 수량 입력 테이블 자동 생성
- **조합형 옵션**: 등록 시 사이즈×색상 조합을 하나의 optionGroup("옵션")으로 전송 (예: "S-블랙", "M-블랙")
  - 상품 상세에서 조합값이 하나의 그룹에 버튼으로 나열, 선택 시 해당 optionValueId가 장바구니로 전송
  - 기존 분리형 옵션(사이즈/색상 별도 그룹)으로 등록된 레거시 상품도 하위 호환 유지
- 수정 모달: 기존 옵션 읽기 전용 (백엔드 PATCH 옵션 수정 미지원)

## Key API Response Differences

- 장바구니: basePrice + additionalPrice + discountRate (프론트에서 할인 계산 후 합산)
- 상품 옵션: 백엔드 `values` 키 사용 (프론트 타입도 `values`)
- 소프트 삭제: deletedAt이 null인 것만 목록 표시
- 쿠폰: CouponResponse에 totalQuantity, issuedQuantity 포함
- 상품 목록: 백엔드 ProductSummaryResponse는 `thumbnailUrl: string` 반환 (images 배열 아님)
- 주문 상품: OrderItemResponse에 `productId`, `thumbnailUrl` 포함
- 주문 응답: OrderResponse에 `couponName`, `couponDiscountAmount` 포함

## Additional Types (types/index.ts)

- `Product.thumbnailUrl: string | null` — 상품 목록 API용 (상세는 images 배열)
- `OrderRequest.memberCouponId: number | null` — 쿠폰 적용 주문
- `OrderResponse.couponName: string | null`, `couponDiscountAmount: number | null`
- `OrderItemResponse.productId: number`, `thumbnailUrl: string | null`
- `WishlistItem` — id, productId, productName, productPrice, thumbnailUrl, createdAt
- `MemberCoupon` — id, couponId, couponName, discountType, discountValue, minOrderAmount, maxDiscountAmount, usedAt, expiredAt, usable
- `User.passwordChangedAt: string | null`
- `Review` — id, memberName, rating, content, images, likeCount, liked, createdAt

## Image Upload (S3)

- 관리자 상품 등록: S3 파일 업로드
- `lib/admin.ts`: `uploadProductImage(file)` (POST /api/admin/images, FormData), `deleteProductImage(imageUrl)` (DELETE /api/admin/images)
- 프론트 유효성: 확장자(jpg/jpeg/png/gif/webp), 5MB 제한, 최대 5장
- 리뷰 이미지: S3 업로드, 최대 10장

## Search (검색)

- 헤더 검색바 → /search?keyword=xxx 이동
- 검색 결과 페이지: 키워드/카테고리/가격 범위 필터, 상품 그리드 표시
- `lib/product.ts`: `searchProducts(params)` (GET /api/products/search)

## Review (리뷰)

- 상품 상세 리뷰 섹션 (ReviewSection.tsx): 페이지네이션, 정렬(최신/높은별점/낮은별점), 좋아요 토글, 이미지 모달
- 마이페이지 리뷰 관리: 모달 방식 작성/수정/삭제, 별점 필수, 사진 S3 첨부
- 구매확정 연동: confirmedOrderIds에 포함된 주문만 리뷰 작성 가능
- `lib/review.ts`: getProductReviews, createReview, updateReview, deleteReview, toggleReviewLike, getMyReviews

## Wishlist (찜)

- `lib/wishlist.ts`: `getWishlists()` (GET /api/wishlists), `toggleWishlist(productId)` (POST /api/wishlists/{productId})
- 상품 목록(products/page.tsx): 각 상품 이미지 우하단에 하트 버튼 (로그인 시 찜 여부 표시, 비로그인 시 alert → /login)
- 상품 상세(ProductDetailClient.tsx): 상품명 옆 하트 버튼 토글
- 마이페이지 찜 목록: 그리드 카드 + 하트 해제 + 장바구니 담기(→상품 상세 이동)

## Coupon (쿠폰)

- 마이페이지 쿠폰함: 3탭 (사용가능/사용완료/만료), usedAt 기반 필터링
- 주문 페이지 쿠폰 적용: 드롭다운 select로 사용 가능한 쿠폰 선택, 할인 금액 프론트 미리 계산 (FIXED/PERCENT)
- 주문 생성 시 memberCouponId 전달, 결제 확인 시 백엔드에서 markUsed() + 명시적 save()
- `lib/coupon.ts`: `getMyCoupons()` (GET /api/coupons/me) — 전체 쿠폰 반환 (사용완료 포함)

## Purchase Confirmation (구매확정)

- 백엔드 API 없음 — localStorage `confirmedOrderIds` 배열로 프론트 관리
- 주문내역: DELIVERED 상태에서 구매확정 전/후 버튼 분기
- 리뷰 관리: confirmedOrderIds에 포함된 주문만 리뷰 작성 가능

## Password Change (비밀번호 변경)

- PATCH /api/users/me/password (currentPassword, newPassword, newPasswordConfirm)
- 유효성: 8자 이상 + 영문 + 숫자 + 특수문자 (프론트/백엔드 동일 정규식)
- 실시간 조건 표시 (8자/영문/숫자/특수문자 각각 체크), 확인 일치 실시간 표시
- 30일 제한: Member.passwordChangedAt 기반, 30일 이내 재변경 시 예외
- 마지막 변경일 표시, 눈 아이콘 tabIndex={-1} (Tab 포커스 제외)

## Payment (결제)

- 토스페이먼츠 API 개별 연동 (SDK: `https://js.tosspayments.com/v1/payment`)
- 클라이언트 키: 환경변수 `NEXT_PUBLIC_TOSS_CLIENT_KEY` (기본값: 테스트 키)
- 흐름: 주문 생성(POST /api/orders) → 토스 결제창(리다이렉트 방식) → 성공 시 /payment/success → POST /api/payments/confirm (orderNumber로 조회) → 결제 완료 UI
- 결제 완료 페이지: 주문번호/결제금액 표시, "쇼핑 계속하기"/"주문 상세 보기" 버튼, 장바구니 캐시 무효화 + sessionStorage 정리
- 실패 시 /payment/fail 페이지 표시
- 주소 입력: 카카오 우편번호 API (Daum Postcode) 연동 완료
- **주의**: 장바구니 캐시 무효화(invalidateQueries["cart"])는 반드시 payment/success에서만 실행 (order 페이지에서 하면 빈 장바구니 감지 → /cart 리다이렉트로 결제창 차단됨)

## Main Page (메인 페이지)

- 배너 슬라이더: fade 전환, 자동 재생, 관리자에서 등록한 배너 표시
- NEW ARRIVALS: 최신 상품 API 연동
- BEST: 판매량 기준 상품 API 연동

## Admin Banners (관리자 배너)

- /admin/banners: 배너 등록/삭제/순서변경
- S3 이미지 업로드, 링크 URL 설정, 활성/비활성 토글
- 최대 5개 제한

## Backend Config

- `application-example.yml` 존재 (GitHub 공유용, 민감 키 제외)

## Known Issues

- 옵션 변경/반품/교환: 버튼만 존재, "준비 중" alert
- 구매확정: 백엔드 API 없음, localStorage로 프론트 관리
