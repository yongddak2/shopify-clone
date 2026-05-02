#!/bin/bash
# S11 — 판매량 증감 확인
# - PAID 시 increase: PaymentService.confirmPayment 흐름 (토스 외부 API 의존 → SKIP)
# - 취소 시 decrease: AdminOrderService.updateOrderStatus(PAID -> CANCELLED) 로 검증
#   ORDER_S11: PAID 상태, item qty=2, S11_PRODUCT_ID 의 sales_count 사전 +2

source "$(dirname "$0")/_helpers.sh"

echo "=== S11: 판매량 증감 ==="

if [ -z "$ORDER_S11" ] || [ -z "$S11_PRODUCT_ID" ]; then
  skip "ORDER_S11 / S11_PRODUCT_ID 누락"
  exit 0
fi

SALES_BEFORE=$($PG -c "SELECT sales_count FROM product WHERE id=$S11_PRODUCT_ID;" | tr -d '[:space:]')
echo "-- BEFORE: product($S11_PRODUCT_ID).sales_count = $SALES_BEFORE"

# 취소 (감소 검증)
print_call "PATCH /api/admin/orders/$ORDER_S11/status (PAID -> CANCELLED)" \
  -X PATCH "$BASE_URL/api/admin/orders/$ORDER_S11/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"CANCELLED"}'

SALES_AFTER=$($PG -c "SELECT sales_count FROM product WHERE id=$S11_PRODUCT_ID;" | tr -d '[:space:]')
DELTA=$((SALES_AFTER - SALES_BEFORE))
echo "-- AFTER : product($S11_PRODUCT_ID).sales_count = $SALES_AFTER (delta=$DELTA, expected=-2)"

if [ "$DELTA" = "-2" ]; then
  echo "RESULT(decrease): PASS"
else
  echo "RESULT(decrease): FAIL (expected -2, got $DELTA)"
fi

skip "PAID 시 increase 검증 (PaymentService.confirmPayment 토스 외부 API 의존 — 단위 테스트 영역)"
