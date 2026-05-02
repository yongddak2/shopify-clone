#!/bin/bash
# S9 — RETURN COMPLETE 시 재고 변동 없음 확인 (CLAUDE.md 명세 기준).
# setup.sh 에서 INSERT 한 ORDER_S9 (DELIVERED, qty=2) 사용.
source "$(dirname "$0")/_helpers.sh"

echo "=== S9 RETURN COMPLETE 재고 변동 없음 ==="
if [ -z "$ORDER_S9" ] || [ -z "$OPT_S9_ID" ]; then
  skip "S9 임시 주문/옵션 없음"
  exit 0
fi

STOCK_BEFORE=$($PG -c "SELECT stock_quantity FROM product_option_value WHERE id=$OPT_S9_ID;" | tr -d '[:space:]')
echo "OPT $OPT_S9_ID 재고 before=$STOCK_BEFORE (qty=2 주문)"

print_call "RETURN 신청" \
  -X POST "$BASE_URL/api/orders/$ORDER_S9/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"WRONG_SIZE","reasonText":"S9 RETURN"}'

REQ_ID=$(echo "$LAST_BODY" | sed -nE 's/.*"id":([0-9]+).*/\1/p' | head -1)
echo "REQ_ID=$REQ_ID"

print_call "ADMIN approve" \
  -X PATCH "$BASE_URL/api/admin/requests/$REQ_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adminMemo":"approve for S9"}'

print_call "ADMIN complete" \
  -X PATCH "$BASE_URL/api/admin/requests/$REQ_ID/complete" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

STOCK_AFTER=$($PG -c "SELECT stock_quantity FROM product_option_value WHERE id=$OPT_S9_ID;" | tr -d '[:space:]')
echo "OPT $OPT_S9_ID 재고 after=$STOCK_AFTER  (delta=$((STOCK_AFTER - STOCK_BEFORE)))"
echo "EXPECTED delta=0 (CLAUDE.md: RETURN→REFUNDED 재고복구X)"
