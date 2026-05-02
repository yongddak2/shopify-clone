#!/bin/bash
# S7 — 동일 주문에 RETURN 신청 후 RETURN 재신청. 기대 400/409.
# (S6 와 마찬가지로 두 번째에서는 ORDER_NOT_DELIVERED 가 먼저 트리거됨)
source "$(dirname "$0")/_helpers.sh"

echo "=== S7 RETURN 후 동일 type RETURN 재신청 ==="
TARGET="${ORDER_DELIVERED_NEW_2}"
if [ -z "$TARGET" ]; then
  skip "두 번째 DELIVERED + 신청 가능 주문 없음 — 수동 확인 필요"
  exit 0
fi
echo "TARGET_ORDER=$TARGET"

print_call "1차 RETURN 신청 (성공 기대)" \
  -X POST "$BASE_URL/api/orders/$TARGET/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"S7 1st RETURN"}'

print_call "2차 RETURN 신청 (실패 기대)" \
  -X POST "$BASE_URL/api/orders/$TARGET/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"S7 2nd RETURN"}'
