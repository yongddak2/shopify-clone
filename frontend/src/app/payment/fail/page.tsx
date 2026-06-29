"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { readPendingCheckout, clearCheckoutSession } from "@/lib/checkoutSession";
import { cancelOrder } from "@/lib/order";

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const code = searchParams.get("code") ?? "";
  const message = searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";

  useEffect(() => {
    // PC 브라우저에서 NICE V2 SDK가 팝업 방식으로 동작할 때
    // 팝업 안에 fail 페이지가 로드되는 경우 → 메인 창을 이 URL로 이동 후 팝업 닫기
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.location.replace(window.location.href);
        window.close();
        return;
      } catch {
        // 크로스 오리진 등으로 opener 접근 불가 시 그냥 계속 진행
      }
    }

    const pending = readPendingCheckout();
    if (pending) {
      setPendingOrderId(pending.orderId);
    }
  }, []);

  const handleCancelOrder = async () => {
    if (!pendingOrderId) return;
    setCancelling(true);
    try {
      await cancelOrder(pendingOrderId);
    } catch {}
    clearCheckoutSession();
    router.replace("/mypage/orders");
  };

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
      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={() => router.replace("/order")}
          className="px-6 py-3 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
        >
          결제 다시 시도하기
        </button>
        {pendingOrderId && (
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="px-6 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-50"
          >
            {cancelling ? "취소 중..." : "주문 취소"}
          </button>
        )}
        <button
          onClick={() => router.replace("/mypage/orders")}
          className="px-6 py-3 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
        >
          주문 내역
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-24 text-center text-[var(--text-muted)]">로딩 중...</div>}>
      <PaymentFailContent />
    </Suspense>
  );
}
