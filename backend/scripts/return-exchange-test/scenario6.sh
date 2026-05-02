#!/bin/bash
# S6 — 동일 주문에 RETURN 신청 후 EXCHANGE 재신청. 기대 400/409.
# 주의: 첫 RETURN 신청 시 order.status 가 DELIVERED → RETURN_REQUESTED 로 변하므로
# 두 번째 신청에서는 DUPLICATE_RETURN_REQUEST 보다 ORDER_NOT_DELIVERED 가 먼저 트리거된다.
# 어느 쪽이든 400 응답이라 명세 충족.
source "$(dirname "$0")/_helpers.sh"

echo "=== S6 RETURN 후 EXCHANGE 재신청 ==="
TARGET="${ORDER_DELIVERED_NEW_1}"
if [ -z "$TARGET" ]; then
  skip "DELIVERED + 신청 가능 주문 없음 — 수동 확인 필요"
  exit 0
fi
echo "TARGET_ORDER=$TARGET"

print_call "1차 RETURN 신청 (성공 기대)" \
  -X POST "$BASE_URL/api/orders/$TARGET/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"S6 1st RETURN"}'

# desiredOptionValueId — 임의(주문 7 케이스에서는 옵션 그룹의 다른 값)
DESIRED=$($PG -c "SELECT pov2.id FROM order_item oi JOIN product_option_value pov ON pov.id=oi.option_value_id JOIN product_option_value pov2 ON pov2.option_group_id=pov.option_group_id AND pov2.id<>pov.id WHERE oi.order_id=$TARGET LIMIT 1;" | tr -d '[:space:]')
DESIRED="${DESIRED:-1}"

print_call "2차 EXCHANGE 신청 (실패 기대)" \
  -X POST "$BASE_URL/api/orders/$TARGET/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"EXCHANGE\",\"reasonDetail\":\"DISLIKE\",\"reasonText\":\"S6 2nd EXCHANGE\",\"desiredOptionValueId\":$DESIRED}"
