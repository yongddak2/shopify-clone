#!/bin/bash
# S8 — EXCHANGE COMPLETE 시 재고 +qty 복구 확인.
# setup.sh 에서 INSERT 한 ORDER_S8 (DELIVERED, member_id=2) 사용.
source "$(dirname "$0")/_helpers.sh"

echo "=== S8 EXCHANGE COMPLETE 재고 복구 ==="
if [ -z "$ORDER_S8" ] || [ -z "$OPT_S8_ID" ]; then
  skip "S8 임시 주문/옵션 없음"
  exit 0
fi

STOCK_BEFORE=$($PG -c "SELECT stock_quantity FROM product_option_value WHERE id=$OPT_S8_ID;" | tr -d '[:space:]')
echo "OPT $OPT_S8_ID 재고 before=$STOCK_BEFORE (qty=1 주문)"

print_call "EXCHANGE 신청" \
  -X POST "$BASE_URL/api/orders/$ORDER_S8/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"EXCHANGE\",\"reasonDetail\":\"WRONG_SIZE\",\"reasonText\":\"S8 EXCHANGE\",\"desiredOptionValueId\":$DESIRED_OPT_FOR_S8}"

REQ_ID=$(echo "$LAST_BODY" | sed -nE 's/.*"id":([0-9]+).*/\1/p' | head -1)
echo "REQ_ID=$REQ_ID"

print_call "ADMIN approve" \
  -X PATCH "$BASE_URL/api/admin/requests/$REQ_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"adminMemo":"approve for S8"}'

print_call "ADMIN complete" \
  -X PATCH "$BASE_URL/api/admin/requests/$REQ_ID/complete" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

STOCK_AFTER=$($PG -c "SELECT stock_quantity FROM product_option_value WHERE id=$OPT_S8_ID;" | tr -d '[:space:]')
echo "OPT $OPT_S8_ID 재고 after=$STOCK_AFTER  (delta=$((STOCK_AFTER - STOCK_BEFORE)))"
echo "EXPECTED delta=+1"
