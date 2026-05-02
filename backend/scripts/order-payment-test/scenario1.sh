#!/bin/bash
# S1 — 비로그인 호출
# 토큰 없이 주문/결제 보호 엔드포인트 호출 → 401 기대
# (AUTH-001 패치 후 CustomAuthenticationEntryPoint 가 401 + ApiResponse 표준 바디 반환해야 함)

source "$(dirname "$0")/_helpers.sh"

echo "=== S1: 비로그인 호출 ==="
TARGET_ID="${ORDER_ANY:-1}"

print_call "GET /api/orders" -X GET "$BASE_URL/api/orders"
print_call "GET /api/orders/$TARGET_ID" -X GET "$BASE_URL/api/orders/$TARGET_ID"
print_call "POST /api/orders" -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"cartItemIds":[1],"recipient":"X","phone":"01000000000","address":"S"}'
print_call "POST /api/orders/$TARGET_ID/cancel" -X POST "$BASE_URL/api/orders/$TARGET_ID/cancel"
print_call "POST /api/orders/$TARGET_ID/confirm" -X POST "$BASE_URL/api/orders/$TARGET_ID/confirm"
print_call "POST /api/payments/confirm" -X POST "$BASE_URL/api/payments/confirm" \
  -H "Content-Type: application/json" \
  -d '{"paymentKey":"x","orderNumber":"x","amount":1000}'
