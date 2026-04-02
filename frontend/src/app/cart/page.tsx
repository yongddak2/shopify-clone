"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, updateCartQuantity, removeCartItem } from "@/lib/cart";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/common/Button";
import type { CartItem } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function itemPrice(item: { basePrice: number; additionalPrice: number }) {
  return item.basePrice + item.additionalPrice;
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
  // 그룹: 그룹 내 가장 큰 id 기준 내림차순 (최근 담은 상품이 위)
  groups.sort((a, b) => {
    const maxA = Math.max(...a.items.map((i) => i.id));
    const maxB = Math.max(...b.items.map((i) => i.id));
    return maxB - maxA;
  });
  // 그룹 내 옵션: id 오름차순
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeCartItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const handleRemove = (id: number) => {
    if (confirm("삭제하시겠습니까?")) {
      removeMutation.mutate(id);
    }
  };

  const items = data?.data ?? [];
  const groups = useMemo(() => groupByProduct(items), [items]);

  const totalAmount = items.reduce(
    (sum, item) => sum + itemPrice(item) * item.quantity,
    0
  );
  const deliveryFee = totalAmount >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const finalAmount = totalAmount + deliveryFee;

  // mounted 전 로딩
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

  // 비로그인
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
          {/* 장바구니 아이템 목록 (상품 그룹별) */}
          <div className="space-y-6 mb-12">
            {groups.map((group) => (
              <div
                key={group.productId}
                className="flex gap-4 py-6 border-b border-[var(--border-color)]"
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
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2"
                      >
                        {/* 옵션값 */}
                        <span className="text-xs text-[var(--text-muted)] w-10 flex-shrink-0">
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
                            className="w-7 h-7 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs text-[var(--text-secondary)]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateMutation.mutate({
                                id: item.id,
                                quantity: item.quantity + 1,
                              })
                            }
                            className="w-7 h-7 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          >
                            +
                          </button>
                        </div>

                        {/* 소계 */}
                        <span className="text-sm text-[var(--text-secondary)] min-w-[5rem] text-right">
                          {formatPrice(itemPrice(item) * item.quantity)}원
                        </span>

                        {/* 삭제 */}
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-[var(--text-dim)] hover:text-[var(--text-primary)] text-lg flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
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
                {deliveryFee === 0 ? "무료" : `${formatPrice(deliveryFee)}원`}
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

          <div className="mt-8">
            <Button fullWidth onClick={() => router.push("/order")}>
              주문하기
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
