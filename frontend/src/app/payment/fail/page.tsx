"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentFailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get("code") ?? "";
  const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-red-400 rounded-full">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-xl font-light tracking-wider text-[var(--text-primary)] mb-3">
        결제 실패
      </h1>
      <p className="text-sm text-red-400 mb-2">{message}</p>
      {code && (
        <p className="text-xs text-[var(--text-dim)] mb-8">오류 코드: {code}</p>
      )}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.replace("/cart")}
          className="px-6 py-3 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
        >
          장바구니로 돌아가기
        </button>
        <button
          onClick={() => router.replace("/orders")}
          className="px-6 py-3 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
        >
          주문 내역
        </button>
      </div>
    </div>
  );
}
