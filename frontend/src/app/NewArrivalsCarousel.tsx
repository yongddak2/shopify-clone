"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types";

const AUTO_INTERVAL_MS = 3500;
const TRANSITION_MS = 500;

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function discountedPrice(base: number, rate: number) {
  return Math.round(base * (1 - rate / 100));
}

function useVisibleCount() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqMd = window.matchMedia("(min-width: 768px)");

    const compute = () => {
      if (mqLg.matches) return 4;
      if (mqMd.matches) return 3;
      return 2;
    };

    const update = () => setCount(compute());
    update();

    mqLg.addEventListener("change", update);
    mqMd.addEventListener("change", update);
    return () => {
      mqLg.removeEventListener("change", update);
      mqMd.removeEventListener("change", update);
    };
  }, []);

  return count;
}

export default function NewArrivalsCarousel({
  products,
  wishlistIds,
  onWishlistClick,
}: {
  products: Product[];
  wishlistIds: Set<number>;
  onWishlistClick: (e: React.MouseEvent, id: number) => void;
}) {
  const visibleCount = useVisibleCount();
  const total = products.length;

  const looped = useMemo(
    () => [...products, ...products.slice(0, visibleCount)],
    [products, visibleCount]
  );

  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 화살표를 썸네일(이미지) 세로 중앙에 맞추기 위해 첫 썸네일 높이를 측정
  const trackRef = useRef<HTMLDivElement>(null);
  const [arrowTop, setArrowTop] = useState<number | null>(null);

  useEffect(() => {
    const thumb = trackRef.current?.querySelector<HTMLElement>("[data-thumb]");
    if (!thumb) return;
    const update = () => setArrowTop(thumb.offsetHeight / 2);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(thumb);
    return () => ro.disconnect();
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAuto = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, AUTO_INTERVAL_MS);
  }, [clearTimer]);

  useEffect(() => {
    if (!hovered) startAuto();
    return clearTimer;
  }, [hovered, startAuto, clearTimer]);

  // total을 넘어서면 점프해서 무한 루프 환영 유지
  useEffect(() => {
    if (index < total) return;
    const timeout = setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, TRANSITION_MS);
    return () => clearTimeout(timeout);
  }, [index, total]);

  // animate가 false로 점프한 다음 프레임에 다시 true로 — 트랜지션 재활성
  useEffect(() => {
    if (animate) return;
    const id = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(id);
  }, [animate]);

  const goNext = () => {
    setIndex((prev) => prev + 1);
  };

  const goPrev = () => {
    if (index === 0) {
      // 0에서 -1로 가지 않고, 점프 후 반대 방향으로
      setAnimate(false);
      setIndex(total);
      requestAnimationFrame(() => {
        setAnimate(true);
        setIndex(total - 1);
      });
      return;
    }
    setIndex((prev) => prev - 1);
  };

  const cardWidthPercent = 100 / visibleCount;
  const translatePercent = -index * cardWidthPercent;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden" ref={trackRef}>
        <div
          className="flex"
          style={{
            transform: `translateX(${translatePercent}%)`,
            transition: animate ? `transform ${TRANSITION_MS}ms ease-in-out` : "none",
          }}
        >
          {looped.map((product, idx) => (
            <div
              key={`${product.id}-${idx}`}
              className="flex-shrink-0 px-1"
              style={{ width: `${cardWidthPercent}%` }}
            >
              <ProductCard
                product={product}
                wishlistIds={wishlistIds}
                onWishlistClick={onWishlistClick}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 좌우 화살표 — 버튼 배경 없이 기호만. top은 썸네일 세로 중앙(측정값) */}
      <button
        onClick={goPrev}
        style={{ top: arrowTop ?? undefined }}
        className="absolute -left-2 md:-left-6 lg:-left-12 top-1/3 -translate-y-1/2 z-10 flex items-center justify-center text-[var(--text-primary)] hover:opacity-50 transition-opacity"
        aria-label="이전"
      >
        <ChevronLeft className="w-7 h-7" strokeWidth={1.5} />
      </button>
      <button
        onClick={goNext}
        style={{ top: arrowTop ?? undefined }}
        className="absolute -right-2 md:-right-6 lg:-right-12 top-1/3 -translate-y-1/2 z-10 flex items-center justify-center text-[var(--text-primary)] hover:opacity-50 transition-opacity"
        aria-label="다음"
      >
        <ChevronRight className="w-7 h-7" strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function ProductCard({
  product,
  wishlistIds,
  onWishlistClick,
}: {
  product: Product;
  wishlistIds: Set<number>;
  onWishlistClick: (e: React.MouseEvent, id: number) => void;
}) {
  const isSoldOut = product.status === "SOLDOUT";
  const hasDiscount = product.discountRate > 0;
  const finalPrice = hasDiscount
    ? discountedPrice(product.basePrice, product.discountRate)
    : product.basePrice;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div
        data-thumb
        className="relative aspect-[3/4] bg-[var(--card-bg)] mb-4 overflow-hidden"
      >
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
            <span className="text-white text-xs tracking-[0.2em]">SOLD OUT</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
          <button
            onClick={(e) => onWishlistClick(e, product.id)}
            className="w-8 h-8 flex items-center justify-center transition-transform hover:scale-110 active:scale-90"
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
          <span className="text-xs text-red-400">{product.discountRate}%</span>
        )}
      </div>
    </Link>
  );
}
