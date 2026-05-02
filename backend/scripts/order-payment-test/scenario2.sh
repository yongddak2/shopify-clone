#!/bin/bash
# S2 — 타인 주문 접근
# USER B 토큰으로 USER A(member_id=2) 의 주문에 GET/cancel/confirm 시도
# 코드 분석: OrderService 는 findByIdAndMemberId → 404 ORDER_NOT_FOUND
#           PaymentService 는 findByOrderNumber + 본인 검증 → 403 ORDER_FORBIDDEN

source "$(dirname "$0")/_helpers.sh"

echo "=== S2: 타인 주문 접근 (USER B → USER A 자원) ==="

if [ -z "$ORDER_PENDING" ] || [ -z "$ORDER_DELIVERED_CONFIRMED" ]; then
  echo "FAIL: 필수 ORDER_PENDING/ORDER_DELIVERED_CONFIRMED 누락"
  exit 1
fi

print_call "GET /api/orders/$ORDER_PENDING (USER B)" \
  -X GET "$BASE_URL/api/orders/$ORDER_PENDING" \
  -H "Authorization: Bearer $USER_B_TOKEN"

print_call "POST /api/orders/$ORDER_PENDING/cancel (USER B)" \
  -X POST "$BASE_URL/api/orders/$ORDER_PENDING/cancel" \
  -H "Authorization: Bearer $USER_B_TOKEN"

print_call "POST /api/orders/$ORDER_DELIVERED_CONFIRMED/confirm (USER B)" \
  -X POST "$BASE_URL/api/orders/$ORDER_DELIVERED_CONFIRMED/confirm" \
  -H "Authorization: Bearer $USER_B_TOKEN"

# Payment confirm — USER A 소유 PENDING 주문의 orderNumber 사용
PEND_ORDERNUMBER=$($PG -c "SELECT order_number FROM orders WHERE id=$ORDER_PENDING;" | tr -d '[:space:]')
print_call "POST /api/payments/confirm (USER B → A's orderNumber)" \
  -X POST "$BASE_URL/api/payments/confirm" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"paymentKey\":\"X\",\"orderNumber\":\"$PEND_ORDERNUMBER\",\"amount\":1000}"
