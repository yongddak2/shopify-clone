"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import { useAuthStore } from "@/stores/authStore";
import { Heart } from "lucide-react";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export default function MypageWishlistPage() {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["wishlists"],
    queryFn: getWishlists,
    enabled: isLoggedIn(),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => toggleWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });

  const items = data?.data ?? [];

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-8">
        찜 목록
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
                <p className="text-sm text-[var(--text-secondary)] mb-1">
                  {item.productName}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {formatPrice(item.productPrice)}원
                </p>
              </Link>
              <button
                onClick={() => removeMutation.mutate(item.productId)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
              >
                <Heart
                  className="w-4 h-4 text-red-400 fill-red-400"
                  strokeWidth={1.5}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
