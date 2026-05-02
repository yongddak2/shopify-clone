#!/bin/bash
# coupon-test 공통 헬퍼 — 각 시나리오에서 source

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/tokens.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "tokens.env 없음. 먼저 setup.sh 실행하세요."
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"

PG="docker exec shop-postgres psql -U shop -d shopdb -tA"

# 응답 + status 출력 (HTTPSTATUS:NNN 마커)
print_call() {
  local label="$1" status body
  shift
  echo "[$label]"
  local response
  response=$(curl -s -w "\nHTTPSTATUS:%{http_code}" "$@")
  status=$(echo "$response" | grep -oE 'HTTPSTATUS:[0-9]+' | tail -1 | cut -d: -f2)
  body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
  echo "  HTTP: $status"
  echo "  BODY: $body"
  LAST_STATUS="$status"
  LAST_BODY="$body"
}

skip() {
  echo "[SKIP] $1"
}
