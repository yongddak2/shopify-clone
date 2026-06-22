"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProductDetail } from "@/lib/product";
import { addToCart, getCart } from "@/lib/cart";
import { guestAddItem } from "@/lib/guestCart";
import { beginCheckout } from "@/lib/checkoutSession";
import { invalidateCartRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import { useCartPanelStore } from "@/stores/cartPanelStore";
import { X } from "lucide-react";

function formatPrice(p: number) {
  return p.toLocaleString("ko-KR");
}

interface SelectedItem {
  optionValueId: number;
  quantity: number;
}

export default function QuickAddPanel() {
  const router = useRouter();
  const qc = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const { mode, productId, openCart, close } = useCartPanelStore();
  const open = mode === "quickadd" && productId != null;

  const [items, setItems] = useState<SelectedItem[]>([]);
  const [freeQty, setFreeQty] = useState(1);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const { data } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductDetail(productId!),
    enabled: open,
  });
  const product = data?.data;
  const optionValues = product?.optionGroups?.[0]?.values ?? [];
  const isFree =
    optionValues.length === 0 ||
    (optionValues.length === 1 && optionValues[0].value === "FREE");

  useEffect(() => {
    if (open) {
      setItems([]);
      setFreeQty(1);
      setError("");
    }
  }, [open, productId]);

  if (!open) return null;

  const basePrice = product?.basePrice ?? 0;
  const rate = product?.discountRate ?? 0;
  const discountedBase =
    rate > 0 ? Math.round(basePrice * (1 - rate / 100)) : basePrice;
  const unitPriceOf = (ov?: { additionalPrice: number }) =>
    discountedBase + (ov?.additionalPrice ?? 0);
  const thumb =
    product?.images?.find((i) => i.isThumbnail)?.url ??
    product?.images?.[0]?.url ??
    null;
  const findOv = (id: number) => optionValues.find((v) => v.id === id);

  // 옵션 버튼 클릭 → 항목 행 추가 (이미 선택된 옵션은 무시)
  const selectOption = (id: number) => {
    setError("");
    setItems((prev) =>
      prev.some((i) => i.optionValueId === id)
        ? prev
        : [...prev, { optionValueId: id, quantity: 1 }]
    );
  };
  const changeRowQty = (id: number, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.optionValueId !== id) return i;
        const stock = findOv(id)?.stockQuantity ?? 0;
        let q = i.quantity + delta;
        if (q < 1) q = 1;
        if (stock > 0 && q > stock) q = stock;
        return { ...i, quantity: q };
      })
    );
  };
  const removeRow = (id: number) =>
    setItems((prev) => prev.filter((i) => i.optionValueId !== id));

  const totalQty = isFree
    ? freeQty
    : items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = isFree
    ? unitPriceOf(optionValues[0]) * freeQty
    : items.reduce(
        (s, i) => s + unitPriceOf(findOv(i.optionValueId)) * i.quantity,
        0
      );

  // 담을 항목 산출 (free 상품은 단일 항목)
  const resolveToAdd = (): SelectedItem[] => {
    if (isFree) {
      const fid = optionValues[0]?.id;
      return fid != null ? [{ optionValueId: fid, quantity: freeQty }] : [];
    }
    return items;
  };

  const handleAdd = async () => {
    const toAdd = resolveToAdd();
    if (toAdd.length === 0) {
      setError("옵션을 선택해주세요.");
      return;
    }
    setError("");
    setPending(true);
    try {
      for (const it of toAdd) {
        if (isLoggedIn()) {
          await addToCart(productId!, it.optionValueId, it.quantity);
        } else {
          const ov = findOv(it.optionValueId);
          guestAddItem({
            productId: productId!,
            productName: product!.name,
            optionValueId: it.optionValueId,
            optionValue: ov?.value ?? "",
            basePrice,
            additionalPrice: ov?.additionalPrice ?? 0,
            discountRate: rate,
            quantity: it.quantity,
            stockQuantity: ov?.stockQuantity ?? 0,
            thumbnailUrl: thumb,
          });
        }
      }
      invalidateCartRelated(qc);
      openCart(); // 담은 결과 CART 레이어로 전환 (회원·비회원 공통)
    } catch {
      setError("장바구니 담기에 실패했습니다.");
    } finally {
      setPending(false);
    }
  };

  const handleBuyNow = async () => {
    const toAdd = resolveToAdd();
    if (toAdd.length === 0) {
      setError("옵션을 선택해주세요.");
      return;
    }
    // 주문은 로그인 필수
    if (!isLoggedIn()) {
      close();
      router.push("/login");
      return;
    }
    setError("");
    setPending(true);
    try {
      for (const it of toAdd) {
        await addToCart(productId!, it.optionValueId, it.quantity);
      }
      const cart = await getCart();
      const ids = (cart.data ?? [])
        .filter((c) => toAdd.some((t) => t.optionValueId === c.optionValueId))
        .map((c) => c.id);
      if (ids.length === 0) {
        setError("주문 정보를 불러오지 못했습니다.");
        return;
      }
      beginCheckout(ids);
      invalidateCartRelated(qc);
      close();
      router.push("/order");
    } catch {
      setError("주문 처리에 실패했습니다.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[400px] bg-[var(--background)] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)]">
          <h2 className="text-sm tracking-[0.2em] text-[var(--text-primary)]">
            옵션 선택
          </h2>
          <button onClick={close} aria-label="닫기">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!product ? (
            <p className="text-sm text-[var(--text-muted)]">불러오는 중...</p>
          ) : (
            <>
              {/* 상품 요약 */}
              <div className="flex gap-3 pb-5 border-b border-[var(--border-color)]">
                <div className="w-16 h-20 bg-[var(--card-bg)] overflow-hidden shrink-0">
                  {thumb && (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {product.name}
                </p>
              </div>

              {/* 옵션 버튼 (옵션 상품만) */}
              {!isFree && (
                <div className="py-5 border-b border-[var(--border-color)]">
                  <p className="text-xs tracking-wider text-[var(--text-muted)] mb-3">
                    옵션
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {optionValues.map((v) => {
                      const out = v.stockQuantity === 0;
                      const active = items.some((i) => i.optionValueId === v.id);
                      return (
                        <button
                          key={v.id}
                          disabled={out}
                          onClick={() => selectOption(v.id)}
                          className={`px-3 py-2 text-xs border transition-colors ${
                            active
                              ? "border-[var(--header-pink-accent)] text-[var(--header-pink-accent)]"
                              : out
                                ? "border-[var(--border-color)] text-[var(--text-dim)] line-through cursor-not-allowed"
                                : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
                          }`}
                        >
                          {v.value}
                          {out && " (품절)"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 선택 항목 행 (옵션 상품) */}
              {!isFree &&
                items.map((i) => {
                  const ov = findOv(i.optionValueId);
                  const stock = ov?.stockQuantity ?? 0;
                  return (
                    <div
                      key={i.optionValueId}
                      className="flex items-start gap-2 py-4 border-b border-[var(--border-color)]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          - {ov?.value}
                        </p>
                        <div className="inline-flex items-center border border-[var(--border-color)] mt-2">
                          <button
                            className="w-7 h-7 text-[var(--text-secondary)] disabled:opacity-30"
                            onClick={() => changeRowQty(i.optionValueId, -1)}
                            disabled={i.quantity <= 1}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs text-[var(--text-primary)]">
                            {i.quantity}
                          </span>
                          <button
                            className="w-7 h-7 text-[var(--text-secondary)] disabled:opacity-30"
                            onClick={() => changeRowQty(i.optionValueId, 1)}
                            disabled={stock > 0 && i.quantity >= stock}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeRow(i.optionValueId)}
                        aria-label="삭제"
                        className="text-[var(--text-muted)] mt-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-[var(--text-primary)] whitespace-nowrap mt-0.5">
                        {formatPrice(unitPriceOf(ov) * i.quantity)}원
                      </span>
                    </div>
                  );
                })}

              {/* 수량 (옵션 없는 상품) */}
              {isFree && (
                <div className="py-5 border-b border-[var(--border-color)]">
                  <p className="text-xs tracking-wider text-[var(--text-muted)] mb-3">
                    수량
                  </p>
                  <div className="inline-flex items-center border border-[var(--border-color)]">
                    <button
                      className="w-9 h-9 text-[var(--text-secondary)] disabled:opacity-30"
                      onClick={() => setFreeQty((q) => Math.max(1, q - 1))}
                      disabled={freeQty <= 1}
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-sm text-[var(--text-primary)]">
                      {freeQty}
                    </span>
                    <button
                      className="w-9 h-9 text-[var(--text-secondary)] disabled:opacity-30"
                      onClick={() => {
                        const stock = optionValues[0]?.stockQuantity ?? 0;
                        setFreeQty((q) =>
                          stock > 0 ? Math.min(stock, q + 1) : q + 1
                        );
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* TOTAL */}
              <div className="flex items-center justify-between py-5">
                <span className="text-xs tracking-wider text-[var(--text-muted)]">
                  TOTAL (QUANTITY)
                </span>
                <span className="text-sm text-[var(--text-primary)]">
                  {formatPrice(totalPrice)}원{" "}
                  <span className="text-[var(--text-dim)]">({totalQty}개)</span>
                </span>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
            </>
          )}
        </div>

        <div className="border-t border-[var(--border-color)] p-4 space-y-2">
          <button
            onClick={handleBuyNow}
            disabled={pending}
            className="w-full py-3.5 bg-[var(--text-primary)] text-[var(--btn-primary-text)] text-sm tracking-wider disabled:opacity-50"
          >
            바로 구매하기
          </button>
          <button
            onClick={handleAdd}
            disabled={pending}
            className="w-full py-3.5 border border-[var(--text-primary)] text-[var(--text-primary)] text-sm tracking-wider disabled:opacity-50"
          >
            장바구니 담기
          </button>
        </div>
      </aside>
    </div>
  );
}
