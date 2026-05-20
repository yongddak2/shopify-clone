"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProducts } from "@/lib/product";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import {
  getPublicBanners,
  getPublicMainPageConfig,
  getPublicNewArrivals,
} from "@/lib/admin";
import { invalidateWishlistRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, Banner } from "@/types";
import NewArrivalsCarousel from "./NewArrivalsCarousel";

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
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

function BannerOverlay({ title }: { title: string | null }) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* 좌측 하단 가독성 위한 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent" />
      {/* 좌측 하단 컨텐츠 */}
      <div className="absolute bottom-16 left-6 md:bottom-24 md:left-20">
        <h1
          className="text-3xl md:text-5xl font-light tracking-wider text-white mb-6"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
        >
          {title ?? "Find Your Style"}
        </h1>
        <Link
          href="/products"
          className="inline-block pointer-events-auto rounded-full bg-white text-black text-xs md:text-sm tracking-[0.1em] px-8 py-3 hover:bg-white/85 transition-colors"
        >
          shop now
        </Link>
      </div>
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
        <BannerOverlay title={null} />
      </section>
    );
  }

  const currentTitle = banners[currentIndex]?.title ?? null;

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

      {/* 오버레이: 현재 슬라이드 title + Shop Now */}
      <BannerOverlay title={currentTitle} />

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

      {/* 인디케이터 (2개 이상일 때만) — 우측 하단, 큰 글씨와 같은 라인 */}
      {count > 1 && (
        <div className="absolute bottom-12 right-10 md:bottom-20 md:right-16 z-20 flex gap-2.5">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-3 h-3 rounded-full transition-colors ${
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

  const { data: configData } = useQuery({
    queryKey: ["mainPageConfig"],
    queryFn: getPublicMainPageConfig,
  });

  const activeBanners = (bannerData?.data ?? [])
    .filter((b) => b.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const mainSubText = configData?.data?.subText ?? null;

  const { data: curatedNewArrivalsData, isLoading: curatedLoading } = useQuery({
    queryKey: ["mainNewArrivals"],
    queryFn: getPublicNewArrivals,
  });
  const curatedNewArrivals = curatedNewArrivalsData?.data ?? [];

  const { data: newData, isLoading: newLoading } = useQuery({
    queryKey: ["mainNewProducts", 4],
    queryFn: () => getProducts({ page: 0, size: 4, sort: "createdAt,desc" }),
    enabled: !curatedLoading && curatedNewArrivals.length === 0,
  });

  const { data: bestData, isLoading: bestLoading } = useQuery({
    queryKey: ["mainBestProducts", 4],
    queryFn: () => getProducts({ page: 0, size: 4, sort: "sales" }),
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

  const fallbackNew = newData?.data?.content ?? [];
  const newProducts: Product[] =
    curatedNewArrivals.length > 0 ? curatedNewArrivals : fallbackNew;
  const newArrivalsLoading =
    curatedLoading || (curatedNewArrivals.length === 0 && newLoading);
  const useCarousel = curatedNewArrivals.length > 4;
  const bestProducts = bestData?.data?.content ?? [];

  return (
    <>
      {/* 배너 슬라이더 (헤더 뒤로 깔림 — 헤더 투명 모드와 결합) */}
      <div className="-mt-16">
        <BannerSlider banners={activeBanners} />
      </div>

      {/* 신상품 섹션 */}
      <section className="w-full px-[3vw] pt-32 pb-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)]">
            NEW ARRIVALS
          </h2>
          <Link
            href="/products?sort=createdAt,desc"
            className="text-xs tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            MORE VIEW &rsaquo;
          </Link>
        </div>
        {useCarousel ? (
          <NewArrivalsCarousel
            products={newProducts}
            wishlistIds={wishlistIds}
            onWishlistClick={handleWishlistClick}
          />
        ) : (
          <ProductGrid
            products={newProducts}
            wishlistIds={wishlistIds}
            onWishlistClick={handleWishlistClick}
            isLoading={newArrivalsLoading}
          />
        )}
      </section>

      {/* 메인 텍스트 섹션 (신상품 ↔ BEST 사이) */}
      {mainSubText && (
        <section className="w-full px-[3vw] py-8 md:py-12 lg:py-16">
          <p className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-light tracking-tight text-[var(--text-primary)] leading-tight">
            {mainSubText}
          </p>
        </section>
      )}

      {/* BEST 섹션 */}
      <section className="w-full px-[3vw] py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl tracking-[0.2em] font-light text-[var(--text-primary)]">
            BEST
          </h2>
          <Link
            href="/products?sort=sales"
            className="text-xs tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            MORE VIEW &rsaquo;
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
