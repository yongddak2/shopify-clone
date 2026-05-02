#!/usr/bin/env bash
# 시나리오 5: ADMIN 본인 차단 규칙
# ADMIN 토큰으로 본인의 권한 변경/탈퇴를 시도 → 차단되어야 함

set -u
BASE="${BASE:-http://localhost:8080}"
ADMIN=$(cat /tmp/admin.tok)

# ADMIN userId — 토큰의 sub 클레임에서 추출
ADMIN_ID=$(node -e "
const t = process.argv[1];
const p = JSON.parse(Buffer.from(t.split('.')[1], 'base64url'));
console.log(p.sub);
" "$ADMIN")
echo "ADMIN_ID=$ADMIN_ID"

echo "=== ADMIN 본인 권한 변경 ==="
curl -s -X PATCH "$BASE/api/admin/users/$ADMIN_ID/role" \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"role":"USER"}' -o /tmp/_b -w "STATUS:%{http_code}\n"
cat /tmp/_b | head -c 300; echo ""

echo "=== ADMIN 본인 강제 탈퇴 ==="
curl -s -X DELETE "$BASE/api/admin/users/$ADMIN_ID" \
  -H "Authorization: Bearer $ADMIN" -o /tmp/_b -w "STATUS:%{http_code}\n"
cat /tmp/_b | head -c 300; echo ""
