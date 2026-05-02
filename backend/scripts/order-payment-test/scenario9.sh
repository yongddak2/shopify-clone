#!/bin/bash
# S9 — 쿠폰 적용 PENDING 주문 취소 시 쿠폰 복원 확인
# - ORDER_S9 (PENDING + member_coupon_id=$MC_S9, used_at=NOW)
# - cancel API → mc.used_at NULL 복원 검증

source "$(dirname "$0")/_helpers.sh"

echo "=== S9: 쿠폰 복원 검증 ==="

if [ -z "$ORDER_S9" ] || [ -z "$MC_S9" ]; then
  skip "ORDER_S9 / MC_S9 누락"
  exit 0
fi

USED_BEFORE=$($PG -c "SELECT COALESCE(used_at::text, 'NULL') FROM member_coupon WHERE id=$MC_S9;" | tr -d '[:space:]')
echo "-- BEFORE: member_coupon($MC_S9).used_at = $USED_BEFORE"

print_call "POST /api/orders/$ORDER_S9/cancel" \
  -X POST "$BASE_URL/api/orders/$ORDER_S9/cancel" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN"

USED_AFTER=$($PG -c "SELECT COALESCE(used_at::text, 'NULL') FROM member_coupon WHERE id=$MC_S9;" | tr -d '[:space:]')
ORDER_AFTER=$($PG -c "SELECT status FROM orders WHERE id=$ORDER_S9;" | tr -d '[:space:]')
echo "-- AFTER : member_coupon($MC_S9).used_at = $USED_AFTER"
echo "-- AFTER : orders($ORDER_S9).status     = $ORDER_AFTER"

if [ "$USED_AFTER" = "NULL" ] && [ "$ORDER_AFTER" = "CANCELLED" ]; then
  echo "RESULT: PASS (쿠폰 복원 + 주문 취소 정상)"
else
  echo "RESULT: FAIL (used_at=$USED_AFTER, status=$ORDER_AFTER)"
fi
