#!/bin/bash
# S7 — 결제 승인 엣지 케이스
# - 존재하지 않는 orderNumber → 404 ORDER_NOT_FOUND
# - 이미 PAID 된 주문 orderNumber 재승인 → 400 ORDER_NOT_PENDING
# 비고: 토스페이먼츠 실제 연동이라 paymentKey/amount 위조는 SKIP (외부 API)

source "$(dirname "$0")/_helpers.sh"

echo "=== S7: 결제 승인 엣지 케이스 ==="

# (a) 존재하지 않는 orderNumber
print_call "POST /api/payments/confirm (orderNumber=NOT-EXIST)" \
  -X POST "$BASE_URL/api/payments/confirm" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentKey":"PK","orderNumber":"NOT-EXIST-ORDER","amount":1000}'

# (b) 이미 PAID 된 주문 재승인
if [ -z "$ORDER_S7_PAID_ORDERNUMBER" ]; then
  skip "이미 PAID 주문 재승인 (ORDER_S7_PAID_ORDERNUMBER 누락)"
else
  print_call "POST /api/payments/confirm (PAID orderNumber=$ORDER_S7_PAID_ORDERNUMBER)" \
    -X POST "$BASE_URL/api/payments/confirm" \
    -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"paymentKey\":\"PK\",\"orderNumber\":\"$ORDER_S7_PAID_ORDERNUMBER\",\"amount\":33000}"
fi

skip "paymentKey/amount 위조 (토스페이먼츠 외부 API 의존 — 단위 테스트 영역)"
