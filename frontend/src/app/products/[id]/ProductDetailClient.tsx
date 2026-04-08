"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductDetail } from "@/lib/product";
import { addToCart } from "@/lib/cart";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import {
  invalidateCartRelated,
  invalidateWishlistRelated,
} from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/common/Button";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import ReviewSection from "./ReviewSection";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export default function ProductDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedOptionValueId, setSelectedOptionValueId] = useState<number | null>(null);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [singleDropdownOpen, setSingleDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);
  const colorDropdownRef = useRef<HTMLDivElement>(null);
  const singleDropdownRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [optionError, setOptionError] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartModal, setCartModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductDetail(Number(id)),
  });

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlists"],
    queryFn: getWishlists,
    enabled: isLoggedIn(),
  });

  const isWishlisted = wishlistData?.data?.some(
    (item) => item.productId === Number(id)
  ) ?? false;

  const wishlistMutation = useMutation({
    mutationFn: () => toggleWishlist(Number(id)),
    onSuccess: () => {
      invalidateWishlistRelated(queryClient);
    },
  });

  const handleWishlistToggle = () => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    wishlistMutation.mutate();
  };

  const cartMutation = useMutation({
    mutationFn: ({
      optionValueId,
      qty,
    }: {
      optionValueId: number;
      qty: number;
    }) => addToCart(Number(id), optionValueId, qty),
    onSuccess: () => {
      setCartError("");
      invalidateCartRelated(queryClient);
      setCartModal(true);
    },
    onError: () => {
      setCartError("장바구니 담기에 실패했습니다");
    },
  });

  // 옵션 파싱
  const optionGroup = data?.data?.optionGroups?.[0];
  const optionValues = useMemo(() => optionGroup?.values ?? [], [optionGroup]);

  const optionMode: 'free' | 'combo' | 'single' = useMemo(() => {
    if (optionValues.length === 0) return 'free';
    if (optionValues.length === 1 && optionValues[0].value === 'FREE') return 'free';
    const hasDash = optionValues.some((v) => v.value.includes('-'));
    return hasDash ? 'combo' : 'single';
  }, [optionValues]);

  const colors = useMemo(() => {
    if (optionMode !== 'combo') return [];
    return Array.from(new Set(optionValues.map((v) => v.value.split('-').slice(1).join('-'))));
  }, [optionMode, optionValues]);

  const sizesForColor = useMemo(() => {
    if (optionMode !== 'combo' || !selectedColor) return [];
    return optionValues
      .filter((v) => v.value.split('-').slice(1).join('-') === selectedColor)
      .map((v) => v.value.split('-')[0]);
  }, [optionMode, optionValues, selectedColor]);

  // FREE 옵션이면 자동 선택
  useEffect(() => {
    if (optionMode === 'free' && optionValues.length > 0) {
      setSelectedOptionValueId(optionValues[0].id);
    }
  }, [optionMode, optionValues]);

  // 사이즈+색상 모두 선택되면 optionValueId 매칭
  useEffect(() => {
    if (optionMode !== 'combo') return;
    if (selectedSize && selectedColor) {
      const target = `${selectedSize}-${selectedColor}`;
      const found = optionValues.find((v) => v.value === target);
      setSelectedOptionValueId(found ? found.id : null);
    } else {
      setSelectedOptionValueId(null);
    }
  }, [optionMode, optionValues, selectedSize, selectedColor]);

  // 선택된 옵션의 재고 추적
  useEffect(() => {
    if (selectedOptionValueId == null) {
      setCurrentStock(0);
      return;
    }
    const found = optionValues.find((v) => v.id === selectedOptionValueId);
    setCurrentStock(found?.stockQuantity ?? 0);
    // 옵션 변경 시 수량을 1로 리셋
    setQuantity(1);
  }, [selectedOptionValueId, optionValues]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target as Node)) {
        setSizeDropdownOpen(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(e.target as Node)) {
        setColorDropdownOpen(false);
      }
      if (singleDropdownRef.current && !singleDropdownRef.current.contains(e.target as Node)) {
        setSingleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-[var(--skeleton)] animate-pulse w-3/4" />
            <div className="h-6 bg-[var(--skeleton)] animate-pulse w-1/2" />
            <div className="h-40 bg-[var(--skeleton)] animate-pulse mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)] text-sm">
        상품을 찾을 수 없습니다.
      </div>
    );
  }

  const product = data.data;
  const hasDiscount = product.discountRate > 0;
  const basePrice = product.basePrice;
  const discountedBase = hasDiscount
    ? Math.round(basePrice * (1 - product.discountRate / 100))
    : basePrice;

  const selectedOption = optionValues.find((v) => v.id === selectedOptionValueId) ?? null;
  const additionalPrice = selectedOption?.additionalPrice ?? 0;
  const totalPrice = (discountedBase + additionalPrice) * quantity;

  const handleAddToCart = () => {
    if (!isLoggedIn()) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login");
      }
      return;
    }

    if (selectedOptionValueId == null) {
      setOptionError("옵션을 선택해주세요.");
      return;
    }

    setOptionError("");
    setCartError("");
    cartMutation.mutate({ optionValueId: selectedOptionValueId, qty: quantity });
  };

  const images = (product.images ?? []).length > 0 ? product.images : [null];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
        {/* 좌측: 이미지 갤러리 */}
        <div>
          <div className="aspect-[3/4] bg-[var(--card-bg)] overflow-hidden mb-4">
            {images[mainImageIndex] ? (
              <img
                src={images[mainImageIndex]!.url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[var(--section-bg)]" />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setMainImageIndex(i)}
                  className={`w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                    mainImageIndex === i
                      ? "border-[var(--text-primary)]"
                      : "border-transparent"
                  }`}
                >
                  {img ? (
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--section-bg)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 우측: 상품 정보 */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-light tracking-wide text-[var(--text-primary)]">
              {product.name}
            </h1>
            <button
              onClick={handleWishlistToggle}
              disabled={wishlistMutation.isPending}
              className="flex-shrink-0 mt-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
            >
              <Heart
                className={`w-6 h-6 ${isWishlisted ? "text-red-400 fill-red-400" : ""}`}
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* 가격 */}
          <div className="flex items-baseline gap-3 mb-8">
            {hasDiscount && (
              <span className="text-lg text-[var(--text-dim)] line-through">
                {formatPrice(basePrice)}원
              </span>
            )}
            <span className="text-xl font-medium text-[var(--text-primary)]">
              {formatPrice(discountedBase)}원
            </span>
            {hasDiscount && (
              <span className="text-sm text-red-400">
                {product.discountRate}%
              </span>
            )}
          </div>

          {/* 옵션 선택 - 드롭다운 (색상 → 사이즈 순) */}
          {optionMode === 'combo' && (
            <div className="mb-6">
              {/* 색상 드롭다운 */}
              <div ref={colorDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setColorDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-[#2a2a2a] border border-[#555] text-left hover:border-[var(--text-muted)] transition-colors"
                >
                  <span className={selectedColor ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                    {selectedColor || "색상을 선택해주세요"}
                  </span>
                  {colorDropdownOpen ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </button>
                {colorDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#2a2a2a] border border-[#555] z-50 max-h-64 overflow-y-auto">
                    {colors.map((color) => {
                      const matching = optionValues.filter((v) => v.value.split('-').slice(1).join('-') === color);
                      const allOut = matching.every((v) => v.stockQuantity === 0);
                      return (
                        <button
                          key={color}
                          type="button"
                          disabled={allOut}
                          onClick={() => {
                            if (allOut) return;
                            setSelectedColor(color);
                            setSelectedSize('');
                            setColorDropdownOpen(false);
                            setOptionError("");
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            allOut
                              ? "text-[#666] cursor-not-allowed"
                              : selectedColor === color
                                ? "text-white bg-[#3a3a3a]"
                                : "text-[var(--text-secondary)] hover:bg-[#3a3a3a]"
                          }`}
                        >
                          {color}{allOut && " (품절)"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 사이즈 드롭다운 (색상 선택 후 활성화) */}
              <div ref={sizeDropdownRef} className="relative mt-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedColor) {
                      alert("상위 옵션을 선택해주세요.");
                      return;
                    }
                    setSizeDropdownOpen((v) => !v);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-[#2a2a2a] border border-[#555] text-left hover:border-[var(--text-muted)] transition-colors"
                >
                  <span className={selectedSize ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                    {selectedSize || "사이즈"}
                  </span>
                  {sizeDropdownOpen ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </button>
                {sizeDropdownOpen && selectedColor && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#2a2a2a] border border-[#555] z-50 max-h-64 overflow-y-auto">
                    {sizesForColor.map((size) => {
                      const target = `${size}-${selectedColor}`;
                      const opt = optionValues.find((v) => v.value === target);
                      const outOfStock = !opt || opt.stockQuantity === 0;
                      return (
                        <button
                          key={size}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => {
                            if (outOfStock) return;
                            setSelectedSize(size);
                            setSizeDropdownOpen(false);
                            setOptionError("");
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            outOfStock
                              ? "text-[#666] cursor-not-allowed"
                              : selectedSize === size
                                ? "text-white bg-[#3a3a3a]"
                                : "text-[var(--text-secondary)] hover:bg-[#3a3a3a]"
                          }`}
                        >
                          {size}{outOfStock && " (품절)"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {optionMode === 'single' && (
            <div className="mb-6">
              <div ref={singleDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSingleDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-[#2a2a2a] border border-[#555] text-left hover:border-[var(--text-muted)] transition-colors"
                >
                  <span className={selectedOption ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}>
                    {selectedOption ? selectedOption.value : "옵션을 선택해주세요"}
                  </span>
                  {singleDropdownOpen ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </button>
                {singleDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#2a2a2a] border border-[#555] z-50 max-h-64 overflow-y-auto">
                    {optionValues.map((opt) => {
                      const outOfStock = opt.stockQuantity === 0;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => {
                            if (outOfStock) return;
                            setSelectedOptionValueId(opt.id);
                            setSingleDropdownOpen(false);
                            setOptionError("");
                          }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            outOfStock
                              ? "text-[#666] cursor-not-allowed"
                              : selectedOptionValueId === opt.id
                                ? "text-white bg-[#3a3a3a]"
                                : "text-[var(--text-secondary)] hover:bg-[#3a3a3a]"
                          }`}
                        >
                          {opt.value}{outOfStock && " (품절)"}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 수량 */}
          <div className="mb-2">
            <p className="text-xs tracking-wider text-[var(--text-muted)] mb-3">
              수량
              {selectedOptionValueId != null && currentStock > 0 && currentStock <= 10 && (
                <span className="ml-2 text-red-400 normal-case tracking-normal">
                  ({currentStock}개 남음)
                </span>
              )}
            </p>
            <div className="inline-flex items-center border border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={currentStock || 1}
                value={quantity}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (isNaN(v) || v < 1) { setQuantity(1); return; }
                  if (currentStock > 0 && v > currentStock) { setQuantity(currentStock); return; }
                  setQuantity(v);
                }}
                className="w-12 h-10 text-center text-sm text-[var(--text-secondary)] bg-transparent border-0 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (currentStock > 0 && quantity + 1 > currentStock) return;
                  setQuantity(quantity + 1);
                }}
                disabled={currentStock === 0 || quantity >= currentStock}
                className="w-10 h-10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-6" />

          {/* 총 가격 */}
          <div className="flex items-center justify-between py-4 border-t border-[var(--border-color)] mb-6">
            <span className="text-xs tracking-wider text-[var(--text-muted)]">
              총 금액
            </span>
            <span className="text-lg font-medium text-[var(--text-primary)]">
              {formatPrice(totalPrice)}원
            </span>
          </div>

          {/* 에러 메시지 (공간 미리 확보) */}
          <div className="min-h-[1.5rem] mb-2">
            {(optionError || cartError) && (
              <p className="text-sm text-red-400">{optionError || cartError}</p>
            )}
          </div>

          {/* 장바구니 담기 */}
          <Button
            fullWidth
            onClick={handleAddToCart}
            loading={cartMutation.isPending}
            disabled={product.status === "SOLDOUT" || (selectedOptionValueId != null && currentStock === 0)}
          >
            {product.status === "SOLDOUT" || (selectedOptionValueId != null && currentStock === 0)
              ? "품절"
              : "장바구니 담기"}
          </Button>

          {/* 상품 설명 */}
          {product.description && (
            <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
              <h3 className="text-xs tracking-widest text-[var(--text-muted)] mb-4">
                DESCRIPTION
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* 리뷰 섹션 */}
      <ReviewSection productId={id} />

      {/* 장바구니 담기 완료 모달 */}
      {cartModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setCartModal(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              장바구니에 담았습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCartModal(false)}
                className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
              >
                쇼핑 계속하기
              </button>
              <button
                onClick={() => router.push("/cart")}
                className="flex-1 py-3 text-sm tracking-wider bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
              >
                장바구니로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
