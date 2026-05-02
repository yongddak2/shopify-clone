#!/bin/bash
# S3 — 웰컴 쿠폰 자동 발급 확인
# Setup 단계에서 가입한 USER B 가 웰컴 쿠폰을 자동 발급받았는지 검증
# - GET /api/coupons/me 응답에 웰컴 쿠폰 포함
# - DB 조회로 member_coupon 행 존재 + coupon.is_welcome=true 확인

source "$(dirname "$0")/_helpers.sh"

echo "=== S3: 웰컴 쿠폰 자동 발급 확인 ==="
echo "USER B member_id=$USER_B_MEMBER_ID, 활성 웰컴 쿠폰 id=$WELCOME_COUPON"

print_call "GET /api/coupons/me (USER B)" -X GET "$BASE_URL/api/coupons/me" \
  -H "Authorization: Bearer $USER_B_TOKEN"

echo ""
echo "[DB 검증]"
WELCOME_ROW=$($PG -c "SELECT mc.id||'|'||mc.coupon_id||'|'||c.is_welcome||'|'||to_char(mc.expired_at,'YYYY-MM-DD HH24:MI:SS') FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id WHERE mc.member_id=$USER_B_MEMBER_ID AND c.is_welcome=true;")
echo "  member_coupon 행: $WELCOME_ROW"
ROW_COUNT=$($PG -c "SELECT COUNT(*) FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id WHERE mc.member_id=$USER_B_MEMBER_ID AND c.is_welcome=true;" | tr -d '[:space:]')
echo "  is_welcome=true 행 수: $ROW_COUNT (기대: 1)"
