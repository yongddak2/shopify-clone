#!/bin/bash
# S2 — 타인 주문에 신청. USER B 토큰으로 USER A(주문 보유자) 의 주문에 신청. 기대 403/404.
source "$(dirname "$0")/_helpers.sh"

echo "=== S2 타인 주문에 반품/교환 신청 (USER B → USER A 주문) ==="
TARGET_ORDER="${ORDER_DELIVERED_NEW_1:-${ORDER_DELIVERED_CONFIRMED:-$ORDER_ANY}}"
echo "TARGET_ORDER=$TARGET_ORDER"
print_call "POST /api/orders/$TARGET_ORDER/return-exchange (USER B token, owner=USER A)" \
  -X POST "$BASE_URL/api/orders/$TARGET_ORDER/return-exchange" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"other user order test"}'
