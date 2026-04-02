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
- 가격: `(basePrice + additionalPrice) * quantity`, 천단위 콤마
- 장바구니: productId 기준 그룹핑, 옵션별 수량 조절, 최근 담은 순 정렬
- 폼 유효성: noValidate + 커스텀 검증 + 빨간 텍스트

## Product Options (상품 옵션)

- 사이즈: S, M, L, XL, XXL, FREE (체크박스)
- 색상: 블랙, 화이트, 네이비, 그레이, 베이지, 기타(직접입력) (체크박스)
- 선택 시 조합별 재고 수량 입력 테이블 자동 생성
- 수정 모달: 기존 옵션 읽기 전용 (백엔드 PATCH 옵션 수정 미지원)

## Key API Response Differences

- 장바구니: basePrice + additionalPrice (프론트에서 합산)
- 상품 옵션: 백엔드 `values` 키 사용 (프론트 타입도 `values`)
- 소프트 삭제: deletedAt이 null인 것만 목록 표시

## Known Issues

- console.log 디버그 로그 잔존 (products/new/page.tsx)
- 검색바: UI만 구현, 기능 미연결
- 토스 결제 위젯: 프론트 미연동
- 주소 입력: 카카오 우편번호 API 미적용