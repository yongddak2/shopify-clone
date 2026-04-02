"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPayment } from "@/lib/payment";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    confirmPayment({
      paymentKey,
      orderId,
      amount: Number(amount),
    })
      .then((res) => {
        setStatus("success");
        setTimeout(() => {
          router.replace(`/orders/${res.data.orderId}`);
        }, 2000);
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("결제 승인에 실패했습니다. 고객센터에 문의해주세요.");
      });
  }, [searchParams, router]);

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      {status === "loading" && (
        <>
          <div className="w-10 h-10 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin mx-auto mb-6" />
          <p className="text-sm text-[var(--text-secondary)]">결제를 승인하고 있습니다...</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-[var(--badge-green-text)] rounded-full">
            <svg className="w-8 h-8 text-[var(--badge-green-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-light tracking-wider text-[var(--text-primary)] mb-3">
            결제가 완료되었습니다
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            주문 상세 페이지로 이동합니다...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border-2 border-red-400 rounded-full">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-light tracking-wider text-[var(--text-primary)] mb-3">
            결제 승인 실패
          </h1>
          <p className="text-sm text-red-400 mb-8">{errorMessage}</p>
          <button
            onClick={() => router.replace("/orders")}
            className="px-6 py-3 text-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
          >
            주문 내역으로 이동
          </button>
        </>
      )}
    </div>
  );
}
