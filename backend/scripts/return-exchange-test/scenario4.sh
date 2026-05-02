#!/bin/bash
# S4 — 신청 불가 주문 상태에서 신청. 기대 400/409.
# 본인 소유 주문이어야 ORDER_FORBIDDEN(403) 보다 ORDER_NOT_DELIVERED(400) 가 트리거된다.
# 따라서 데이터 보유자(USER_A_OWNER_TOKEN, member_id=2) 토큰을 사용한다.
source "$(dirname "$0")/_helpers.sh"

echo "=== S4 신청 불가 상태 주문에 반품/교환 신청 ==="

call_state() {
  local state="$1" oid="$2"
  if [ -z "$oid" ]; then
    skip "$state 상태의 본인 소유 주문이 DB에 없음 — 수동 확인 필요"
    return
  fi
  print_call "POST /api/orders/$oid/return-exchange ($state)" \
    -X POST "$BASE_URL/api/orders/$oid/return-exchange" \
    -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"S4 state check"}'
}

call_state "PENDING"   "$ORDER_PENDING"
call_state "PAID"      "$ORDER_PAID"
call_state "PREPARING" "$ORDER_PREPARING"
call_state "SHIPPED"   "$ORDER_SHIPPED"
