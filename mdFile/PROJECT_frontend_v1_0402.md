# 쇼핑몰 프론트엔드 디자인 수정 — 이전 대화 요약

## 프로젝트 기본 정보
- 프로젝트: shopify-clone (의류 쇼핑몰, 취업 포트폴리오 + 실서비스 목표)
- 경로: `C:\Users\KYW\projects\shopify-clone`
- 백엔드: Spring Boot 4, Java 17 (localhost:8080)
- 프론트엔드: Next.js 16.2.1, React 19, TypeScript, Tailwind CSS v4 (localhost:3000)
- 개발 수준: Spring Boot 입문, 초보자 기준 설명 필요
- 터미널: cmd 기준 (PowerShell 아님)
- Claude Code 백엔드: `cd backend` → `claude`
- Claude Code 프론트엔드: `cd frontend` → `claude`

## 이전 대화에서 완료한 작업

### 헤더 리디자인
- 데스크톱/모바일 모두 왼쪽 햄버거 아이콘 → 왼쪽 슬라이드 사이드바 패널 (SHOP 메뉴 포함)
- 중앙 SHOPIFY 로고 (클릭 시 홈 이동, 나중에 이미지 교체 가능)
- 오른쪽: 검색(🔍) + Login/Join 또는 LOGOUT + 쇼핑백(🛍️) + 마이페이지(👤)
- 비로그인 시에도 쇼핑백/마이페이지 아이콘 표시 (클릭 → /login)
- 검색바: 헤더 아래 레이어드 슬라이드 다운 (UI만, 기능 미연결)
- 로그아웃: 커스텀 확인 모달 후 실행
- HOME 버튼 삭제됨

### 다크 테마 전체 적용
- 차콜 다크 테마: 배경 #2a2a2a, 헤더/푸터 #1e1e1e
- globals.css에 CSS 변수 체계로 정의
- 모든 페이지 (메인, 로그인, 회원가입, 상품목록, 상품상세, 장바구니, 주문, 주문내역) 적용 완료

### 장바구니/주문 버그 수정
- 가격 NaN → basePrice + additionalPrice 합산으로 수정
- 장바구니 담기 후 React Query 캐시 invalidate (즉시 반영)
- Hydration 에러 → mounted state 패턴 적용
- 같은 상품 다른 옵션 → productId 기준 그룹핑, 옵션별 수량 조절 가능
- 장바구니 정렬: 최근 담은 상품이 위, 수량 변경 시 순서 고정
- 주문 페이지에도 상품 합치기 + 썸네일 추가

### 로그인/회원가입 UI 개선
- 브라우저 기본 유효성 검사 → noValidate + 커스텀 빨간 텍스트
- 로그아웃 403 에러 무시 처리 (프론트 상태는 항상 초기화)

### 상품 상세 수정
- 옵션 키 불일치 수정 (optionValues → values)
- 장바구니 담기 alert → 빨간 텍스트로 변경

### 관리자 페이지 전체 구현 (/admin)
- 별도 레이아웃 (240px 사이드바 + 콘텐츠, 일반 Header/Footer 미사용)
- 권한 체크: 비로그인 → /login, 로그인했지만 ADMIN 아님 → "관리자 권한이 필요합니다" 후 / 리다이렉트
- 로그인 시 getMyInfo()로 user 정보(role) 저장
- 대시보드: 총 상품/주문/회원/쿠폰 카드 (deletedAt null 필터링)
- 상품 관리: 테이블 + 등록(체크박스 옵션) + 수정(모달, 기본 정보만) + 삭제(소프트 삭제)
- 주문 관리: 테이블 + 아코디언 상세 + 상태 변경 드롭다운
- 회원 관리: 읽기 전용 테이블
- 쿠폰 관리: 테이블 + 생성 폼
- 가격 입력: 콤마 자동, 스피너 제거
- 카테고리: 드롭다운 (상의/하의/아우터/원피스스커트/악세서리)
- 상품 옵션: 사이즈(S/M/L/XL/XXL/FREE) + 색상(블랙/화이트/네이비/그레이/베이지/기타) 체크박스
- 수정 모달: 기존 옵션 프리필 (읽기 전용, "옵션 변경은 삭제 후 재등록" 안내)

### 백엔드 수정 (이전 대화에서)
- AdminProductCreateRequest.java: optionValues 키 불일치 수정 (values → optionValues)
- AdminProductService.java: getValues() → getOptionValues()

## 오늘 할 작업 목록

1. **테스트 데이터 정리**: 옵션 없는 테스트 상품(ID 8, 10, 12, 13) 삭제
2. **상품 등록 옵션 최종 확인**: 프론트에서 옵션 체크 후 등록 → 목록에 옵션 표시 확인
3. **주문 관리 테스트**: 상태 변경 동작 확인
4. **쿠폰 관리 테스트**: 쿠폰 생성 동작 확인
5. **console.log 제거**: products/new/page.tsx의 디버그 로그
6. **관리자 진입 링크**: 헤더에서 ADMIN 사용자일 때 /admin 진입 방법 추가 검토
7. **프론트엔드 디자인 수정**: 메인, 상품목록, 로그인/회원가입 등 나머지 페이지
8. **CLAUDE.md 업데이트**: backend/frontend 각각 (파일은 이미 작성됨, 교체만 하면 됨)

## 알려진 이슈 / 미완료 항목
- 백엔드 PATCH /api/admin/products/{id}: 옵션 수정 미지원 → 나중에 백엔드 리팩토링 시 추가 (A안)
- 검색바: UI만 구현, 기능 미연결
- 토스 결제 위젯: 프론트 미연동
- 주소 입력: 카카오 우편번호 API 미적용
- 쿠폰 주문 적용: 미리보기만 구현
- 재고 Race Condition: 비관적 락 미적용
- 라이트 테마: 나중에 추가 예정 (다크가 기본, 마이페이지 설정에서 토글)

## 참고 사항
- 테스트 계정: test2@test.com / Test1234! (ADMIN)
- 일반 계정: test@test.com / Test1234! (USER)
- 서버 실행: Docker Desktop → docker compose up -d → backend: gradlew bootRun → frontend: npm run dev
- 레퍼런스 사이트: coolsis.kr, kaposhka.com, hieta.co.kr (미니멀 의류 쇼핑몰)
- 코드 작성은 Claude Code에서, 웹 채팅(여기)에서는 설계/방향 결정
- 프롬프트는 여기서 작성 → Claude Code에 붙여넣기 방식
