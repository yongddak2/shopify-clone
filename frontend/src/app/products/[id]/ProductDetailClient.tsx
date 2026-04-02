"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProductDetail } from "@/lib/product";
import { addToCart } from "@/lib/cart";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/common/Button";
import type { ProductOptionValue } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

export default function ProductDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, ProductOptionValue>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [optionError, setOptionError] = useState("");
  const [cartError, setCartError] = useState("");
  const [cartModal, setCartModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductDetail(Number(id)),
  });

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
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setCartModal(true);
    },
    onError: () => {
      setCartError("장바구니 담기에 실패했습니다");
    },
  });

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

  const additionalPrice = Object.values(selectedOptions).reduce(
    (sum, opt) => sum + opt.additionalPrice,
    0
  );
  const totalPrice = (discountedBase + additionalPrice) * quantity;

  const optionGroups = product.optionGroups ?? [];

  const allOptionsSelected =
    optionGroups.length === 0 ||
    optionGroups.every((group) => selectedOptions[group.id]);

  const handleAddToCart = () => {
    if (!isLoggedIn()) {
      if (confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?")) {
        router.push("/login");
      }
      return;
    }

    if (!allOptionsSelected) {
      setOptionError("필수 옵션을 선택해주세요");
      return;
    }

    setOptionError("");
    setCartError("");

    // 선택된 옵션 값들에서 optionValueId 추출
    const selectedValues = Object.values(selectedOptions);
    const optionValueId = selectedValues.length > 0
      ? selectedValues[selectedValues.length - 1].id
      : 0;

    cartMutation.mutate({ optionValueId, qty: quantity });
  };

  const handleOptionSelect = (groupId: number, opt: ProductOptionValue) => {
    setSelectedOptions((prev) => ({ ...prev, [groupId]: opt }));
    setOptionError("");
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
          <h1 className="text-xl md:text-2xl font-light tracking-wide mb-4 text-[var(--text-primary)]">
            {product.name}
          </h1>

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

          {/* 옵션 선택 */}
          {optionGroups.map((group) => (
            <div key={group.id} className="mb-6">
              <p className="text-xs tracking-wider text-[var(--text-muted)] mb-3">
                {group.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {(group.values ?? []).map((opt) => {
                  const isSelected =
                    selectedOptions[group.id]?.id === opt.id;
                  const outOfStock = opt.stockQuantity === 0;

                  return (
                    <button
                      key={opt.id}
                      disabled={outOfStock}
                      onClick={() => handleOptionSelect(group.id, opt)}
                      className={`px-4 py-2 text-xs border transition-colors ${
                        outOfStock
                          ? "border-[var(--border-color)] text-[var(--text-dim)] cursor-not-allowed"
                          : isSelected
                            ? "border-[var(--text-primary)] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                            : "border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]"
                      }`}
                    >
                      {opt.value}
                      {opt.additionalPrice > 0 &&
                        ` (+${formatPrice(opt.additionalPrice)}원)`}
                      {outOfStock && " (품절)"}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 수량 */}
          <div className="mb-8">
            <p className="text-xs tracking-wider text-[var(--text-muted)] mb-3">수량</p>
            <div className="inline-flex items-center border border-[var(--border-color)]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                −
              </button>
              <span className="w-12 text-center text-sm text-[var(--text-secondary)]">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                +
              </button>
            </div>
          </div>

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
            disabled={product.status === "SOLDOUT"}
          >
            {product.status === "SOLDOUT" ? "품절" : "장바구니 담기"}
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
