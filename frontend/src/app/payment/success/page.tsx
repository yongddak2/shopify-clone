"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { clearCheckoutSession } from "@/lib/checkoutSession";
import { invalidateAfterPayment } from "@/lib/queryInvalidator";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");
  const amount = Number(searchParams.get("amount"));
  const valid = Boolean(orderId && orderNumber && Number.isFinite(amount));

  useEffect(() => {
    if (!valid) return;
    invalidateAfterPayment(queryClient);
    clearCheckoutSession();
  }, [queryClient, valid]);

  if (!valid) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <h1 className="text-xl text-[var(--text-primary)] mb-4">
          결제 정보를 확인할 수 없습니다.
        </h1>
        <Link href="/mypage/orders" className="text-sm underline">
          주문 내역으로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-[var(--badge-green-text)] rounded-full">
        <svg className="w-8 h-8 text-[var(--badge-green-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-xl font-light tracking-wider text-[var(--text-primary)] mb-6">
        주문이 완료되었습니다!
      </h1>
      <div className="space-y-2 mb-10">
        <p className="text-sm text-[var(--text-muted)]">
          주문번호: <span className="text-[var(--text-secondary)]">{orderNumber}</span>
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          결제 금액: <span className="text-[var(--text-secondary)]">{formatPrice(amount)}원</span>
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/" className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)]">
          쇼핑 계속하기
        </Link>
        <Link href={`/mypage/orders/${orderId}`} className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]">
          주문 상세 보기
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-24 text-center">로딩 중...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
