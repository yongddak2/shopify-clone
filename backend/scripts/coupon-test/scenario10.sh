#!/bin/bash
# S10 — validDays 기반 만료일 계산 확인
# Setup 단계에서 가입한 USER B 의 자동 발급 웰컴 쿠폰 expired_at 검증
# - 가입 시각 ≈ SIGNUP_TIME_BEFORE_SEC (epoch sec)
# - 기대 만료일 = MIN(가입일 + WELCOME_VALID_DAYS, coupon.end_date)
# - WELCOME_VALID_DAYS=30 / coupon.end_date 는 충분히 미래 → 가입일+30일이 채택되어야 함
# - 허용 오차 ±60초

source "$(dirname "$0")/_helpers.sh"

echo "=== S10: 웰컴 쿠폰 만료일 = MIN(가입일 + validDays, end_date) ==="
echo "USER B member_id=$USER_B_MEMBER_ID, validDays=$WELCOME_VALID_DAYS"

# DB 의 created_at / expired_at + coupon.end_date / valid_days 조회
ROW=$($PG -c "SELECT EXTRACT(EPOCH FROM mc.created_at)::bigint||'|'||EXTRACT(EPOCH FROM mc.expired_at)::bigint||'|'||EXTRACT(EPOCH FROM c.end_date)::bigint||'|'||c.valid_days FROM member_coupon mc JOIN coupon c ON c.id=mc.coupon_id WHERE mc.member_id=$USER_B_MEMBER_ID AND c.is_welcome=true;")
echo "raw: $ROW"

CREATED_SEC=$(echo "$ROW" | cut -d'|' -f1)
EXPIRED_SEC=$(echo "$ROW" | cut -d'|' -f2)
END_SEC=$(echo "$ROW" | cut -d'|' -f3)
VALID_DAYS=$(echo "$ROW" | cut -d'|' -f4)

EXPECTED_FROM_CREATED=$(( CREATED_SEC + VALID_DAYS * 86400 ))
EXPECTED=$EXPECTED_FROM_CREATED
if [ "$END_SEC" -lt "$EXPECTED_FROM_CREATED" ]; then
  EXPECTED=$END_SEC
  CHOSEN="coupon.end_date"
else
  CHOSEN="created_at + validDays"
fi

DIFF=$(( EXPIRED_SEC - EXPECTED ))
ABS_DIFF=${DIFF#-}

echo "created_at(epoch)            : $CREATED_SEC"
echo "expired_at(epoch, 실제)       : $EXPIRED_SEC"
echo "coupon.end_date(epoch)       : $END_SEC"
echo "valid_days                   : $VALID_DAYS"
echo "expected (=$CHOSEN)          : $EXPECTED"
echo "차이(초)                      : $DIFF (절대값 $ABS_DIFF)"

if [ "$ABS_DIFF" -le 60 ]; then
  echo "→ PASS: 허용 오차 ±60초 이내"
else
  echo "→ FAIL: 차이가 60초 초과"
fi
