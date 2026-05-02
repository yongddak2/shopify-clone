#!/bin/bash
# S9 — 웰컴 쿠폰 단일 유지 정책
# 기존 웰컴 쿠폰 A(=S9_OLD_WELCOME_ID) 존재 상태에서
# 일반 쿠폰 B(=S9_TARGET_COUPON)를 isWelcome=true 로 PATCH
# → A.is_welcome=false, B.is_welcome=true 가 되어 항상 1개만 유지
# 검증 후 원상 복구 (B → false / A → true) — 이후 시나리오 영향 차단

source "$(dirname "$0")/_helpers.sh"

echo "=== S9: 웰컴 쿠폰 단일 유지 ==="
echo "기존 웰컴 A=$S9_OLD_WELCOME_ID, 후보 B=$S9_TARGET_COUPON"

BEFORE=$($PG -c "SELECT id||':'||is_welcome FROM coupon WHERE id IN ($S9_OLD_WELCOME_ID, $S9_TARGET_COUPON) ORDER BY id;")
echo "BEFORE: $BEFORE"

# B 의 현재 startDate/endDate 가져오기 (PATCH 페이로드에 필요)
B_START=$($PG -c "SELECT to_char(start_date,'YYYY-MM-DD\"T\"HH24:MI:SS') FROM coupon WHERE id=$S9_TARGET_COUPON;" | tr -d '[:space:]')
B_END=$($PG -c "SELECT to_char(end_date,'YYYY-MM-DD\"T\"HH24:MI:SS') FROM coupon WHERE id=$S9_TARGET_COUPON;" | tr -d '[:space:]')
B_NAME=$($PG -c "SELECT name FROM coupon WHERE id=$S9_TARGET_COUPON;" | tr -d '[:space:]')

PATCH_BODY="{\"name\":\"$B_NAME\",\"startDate\":\"$B_START\",\"endDate\":\"$B_END\",\"isWelcome\":true,\"validDays\":7}"
echo "PATCH BODY: $PATCH_BODY"

print_call "PATCH /api/admin/coupons/$S9_TARGET_COUPON (isWelcome=true)" -X PATCH "$BASE_URL/api/admin/coupons/$S9_TARGET_COUPON" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PATCH_BODY"

AFTER=$($PG -c "SELECT id||':'||is_welcome||':'||COALESCE(valid_days::text,'NULL')||':'||COALESCE(total_quantity::text,'NULL') FROM coupon WHERE id IN ($S9_OLD_WELCOME_ID, $S9_TARGET_COUPON) ORDER BY id;")
echo "AFTER (id:is_welcome:valid_days:total_quantity): $AFTER"

# 활성 웰컴 쿠폰 카운트
ACTIVE=$($PG -c "SELECT COUNT(*) FROM coupon WHERE is_welcome=true;" | tr -d '[:space:]')
echo "활성 웰컴 쿠폰 수: $ACTIVE (기대: 1)"

# 원상 복구 — REST API 의 PATCH 페이로드에 한글 이름 포함 시 UTF-8 인코딩 이슈(RETURN-001 와 동일)
# 발생하므로 PG 직접 UPDATE 로 정리. S10 이 의존하므로 안정성이 더 중요.
echo ""
echo "-- 원상 복구 (PG 직접 UPDATE)"
$PG -c "UPDATE coupon SET is_welcome=false, valid_days=NULL WHERE id=$S9_TARGET_COUPON;" >/dev/null
$PG -c "UPDATE coupon SET is_welcome=true, valid_days=30, total_quantity=NULL WHERE id=$S9_OLD_WELCOME_ID;" >/dev/null

RESTORED=$($PG -c "SELECT id||':'||is_welcome||':'||COALESCE(valid_days::text,'NULL') FROM coupon WHERE id IN ($S9_OLD_WELCOME_ID, $S9_TARGET_COUPON) ORDER BY id;")
echo "RESTORED: $RESTORED"
ACTIVE_RESTORED=$($PG -c "SELECT COUNT(*) FROM coupon WHERE is_welcome=true;" | tr -d '[:space:]')
echo "복구 후 활성 웰컴 쿠폰 수: $ACTIVE_RESTORED (기대: 1)"
