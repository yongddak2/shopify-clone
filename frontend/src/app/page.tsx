"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts } from "@/lib/product";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import { getPublicBanners } from "@/lib/admin";
import { useAuthStore } from "@/stores/authStore";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, Banner } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function discountedPrice(base: number, rate: number) {
  return Math.round(base * (1 - rate / 100));
}

function ProductGrid({
  products,
  wishlistIds,
  onWishlistClick,
  isLoading,
}: {
  products: Product[];
  wishlistIds: Set<number>;
  onWishlistClick: (e: React.MouseEvent, id: number) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse mb-4" />
            <div className="h-4 bg-[var(--skeleton)] animate-pulse mb-2 w-3/4" />
            <div className="h-4 bg-[var(--skeleton)] animate-pulse w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
      {products.map((product) => {
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
                onClick={(e) => onWishlistClick(e, product.id)}
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
  );
}

function BannerOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      {/* 하단 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
      <div className="relative text-center">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-[0.3em] mb-3 text-white"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
        >
          SHOPIFY
        </h1>
        <p
          className="text-sm md:text-base tracking-widest text-white/80 mb-10"
          style={{ textShadow: "0 1px 6px rgba(0,0,0,0.4)" }}
        >
          Find Your Style
        </p>
      </div>
      <Link
        href="/products"
        className="relative pointer-events-auto rounded-full bg-white text-black text-xs md:text-sm tracking-[0.15em] px-8 py-3 hover:bg-white/85 transition-colors"
        style={{ textShadow: "none" }}
      >
        SHOP NOW
      </Link>
    </div>
  );
}

function BannerSlider({ banners }: { banners: Banner[] }) {
  const count = banners.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const TRANSITION_MS = 700;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const slideTo = useCallback(
    (next: number) => {
      setIsTransitioning(true);
      setCurrentIndex(next);
      setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
    },
    []
  );

  const resetAutoSlide = useCallback(() => {
    clearTimer();
    if (count > 1) {
      timerRef.current = setInterval(() => {
        setIsTransitioning((busy) => {
          if (busy) return true;
          setCurrentIndex((prev) => (prev + 1) % count);
          setTimeout(() => setIsTransitioning(false), TRANSITION_MS);
          return true;
        });
      }, 4000);
    }
  }, [count, clearTimer]);

  useEffect(() => {
    if (!hovered && count > 1) {
      resetAutoSlide();
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [hovered, resetAutoSlide, clearTimer, count]);

  const goPrev = () => {
    if (isTransitioning) return;
    slideTo((currentIndex - 1 + count) % count);
    resetAutoSlide();
  };

  const goNext = () => {
    if (isTransitioning) return;
    slideTo((currentIndex + 1) % count);
    resetAutoSlide();
  };

  const goTo = (idx: number) => {
    if (isTransitioning || idx === currentIndex) return;
    slideTo(idx);
    resetAutoSlide();
  };

  if (count === 0) {
    return (
      <section className="relative h-[50vh] md:h-[80vh] max-h-[800px] bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center overflow-hidden">
        <BannerOverlay />
      </section>
    );
  }

  return (
    <section
      className="relative w-full h-[50vh] md:h-[80vh] max-h-[800px] overflow-hidden"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 배너 이미지 (absolute 겹침, fade) */}
      {banners.map((banner, idx) => (
        <div
          key={banner.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: idx === currentIndex ? 1 : 0 }}
        >
          <img
            src={banner.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* 오버레이: 브랜드명 + Shop Now */}
      <BannerOverlay />

      {/* 좌우 화살표 (2개 이상일 때만) */}
      {count > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* 인디케이터 (2개 이상일 때만) */}
      {count > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                idx === currentIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  const { data: bannerData } = useQuery({
    queryKey: ["publicBanners"],
    queryFn: getPublicBanners,
  });

  const activeBanners = (bannerData?.data ?? [])
    .filter((b) => b.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const { data: newData, isLoading: newLoading } = useQuery({
    queryKey: ["mainNewProducts"],
    queryFn: () => getProducts({ page: 0, size: 8, sort: "createdAt,desc" }),
  });

  const { data: bestData, isLoading: bestLoading } = useQuery({
    queryKey: ["mainBestProducts"],
    queryFn: () => getProducts({ page: 0, size: 8, sort: "sales" }),
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
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
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

  const newProducts = newData?.data?.content ?? [];
  const bestProducts = bestData?.data?.content ?? [];

  return (
    <>
      {/* 배너 슬라이더 (배너 0개 시 기존 히어로 폴백) */}
      <BannerSlider banners={activeBanners} />

      {/* 신상품 섹션 */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)]">
            NEW ARRIVALS
          </h2>
          <Link
            href="/products?sort=createdAt,desc"
            className="text-xs tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            더보기 &rsaquo;
          </Link>
        </div>
        <ProductGrid
          products={newProducts}
          wishlistIds={wishlistIds}
          onWishlistClick={handleWishlistClick}
          isLoading={newLoading}
        />
      </section>

      {/* BEST 섹션 */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)]">
            BEST
          </h2>
          <Link
            href="/products?sort=sales"
            className="text-xs tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            더보기 &rsaquo;
          </Link>
        </div>
        <ProductGrid
          products={bestProducts}
          wishlistIds={wishlistIds}
          onWishlistClick={handleWishlistClick}
          isLoading={bestLoading}
        />
      </section>
    </>
  );
}
