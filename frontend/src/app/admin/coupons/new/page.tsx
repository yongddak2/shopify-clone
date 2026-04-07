"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCoupon } from "@/lib/admin";

export default function NewCouponPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState("FIXED");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      router.push("/admin/coupons");
    },
    onError: () => setError("쿠폰 생성에 실패했습니다"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("쿠폰명을 입력하세요"); return; }
    if (!discountValue || Number(discountValue) <= 0) { setError("할인 값을 입력하세요"); return; }
    if (!minOrderAmount) { setError("최소 주문 금액을 입력하세요"); return; }
    if (!totalQuantity) { setError("총 발급 수량을 입력하세요"); return; }
    if (!startDate || !endDate) { setError("기간을 입력하세요"); return; }

    mutation.mutate({
      name: name.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount),
      ...(discountType === "PERCENT" && maxDiscountAmount
        ? { maxDiscountAmount: Number(maxDiscountAmount) }
        : {}),
      totalQuantity: Number(totalQuantity),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  const inputClass =
    "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        NEW COUPON
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">쿠폰명 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">할인 타입 *</label>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={inputClass}>
              <option value="FIXED">FIXED (정액)</option>
              <option value="PERCENT">PERCENT (정률)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              할인 값 * {discountType === "PERCENT" ? "(%)" : "(원)"}
            </label>
            <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">최소 주문 금액 *</label>
            <input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              최대 할인 금액 {discountType === "FIXED" && "(PERCENT 전용)"}
            </label>
            <input
              type="number"
              value={maxDiscountAmount}
              onChange={(e) => setMaxDiscountAmount(e.target.value)}
              disabled={discountType === "FIXED"}
              className={`${inputClass} disabled:opacity-40 disabled:cursor-not-allowed`}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">총 발급 수량 *</label>
            <input type="number" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">시작일 *</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">종료일 *</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="min-h-[1.5rem]">
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">취소</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors">
            {mutation.isPending ? "생성 중..." : "생성"}
          </button>
        </div>
      </form>
    </div>
  );
}
