#!/bin/bash
# S1 — 비로그인 호출
# 토큰 없이 보호 엔드포인트 호출 → 401 기대
# (AUTH-001 패치 후 CustomAuthenticationEntryPoint 가 401 + ApiResponse 표준 바디 반환)

source "$(dirname "$0")/_helpers.sh"

echo "=== S1: 비로그인 호출 ==="

print_call "GET /api/coupons/me" -X GET "$BASE_URL/api/coupons/me"
print_call "GET /api/coupons" -X GET "$BASE_URL/api/coupons"
print_call "POST /api/coupons/$WELCOME_COUPON/issue" -X POST "$BASE_URL/api/coupons/$WELCOME_COUPON/issue"
print_call "POST /api/coupons/preview" -X POST "$BASE_URL/api/coupons/preview?memberCouponId=$USABLE_MEMBER_COUPON&orderAmount=20000"
