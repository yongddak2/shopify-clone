"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import { useAuthStore } from "@/stores/authStore";
import { Heart } from "lucide-react";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}.${mm}.${dd}`;
}

export default function MypageWishlistPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  // 페이지 머무는 동안만 유지되는 "해제된 상품" 상태.
  // 카드를 즉시 제거하지 않고 하트 아이콘만 비활성화로 표시한다.
  // 새로고침/페이지 재진입 시 ["wishlists"] 쿼리가 다시 fetch되며 자연스럽게 사라진다.
  const [toggledOff, setToggledOff] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["wishlists"],
    queryFn: getWishlists,
    enabled: isLoggedIn(),
  });

  const toggleMutation = useMutation({
    mutationFn: (productId: number) => toggleWishlist(productId),
    // 이 페이지에 있는 동안에는 캐시를 invalidate하지 않는다.
    // (즉시 사라지는 것을 막기 위함 — 새로고침 시점에 갱신됨)
  });

  const handleToggle = (productId: number) => {
    setToggledOff((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    toggleMutation.mutate(productId);
  };

  const items = data?.data ?? [];

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-8">
        찜 목록
        {!isLoading && (
          <span className="text-sm text-[var(--text-muted)] ml-2 font-normal">
            ({items.length})
          </span>
        )}
      </h2>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse mb-4" />
              <div className="h-4 bg-[var(--skeleton)] animate-pulse mb-2 w-3/4" />
              <div className="h-4 bg-[var(--skeleton)] animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)] mb-6">
            찜한 상품이 없습니다.
          </p>
          <Link
            href="/products"
            className="text-sm text-[var(--text-primary)] underline underline-offset-4"
          >
            쇼핑하러 가기
          </Link>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={`/products/${item.productId}`}>
                <div className="aspect-[3/4] bg-[var(--card-bg)] mb-4 overflow-hidden">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--section-bg)] group-hover:scale-105 transition-transform duration-500" />
                  )}
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-1 truncate">
                  {item.productName}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  {formatPrice(item.productPrice)}원
                </p>
                <p className="text-[10px] text-[var(--text-dim)]">
                  {formatDate(item.createdAt)} 찜
                </p>
              </Link>
              {/* 하트 토글 (즉시 제거되지 않음 — 새로고침 시 사라짐) */}
              <button
                onClick={() => handleToggle(item.productId)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
              >
                <Heart
                  className={
                    toggledOff.has(item.productId)
                      ? "w-4 h-4 text-white"
                      : "w-4 h-4 text-red-400 fill-red-400"
                  }
                  strokeWidth={1.5}
                />
              </button>
              {/* 장바구니 담기 */}
              <button
                onClick={() => router.push(`/products/${item.productId}`)}
                className="mt-2 w-full py-2 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
              >
                장바구니 담기
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
