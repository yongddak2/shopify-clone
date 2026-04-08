"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, updateCartQuantity, removeCartItem } from "@/lib/cart";
import { invalidateCartRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/common/Button";
import type { CartItem } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function originalPrice(item: CartItem) {
  return item.basePrice + item.additionalPrice;
}

function discountedPrice(item: CartItem) {
  const rate = item.discountRate ?? 0;
  const base = rate > 0 ? Math.round(item.basePrice * (1 - rate / 100)) : item.basePrice;
  return base + item.additionalPrice;
}

interface CartGroup {
  productId: number;
  productName: string;
  thumbnailUrl: string | null;
  items: CartItem[];
}

function groupByProduct(items: CartItem[]): CartGroup[] {
  const map = new Map<number, CartGroup>();
  for (const item of items) {
    const existing = map.get(item.productId);
    if (existing) {
      existing.items.push(item);
      if (!existing.thumbnailUrl && item.thumbnailUrl) {
        existing.thumbnailUrl = item.thumbnailUrl;
      }
    } else {
      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        thumbnailUrl: item.thumbnailUrl,
        items: [item],
      });
    }
  }
  const groups = Array.from(map.values());
  groups.sort((a, b) => {
    const maxA = Math.max(...a.items.map((i) => i.id));
    const maxB = Math.max(...b.items.map((i) => i.id));
    return maxB - maxA;
  });
  for (const group of groups) {
    group.items.sort((a, b) => a.id - b.id);
  }
  return groups;
}

const DELIVERY_THRESHOLD = 50000;
const DELIVERY_FEE = 3000;

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [orderError, setOrderError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    enabled: mounted && isLoggedIn(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      updateCartQuantity(id, quantity),
    onSuccess: () => invalidateCartRelated(queryClient),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeCartItem(id),
    onSuccess: () => {
      invalidateCartRelated(queryClient);
    },
  });

  const items = data?.data ?? [];
  const groups = useMemo(() => groupByProduct(items), [items]);

  // 초기 체크 상태: 빈 배열 (아무것도 체크 안 됨)
  useEffect(() => {
    if (items.length > 0 && !initialized) {
      setInitialized(true);
    }
  }, [items, initialized]);

  // 삭제 후 checkedIds에서 없어진 항목 + 재고 부족 항목 정리
  useEffect(() => {
    if (initialized && items.length > 0) {
      const validIds = new Set(
        items.filter((i) => i.quantity <= i.stockQuantity).map((i) => i.id)
      );
      setCheckedIds((prev) => {
        const next = new Set<number>();
        prev.forEach((id) => {
          if (validIds.has(id)) next.add(id);
        });
        return next;
      });
    }
  }, [items, initialized]);

  const hasOverStock = items.some((i) => i.quantity > i.stockQuantity);

  const toggleCheck = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableItems = items.filter((i) => i.quantity <= i.stockQuantity);
  const allChecked =
    selectableItems.length > 0 &&
    selectableItems.every((i) => checkedIds.has(i.id));

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(selectableItems.map((i) => i.id)));
    }
  };

  const checkedItems = items.filter((i) => checkedIds.has(i.id));
  const totalAmount = checkedItems.reduce(
    (sum, item) => sum + discountedPrice(item) * item.quantity,
    0
  );
  const deliveryFee =
    checkedItems.length === 0
      ? 0
      : totalAmount >= DELIVERY_THRESHOLD
        ? 0
        : DELIVERY_FEE;
  const finalAmount = totalAmount + deliveryFee;

  const handleRemove = (id: number) => {
    if (confirm("삭제하시겠습니까?")) {
      removeMutation.mutate(id);
    }
  };

  const handleBulkDelete = async () => {
    setDeleteConfirm(false);
    const ids = Array.from(checkedIds);
    for (const id of ids) {
      await removeCartItem(id);
    }
    setCheckedIds(new Set());
    invalidateCartRelated(queryClient);
  };

  const handleOrder = () => {
    const ids = Array.from(checkedIds);
    const checked = items.filter((i) => checkedIds.has(i.id));
    if (checked.some((i) => i.quantity > i.stockQuantity)) {
      setOrderError("재고가 부족한 상품은 주문할 수 없습니다.");
      return;
    }
    setOrderError("");
    sessionStorage.setItem("orderCartItemIds", JSON.stringify(ids));
    router.push("/order");
  };

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
        <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
          CART
        </h1>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-24 h-32 bg-[var(--skeleton)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--skeleton)] animate-pulse w-1/2" />
                <div className="h-4 bg-[var(--skeleton)] animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoggedIn()) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-[var(--text-muted)]">로그인이 필요합니다.</p>
        <Link
          href="/login"
          className="text-sm text-[var(--text-primary)] underline underline-offset-4"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
      <h1 className="text-2xl tracking-[0.2em] font-light text-center mb-12 text-[var(--text-primary)]">
        CART
      </h1>

      {isLoading && (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-24 h-32 bg-[var(--skeleton)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--skeleton)] animate-pulse w-1/2" />
                <div className="h-4 bg-[var(--skeleton)] animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)] mb-6">
            장바구니가 비어있습니다.
          </p>
          <Link
            href="/products"
            className="text-sm text-[var(--text-primary)] underline underline-offset-4"
          >
            쇼핑 계속하기
          </Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          {/* 재고 부족 경고 배너 */}
          {hasOverStock && (
            <div className="sticky top-0 z-40 mb-6 px-4 py-3 bg-orange-500/20 border border-orange-500 text-sm text-orange-300">
              ⚠ 재고가 부족한 상품이 있습니다. 수량을 조정하거나 해당 상품을 제거해주세요.
            </div>
          )}

          {/* 전체 선택 + 선택 삭제 */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--border-color)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="w-4 h-4 accent-[var(--text-primary)]"
              />
              <span className="text-sm text-[var(--text-secondary)]">
                전체 선택 ({checkedIds.size}/{items.length})
              </span>
            </label>
            {checkedIds.size > 0 && (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                선택 삭제
              </button>
            )}
          </div>

          {/* 장바구니 아이템 목록 */}
          <div className="space-y-6 mb-12">
            {groups.map((group) => {
              const groupOverStock = group.items.some((i) => i.quantity > i.stockQuantity);
              return (
              <div
                key={group.productId}
                className={`flex gap-4 py-6 border-b border-[var(--border-color)] transition-opacity ${
                  groupOverStock ? "opacity-40 grayscale" : ""
                }`}
              >
                {/* 썸네일 이미지 */}
                <div className="w-24 h-32 bg-[var(--card-bg)] flex-shrink-0 overflow-hidden">
                  {group.thumbnailUrl ? (
                    <img
                      src={group.thumbnailUrl}
                      alt={group.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--section-bg)]" />
                  )}
                </div>

                {/* 상품 정보 + 옵션 행들 */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${group.productId}`}
                    className="text-sm text-[var(--text-secondary)] hover:underline"
                  >
                    {group.productName}
                  </Link>

                  <div className="mt-3 space-y-3">
                    {group.items.map((item) => {
                      const isOverStock = item.quantity > item.stockQuantity;
                      const atMax = item.quantity >= item.stockQuantity;
                      return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          {/* 체크박스 */}
                          <input
                            type="checkbox"
                            checked={checkedIds.has(item.id) && !isOverStock}
                            onChange={() => toggleCheck(item.id)}
                            disabled={isOverStock}
                            className="w-4 h-4 accent-[var(--text-primary)] flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                          />

                          {/* 옵션값 */}
                          <span className="text-xs text-[var(--text-muted)] min-w-[3rem] flex-shrink-0">
                            {item.optionValue}
                          </span>

                          {/* 수량 조절 */}
                          <div className="inline-flex items-center border border-[var(--border-color)]">
                            <button
                              onClick={() =>
                                item.quantity > 1 &&
                                updateMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity - 1,
                                })
                              }
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={item.stockQuantity}
                              value={item.quantity}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (isNaN(v) || v < 1) return;
                                const next = item.stockQuantity > 0 && v > item.stockQuantity ? item.stockQuantity : v;
                                if (next === item.quantity) return;
                                updateMutation.mutate({ id: item.id, quantity: next });
                              }}
                              className="w-10 text-center text-xs text-[var(--text-secondary)] bg-transparent border-0 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <button
                              onClick={() => {
                                if (atMax) return;
                                updateMutation.mutate({
                                  id: item.id,
                                  quantity: item.quantity + 1,
                                });
                              }}
                              disabled={atMax}
                              className="w-7 h-7 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>

                          {/* 소계 */}
                          <div className="min-w-[5rem] text-right flex-1">
                            {(item.discountRate ?? 0) > 0 && (
                              <span className="text-xs text-[var(--text-dim)] line-through mr-1">
                                {formatPrice(originalPrice(item) * item.quantity)}원
                              </span>
                            )}
                            <span className="text-sm text-[var(--text-secondary)]">
                              {formatPrice(discountedPrice(item) * item.quantity)}원
                            </span>
                          </div>

                          {/* 삭제 */}
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="text-[var(--text-dim)] hover:text-[var(--text-primary)] text-lg flex-shrink-0"
                          >
                            ×
                          </button>
                        </div>
                        {isOverStock && (
                          <p className="text-sm text-red-400 ml-6">
                            재고 부족 (현재 재고: {item.stockQuantity}개)
                          </p>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* 요약 */}
          <div className="border-t border-[var(--border-color)] pt-8 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">총 상품 금액</span>
              <span className="text-[var(--text-secondary)]">{formatPrice(totalAmount)}원</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-muted)]">배송비</span>
              <span className="text-[var(--text-secondary)]">
                {checkedItems.length === 0
                  ? "—"
                  : deliveryFee === 0
                    ? "무료"
                    : `${formatPrice(deliveryFee)}원`}
              </span>
            </div>
            {deliveryFee > 0 && (
              <p className="text-xs text-[var(--text-muted)]">
                {formatPrice(DELIVERY_THRESHOLD)}원 이상 구매 시 무료배송
              </p>
            )}
            <div className="flex justify-between text-base font-medium pt-4 border-t border-[var(--border-color)]">
              <span className="text-[var(--text-primary)]">결제 예정 금액</span>
              <span className="text-[var(--text-primary)]">{formatPrice(finalAmount)}원</span>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="min-h-[1.25rem]">
              {orderError && <p className="text-sm text-red-400">{orderError}</p>}
            </div>
            <Button
              fullWidth
              onClick={handleOrder}
              disabled={checkedIds.size === 0}
            >
              {checkedIds.size === 0 ? "상품을 선택해주세요" : `주문하기 (${checkedIds.size}개)`}
            </Button>
            <button
              onClick={() => router.push("/products")}
              className="w-full py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
            >
              쇼핑 계속하기
            </button>
          </div>
        </>
      )}

      {/* 선택 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteConfirm(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              선택한 {checkedIds.size}개 상품을 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-3 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
