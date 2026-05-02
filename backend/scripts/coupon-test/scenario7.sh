#!/bin/bash
# S7 — 쿠폰 할인 미리보기 검증
# - 정상: USABLE_MEMBER_COUPON 으로 preview → 200 + 할인 금액
# - 사용된 쿠폰: USED_MEMBER_COUPON → 400 (COUPON_NOT_USABLE)
# - 본인 아님: USER B 토큰 + USABLE_MEMBER_COUPON(ADMIN 소유) → 404 (MEMBER_COUPON_NOT_FOUND)

source "$(dirname "$0")/_helpers.sh"

echo "=== S7: 쿠폰 할인 미리보기 ==="
echo "USABLE_MEMBER_COUPON=$USABLE_MEMBER_COUPON ($USABLE_COUPON_INFO)"
echo "USED_MEMBER_COUPON=$USED_MEMBER_COUPON"

# minOrderAmount 조회 후 충분히 큰 orderAmount 사용 (정상 PASS 케이스)
USABLE_MIN=$($PG -c "SELECT COALESCE(c.min_order_amount, 0)::int FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id WHERE mc.id=$USABLE_MEMBER_COUPON;" | tr -d '[:space:]')
ORDER_AMOUNT_OK=$(( USABLE_MIN + 50000 ))
echo "USABLE_MIN=$USABLE_MIN -> orderAmount=$ORDER_AMOUNT_OK"

print_call "POST /api/coupons/preview (정상, orderAmount=$ORDER_AMOUNT_OK >= minOrderAmount)" -X POST "$BASE_URL/api/coupons/preview?memberCouponId=$USABLE_MEMBER_COUPON&orderAmount=$ORDER_AMOUNT_OK" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

print_call "POST /api/coupons/preview (minOrderAmount 미충족)" -X POST "$BASE_URL/api/coupons/preview?memberCouponId=$USABLE_MEMBER_COUPON&orderAmount=1" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

print_call "POST /api/coupons/preview (사용된 쿠폰)" -X POST "$BASE_URL/api/coupons/preview?memberCouponId=$USED_MEMBER_COUPON&orderAmount=$ORDER_AMOUNT_OK" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

print_call "POST /api/coupons/preview (USER B 토큰 + ADMIN 소유 mc)" -X POST "$BASE_URL/api/coupons/preview?memberCouponId=$USABLE_MEMBER_COUPON&orderAmount=$ORDER_AMOUNT_OK" \
  -H "Authorization: Bearer $USER_B_TOKEN"

print_call "POST /api/coupons/preview (존재하지 않는 mc)" -X POST "$BASE_URL/api/coupons/preview?memberCouponId=999999&orderAmount=$ORDER_AMOUNT_OK" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
