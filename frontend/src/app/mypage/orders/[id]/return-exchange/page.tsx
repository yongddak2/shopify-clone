"use client";

import { useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReturnExchangeRequest,
  uploadReturnImage,
  getOrderDetail,
} from "@/lib/order";
import { getProductDetail } from "@/lib/product";
import { invalidateOrderRelated } from "@/lib/queryInvalidator";
import type { ReasonDetail, ReasonType } from "@/types";

const CHANGE_OF_MIND: { value: ReasonDetail; label: string }[] = [
  { value: "DISLIKE", label: "상품이 마음에 들지 않음" },
  { value: "WRONG_SIZE", label: "사이즈가 맞지 않음" },
  { value: "WRONG_ORDER", label: "주문을 잘못함 (옵션 선택 오류)" },
  { value: "FOUND_CHEAPER", label: "더 저렴한 상품을 발견함" },
];

const SELLER_FAULT: { value: ReasonDetail; label: string }[] = [
  { value: "WRONG_ITEM_SENT", label: "다른 상품이 배송됨 (오배송)" },
  { value: "WRONG_OPTION_SENT", label: "주문한 옵션과 다른 상품이 배송됨" },
  { value: "PRODUCT_DEFECT", label: "상품에 불량/하자가 있음" },
  { value: "DIFFERENT_FROM_DESC", label: "상품 설명과 실제 상품이 다름" },
  { value: "SEWING_DEFECT", label: "봉제/재봉 불량" },
];

const SELLER_FAULT_VALUES = new Set(SELLER_FAULT.map((r) => r.value));

const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_SIZE = 20 * 1024 * 1024;
const MAX_IMAGES = 3;

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function ReturnExchangePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { id } = use(params);
  const orderId = Number(id);
  const type = (searchParams.get("type") ?? "RETURN") as ReasonType;
  const title = type === "RETURN" ? "반품 신청" : "교환 신청";

  const [reasonDetail, setReasonDetail] = useState<ReasonDetail | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [desiredOptionValueId, setDesiredOptionValueId] = useState<number | null>(null);

  // 주문 정보 조회
  const { data: orderData, isLoading: orderLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrderDetail(orderId),
  });
  const order = orderData?.data;
  const firstItem = order?.orderItems?.[0];

  // 교환일 때만 상품 옵션 조회 (첫 번째 상품 기준)
  const { data: productData } = useQuery({
    queryKey: ["product", firstItem?.productId],
    queryFn: () => getProductDetail(firstItem!.productId),
    enabled: type === "EXCHANGE" && !!firstItem?.productId,
  });
  const optionValues =
    productData?.data?.optionGroups?.[0]?.values ?? [];

  const isSellerFault = reasonDetail ? SELLER_FAULT_VALUES.has(reasonDetail) : false;
  const optionRequiredOk =
    type !== "EXCHANGE" || desiredOptionValueId !== null;
  const canSubmit =
    !!reasonDetail &&
    reasonText.trim().length > 0 &&
    optionRequiredOk &&
    !submitting;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";

    if (imageUrls.length + files.length > MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXT.includes(ext)) {
        alert("jpg, jpeg, png, gif, webp 파일만 업로드 가능합니다.");
        return;
      }
      if (file.size > MAX_SIZE) {
        alert("파일 크기는 20MB 이하여야 합니다.");
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const url = await uploadReturnImage(file);
        uploaded.push(url);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!reasonDetail || !reasonText.trim()) return;
    if (type === "EXCHANGE" && !desiredOptionValueId) {
      alert("교환을 원하는 옵션을 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      await createReturnExchangeRequest(orderId, {
        type,
        reasonDetail,
        reasonText: reasonText.trim(),
        imageUrls,
        ...(type === "EXCHANGE" && desiredOptionValueId
          ? { desiredOptionValueId }
          : {}),
      });
      invalidateOrderRelated(queryClient);
      alert("신청이 완료되었습니다. 영업일 기준 3~5일 내 처리됩니다.");
      router.push("/mypage/orders");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      const msg = err?.response?.data?.error?.message ?? "신청에 실패했습니다.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          ← 뒤로가기
        </button>
      </div>

      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-6">
        {title}
      </h2>

      {/* 주문 상품 정보 */}
      <section className="mb-8">
        <h3 className="text-sm text-[var(--text-secondary)] mb-3">주문 상품</h3>
        {orderLoading && (
          <div className="h-20 bg-[var(--skeleton)] animate-pulse" />
        )}
        {order && (
          <div className="border border-[var(--border-color)]">
            {(order.orderItems ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border-color)] last:border-b-0"
              >
                <div className="w-[60px] h-[60px] bg-[var(--card-bg)] flex-shrink-0 overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.productNameSnapshot}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--section-bg)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {item.productNameSnapshot}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {item.optionInfoSnapshot} / {item.quantity}개
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {formatPrice(item.subtotal)}원
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 교환 시 옵션 선택 */}
      {type === "EXCHANGE" && (
        <section className="mb-8">
          <h3 className="text-sm text-[var(--text-secondary)] mb-3">
            원하시는 옵션을 선택해주세요
          </h3>
          <select
            value={desiredOptionValueId ?? ""}
            onChange={(e) =>
              setDesiredOptionValueId(
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="w-full p-3 bg-[var(--card-bg)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-muted)]"
          >
            <option value="">옵션 선택</option>
            {optionValues.map((opt) => {
              const soldOut = opt.stockQuantity <= 0;
              return (
                <option key={opt.id} value={opt.id} disabled={soldOut}>
                  {opt.value}
                  {soldOut ? " (품절)" : ` (재고: ${opt.stockQuantity}개)`}
                </option>
              );
            })}
          </select>
        </section>
      )}

      {/* 사유 선택 */}
      <section className="mb-8">
        <h3 className="text-sm text-[var(--text-secondary)] mb-4">사유 선택</h3>

        <div className="mb-4">
          <p className="text-xs text-[var(--text-muted)] mb-2 tracking-wider">
            [단순 변심]
          </p>
          <div className="space-y-2">
            {CHANGE_OF_MIND.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reasonDetail === r.value}
                  onChange={() => setReasonDetail(r.value)}
                  className="accent-white"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-[var(--text-muted)] mb-2 tracking-wider">
            [상품/배송 문제]
          </p>
          <div className="space-y-2">
            {SELLER_FAULT.map((r) => (
              <label
                key={r.value}
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer"
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reasonDetail === r.value}
                  onChange={() => setReasonDetail(r.value)}
                  className="accent-white"
                />
                {r.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* 상세 사유 */}
      <section className="mb-8">
        <h3 className="text-sm text-[var(--text-secondary)] mb-3">상세 사유</h3>
        <div className="relative">
          <textarea
            value={reasonText}
            onChange={(e) => {
              if (e.target.value.length <= 500) setReasonText(e.target.value);
            }}
            placeholder="자세한 사유를 입력해주세요. (필수)"
            rows={5}
            className="w-full p-3 bg-[var(--card-bg)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] resize-none focus:outline-none focus:border-[var(--text-muted)]"
          />
          <span className="absolute bottom-2 right-3 text-xs text-[var(--text-dim)]">
            {reasonText.length}/500
          </span>
        </div>
        {isSellerFault && (
          <p className="mt-2 text-xs text-yellow-400">
            ⚠ 상품 상태 사진을 첨부하시면 처리가 빨라집니다.
          </p>
        )}
      </section>

      {/* 사진 첨부 */}
      <section className="mb-8">
        <h3 className="text-sm text-[var(--text-secondary)] mb-3">
          사진 첨부 ({imageUrls.length}/{MAX_IMAGES})
        </h3>
        <div className="flex gap-3 flex-wrap">
          {imageUrls.map((url, idx) => (
            <div key={idx} className="relative w-[100px] h-[100px]">
              <img
                src={url}
                alt={`첨부 ${idx + 1}`}
                className="w-full h-full object-cover border border-[var(--border-color)]"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/80 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          {imageUrls.length < MAX_IMAGES && (
            <label className="w-[100px] h-[100px] border border-dashed border-[var(--border-color)] flex items-center justify-center text-2xl text-[var(--text-muted)] cursor-pointer hover:border-[var(--text-muted)]">
              {uploading ? "..." : "+"}
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      </section>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm tracking-wider hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "신청 중..." : "신청하기"}
      </button>
    </div>
  );
}
