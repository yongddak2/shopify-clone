# CLAUDE.md

PanTrKa — 의류 쇼핑몰. 모노레포 (backend/ + frontend/). 코드 디렉토리는 `shopify-clone/` 로컬 폴더명 유지.
루트에서 실행. 백엔드 작업 시 backend/CLAUDE.md, 프론트 작업 시 frontend/CLAUDE.md 자동 로드.

---

## 프로젝트 개요

- **GitHub**: https://github.com/yongddak2/shopify-clone (Public)
- **Backend**: Spring Boot 4.0.4 / Java 17 → localhost:8080
- **Frontend**: Next.js 16.2.1 / React 19 / TypeScript / Tailwind CSS v4 → localhost:3000
- **인프라**: PostgreSQL 16, Redis 7, AWS S3 (`ap-southeast-2`. 로컬 버킷 `yong-byeong-shop-images` / 운영 버킷 `pantrka-images-862121602931-ap-southeast-2-an` — 불일치 주의)
- **결제**: NICE페이먼츠 API (샌드박스 키). 인증창 → form POST 콜백(`/api/payments/nice/callback`) → 서버 승인 (구 토스 전환됨)
- **이메일**: Gmail SMTP (happywe2931@gmail.com)
- **디자인 참고**: coolsis.kr, kaposhka.com, hieta.co.kr (미니멀 의류몰)

---

## 명령어

실행 방식 2종 — 개발은 **방식 A**(hot reload), 통째로 띄우는 건 **방식 B**(풀스택 도커).

```powershell
# ── 방식 A: 로컬 개발 (코드 직접 실행) ──
docker compose up -d   # 인프라만(postgres·redis·ES·kafka), 포트 127.0.0.1 바인딩
.\gradlew bootRun      # cd backend 후, 포트 8080, application.yml 사용
.\gradlew test         # 테스트 33개
npm run dev            # cd frontend 후, 포트 3000
npx tsc --noEmit       # 타입 체크

# ── 방식 B: 풀스택 도커 (backend+frontend+db+redis+Caddy+Cloudflare 일괄) ──
# 전체(터널 포함 → https://pantrka.com 공개)
docker compose --env-file .env.server -f compose.test-server.yml up -d --build
# 로컬 전용(터널 제외 → http://localhost:8088 만)
docker compose --env-file .env.server -f compose.test-server.yml up -d --build postgres redis backend frontend
```

> 방식 B 주의: DB 볼륨 분리(A=`postgres_data` / B=`postgres_server_data`, B 첫 기동 시 빈 DB) · 포트 충돌(둘 다 5432 → 동시 기동 금지) · 코드 반영은 `up -d --build` 재실행 · 터널은 친구 PC 운영 중(같은 TunnelID 충돌 가능). 상세: [docs/TEST_SERVER.md](docs/TEST_SERVER.md), [docs/LOCAL_HOSTING.md](docs/LOCAL_HOSTING.md)
> PowerShell 5.1은 `&&` 미지원 — 명령은 한 줄씩 실행 (또는 `;` 사용).

---

## 공통 코드 패턴

### 백엔드
- 인증 추출: `(Long) authentication.getPrincipal()` → memberId
- 의존성 주입: `@RequiredArgsConstructor`
- 트랜잭션: 클래스 `@Transactional(readOnly=true)` + 쓰기 메서드 `@Transactional`
- 예외: `BusinessException(ErrorCode.XXX)`
- 응답: `ApiResponse.success(data)` + `ResponseEntity`
- HTTP 상태: POST → 201, DELETE → 204
- DTO: 정적 팩토리 `from()` / 엔티티: `@Builder` + `@NoArgsConstructor(PROTECTED)`
- 이미지 N+1 방지: `@EntityGraph(attributePaths = {"product.images"})`
- 이메일 발송: `@Async` (`@EnableAsync` — BackendApplication 선언). `OrderEmailContext` 스냅샷으로 LazyInitializationException 회피. 발송 실패는 try-catch로 호출 흐름 격리

### 프론트엔드
- SSR Hydration 방지: `useState(false)` + `useEffect` mounted 패턴 (Header 등 인터랙션 상태)
- SSR 데이터 prefetch: 서버 컴포넌트(`page.tsx`, `dynamic="force-dynamic"`)가 `INTERNAL_API_BASE_URL ?? NEXT_PUBLIC_API_BASE_URL`로 `fetch(no-store)` 병렬 prefetch → 클라이언트 `*Content.tsx`에 `initialData` 주입. baseUrl/fetch 실패 시 undefined 폴백(클라이언트 재fetch). 적용: 메인(`page.tsx`+`HomeContent`), 상품목록(`products/page.tsx`+`ProductsContent`)
- 인증 보호: 비로그인 → /login 리다이렉트
- 에러 표시: alert() 금지 → 빨간 인라인 텍스트
- 가격 계산: `Math.round(basePrice * (1 - discountRate / 100)) + additionalPrice`
- 전화번호: 숫자만 + 자동 하이픈, API 전송 시 하이픈 제거
- 캐시 무효화: `queryInvalidator.ts` 헬퍼만 사용 (직접 invalidateQueries 금지)

---

## 핵심 비즈니스 규칙

- **배송비**: 50,000원 이상 무료 / 미만 3,000원
- **주문 취소**: PENDING, PAID 상태에서만 가능. 취소 시 쿠폰 복원 + 재고 복구 + 판매량 감소. PAID 취소 시 `paymentService.cancelPaidOrder()`가 **NICE full-cancel API 호출 후** 재고 복구 (반품 완료 RETURN도 동일 경로)
- **결제(NICE페이먼츠)**: 프론트 `window.AUTHNICE.requestPay({returnUrl: …/api/payments/nice/callback})` → NICE 인증창 → NICE가 백엔드로 **form POST 콜백**(permitAll) → `confirmNicePayment`에서 ① 콜백 서명 검증 `SHA-256(authToken+clientId+amount+secretKey)` ② 금액 검증(`order.finalAmount`) ③ 주문 락(`findByOrderNumberForUpdate`, PESSIMISTIC_WRITE) ④ NICE 승인 API + 응답 서명 재검증 ⑤ PAID 전환·쿠폰 markUsed·salesCount·이메일 → `303` 리다이렉트(`/payment/success` 또는 `/payment/fail`). 로컬 처리 실패 시 NICE cancel로 보상. 기존 DONE Payment는 멱등 반환
- **관리자 강제 상태 변경**: 어드민 ORDERS 페이지는 모든 상태 전환 허용 (매트릭스 없음, 관리자 신뢰 모델). 사용자 직접 취소는 위 정책 유지.
- **구매 확정**: DELIVERED + 중복 불가 → `confirmedAt` 저장
- **반품/교환 신청**: DELIVERED + `confirmedAt == null` 에서만
  - RETURN → RETURN_REQUESTED / EXCHANGE → EXCHANGE_REQUESTED
  - COMPLETED: RETURN → REFUNDED(재고복구X) / EXCHANGE → DELIVERED(재고복구O)
- **리뷰 작성**: DELIVERED + `confirmedAt != null` 후만 가능. 상품당 1회(소프트삭제 후 재작성 가능)
- **쿠폰**: 주문 생성 시 검증 → PAID 시 `markUsed()` + `save()` 필수 → 취소 시 미만료 복원
- **쿠폰 수정**: name / totalQuantity / startDate / endDate / isWelcome / validDays 가능 (할인타입·금액 변경 불가). isWelcome=true 전환 시 기존 웰컴 쿠폰 자동 해제 + totalQuantity는 null 처리
- **쿠폰 삭제**: issuedQuantity > 0 시 차단
- **웰컴 쿠폰**: `is_welcome=true` 쿠폰은 항상 1개만 활성. validDays 필수. 회원가입 시 `issueWelcomeCouponSafely()` 자동 발급(실패해도 가입 진행). 다운로드 목록 노출 X + 수동 발급 차단. 만료일 = `min(가입일+validDays, endDate)`
- **판매량**: `Product.salesCount` — PAID 시 increase / 취소·환불 시 decrease (0 미만 방지)
- **재고**: 주문 시 `decreaseStock()` / 취소 시 `increaseStock()` / 비관적 락: `findByIdWithLock()`
- **주문 상태 알림 이메일**: PAID(자동) / SHIPPED(관리자 변경 시 운송장·배송사 포함) / CANCELLED(관리자 취소만, 사용자 직접 취소는 미발송)
- **운송장**: `Order.carrier`, `Order.tracking_number` 컬럼. 관리자가 SHIPPED 변경 시 모달에서 입력. SHIPPED 전이 시 **carrier·tracking_number 둘 다 필수**(하나라도 비면 `MISSING_TRACKING_INFO`), 저장 시 trim. `PATCH /api/admin/orders/{id}/shipping`(`AdminShippingUpdateRequest`)로 SHIPPED/DELIVERED 주문 운송장 사후 수정 가능(그 외 상태 `SHIPPING_UPDATE_NOT_ALLOWED`). SHIPPED 이메일은 실제 값 사용, null이면 "준비 중" fallback
- **회원 강제 탈퇴**: `DELETE /api/admin/users/{id}` = 소프트 삭제(`deletedAt` 세팅). 본인 변경/탈퇴 차단. 주문/리뷰 등 데이터 보존 + 로그인은 자동 차단(`findByEmailAndDeletedAtIsNull`)
- **비밀번호**: 8자+영문+숫자+특수문자 / 변경 30일 제한(`passwordChangedAt`) / 소셜 로그인 차단
- **비밀번호 찾기**: Redis 코드 3분 → verified 키 10분 → 재발송 30초 이중 방어
- **배너**: 최대 5개, sortOrder, isActive, title (필수, VARCHAR 100). 링크: productId 또는 linkUrl 중 하나만(상호 배타) — 공개 응답에서 `/products/{productId}` 또는 raw URL로 직렬화. 메인 슬라이드 클릭 시 동일 창 라우팅
- **ABOUT 페이지**: 풀스크린 단일 이미지. `MainPageConfig.aboutImageUrl`(S3 about/). 어드민 배너 관리 페이지에서 업로드/제거. `PUT /api/admin/main-page-config/about-image` 별도 엔드포인트
- **인스타그램 섹션**: `MainPageConfig`(싱글턴)에 `instagram_handle` + 이미지/링크 3쌍 컬럼 평면화(별도 테이블 아님). **0개 또는 정확히 3개만** 저장 가능(부분 입력 차단). `imageUrl`=HTTPS, `linkUrl`=`instagram.com`/`*.instagram.com` HTTPS 강제, handle 정규식 `^[A-Za-z0-9._]{1,100}$`(앞 `@` 제거). 이미지 5MB(`directory=instagram`). `PUT /api/admin/main-page-config/instagram`. 어드민 배너 관리 페이지 `InstagramSection.tsx`. 메인 맨 아래 3열 그리드(handle+3개 모두 있을 때만). 교체 시 고아 S3 이미지 삭제
- **시즌 컬렉션(PNTK)**: 이름은 영문/숫자/공백만, slug 자동 생성(kebab-case, 중복 시 -2/-3). 사진 한 장 10MB. 헤더 PNTK 클릭 → `/pntk` → 첫 활성 시즌(sortOrder 최상단)으로 redirect. `/pntk/[slug]` 상단에 시즌 탭 네비
- **썸네일**: `isThumbnail=true` 우선, sortOrder 최소값 fallback
  - 적용 대상: ProductSummaryResponse, CartItemResponse, WishlistResponse, OrderItemResponse
- **이미지 S3 경로**: products/(5MB) / reviews/(5MB) / return-requests/(20MB) / banners/ / season-collections/(10MB) / about/(10MB) / instagram/(5MB). 업로드 허용 디렉토리 화이트리스트 = products·banners·about·instagram
- **이미지 서빙(프록시)**: 모든 업로드 URL은 `{APP_PUBLIC_BASE_URL}/api/images/{key}` 프록시 형식(amazonaws 직접 URL 폐기). `GET /api/images/**`(permitAll, `PublicImageController`, 1년 immutable 캐시)가 S3에서 읽어 서빙. `deleteFile`은 프록시·레거시 URL 둘 다 파싱. AWS 자격증명 미설정 시 `DefaultCredentialsProvider`(IAM Role) 폴백

---

## 상품 옵션 구조

- OPTION_GROUP name: 항상 `"옵션"`
- OPTION_VALUE value: `"S-블랙"`, `"M-화이트"` 형태 조합값
- `value === "FREE"` → 옵션 없는 상품

### 등록 페이로드
```json
{ "optionGroups": [{ "name": "옵션", "optionValues": [{"value":"S-블랙","additionalPrice":0,"stockQuantity":10}] }] }
```

### 수정 페이로드
```json
{
  "optionGroupName": "옵션",
  "optionValues": [{"id":1, "value":"S-블랙", "additionalPrice":0, "stockQuantity":10}],
  "images": [{"id":1, "url":"...", "sortOrder":0, "isThumbnail":true}]
}
```
- `images: null` → 이미지 수정 안 함 / `images: []` → 전체 삭제
- 이미지 삭제 후 `flush()` 필수
- 옵션 수정 시 cascade 없으므로 `productOptionValueRepository.save()/delete()` 직접 호출

---

## 주의사항

- 장바구니 캐시 무효화: `payment/success` 에서만 (order 페이지에서 하면 결제창 차단)
- 레거시 분리형 옵션 상품: 삭제 후 조합형 재등록 필요
- `Coupon.totalQuantity` nullable: 웰컴 쿠폰은 null(무제한), 일반 쿠폰은 NOT NULL
- NICE 취소 API **코드 연동됨**(취소/반품 시 `cancelPaidOrder` 호출) — 단 **샌드박스 키 기준, 실제 운영 환불 검증은 미완**(`docs/PRODUCTION_READINESS.md` P0)
- `application.yml`은 이제 **gitignore 대상**(시크릿 포함, `application-example.yml` 삭제됨). 환경 설정 템플릿은 `application-test-server.yml`(test-server 프로파일) + `.env.server.example`
- 테스트 계정: ADMIN — test2@test.com / rladyddn00! | USER — test@test.com / Test1234!
- Swagger: http://localhost:8080/swagger-ui.html (test-server 프로파일은 비활성화)
- 검증 트랙(권한·반품교환·주문결제·쿠폰…) 결과/이슈/리팩토링 백로그는 `docs/VERIFICATION_LOG.md` 참고. 검증 스크립트는 `backend/scripts/{도메인}-test/`
- 전체 API 목록은 `docs/API_REFERENCE.md` 참고
- 운영 준비 상태(런치 블로커 P0 7개·P1 16개·P2 5개)는 `docs/PRODUCTION_READINESS.md` 참고. AI 에이전트 지침은 `AGENTS.md`(Codex/CodeGraph)
