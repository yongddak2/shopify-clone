"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, createProduct, uploadProductImage, deleteProductImage } from "@/lib/admin";
import { invalidateProductRelated } from "@/lib/queryInvalidator";
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
const COLOR_OPTIONS = ["블랙", "화이트", "네이비", "그레이", "베이지", "브라운", "카키", "버건디"];
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

interface UploadedImage {
  url: string;
  uploading: boolean;
}

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

export default function AdminProductNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [categoryId, setCategoryId] = useState(0);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sizeMode, setSizeMode] = useState<'none' | 'custom'>('none');
  const [colorMode, setColorMode] = useState<'none' | 'custom'>('none');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [optionCombinations, setOptionCombinations] = useState<{ value: string; stock: number }[]>([]);

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

  // 사이즈/색상 변경 시 조합 자동 갱신 (기존 stock 값 보존)
  useEffect(() => {
    let nextValues: string[];
    if (sizeMode === 'none' && colorMode === 'none') {
      nextValues = ['FREE'];
    } else if (sizeMode === 'custom' && colorMode === 'none') {
      nextValues = selectedSizes;
    } else if (sizeMode === 'none' && colorMode === 'custom') {
      nextValues = selectedColors;
    } else {
      // 둘 다 custom
      if (selectedSizes.length === 0 || selectedColors.length === 0) {
        nextValues = [];
      } else {
        nextValues = [];
        for (const size of selectedSizes) {
          for (const color of selectedColors) {
            nextValues.push(`${size}-${color}`);
          }
        }
      }
    }

    setOptionCombinations((prev) => {
      const prevMap = new Map(prev.map((c) => [c.value, c.stock]));
      return nextValues.map((value) => ({
        value,
        stock: prevMap.get(value) ?? 0,
      }));
    });
  }, [sizeMode, colorMode, selectedSizes, selectedColors]);

  const toggleSize = (s: string) => {
    setSelectedSizes((prev) => (prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s]));
  };
  const toggleColor = (c: string) => {
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((v) => v !== c) : [...prev, c]));
  };

  const addCustomSize = () => {
    const v = customSizeInput.trim();
    if (!v) return;
    setSelectedSizes((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCustomSizeInput('');
  };
  const addCustomColor = () => {
    const v = customColorInput.trim();
    if (!v) return;
    setSelectedColors((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCustomColorInput('');
  };
  const removeSelectedSize = (s: string) => {
    setSelectedSizes((prev) => prev.filter((v) => v !== s));
  };
  const removeSelectedColor = (c: string) => {
    setSelectedColors((prev) => prev.filter((v) => v !== c));
  };

  const updateCombinationStock = (idx: number, stock: number) => {
    setOptionCombinations((prev) => prev.map((c, i) => (i === idx ? { ...c, stock } : c)));
  };

  const isOptionInvalid =
    (sizeMode === 'custom' || colorMode === 'custom') && optionCombinations.length === 0;

  const handleDiscountChange = (raw: string) => {
    if (raw === "") { setDiscountRate(0); return; }
    let v = parseInt(raw, 10);
    if (isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setDiscountRate(v);
  };

  // 이미지 업로드/삭제
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = "";
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp)");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("파일 크기는 5MB 이하만 가능합니다.");
      return;
    }

    const idx = uploadedImages.length;
    setUploadedImages((prev) => [...prev, { url: "", uploading: true }]);

    try {
      const url = await uploadProductImage(file);
      setUploadedImages((prev) =>
        prev.map((img, i) => (i === idx ? { url, uploading: false } : img))
      );
    } catch {
      setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
      setError("이미지 업로드에 실패했습니다.");
    }
  };

  const handleRemoveImage = async (idx: number) => {
    const img = uploadedImages[idx];
    if (img.uploading) return;

    setUploadedImages((prev) => prev.filter((_, i) => i !== idx));
    try {
      await deleteProductImage(img.url);
    } catch {
      // S3 삭제 실패해도 목록에서는 제거 유지
    }
  };

  const mutation = useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      invalidateProductRelated(queryClient);
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
    if (isOptionInvalid) { setError("옵션을 선택해주세요."); return; }

    const readyImages = uploadedImages.filter((img) => !img.uploading && img.url);
    if (readyImages.length === 0) { setError("최소 1장의 이미지를 등록해주세요."); return; }
    if (uploadedImages.some((img) => img.uploading)) { setError("이미지 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요."); return; }

    const optionGroups = [
      {
        name: "옵션",
        optionValues: optionCombinations.map((combo) => ({
          value: combo.value,
          additionalPrice: 0,
          stockQuantity: combo.stock,
        })),
      },
    ];

    const images = readyImages.map((img, i) => ({
      url: img.url,
      sortOrder: i,
      isThumbnail: i === 0,
    }));

    mutation.mutate({
      name: name.trim(),
      basePrice,
      discountRate,
      categoryId,
      description,
      status,
      images,
      optionGroups,
    });
  };

  const inputClass =
    "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors";
  const radioClass = "w-4 h-4 accent-[var(--text-primary)]";
  const optionBtnClass = (selected: boolean) =>
    `px-3 py-1.5 text-xs border transition-colors ${
      selected
        ? "bg-white text-black border-white"
        : "bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)]"
    }`;

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
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="radio" name="sizeMode" checked={sizeMode === 'none'} onChange={() => setSizeMode('none')} className={radioClass} />
              없음
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="radio" name="sizeMode" checked={sizeMode === 'custom'} onChange={() => setSizeMode('custom')} className={radioClass} />
              직접 설정
            </label>
          </div>
          {sizeMode === 'custom' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSize(s)} className={optionBtnClass(selectedSizes.includes(s))}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize(); } }}
                  className={`${inputClass} flex-1`}
                  placeholder="직접 입력"
                />
                <button type="button" onClick={addCustomSize} className="px-3 py-2 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors flex-shrink-0">
                  추가
                </button>
              </div>
              {selectedSizes.filter((s) => !SIZE_OPTIONS.includes(s)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSizes.filter((s) => !SIZE_OPTIONS.includes(s)).map((s) => (
                    <button key={s} type="button" onClick={() => removeSelectedSize(s)} className="px-3 py-1.5 text-xs bg-white text-black border border-white inline-flex items-center gap-1.5">
                      {s}
                      <span className="text-[10px]">✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 색상 옵션 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">색상</label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="radio" name="colorMode" checked={colorMode === 'none'} onChange={() => setColorMode('none')} className={radioClass} />
              없음
            </label>
            <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
              <input type="radio" name="colorMode" checked={colorMode === 'custom'} onChange={() => setColorMode('custom')} className={radioClass} />
              직접 설정
            </label>
          </div>
          {colorMode === 'custom' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button key={c} type="button" onClick={() => toggleColor(c)} className={optionBtnClass(selectedColors.includes(c))}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs">
                <input
                  type="text"
                  value={customColorInput}
                  onChange={(e) => setCustomColorInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomColor(); } }}
                  className={`${inputClass} flex-1`}
                  placeholder="직접 입력"
                />
                <button type="button" onClick={addCustomColor} className="px-3 py-2 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] transition-colors flex-shrink-0">
                  추가
                </button>
              </div>
              {selectedColors.filter((c) => !COLOR_OPTIONS.includes(c)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedColors.filter((c) => !COLOR_OPTIONS.includes(c)).map((c) => (
                    <button key={c} type="button" onClick={() => removeSelectedColor(c)} className="px-3 py-1.5 text-xs bg-white text-black border border-white inline-flex items-center gap-1.5">
                      {c}
                      <span className="text-[10px]">✕</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 옵션 조합 및 재고 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">옵션 조합 및 재고</label>
          {optionCombinations.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">사이즈 또는 색상을 선택하면 조합이 자동 생성됩니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                    <th className="py-2 px-3 text-left">옵션값</th>
                    <th className="py-2 px-3 text-right w-32">재고</th>
                  </tr>
                </thead>
                <tbody>
                  {optionCombinations.map((combo, idx) => {
                    const displayValue =
                      sizeMode === 'none' && colorMode === 'none' ? '옵션 없음' : combo.value;
                    return (
                      <tr key={combo.value} className="border-b border-[var(--border-color)]">
                        <td className="py-2 px-3 text-[var(--text-secondary)]">{displayValue}</td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            value={combo.stock}
                            onChange={(e) => updateCombinationStock(idx, Math.max(0, parseInt(e.target.value, 10) || 0))}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-2 py-1 text-xs text-right text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {isOptionInvalid && (
            <p className="text-xs text-red-400 mt-2">옵션을 선택해주세요.</p>
          )}
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-2">
            상품 이미지 ({uploadedImages.filter((img) => !img.uploading).length}/{MAX_IMAGES})
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-wrap gap-3">
            {uploadedImages.map((img, idx) => (
              <div key={idx} className="relative w-[100px] h-[100px] border border-[var(--border-color)] bg-[var(--input-bg)]">
                {img.uploading ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <span className="text-xs text-[var(--text-muted)] animate-pulse">업로드 중...</span>
                  </div>
                ) : (
                  <>
                    <img src={img.url} alt={`상품 이미지 ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                    >
                      ✕
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]">
                        대표
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
            {uploadedImages.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-[100px] h-[100px] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <span className="text-2xl leading-none">+</span>
                <span className="text-[10px] mt-1">이미지 추가</span>
              </button>
            )}
          </div>
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
            disabled={mutation.isPending || isOptionInvalid}
            className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "등록 중..." : "상품 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
