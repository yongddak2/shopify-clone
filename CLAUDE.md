# CLAUDE.md

PanTrKa — 의류 쇼핑몰. 모노레포 (backend/ + frontend/). 코드 디렉토리는 `shopify-clone/` 로컬 폴더명 유지.
루트에서 실행. 백엔드 작업 시 backend/CLAUDE.md, 프론트 작업 시 frontend/CLAUDE.md 자동 로드.

---

## 프로젝트 개요

- **GitHub**: https://github.com/yongddak2/shopify-clone (Public)
- **Backend**: Spring Boot 4.0.4 / Java 17 → localhost:8080
- **Frontend**: Next.js 16.2.1 / React 19 / TypeScript / Tailwind CSS v4 → localhost:3000
- **인프라**: PostgreSQL 16, Redis 7, AWS S3 (`yong-byeong-shop-images`, `ap-southeast-2`)
- **결제**: 토스페이먼츠 API (테스트 키)
- **이메일**: Gmail SMTP (happywe2931@gmail.com)
- **디자인 참고**: coolsis.kr, kaposhka.com, hieta.co.kr (미니멀 의류몰)

---

## 명령어

```powershell
# 인프라 (루트에서)
docker compose up -d

# 백엔드 (cd backend 후)
.\gradlew bootRun    # 포트 8080
.\gradlew test       # 테스트 27개

# 프론트엔드 (cd frontend 후)
npm run dev          # 포트 3000
npx tsc --noEmit     # 타입 체크
```

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
- SSR Hydration 방지: `useState(false)` + `useEffect` mounted 패턴
- 인증 보호: 비로그인 → /login 리다이렉트
- 에러 표시: alert() 금지 → 빨간 인라인 텍스트
- 가격 계산: `Math.round(basePrice * (1 - discountRate / 100)) + additionalPrice`
- 전화번호: 숫자만 + 자동 하이픈, API 전송 시 하이픈 제거
- 캐시 무효화: `queryInvalidator.ts` 헬퍼만 사용 (직접 invalidateQueries 금지)

---

## 핵심 비즈니스 규칙

- **배송비**: 50,000원 이상 무료 / 미만 3,000원
- **주문 취소**: PENDING, PAID 상태에서만 가능. 취소 시 쿠폰 복원 + 재고 복구 + 판매량 감소
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
- **운송장**: `Order.carrier`, `Order.tracking_number` 컬럼. 관리자가 SHIPPED 변경 시 모달에서 입력. SHIPPED 이메일은 실제 값 사용, null이면 "준비 중" fallback
- **회원 강제 탈퇴**: `DELETE /api/admin/users/{id}` = 소프트 삭제(`deletedAt` 세팅). 본인 변경/탈퇴 차단. 주문/리뷰 등 데이터 보존 + 로그인은 자동 차단(`findByEmailAndDeletedAtIsNull`)
- **비밀번호**: 8자+영문+숫자+특수문자 / 변경 30일 제한(`passwordChangedAt`) / 소셜 로그인 차단
- **비밀번호 찾기**: Redis 코드 3분 → verified 키 10분 → 재발송 30초 이중 방어
- **배너**: 최대 5개, sortOrder, isActive, title (필수, VARCHAR 100)
- **썸네일**: `isThumbnail=true` 우선, sortOrder 최소값 fallback
  - 적용 대상: ProductSummaryResponse, CartItemResponse, WishlistResponse, OrderItemResponse
- **이미지 S3 경로**: products/(5MB) / reviews/(5MB) / return-requests/(20MB) / banners/

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
- 토스 환불 API 미연동: 취소/반품 시 DB만 변경, 실제 환불 미처리
- 테스트 계정: ADMIN — test2@test.com / rladyddn00! | USER — test@test.com / Test1234!
- Swagger: http://localhost:8080/swagger-ui.html
- 검증 트랙(권한·반품교환·주문결제·쿠폰…) 결과/이슈/리팩토링 백로그는 `docs/VERIFICATION_LOG.md` 참고. 검증 스크립트는 `backend/scripts/{도메인}-test/`
- 전체 API 목록은 `docs/API_REFERENCE.md` 참고
