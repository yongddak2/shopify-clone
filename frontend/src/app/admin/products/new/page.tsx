"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, createProduct } from "@/lib/admin";
import type { CreateProductRequest } from "@/types";

function toComma(n: number | string): string {
  const s = String(n).replace(/[^\d]/g, "");
  if (!s) return "";
  return Number(s).toLocaleString("ko-KR");
}
function fromComma(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL", "FREE"];
const COLOR_OPTIONS = ["블랙", "화이트", "네이비", "그레이", "베이지"];
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "INACTIVE", label: "INACTIVE" },
];
const FALLBACK_CATEGORIES = [
  { id: 1, name: "상의" },
  { id: 2, name: "하의" },
  { id: 3, name: "아우터" },
  { id: 4, name: "원피스/스커트" },
  { id: 5, name: "악세서리" },
];

interface OptionCombo {
  size: string;
  color: string;
  stockQuantity: string;
}

export default function AdminProductNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [imageUrls, setImageUrls] = useState([""]);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [combos, setCombos] = useState<OptionCombo[]>([]);

  const [error, setError] = useState("");

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const flatCategories = useMemo(() => {
    const cats = catData?.data;
    if (!cats || cats.length === 0) return FALLBACK_CATEGORIES;
    const flat: { id: number; name: string }[] = [];
    const walk = (list: typeof cats, prefix = "") => {
      for (const c of list) {
        flat.push({ id: c.id, name: prefix ? `${prefix} > ${c.name}` : c.name });
        if (c.children?.length) walk(c.children, prefix ? `${prefix} > ${c.name}` : c.name);
      }
    };
    walk(cats);
    return flat;
  }, [catData]);

  const basePrice = fromComma(priceDisplay);
  const discountedPrice = discountRate > 0 ? Math.round(basePrice * (1 - discountRate / 100)) : basePrice;

  // 사이즈/색상 변경 시 조합 테이블 재생성
  const allColors = useMemo(() => {
    return [...selectedColors, ...customColors.filter((c) => c.trim())];
  }, [selectedColors, customColors]);

  const regenerateCombos = (sizes: string[], colors: string[]) => {
    if (sizes.length === 0 || colors.length === 0) {
      setCombos([]);
      return;
    }
    const newCombos: OptionCombo[] = [];
    for (const size of sizes) {
      for (const color of colors) {
        const existing = combos.find((c) => c.size === size && c.color === color);
        newCombos.push(
          existing ?? { size, color, stockQuantity: "0" }
        );
      }
    }
    setCombos(newCombos);
  };

  const toggleSize = (s: string) => {
    const next = selectedSizes.includes(s)
      ? selectedSizes.filter((v) => v !== s)
      : [...selectedSizes, s];
    setSelectedSizes(next);
    regenerateCombos(next, [...(next.length ? allColors : [])]); // use current allColors
  };

  const toggleColor = (c: string) => {
    const next = selectedColors.includes(c)
      ? selectedColors.filter((v) => v !== c)
      : [...selectedColors, c];
    setSelectedColors(next);
    regenerateCombos(selectedSizes, [...next, ...customColors.filter((v) => v.trim())]);
  };

  const addCustomColor = () => setCustomColors((prev) => [...prev, ""]);
  const updateCustomColor = (idx: number, value: string) => {
    setCustomColors((prev) => prev.map((c, i) => (i === idx ? value : c)));
  };
  const removeCustomColor = (idx: number) => {
    const next = customColors.filter((_, i) => i !== idx);
    setCustomColors(next);
    regenerateCombos(selectedSizes, [...selectedColors, ...next.filter((c) => c.trim())]);
  };
  const handleCustomColorBlur = () => {
    regenerateCombos(selectedSizes, [...selectedColors, ...customColors.filter((c) => c.trim())]);
  };

  const updateCombo = (idx: number, value: string) => {
    setCombos((prev) => prev.map((c, i) => (i === idx ? { ...c, stockQuantity: value } : c)));
  };

  const handleDiscountChange = (raw: string) => {
    if (raw === "") { setDiscountRate(0); return; }
    let v = parseInt(raw, 10);
    if (isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setDiscountRate(v);
  };

  // 이미지 URL 관리
  const updateImageUrl = (idx: number, val: string) => {
    setImageUrls((prev) => prev.map((u, i) => (i === idx ? val : u)));
  };
  const addImageUrl = () => setImageUrls((prev) => [...prev, ""]);
  const removeImageUrl = (idx: number) => {
    if (imageUrls.length <= 1) return;
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      router.push("/admin/products");
    },
    onError: () => {
      setError("상품 등록에 실패했습니다. 입력 정보를 확인해주세요.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("상품명을 입력하세요."); return; }
    if (basePrice <= 0) { setError("가격을 입력하세요."); return; }
    if (categoryId === 0) { setError("카테고리를 선택하세요."); return; }
    if (combos.length === 0) { setError("사이즈와 색상을 각각 1개 이상 선택하세요."); return; }

    // 옵션 그룹 빌드: 사이즈×색상 조합을 하나의 그룹으로 전송
    const comboValues = combos.map((combo) => ({
      value: `${combo.size}-${combo.color}`,
      additionalPrice: 0,
      stockQuantity: Number(combo.stockQuantity) || 0,
    }));

    const optionGroups = [
      { name: "옵션", optionValues: comboValues },
    ];

    const images = imageUrls
      .map((url) => url.trim())
      .filter((url) => url.length > 0)
      .map((url, i) => ({ url, sortOrder: i, isThumbnail: i === 0 }));

    mutation.mutate({
      name: name.trim(),
      basePrice,
      discountRate,
      categoryId,
      description,
      status,
      images: images.length > 0 ? images : undefined,
      optionGroups,
    });
  };

  const inputClass =
    "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors";
  const checkClass = "w-4 h-4 accent-[var(--text-primary)]";

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        상품 등록
      </h1>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 상품명 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">상품명</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="상품명을 입력하세요" />
        </div>

        {/* 가격 + 할인율 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">기본가격</label>
            <input
              inputMode="numeric"
              value={priceDisplay}
              onChange={(e) => setPriceDisplay(toComma(e.target.value))}
              className={`${inputClass} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">할인율 (%)</label>
            <input
              inputMode="numeric"
              value={discountRate === 0 ? "" : String(discountRate)}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className={`${inputClass} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              placeholder="0"
            />
            {basePrice > 0 && discountRate > 0 && (
              <p className="text-xs text-[var(--badge-green-text)] mt-1">
                할인가: {discountedPrice.toLocaleString("ko-KR")}원
              </p>
            )}
          </div>
        </div>

        {/* 카테고리 + 상태 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">카테고리</label>
            <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} className={inputClass}>
              <option value={0}>선택하세요</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">상태</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">설명</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={inputClass} placeholder="상품 설명을 입력하세요" />
        </div>

        {/* 사이즈 옵션 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">사이즈</label>
          <div className="flex flex-wrap gap-3">
            {SIZE_OPTIONS.map((s) => (
              <label key={s} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                <input type="checkbox" checked={selectedSizes.includes(s)} onChange={() => toggleSize(s)} className={checkClass} />
                {s}
              </label>
            ))}
          </div>
        </div>

        {/* 색상 옵션 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">색상</label>
          <div className="flex flex-wrap gap-3">
            {COLOR_OPTIONS.map((c) => (
              <label key={c} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                <input type="checkbox" checked={selectedColors.includes(c)} onChange={() => toggleColor(c)} className={checkClass} />
                {c}
              </label>
            ))}
          </div>
          {customColors.length > 0 && (
            <div className="mt-3 space-y-2">
              {customColors.map((color, idx) => (
                <div key={idx} className="flex gap-2 items-center max-w-xs">
                  <input
                    value={color}
                    onChange={(e) => updateCustomColor(idx, e.target.value)}
                    onBlur={handleCustomColorBlur}
                    className={`${inputClass} flex-1`}
                    placeholder="색상명 입력"
                  />
                  <button type="button" onClick={() => removeCustomColor(idx)} className="text-xs text-[var(--badge-red-text)] hover:underline flex-shrink-0">
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addCustomColor}
            className="mt-2 text-xs text-[var(--badge-blue-text)] hover:underline"
          >
            + 색상 추가
          </button>
        </div>

        {/* 옵션 조합 테이블 */}
        {combos.length > 0 && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-2">옵션별 재고수량</label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                    <th className="py-2 px-3 text-left">사이즈</th>
                    <th className="py-2 px-3 text-left">색상</th>
                    <th className="py-2 px-3 text-right w-32">재고수량</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map((combo, idx) => (
                    <tr key={`${combo.size}-${combo.color}`} className="border-b border-[var(--border-color)]">
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{combo.size}</td>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{combo.color}</td>
                      <td className="py-2 px-3 text-right">
                        <input
                          inputMode="numeric"
                          value={combo.stockQuantity}
                          onChange={(e) => updateCombo(idx, e.target.value.replace(/[^\d]/g, ""))}
                          onFocus={(e) => { if (e.target.value === "0") updateCombo(idx, ""); }}
                          onBlur={(e) => { if (e.target.value === "") updateCombo(idx, "0"); }}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-2 py-1 text-xs text-right text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 이미지 URL */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">이미지 URL</label>
          <div className="space-y-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={url}
                  onChange={(e) => updateImageUrl(idx, e.target.value)}
                  className={`${inputClass} flex-1`}
                  placeholder={idx === 0 ? "썸네일 이미지 URL" : "추가 이미지 URL"}
                />
                {idx === 0 && (
                  <span className="text-[10px] text-[var(--badge-blue-text)] flex-shrink-0">썸네일</span>
                )}
                {imageUrls.length > 1 && (
                  <button type="button" onClick={() => removeImageUrl(idx)} className="text-xs text-[var(--badge-red-text)] hover:underline flex-shrink-0">
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addImageUrl} className="mt-2 text-xs text-[var(--badge-blue-text)] hover:underline">
            + 이미지 추가
          </button>
        </div>

        {/* 에러 + 버튼 */}
        <div className="min-h-[1.5rem]">
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
          >
            {mutation.isPending ? "등록 중..." : "상품 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
