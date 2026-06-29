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
import type {
  ApiResponse,
  Banner,
  MainPageConfig,
  PageResponse,
  Product,
} from "@/types";
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-10">
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-10">
      {products.map((product) => {
        const isSoldOut = product.status === "SOLDOUT";
        const hasDiscount = product.discountRate > 0;
        const finalPrice = hasDiscount
          ? discountedPrice(product.basePrice, product.discountRate)
          : product.basePrice;

        return (
          <div key={product.id} className="group">
            <div className="relative aspect-[3/4] bg-[var(--card-bg)] mb-4 overflow-hidden">
              <a
                href={`/products/${product.id}`}
                className="block h-full"
                aria-label={`${product.name} 상세 보기`}
              >
                {product.thumbnailUrl ? (
                  <>
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        product.hoverImageUrl
                          ? "group-hover:opacity-0"
                          : "group-hover:scale-105"
                      }`}
                    />
                    {product.hoverImageUrl && (
                      <img
                        src={product.hoverImageUrl}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      />
                    )}
                  </>
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
              </a>
              <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={(e) => onWishlistClick(e, product.id)}
                  className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 active:scale-90"
                  aria-label={`${product.name} 찜하기`}
                >
                  <Heart
                    className={`w-7 h-7 ${
                      wishlistIds.has(product.id)
                        ? "text-[var(--header-pink-accent)] fill-[var(--header-pink-accent)]"
                        : "text-[var(--header-pink-accent)]"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            </div>
            <a href={`/products/${product.id}`} className="block">
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
            </a>
          </div>
        );
      })}
    </div>
  );
}

function BannerOverlay({
  title,
  linkUrl,
}: {
  title: string | null;
  linkUrl: string | null;
}) {
  const targetUrl = linkUrl ?? "/products";
  const isExternal =
    targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
  const buttonClass =
    "inline-block pointer-events-auto rounded-full bg-white text-black text-xs md:text-sm tracking-[0.1em] px-8 py-3 hover:bg-white/85 transition-colors max-sm:hidden";

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* 좌측 하단 가독성 위한 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/10 to-transparent" />
      {/* 좌측 하단 컨텐츠 */}
      <div className="absolute bottom-16 left-6 md:bottom-24 md:left-20">
        <h1
          className="text-3xl md:text-5xl font-normal tracking-wider text-white mb-6 max-sm:hidden"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
        >
          {title ?? "Find Your Style"}
        </h1>
        {isExternal ? (
          <a
            href={targetUrl}
            onClick={(e) => e.stopPropagation()}
            className={buttonClass}
          >
            shop now
          </a>
        ) : (
          <Link
            href={targetUrl}
            onClick={(e) => e.stopPropagation()}
            className={buttonClass}
          >
            shop now
          </Link>
        )}
      </div>
    </div>
  );
}

function BannerSlider({ banners }: { banners: Banner[] }) {
  const router = useRouter();
  const count = banners.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipedRef = useRef(false);

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
      <section className="relative h-[50vh] md:h-[90vh] bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center overflow-hidden">
        <BannerOverlay title={null} linkUrl={null} />
      </section>
    );
  }

  const currentTitle = banners[currentIndex]?.title ?? null;
  const currentLinkUrl = banners[currentIndex]?.linkUrl ?? null;

  const handleSlideClick = () => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    if (!currentLinkUrl) return;
    if (
      currentLinkUrl.startsWith("http://") ||
      currentLinkUrl.startsWith("https://")
    ) {
      window.location.href = currentLinkUrl;
    } else {
      router.push(currentLinkUrl);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || count <= 1 || isTransitioning) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    swipedRef.current = true;
    if (deltaX < 0) {
      goNext();
    } else {
      goPrev();
    }
  };

  return (
    <section
      className={`relative w-full h-[50vh] md:h-[90vh] overflow-hidden ${
        currentLinkUrl ? "cursor-pointer" : ""
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleSlideClick}
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
      <BannerOverlay title={currentTitle} linkUrl={currentLinkUrl} />

      {/* 좌우 화살표 (2개 이상일 때만) */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white hover:text-white/70 transition-colors max-sm:hidden"
          >
            <ChevronLeft className="w-[50px] h-[50px]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white hover:text-white/70 transition-colors max-sm:hidden"
          >
            <ChevronRight className="w-[50px] h-[50px]" />
          </button>
        </>
      )}

      {/* 인디케이터 (2개 이상일 때만) — 우측 하단, 큰 글씨와 같은 라인 */}
      {count > 1 && (
        <div className="absolute bottom-12 right-10 z-20 flex gap-2.5 max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2 max-sm:gap-1.5 md:bottom-10 md:right-16">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                goTo(idx);
              }}
              className={`w-3 h-3 rounded-full transition-colors max-sm:h-2 max-sm:w-2 ${
                idx === currentIndex ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface HomeContentProps {
  initialBanners?: ApiResponse<Banner[]>;
  initialConfig?: ApiResponse<MainPageConfig>;
  initialCuratedNewArrivals?: ApiResponse<Product[]>;
  initialBestProducts?: ApiResponse<PageResponse<Product>>;
}

export default function HomeContent({
  initialBanners,
  initialConfig,
  initialCuratedNewArrivals,
  initialBestProducts,
}: HomeContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();

  const { data: bannerData } = useQuery({
    queryKey: ["publicBanners"],
    queryFn: getPublicBanners,
    initialData: initialBanners,
  });

  const { data: configData } = useQuery({
    queryKey: ["mainPageConfig"],
    queryFn: getPublicMainPageConfig,
    initialData: initialConfig,
  });

  const activeBanners = (bannerData?.data ?? [])
    .filter((b) => b.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const mainSubText = configData?.data?.subText ?? null;
  const instagramHandle = configData?.data?.instagramHandle ?? null;
  const instagramItems = (configData?.data?.instagramItems ?? []).filter(
    (item): item is { imageUrl: string; linkUrl: string } =>
      Boolean(item.imageUrl && item.linkUrl)
  );

  const { data: curatedNewArrivalsData, isLoading: curatedLoading } = useQuery({
    queryKey: ["mainNewArrivals"],
    queryFn: getPublicNewArrivals,
    initialData: initialCuratedNewArrivals,
  });
  const curatedNewArrivals = curatedNewArrivalsData?.data ?? [];

  const { data: bestData, isLoading: bestLoading } = useQuery({
    queryKey: ["mainBestProducts", 4],
    queryFn: () => getProducts({ page: 0, size: 4, sort: "sales" }),
    initialData: initialBestProducts,
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

  const newProducts: Product[] = curatedNewArrivals;
  const newArrivalsLoading = curatedLoading;
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
        <div className="relative flex items-center justify-center mb-10">
          <h2 className="whitespace-nowrap font-serif-display font-medium text-[clamp(1.75rem,8vw,2.25rem)] tracking-wide text-[var(--header-pink-accent)] md:text-4xl">
            NEW ARRIVALS
          </h2>
          <Link
            href="/products?sort=createdAt,desc"
            className="absolute right-0 -bottom-6 flex items-center gap-0.5 font-serif-display text-base tracking-wider text-[var(--header-pink-accent)] hover:opacity-70 transition-opacity"
          >
            more view
            <ChevronRight className="w-4 h-4" />
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
          <p className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-serif-display font-medium tracking-tight text-[var(--header-pink-accent)] leading-tight">
            {mainSubText}
          </p>
        </section>
      )}

      {/* BEST 섹션 */}
      <section className="w-full px-[3vw] py-16">
        <div className="relative flex items-center justify-center mb-10">
          <h2 className="font-serif-display font-medium text-3xl md:text-4xl tracking-wide text-[var(--header-pink-accent)]">
            BEST
          </h2>
          <Link
            href="/products?sort=sales"
            className="absolute right-0 -bottom-6 flex items-center gap-0.5 font-serif-display text-base tracking-wider text-[var(--header-pink-accent)] hover:opacity-70 transition-opacity"
          >
            more view
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <ProductGrid
          products={bestProducts}
          wishlistIds={wishlistIds}
          onWishlistClick={handleWishlistClick}
          isLoading={bestLoading}
        />
      </section>

      {instagramHandle && instagramItems.length === 3 && (
        <section className="w-full pt-12 md:pt-20">
          <div className="pb-10 text-center md:pb-14">
            <h2 className="font-serif-display text-2xl font-medium tracking-wide text-[var(--header-pink-accent)] md:text-3xl">
              Instagram
            </h2>
            <p className="mt-1 font-serif-display text-lg font-medium tracking-wide text-[var(--header-pink-accent)] md:text-xl">
              @{instagramHandle}
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-px bg-white">
            {instagramItems.map((item, index) => (
              <a
                key={`${item.linkUrl}-${index}`}
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram 게시물 ${index + 1} 열기`}
                className="group relative block aspect-square overflow-hidden bg-[var(--section-bg)]"
              >
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/10" />
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
