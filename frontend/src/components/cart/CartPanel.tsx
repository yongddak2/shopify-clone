"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCart, removeCartItem, updateCartQuantity } from "@/lib/cart";
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
  const queryClient = useQueryClient();
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

  const refreshCart = () => {
    queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  const handleQuantityChange = async (item: CartItem, quantity: number) => {
    const nextQuantity = Math.max(1, Math.min(quantity, item.stockQuantity || quantity));
    if (nextQuantity === item.quantity) return;
    await updateCartQuantity(item.id, nextQuantity);
    refreshCart();
  };

  const handleRemove = async (cartItemId: number) => {
    await removeCartItem(cartItemId);
    refreshCart();
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40 animate-[cartFadeIn_0.2s_ease-out]"
        onClick={close}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[400px] bg-[var(--background)] shadow-2xl flex flex-col animate-[cartSlideIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)]">
          <h2 className="text-sm tracking-[0.2em] text-[var(--header-pink-accent)]">CART</h2>
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
                  <div className="mt-2 inline-flex items-center border border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="h-6 w-7 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="수량 감소"
                    >
                      -
                    </button>
                    <span className="h-6 min-w-8 px-2 text-center text-xs leading-6 text-[var(--text-primary)]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      disabled={item.stockQuantity > 0 && item.quantity >= item.stockQuantity}
                      className="h-6 w-7 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="수량 증가"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="text-sm text-[var(--text-primary)]">
                      {formatPrice(unitPrice(item) * item.quantity)}원
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="shrink-0 text-xs font-bold tracking-wide text-[var(--header-pink-accent)] underline underline-offset-2 transition-opacity hover:opacity-70"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-[var(--border-color)] p-4 space-y-2">
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm tracking-wider transition-colors hover:bg-[var(--btn-primary-hover)] disabled:opacity-50"
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
