#!/bin/bash
# S6 — 웰컴 쿠폰 수동 발급 차단
# is_welcome=true 쿠폰을 사용자가 직접 issue 시도 → 400 (WELCOME_COUPON_NOT_DOWNLOADABLE)
# - ADMIN(웰컴 미보유)으로 시도하면 isWelcome 체크가 가장 먼저 발동

source "$(dirname "$0")/_helpers.sh"

echo "=== S6: 웰컴 쿠폰 수동 발급 차단 ==="
echo "WELCOME_COUPON=$WELCOME_COUPON"

print_call "POST /api/coupons/$WELCOME_COUPON/issue (ADMIN, 웰컴 쿠폰 직접 발급)" -X POST "$BASE_URL/api/coupons/$WELCOME_COUPON/issue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo ""
echo "[DB 검증] ADMIN(member_id=2) → 웰컴 쿠폰 발급 안되어야 함"
COUNT=$($PG -c "SELECT COUNT(*) FROM member_coupon WHERE member_id=2 AND coupon_id=$WELCOME_COUPON;" | tr -d '[:space:]')
echo "  발급 행 수: $COUNT (기대: 0)"

echo ""
echo "[다운로드 목록 노출 차단 검증]"
print_call "GET /api/coupons (ADMIN) — 웰컴 쿠폰 노출 안되어야 함" -X GET "$BASE_URL/api/coupons" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
INCLUDES_WELCOME=$(echo "$LAST_BODY" | grep -oE "\"id\":$WELCOME_COUPON[,}]" | wc -l | tr -d '[:space:]')
echo "  목록에 웰컴 쿠폰 id=$WELCOME_COUPON 포함 횟수: $INCLUDES_WELCOME (기대: 0)"
