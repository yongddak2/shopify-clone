"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchProducts, getCategories } from "@/lib/product";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import { invalidateWishlistRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
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
  { value: "viewCount,desc", label: "인기순" },
];

function PageNumbers({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(0, currentPage - half);
    let end = start + maxVisible - 1;
    if (end >= totalPages) {
      end = totalPages - 1;
      start = end - maxVisible + 1;
    }
    if (start > 0) {
      pages.push(0);
      if (start > 1) pages.push("...");
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) {
      if (end < totalPages - 2) pages.push("...");
      pages.push(totalPages - 1);
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, idx) =>
        p === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="w-8 h-8 flex items-center justify-center text-xs text-[var(--text-dim)]"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 flex items-center justify-center text-xs transition-colors ${
              p === currentPage
                ? "bg-[var(--text-primary)] text-[var(--page-bg)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {p + 1}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  const keyword = searchParams.get("keyword") ?? "";

  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("createdAt,desc");
  const [category, setCategory] = useState<number | undefined>(undefined);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["searchProducts", keyword, category, minPrice, maxPrice, page, sort],
    queryFn: () =>
      searchProducts({
        keyword,
        category,
        minPrice,
        maxPrice,
        page,
        size: 12,
        sort,
      }),
    enabled: keyword.length > 0,
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
  const totalElements = data?.data?.totalElements ?? 0;
  const totalPages = data?.data?.totalPages ?? 0;

  const handleApplyPrice = () => {
    const min = minPriceInput ? Number(minPriceInput) : undefined;
    const max = maxPriceInput ? Number(maxPriceInput) : undefined;
    setMinPrice(min);
    setMaxPrice(max);
    setPage(0);
  };

  const handleCategoryChange = (id: number | undefined) => {
    setCategory(id);
    setPage(0);
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    setPage(0);
  };

  const handleReset = () => {
    setCategory(undefined);
    setMinPriceInput("");
    setMaxPriceInput("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSort("createdAt,desc");
    setPage(0);
  };

  if (!keyword) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 text-center">
        <p className="text-sm text-[var(--text-muted)]">검색어를 입력해주세요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      {/* 검색 결과 헤더 */}
      <div className="mb-6">
        <h1 className="text-lg font-light tracking-wide text-[var(--text-primary)]">
          &lsquo;{keyword}&rsquo; 검색 결과 ({totalElements.toLocaleString("ko-KR")}개)
        </h1>
      </div>

      {/* 상단 필터 바 */}
      <div className="flex flex-wrap items-center gap-3 mb-8 pb-6 border-b border-[var(--border-color)]">
        {/* 카테고리 드롭다운 */}
        <select
          value={category ?? ""}
          onChange={(e) =>
            handleCategoryChange(e.target.value ? Number(e.target.value) : undefined)
          }
          className="text-xs text-[var(--text-secondary)] bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 focus:outline-none focus:border-[var(--text-muted)] transition-colors"
        >
          <option value="">전체 카테고리</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* 가격 필터 */}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value.replace(/\D/g, ""))}
            placeholder="최소"
            className="w-24 bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] placeholder-[var(--text-dim)] transition-colors"
          />
          <span className="text-xs text-[var(--text-dim)]">~</span>
          <input
            type="text"
            inputMode="numeric"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value.replace(/\D/g, ""))}
            placeholder="최대"
            className="w-24 bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] placeholder-[var(--text-dim)] transition-colors"
          />
          <button
            onClick={handleApplyPrice}
            className="px-3 py-2 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
          >
            적용
          </button>
        </div>

        {/* 초기화 */}
        <button
          onClick={handleReset}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          초기화
        </button>

        {/* 정렬 (오른쪽 정렬) */}
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="ml-auto text-xs text-[var(--text-secondary)] bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 focus:outline-none focus:border-[var(--text-muted)] transition-colors"
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

      {/* 빈 결과 */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)] text-sm">
          검색 결과가 없습니다.
        </div>
      )}

      {/* 상품 그리드 */}
      {!isLoading && products.length > 0 && (
        <>
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
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    {product.name}
                  </p>
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

          <PageNumbers
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
