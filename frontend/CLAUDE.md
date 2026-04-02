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
│   ├── page.tsx            # 메인 (히어로 + BEST 상품)
│   ├── login/, signup/     # 인증 페이지
│   ├── products/, cart/, order/, orders/  # 사용자 페이지
│   └── admin/              # 관리자 페이지 (별도 레이아웃)
│       ├── layout.tsx      # 사이드바 + 권한 체크 (ADMIN only)
│       ├── page.tsx        # 대시보드
│       ├── products/       # 상품 관리 (등록/수정/삭제)
│       ├── orders/         # 주문 관리 (상태 변경)
│       ├── users/          # 회원 관리 (읽기 전용)
│       └── coupons/        # 쿠폰 관리 (생성)
├── components/layout/      # Header, Footer
├── lib/                    # API 호출 (api.ts, auth.ts, product.ts, cart.ts, order.ts, user.ts, admin.ts)
├── stores/authStore.ts     # zustand 인증 스토어
└── types/index.ts          # 공통 타입
```

## Design & Theme

- 전체 다크 테마 (차콜): CSS 변수 기반 (globals.css)
- 배경: #2a2a2a (페이지), #1e1e1e (헤더/푸터)
- 헤더: 햄버거 사이드바(왼쪽 슬라이드) + 중앙 로고 + 검색바(UI만) + 로그인/로그아웃 + 쇼핑백 + 마이페이지
- 비로그인 시에도 쇼핑백/마이페이지 아이콘 표시 (클릭 → /login)
- 로그아웃: 확인 모달 후 실행
- 관리자 페이지: 240px 사이드바 + 콘텐츠, 일반 Header/Footer 미사용

## Code Patterns

- SSR Hydration 방지: mounted state 패턴 (`useState(false)` + `useEffect`)
- 인증 보호: 비로그인 → /login 리다이렉트, 관리자 → role 체크
- 에러 표시: alert() 대신 빨간 텍스트 (버튼 위 공간 미리 확보)
- 가격: 할인 적용 시 `Math.round(basePrice * (1 - discountRate / 100)) + additionalPrice`, 천단위 콤마
- 장바구니: productId 기준 그룹핑, 옵션별 수량 조절, 최근 담은 순 정렬, 체크박스 선택 결제
- 폼 유효성: noValidate + 커스텀 검증 + 빨간 텍스트

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

## Payment (결제)

- 토스페이먼츠 API 개별 연동 (SDK: `https://js.tosspayments.com/v1/payment`)
- 클라이언트 키: 환경변수 `NEXT_PUBLIC_TOSS_CLIENT_KEY` (기본값: 테스트 키)
- 흐름: 주문 생성(POST /api/orders) → 토스 결제창 → 성공 시 /payment/success → POST /api/payments/confirm → 주문 상세
- 실패 시 /payment/fail 페이지 표시
- 주소 입력: 카카오 우편번호 API (Daum Postcode) 연동 완료

## Backend Config

- `application-example.yml` 존재 (GitHub 공유용, 민감 키 제외)

## Known Issues

- 검색바: UI만 구현, 기능 미연결