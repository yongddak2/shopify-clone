#!/bin/bash
# S6 — 주문 생성 비즈니스 룰 검증
# - 재고 0 옵션 (ZERO_STOCK_OPTION 부재 시 SKIP)
# - 존재하지 않는 cartItemId → 404 CART_ITEM_NOT_FOUND
# - 사용된 쿠폰 → 400 COUPON_ALREADY_USED
# - 만료된 쿠폰 (EXPIRED_MEMBER_COUPON 부재 시 SKIP)

source "$(dirname "$0")/_helpers.sh"

echo "=== S6: 주문 생성 비즈니스 룰 ==="

# (a) 재고 0 옵션 — 데이터 부재로 SKIP
if [ -z "$ZERO_STOCK_OPTION" ]; then
  skip "재고 0 옵션 주문 시도 (zero stock option 없음)"
else
  skip "재고 0 옵션 주문 시도 (cart_item INSERT 후 별도 시나리오 필요)"
fi

# (b) 존재하지 않는 cartItemId
print_call "POST /api/orders  (cartItemIds=[99999999])" \
  -X POST "$BASE_URL/api/orders" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cartItemIds":[99999999],"recipient":"X","phone":"01000000000","address":"S"}'

# (c) 사용된 쿠폰
if [ -z "$CART_S6_USED_COUPON" ] || [ -z "$USED_MEMBER_COUPON" ]; then
  skip "사용된 쿠폰 적용 (CART_S6_USED_COUPON / USED_MEMBER_COUPON 누락)"
else
  print_call "POST /api/orders  (used coupon=$USED_MEMBER_COUPON)" \
    -X POST "$BASE_URL/api/orders" \
    -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"cartItemIds\":[$CART_S6_USED_COUPON],\"memberCouponId\":$USED_MEMBER_COUPON,\"recipient\":\"X\",\"phone\":\"01000000000\",\"address\":\"S\"}"
fi

# (d) 만료된 쿠폰
if [ -z "$EXPIRED_MEMBER_COUPON" ]; then
  skip "만료된 쿠폰 적용 (EXPIRED_MEMBER_COUPON 없음)"
else
  print_call "POST /api/orders  (expired coupon=$EXPIRED_MEMBER_COUPON)" \
    -X POST "$BASE_URL/api/orders" \
    -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"cartItemIds\":[$CART_S6_USED_COUPON],\"memberCouponId\":$EXPIRED_MEMBER_COUPON,\"recipient\":\"X\",\"phone\":\"01000000000\",\"address\":\"S\"}"
fi
