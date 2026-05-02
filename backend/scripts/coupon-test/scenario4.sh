#!/bin/bash
# S4 — 쿠폰 중복 발급 차단
# ADMIN(member_id=2)이 이미 발급받은 쿠폰을 다시 발급 시도 → 400 (COUPON_ALREADY_ISSUED)

source "$(dirname "$0")/_helpers.sh"

echo "=== S4: 중복 발급 차단 ==="
echo "ADMIN(member_id=2) 이미 발급된 쿠폰 id=$ALREADY_ISSUED_COUPON"

print_call "POST /api/coupons/$ALREADY_ISSUED_COUPON/issue (ADMIN)" -X POST "$BASE_URL/api/coupons/$ALREADY_ISSUED_COUPON/issue" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

echo ""
echo "[DB 검증] member_id=2, coupon_id=$ALREADY_ISSUED_COUPON 행 카운트"
COUNT=$($PG -c "SELECT COUNT(*) FROM member_coupon WHERE member_id=2 AND coupon_id=$ALREADY_ISSUED_COUPON;" | tr -d '[:space:]')
echo "  중복 발급 후 행 수: $COUNT (기대: 1, 증가하면 실패)"
