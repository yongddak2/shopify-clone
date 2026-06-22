"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/lib/cart";
import { beginCheckout } from "@/lib/checkoutSession";
import { useAuthStore } from "@/stores/authStore";
import { useCartPanelStore } from "@/stores/cartPanelStore";
import type { CartItem } from "@/types";
import { X } from "lucide-react";

function formatPrice(p: number) {
  return p.toLocaleString("ko-KR");
}

function unitPrice(item: CartItem) {
  const r = item.discountRate ?? 0;
  const base = r > 0 ? Math.round(item.basePrice * (1 - r / 100)) : item.basePrice;
  return base + item.additionalPrice;
}

export default function CartPanel() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { mode, close } = useCartPanelStore();
  const open = mode === "cart";

  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: open,
  });
  const items = data?.data ?? [];

  if (!open) return null;

  const handleCheckout = () => {
    if (items.length === 0) return;
    // 주문은 로그인 필수 — 비회원은 로그인 유도 (로그인 시 장바구니가 서버로 병합됨)
    if (!isLoggedIn()) {
      close();
      router.push("/login");
      return;
    }
    beginCheckout(items.map((i) => i.id));
    close();
    router.push("/order");
  };

  const goCart = () => {
    close();
    router.push("/cart");
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[400px] bg-[var(--background)] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)]">
          <h2 className="text-sm tracking-[0.2em] text-[var(--text-primary)]">CART</h2>
          <button onClick={close} aria-label="닫기">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-20">
              장바구니가 비어 있습니다.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 px-6 py-4 border-b border-[var(--border-color)]"
              >
                <div className="w-16 h-20 bg-[var(--card-bg)] overflow-hidden shrink-0">
                  {item.thumbnailUrl && (
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-secondary)] truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    [옵션: {item.optionValue}]
                  </p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">
                    수량 : {item.quantity}
                  </p>
                  <p className="text-sm text-[var(--text-primary)] mt-1">
                    {formatPrice(unitPrice(item) * item.quantity)}원
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--border-color)] p-4 space-y-2">
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full py-3.5 bg-[var(--text-primary)] text-[var(--btn-primary-text)] text-sm tracking-wider disabled:opacity-50"
          >
            바로 구매하기
          </button>
          <button
            onClick={goCart}
            className="w-full py-3.5 border border-[var(--text-primary)] text-[var(--text-primary)] text-sm tracking-wider"
          >
            장바구니 이동
          </button>
        </div>
      </aside>
    </div>
  );
}
