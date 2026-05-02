#!/bin/bash
# S10 — 취소 시 재고 복구 확인
# - ORDER_S10: PENDING + option_value(qty=2)
# - cancel 전후 stock_quantity 비교 (delta = +2)

source "$(dirname "$0")/_helpers.sh"

echo "=== S10: 재고 복구 검증 ==="

if [ -z "$ORDER_S10" ] || [ -z "$OPT_S10_ID" ]; then
  skip "ORDER_S10 / OPT_S10_ID 누락"
  exit 0
fi

STOCK_BEFORE=$($PG -c "SELECT stock_quantity FROM product_option_value WHERE id=$OPT_S10_ID;" | tr -d '[:space:]')
echo "-- BEFORE: option($OPT_S10_ID).stock = $STOCK_BEFORE"

print_call "POST /api/orders/$ORDER_S10/cancel" \
  -X POST "$BASE_URL/api/orders/$ORDER_S10/cancel" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN"

STOCK_AFTER=$($PG -c "SELECT stock_quantity FROM product_option_value WHERE id=$OPT_S10_ID;" | tr -d '[:space:]')
DELTA=$((STOCK_AFTER - STOCK_BEFORE))
echo "-- AFTER : option($OPT_S10_ID).stock = $STOCK_AFTER (delta=$DELTA, expected=+2)"

if [ "$DELTA" = "2" ]; then
  echo "RESULT: PASS"
else
  echo "RESULT: FAIL (expected +2, got $DELTA)"
fi
