"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, getCategories } from "@/lib/admin";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "FREE"];
const COLOR_OPTIONS = ["블랙", "화이트", "네이비", "그레이", "베이지"];

function toComma(n: number | string): string {
  const s = String(n).replace(/[^\d]/g, "");
  if (!s) return "";
  return Number(s).toLocaleString("ko-KR");
}
function fromComma(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState("");

  // 옵션 - 배열로 관리 (Set 대신)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColor, setCustomColor] = useState("");
  const [hasCustomColor, setHasCustomColor] = useState(false);
  const [stocks, setStocks] = useState<Record<string, number>>({});

  const basePrice = fromComma(priceDisplay);

  const { data: catData } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const categories = catData?.data ?? [];

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      router.push("/admin/products");
    },
    onError: () => setError("상품 등록에 실패했습니다"),
  });

  // 실제 색상 목록 (useMemo 없이 직접 계산)
  const getActiveColors = () => {
    const list = [...selectedColors];
    if (hasCustomColor && customColor.trim()) {
      list.push(customColor.trim());
    }
    return list;
  };
  const activeColors = getActiveColors();

  // 재고 조합 키
  const stockKeys = (() => {
    if (selectedSizes.length > 0 && activeColors.length > 0) {
      return selectedSizes.flatMap((s) => activeColors.map((c) => `${s} / ${c}`));
    }
    if (selectedSizes.length > 0) return [...selectedSizes];
    if (activeColors.length > 0) return [...activeColors];
    return [];
  })();

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };
  const toggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };
  const setStock = (key: string, val: number) => {
    setStocks((prev) => ({ ...prev, [key]: val }));
  };

  // 이미지 헬퍼
  const addImageUrl = () => setImageUrls([...imageUrls, ""]);
  const removeImageUrl = (i: number) => setImageUrls(imageUrls.filter((_, idx) => idx !== i));
  const updateImageUrl = (i: number, val: string) => { const c = [...imageUrls]; c[i] = val; setImageUrls(c); };

  const handleDiscountChange = (raw: string) => {
    if (raw === "") { setDiscountRate(0); return; }
    let v = parseInt(raw, 10);
    if (isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setDiscountRate(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("상품명을 입력하세요"); return; }
    if (basePrice <= 0) { setError("가격을 입력하세요"); return; }
    if (!categoryId) { setError("카테고리를 선택하세요"); return; }

    const images = imageUrls
      .filter((u) => u.trim())
      .map((url, i) => ({ url: url.trim(), sortOrder: i, isThumbnail: i === 0 }));

    // 제출 시점에 색상 다시 계산 (클로저 stale 방지)
    const colorsAtSubmit = [...selectedColors];
    if (hasCustomColor && customColor.trim()) {
      colorsAtSubmit.push(customColor.trim());
    }

    // 옵션 그룹 조립
    const optionGroups: { name: string; optionValues: { value: string; additionalPrice: number; stockQuantity: number }[] }[] = [];

    if (selectedSizes.length > 0) {
      optionGroups.push({
        name: "사이즈",
        optionValues: selectedSizes.map((size) => ({
          value: size,
          additionalPrice: 0,
          stockQuantity: colorsAtSubmit.length > 0
            ? colorsAtSubmit.reduce((sum, c) => sum + (stocks[`${size} / ${c}`] || 0), 0)
            : (stocks[size] || 0),
        })),
      });
    }

    if (colorsAtSubmit.length > 0) {
      optionGroups.push({
        name: "색상",
        optionValues: colorsAtSubmit.map((color) => ({
          value: color,
          additionalPrice: 0,
          stockQuantity: selectedSizes.length > 0
            ? selectedSizes.reduce((sum, s) => sum + (stocks[`${s} / ${color}`] || 0), 0)
            : (stocks[color] || 0),
        })),
      });
    }

    const payload = {
      name: name.trim(),
      basePrice,
      discountRate,
      categoryId: Number(categoryId),
      description,
      status,
      images,
      optionGroups,
    };

    console.log("전송 데이터:", JSON.stringify(payload, null, 2));

    mutation.mutate(payload);
  };

  const discountedPrice = discountRate > 0 ? Math.round(basePrice * (1 - discountRate / 100)) : basePrice;

  const inputClass =
    "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors";
  const checkClass = "w-4 h-4 accent-[var(--text-primary)] cursor-pointer";

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">NEW PRODUCT</h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">상품명 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">가격 *</label>
            <input inputMode="numeric" value={priceDisplay} onChange={(e) => setPriceDisplay(toComma(e.target.value))} placeholder="0" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">할인율 (%)</label>
            <input inputMode="numeric" value={discountRate === 0 ? "" : String(discountRate)} onChange={(e) => handleDiscountChange(e.target.value)} placeholder="0" className={inputClass} />
            {basePrice > 0 && discountRate > 0 && (
              <p className="text-xs text-[var(--badge-green-text)] mt-1">할인가: {discountedPrice.toLocaleString("ko-KR")}원</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">카테고리 *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">선택하세요</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">상태</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SOLDOUT">SOLDOUT</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">설명</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} />
        </div>

        {/* 이미지 URL */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs text-[var(--text-muted)]">이미지 URL</label>
            <button type="button" onClick={addImageUrl} className="text-xs text-[var(--badge-blue-text)] hover:underline">+ 이미지 추가</button>
          </div>
          {imageUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input value={url} onChange={(e) => updateImageUrl(i, e.target.value)} placeholder="https://example.com/image.jpg" className={`flex-1 ${inputClass}`} />
              {i === 0 && <span className="text-[10px] text-[var(--badge-blue-text)] flex-shrink-0">대표</span>}
              <button type="button" onClick={() => removeImageUrl(i)} className="text-[var(--text-dim)] hover:text-[var(--text-primary)] text-lg flex-shrink-0 w-6 text-center">×</button>
            </div>
          ))}
        </div>

        {/* 사이즈 옵션 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-3">사이즈</label>
          <div className="flex flex-wrap gap-4">
            {SIZE_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={selectedSizes.includes(s)} onChange={() => toggleSize(s)} className={checkClass} />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* 색상 옵션 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-3">색상</label>
          <div className="flex flex-wrap gap-4">
            {COLOR_OPTIONS.map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)]">
                <input type="checkbox" checked={selectedColors.includes(c)} onChange={() => toggleColor(c)} className={checkClass} />
                {c}
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={hasCustomColor} onChange={() => setHasCustomColor(!hasCustomColor)} className={checkClass} />
              기타
            </label>
          </div>
          {hasCustomColor && (
            <input value={customColor} onChange={(e) => setCustomColor(e.target.value)} placeholder="색상 직접 입력" className={`mt-2 max-w-xs ${inputClass}`} />
          )}
        </div>

        {/* 재고 수량 테이블 */}
        {stockKeys.length > 0 && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-3">재고 수량</label>
            <div className="border border-[var(--border-color)] rounded overflow-hidden">
              {stockKeys.map((key) => (
                <div key={key} className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] last:border-b-0">
                  <span className="text-sm text-[var(--text-secondary)]">{key}</span>
                  <input
                    inputMode="numeric"
                    value={stocks[key] === undefined || stocks[key] === 0 ? "" : String(stocks[key])}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setStock(key, isNaN(v) || v < 0 ? 0 : v);
                    }}
                    placeholder="0"
                    className="w-20 bg-[var(--input-bg)] border border-[var(--border-color)] px-2 py-1 text-sm text-[var(--text-secondary)] text-center focus:outline-none focus:border-[var(--text-muted)]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-[1.5rem]">
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">취소</button>
          <button type="submit" disabled={mutation.isPending} className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors">
            {mutation.isPending ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
