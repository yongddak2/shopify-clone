#!/bin/bash
# S10 — 이미지 업로드 4장 초과. 기대 400.
# 주의: POST /api/return-requests/images 는 단일 파일(MultipartFile file) 엔드포인트다.
# 백엔드는 호출당 1장만 받고 4장 일괄 검증은 하지 않으므로
#   (1) 단일 호출에 file 파라미터 4개 첨부 (curl -F 다중 -F file=)
#   (2) 4번 연속 업로드
# 두 가지 모두 시도해 결과를 그대로 기록한다.
# 또한 createRequest 본체 단계의 imageUrls 4장 검증(TOO_MANY_IMAGES)도 별도 검증한다.
source "$(dirname "$0")/_helpers.sh"

echo "=== S10 이미지 업로드 4장 초과 ==="
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# 1KB 짜리 더미 png 4개 생성 (파일 매직 바이트 + 패딩, 검증은 확장자만 보므로 OK)
for i in 1 2 3 4; do
  dd if=/dev/zero of="$TMP_DIR/img$i.png" bs=1024 count=1 status=none
done

echo "-- (a) 단일 요청에 file 파라미터 4개 첨부"
print_call "POST /api/return-requests/images x4 multipart" \
  -X POST "$BASE_URL/api/return-requests/images" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -F "file=@$TMP_DIR/img1.png" \
  -F "file=@$TMP_DIR/img2.png" \
  -F "file=@$TMP_DIR/img3.png" \
  -F "file=@$TMP_DIR/img4.png"

echo "-- (b) imageUrls 4장으로 신청 시도 (TOO_MANY_IMAGES 기대)"
TARGET="${ORDER_DELIVERED_NEW_1:-${ORDER_DELIVERED_CONFIRMED:-$ORDER_ANY}}"
print_call "POST /api/orders/$TARGET/return-exchange (imageUrls=4)" \
  -X POST "$BASE_URL/api/orders/$TARGET/return-exchange" \
  -H "Authorization: Bearer $USER_A_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"RETURN","reasonDetail":"DISLIKE","reasonText":"S10","imageUrls":["a","b","c","d"]}'
