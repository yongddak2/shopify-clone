"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { confirmPayment } from "@/lib/payment";
import { invalidateAfterPayment } from "@/lib/queryInvalidator";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

interface PaymentResult {
  orderId: number;
  orderNumber: string;
  amount: number;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<PaymentResult | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderNumber = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderNumber || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    confirmPayment({
      paymentKey,
      orderNumber,
      amount: Number(amount),
    })
      .then((res) => {
        setResult({
          orderId: res.data.orderId,
          orderNumber: res.data.orderNumber,
          amount: res.data.amount,
        });
        setStatus("success");

        // 결제 완료 — 주문/장바구니/재고/쿠폰 모두 무효화 + sessionStorage 정리
        invalidateAfterPayment(queryClient);
        try {
          sessionStorage.removeItem("orderCartItemIds");
        } catch {
          // ignore
        }
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("결제 승인에 실패했습니다. 고객센터에 문의해주세요.");
      });
  }, [searchParams]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {status === "loading" && (
        <>
          <div className="w-10 h-10 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin mx-auto mb-6" />
          <p className="text-sm text-[var(--text-secondary)]">
            결제를 승인하고 있습니다...
          </p>
        </>
      )}

      {status === "success" && result && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-[var(--badge-green-text)] rounded-full">
            <svg
              className="w-8 h-8 text-[var(--badge-green-text)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-light tracking-wider text-[var(--text-primary)] mb-6">
            주문이 완료되었습니다!
          </h1>

          <div className="space-y-2 mb-10">
            <p className="text-sm text-[var(--text-muted)]">
              주문번호:{" "}
              <span className="text-[var(--text-secondary)]">
                {result.orderNumber}
              </span>
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              결제 금액:{" "}
              <span className="text-[var(--text-secondary)]">
                {formatPrice(result.amount)}원
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
            >
              쇼핑 계속하기
            </Link>
            <Link
              href="/mypage/orders"
              className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
            >
              주문 상세 보기
            </Link>
          </div>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-red-400 rounded-full">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-light tracking-wider text-[var(--text-primary)] mb-3">
            결제 승인 실패
          </h1>
          <p className="text-sm text-red-400 mb-8">{errorMessage}</p>
          <Link
            href="/mypage/orders"
            className="inline-block px-6 py-3 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
          >
            주문 내역으로 이동
          </Link>
        </>
      )}
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-6 py-24 text-center text-[var(--text-muted)]">로딩 중...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
