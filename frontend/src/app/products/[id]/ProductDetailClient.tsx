"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductDetail } from "@/lib/product";
import { addToCart, getCart } from "@/lib/cart";
import { guestAddItem } from "@/lib/guestCart";
import { beginCheckout, savePendingBuyNow } from "@/lib/checkoutSession";
import { getWishlists, toggleWishlist } from "@/lib/wishlist";
import {
  invalidateCartRelated,
  invalidateWishlistRelated,
} from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import { useCartPanelStore } from "@/stores/cartPanelStore";
import Button from "@/components/common/Button";
import { Heart, ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";
import ReviewSection from "./ReviewSection";
import type { ApiResponse, ProductDetail } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

// 사이즈 정렬 순서 (S, M, L …). 목록에 없는 값은 뒤로(숫자 사이즈는 숫자 오름차순)
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE"];
function sizeRank(size: string) {
  const index = SIZE_ORDER.indexOf(size.trim().toUpperCase());
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
function compareSize(a: string, b: string) {
  const ra = sizeRank(a);
  const rb = sizeRank(b);
  if (ra !== rb) return ra - rb;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b);
}

// 배송/교환·반품 공통 안내 (모든 상품 동일). 출시 전 교환·반품 주소 반드시 수정 필요.
const DELIVERY_RETURNS_TEXT = `교환 및 반품 주소
 - 이부분 반드시 출시 전에 수정하셔야 합니다!!!!!


 * 상품 수령일 기준으로 7일 이내 교환 및 반품 의사 전달, 반송지로 상품이 도착하여야 교환 및 반품이 가능합니다.
 (사전 접수 없이 일방적으로 발송하시거나, 안내된 기간이 지난 경우 고지 후 반송처리 됩니다.)
 * 단순 변심의 교환 및 반품은 왕복 배송비 6,000원을 부담해주셔야 합니다.

(제주 및 도서 산간지역 +3,000원)


- 교환 및 반품 불가한 경우
* 고객님의 책임있는 사유로 제품이 훼손된 경우,

고객님의 부주의로 상품이 훼손, 변경된 경우 반품 / 교환이 불가능 합니다.


고객님의 사용 또는 일부 소비에 의해 제품의 가치가 현저히 감소한 경우
시간의 경과에 의하여 재판매가 곤란할 정도로 제품의 가치가 하락된 경우
고객님의 주문에 따라 개별적으로 생산되는 제품의 경우 (주문 제작상품)
향수, 세제 등 향이 베여있는 경우
착용 흔적, 주름 발생이 있는 상품의 경우
택, 더스트백이 없을 경우
세탁을 하신 경우

* 위의 경우에는 교환 및 반품가능 기간에도 불구하고 거절될 수 있습니다.`;

export default function ProductDetailClient({
  id,
  initialProduct,
}: {
  id: string;
  initialProduct?: ApiResponse<ProductDetail>;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const openCartPanel = useCartPanelStore((s) => s.openCart);
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
  const [buyNowPending, setBuyNowPending] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductDetail(Number(id)),
    initialData: initialProduct,
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
      .map((v) => v.value.split('-')[0])
      .sort(compareSize);
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
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.7fr_1fr] gap-10 lg:gap-20">
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

  if (!data?.data) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)] text-sm">
        {isError
          ? "상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
          : "상품을 찾을 수 없습니다."}
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
    if (selectedOptionValueId == null) {
      setOptionError("옵션을 선택해주세요.");
      return;
    }

    setOptionError("");
    setCartError("");

    // 비회원: localStorage 장바구니에 담기 (창을 닫아도 유지, 로그인 시 서버로 병합)
    if (!isLoggedIn()) {
      const thumb =
        product.images?.find((i) => i.isThumbnail)?.url ??
        product.images?.[0]?.url ??
        null;
      guestAddItem({
        productId: Number(id),
        productName: product.name,
        optionValueId: selectedOptionValueId,
        optionValue: selectedOption?.value ?? "",
        basePrice: product.basePrice,
        additionalPrice: selectedOption?.additionalPrice ?? 0,
        discountRate: product.discountRate,
        quantity,
        stockQuantity: currentStock,
        thumbnailUrl: thumb,
      });
      invalidateCartRelated(queryClient);
      openCartPanel();
      return;
    }

    cartMutation.mutate({ optionValueId: selectedOptionValueId, qty: quantity });
  };

  // 바로 구매하기: 장바구니에 담은 뒤 해당 항목만 선택해 주문 페이지로 직행
  const handleBuyNow = async () => {
    if (selectedOptionValueId == null) {
      setOptionError("옵션을 선택해주세요.");
      return;
    }

    setOptionError("");
    setCartError("");

    if (!isLoggedIn()) {
      const thumb =
        product.images?.find((i) => i.isThumbnail)?.url ??
        product.images?.[0]?.url ??
        null;
      guestAddItem({
        productId: Number(id),
        productName: product.name,
        optionValueId: selectedOptionValueId,
        optionValue: selectedOption?.value ?? "",
        basePrice: product.basePrice,
        additionalPrice: selectedOption?.additionalPrice ?? 0,
        discountRate: product.discountRate,
        quantity,
        stockQuantity: currentStock,
        thumbnailUrl: thumb,
      });
      savePendingBuyNow({ optionValueId: selectedOptionValueId });
      invalidateCartRelated(queryClient);
      router.push(`/login?redirect=${encodeURIComponent("/order")}`);
      return;
    }

    setBuyNowPending(true);
    try {
      await addToCart(Number(id), selectedOptionValueId, quantity);
      const cart = await getCart();
      const target = cart.data?.find(
        (it) => it.optionValueId === selectedOptionValueId
      );
      if (!target) {
        setCartError("주문 정보를 불러오지 못했습니다.");
        return;
      }
      beginCheckout([target.id]);
      invalidateCartRelated(queryClient);
      router.push("/order");
    } catch {
      setCartError("주문 처리에 실패했습니다.");
    } finally {
      setBuyNowPending(false);
    }
  };

  const allImages = product.images ?? [];
  const galleryImages = allImages
    .filter((img) => !img.detail)
    .sort((a, b) => {
      if (a.isThumbnail !== b.isThumbnail) return a.isThumbnail ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    });
  const detailImages = allImages
    .filter((img) => img.detail)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const images = galleryImages.length > 0 ? galleryImages : [null];

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.7fr_1fr] gap-10 lg:gap-20 items-start">
        {/* 좌측: 이미지 갤러리 + 상세 설명 이미지 */}
        <div>
          {/* 갤러리: 좌측 세로 썸네일 + 메인 이미지 (상세 이미지보다 좁게) */}
          <div className="flex gap-3 lg:max-w-[80%]">
            {images.length > 1 && (
              <div className="flex flex-col gap-2 w-16 md:w-20 flex-shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setMainImageIndex(i)}
                    className={`aspect-square w-full overflow-hidden border-2 transition-colors ${
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
            <div className="flex-1 aspect-[3/4] bg-[var(--card-bg)] overflow-hidden">
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
          </div>

          {/* 상세 설명 이미지 — 섹션 구분 후 세로로 풀폭 나열 */}
          {detailImages.length > 0 && (
            <div className="mt-24 hidden border-t border-[var(--border-color)] pt-16 md:block">
              <h2 className="text-center text-sm tracking-[0.25em] font-light text-[var(--text-primary)] mb-16">
                PRODUCT DETAIL
              </h2>
              {detailImages.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt={`${product.name} 상세 이미지`}
                  className="w-full block"
                />
              ))}
            </div>
          )}
        </div>

        {/* 우측: 상품 정보 (sticky + 내용이 길면 자체 스크롤 → 좌측 이미지와 독립 스크롤) */}
        <div className="md:sticky md:top-24 self-start md:max-h-[calc(100vh-7rem)] md:overflow-y-auto scrollbar-hide">
          <div className="mb-4">
            <h1 className="text-xl md:text-2xl font-light tracking-wide text-[var(--text-primary)]">
              {product.name}
            </h1>
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

          {/* 상품 설명 + 사이즈/소재 등 부가 정보 */}
          {(product.description || product.productInfo) && (
            <div className="mb-8 space-y-4">
              {product.description && (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              )}
              {product.productInfo && (
                <p className="text-xs text-[var(--text-dim)] leading-relaxed whitespace-pre-line">
                  {product.productInfo}
                </p>
              )}
            </div>
          )}

          {/* 옵션 선택 - 드롭다운 (색상 → 사이즈 순) */}
          {optionMode === 'combo' && (
            <div className="mb-6">
              {/* 색상 드롭다운 */}
              <div ref={colorDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setColorDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-left hover:border-[var(--text-muted)] transition-colors"
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
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--input-bg)] border border-[var(--border-color)] z-50 max-h-64 overflow-y-auto shadow-md">
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
                              ? "text-[var(--text-dim)] cursor-not-allowed"
                              : selectedColor === color
                                ? "bg-[var(--text-primary)] text-[var(--btn-primary-text)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
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
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-left hover:border-[var(--text-muted)] transition-colors"
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
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--input-bg)] border border-[var(--border-color)] z-50 max-h-64 overflow-y-auto shadow-md">
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
                              ? "text-[var(--text-dim)] cursor-not-allowed"
                              : selectedSize === size
                                ? "bg-[var(--text-primary)] text-[var(--btn-primary-text)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
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
                  className="w-full flex items-center justify-between px-4 py-3 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-left hover:border-[var(--text-muted)] transition-colors"
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
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--input-bg)] border border-[var(--border-color)] z-50 max-h-64 overflow-y-auto shadow-md">
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
                              ? "text-[var(--text-dim)] cursor-not-allowed"
                              : selectedOptionValueId === opt.id
                                ? "bg-[var(--text-primary)] text-[var(--btn-primary-text)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
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

          {/* 구매 버튼: 찜 + 장바구니 + 바로 구매하기 (무신사 배치) */}
          {(() => {
            const isSoldOut =
              product.status === "SOLDOUT" ||
              (selectedOptionValueId != null && currentStock === 0);
            return (
              <div className="flex gap-2">
                <button
                  onClick={handleWishlistToggle}
                  disabled={wishlistMutation.isPending}
                  aria-label="찜하기"
                  className="w-14 flex-shrink-0 flex items-center justify-center border border-[var(--btn-outline-border)] hover:border-[var(--text-muted)] transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isWishlisted
                        ? "text-red-400 fill-red-400"
                        : "text-[var(--text-muted)]"
                    }`}
                    strokeWidth={1.5}
                  />
                </button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleAddToCart}
                  loading={cartMutation.isPending}
                  disabled={isSoldOut}
                >
                  {isSoldOut ? "품절" : "장바구니"}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleBuyNow}
                  loading={buyNowPending}
                  disabled={isSoldOut}
                >
                  바로 구매하기
                </Button>
              </div>
            );
          })()}

          {/* Delivery / Returns 아코디언 */}
          <div className="mt-8 border-y border-[var(--border-color)] md:border-b-0">
            <button
              type="button"
              onClick={() => setDeliveryOpen((v) => !v)}
              className="w-full flex items-center justify-between py-4 text-sm text-[var(--text-primary)]"
            >
              Delivery / Returns
              {deliveryOpen ? (
                <Minus className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <Plus className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>
            {deliveryOpen && (
              <div className="pb-6 text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {DELIVERY_RETURNS_TEXT}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 모바일: 상품 정보와 배송/반품 정보 다음에 상세 이미지를 표시 */}
      {detailImages.length > 0 && (
        <div className="pt-12 md:hidden">
          <h2 className="mb-12 text-center text-sm font-light tracking-[0.25em] text-[var(--text-primary)]">
            PRODUCT DETAIL
          </h2>
          {detailImages.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt={`${product.name} 상세 이미지`}
              className="block w-full"
            />
          ))}
        </div>
      )}

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
