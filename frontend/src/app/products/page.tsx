"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts, getCategories } from "@/lib/product";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import { invalidateWishlistRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import { Heart } from "lucide-react";
import type { Product } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function discountedPrice(base: number, rate: number) {
  return Math.round(base * (1 - rate / 100));
}

const SORT_OPTIONS = [
  { value: "createdAt,desc", label: "최신순" },
  { value: "basePrice,asc", label: "가격 낮은순" },
  { value: "basePrice,desc", label: "가격 높은순" },
  { value: "sales", label: "판매량순" },
];

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [page, setPage] = useState(0);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState(() => {
    const urlSort = searchParams.get("sort");
    if (urlSort && SORT_OPTIONS.some((o) => o.value === urlSort)) return urlSort;
    return "createdAt,desc";
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000, // 카테고리는 거의 안 바뀜
  });

  const { data, isLoading } = useQuery({
    queryKey: ["products", { page, categoryId, sort }],
    queryFn: () => getProducts({ page, size: 12, categoryId, sort }),
  });

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlists"],
    queryFn: getWishlists,
    enabled: isLoggedIn(),
  });

  const wishlistIds = new Set(
    wishlistData?.data?.map((item) => item.productId) ?? []
  );

  const wishlistMutation = useMutation({
    mutationFn: (productId: number) => toggleWishlist(productId),
    onSuccess: () => {
      invalidateWishlistRelated(queryClient);
    },
  });

  const handleWishlistClick = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn()) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
      return;
    }
    wishlistMutation.mutate(productId);
  };

  const categories = categoriesData?.data ?? [];
  const products = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      {/* 카테고리 필터 */}
      <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-8 border-b border-[var(--border-color)] scrollbar-hide">
        <button
          onClick={() => {
            setCategoryId(undefined);
            setPage(0);
          }}
          className={`text-xs tracking-widest whitespace-nowrap transition-colors ${
            categoryId === undefined
              ? "text-[var(--text-primary)] font-semibold border-b-2 border-[var(--text-primary)] pb-1"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          ALL
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategoryId(cat.id);
              setPage(0);
            }}
            className={`text-xs tracking-widest whitespace-nowrap transition-colors ${
              categoryId === cat.id
                ? "text-[var(--text-primary)] font-semibold border-b-2 border-[var(--text-primary)] pb-1"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 정렬 + 결과 수 */}
      <div className="flex items-center justify-between mb-8">
        <p className="text-xs text-[var(--text-muted)]">
          {data?.data?.totalElements ?? 0}개의 상품
        </p>
        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(0);
          }}
          className="text-xs text-[var(--text-secondary)] bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 focus:outline-none focus:border-[var(--text-muted)]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse mb-4" />
              <div className="h-4 bg-[var(--skeleton)] animate-pulse mb-2 w-3/4" />
              <div className="h-4 bg-[var(--skeleton)] animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* 상품 그리드 */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)] text-sm">
          상품이 없습니다.
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {products.map((product: Product) => {
            const isSoldOut = product.status === "SOLDOUT";
            const hasDiscount = product.discountRate > 0;
            const finalPrice = hasDiscount
              ? discountedPrice(product.basePrice, product.discountRate)
              : product.basePrice;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group"
              >
                {/* 이미지 */}
                <div className="relative aspect-[3/4] bg-[var(--card-bg)] mb-4 overflow-hidden">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--section-bg)] group-hover:scale-105 transition-transform duration-500" />
                  )}
                  {isSoldOut && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs tracking-[0.2em]">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleWishlistClick(e, product.id)}
                    className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        wishlistIds.has(product.id)
                          ? "text-red-400 fill-red-400"
                          : "text-white"
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
                {/* 정보 */}
                <p className="text-sm text-[var(--text-secondary)] mb-1">{product.name}</p>
                <div className="flex items-center gap-2">
                  {hasDiscount && (
                    <span className="text-sm text-[var(--text-dim)] line-through">
                      {formatPrice(product.basePrice)}원
                    </span>
                  )}
                  <span className="text-sm text-[var(--text-secondary)]">
                    {formatPrice(finalPrice)}원
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-red-400">
                      {product.discountRate}%
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-16">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 text-xs transition-colors ${
                page === i
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-[var(--text-muted)]">로딩 중...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
