"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminProduct,
  getCategories,
  updateProduct,
  uploadProductImage,
  uploadProductDetailImage,
  deleteProductImage,
} from "@/lib/admin";
import { invalidateProductRelated } from "@/lib/queryInvalidator";
import type { AdminProductOptionUpdate } from "@/types";

function toComma(n: number | string): string {
  const s = String(n).replace(/[^\d]/g, "");
  if (!s) return "";
  return Number(s).toLocaleString("ko-KR");
}
function fromComma(s: string): number {
  return Number(s.replace(/[^\d]/g, "")) || 0;
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SOLDOUT", label: "SOLDOUT" },
  { value: "INACTIVE", label: "INACTIVE" },
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const MAX_DETAIL_FILE_SIZE = 10 * 1024 * 1024; // 10MB (상세 설명 이미지)
const MAX_DETAIL_IMAGES = 20;

interface EditingImage {
  id: number | null; // null = 신규 업로드
  url: string;
  uploading: boolean;
  markedForDelete: boolean;
  tempKey?: string; // 업로드 중 항목 식별 (신규 업로드, 동시 업로드 race 방지)
}

export default function AdminProductEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => getAdminProduct(productId),
    enabled: !isNaN(productId),
  });

  const { data: catData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const flatCategories = useMemo(() => {
    const cats = catData?.data;
    if (!cats || cats.length === 0) return [];
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

  // 폼 상태
  const [name, setName] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [status, setStatus] = useState("ACTIVE");
  const [description, setDescription] = useState("");
  const [productInfo, setProductInfo] = useState("");
  const [editingOptions, setEditingOptions] = useState<AdminProductOptionUpdate[]>([]);
  const [editingImages, setEditingImages] = useState<EditingImage[]>([]);
  const [detailEditingImages, setDetailEditingImages] = useState<EditingImage[]>([]);
  const [hoverImage, setHoverImage] = useState<EditingImage | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  const hoverFileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // 상품 데이터 로드 시 폼 초기화 (한 번만)
  useEffect(() => {
    if (!product || initialized.current) return;
    initialized.current = true;
    setName(product.name);
    setPriceDisplay(toComma(product.basePrice));
    setDiscountRate(product.discountRate);
    setCategoryId(product.categoryId ?? null);
    setStatus(product.status);
    setDescription(product.description ?? "");
    setProductInfo(product.productInfo ?? "");

    const firstGroup = (product.optionGroups ?? [])[0];
    setEditingOptions(
      (firstGroup?.values ?? []).map((v) => ({
        id: v.id,
        value: v.value,
        additionalPrice: v.additionalPrice ?? 0,
        stockQuantity: v.stockQuantity,
      }))
    );

    const allImages = product.images ?? [];
    const galleryImages = allImages
      .filter((img) => !img.detail && !img.isHover)
      .sort((a, b) => {
        if (a.isThumbnail !== b.isThumbnail) return a.isThumbnail ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      });
    const detailImgs = allImages
      .filter((img) => img.detail)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const hoverImg = allImages.find((img) => img.isHover) ?? null;

    setEditingImages(
      galleryImages.map((img) => ({
        id: img.id,
        url: img.url,
        uploading: false,
        markedForDelete: false,
      }))
    );
    setDetailEditingImages(
      detailImgs.map((img) => ({
        id: img.id,
        url: img.url,
        uploading: false,
        markedForDelete: false,
      }))
    );
    setHoverImage(
      hoverImg
        ? { id: hoverImg.id, url: hoverImg.url, uploading: false, markedForDelete: false }
        : null
    );
  }, [product]);

  const basePrice = fromComma(priceDisplay);
  const discountedPrice =
    discountRate > 0 ? Math.round(basePrice * (1 - discountRate / 100)) : basePrice;

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateProduct(productId, data),
    onSuccess: () => {
      invalidateProductRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ["admin", "product", productId] });
      setSuccess("저장되었습니다.");
      setTimeout(() => router.push("/admin/products"), 600);
    },
    onError: () => setError("저장에 실패했습니다."),
  });

  const handleDiscountChange = (raw: string) => {
    if (raw === "") { setDiscountRate(0); return; }
    let v = parseInt(raw, 10);
    if (isNaN(v)) v = 0;
    if (v < 0) v = 0;
    if (v > 100) v = 100;
    setDiscountRate(v);
  };

  // 옵션 핸들러
  const updateOption = (index: number, patch: Partial<AdminProductOptionUpdate>) => {
    setEditingOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };
  const removeOption = (index: number) => {
    setEditingOptions((prev) => prev.filter((_, i) => i !== index));
  };
  const addOption = () => {
    setEditingOptions((prev) => [...prev, { id: null, value: "", additionalPrice: 0, stockQuantity: 0 }]);
  };

  // 여러 파일 병렬 업로드 — 각 파일에 고유 키를 부여해 동시 완료 시 안전하게 교체
  const uploadFilesInto = async (
    files: File[],
    config: {
      images: EditingImage[];
      setImages: React.Dispatch<React.SetStateAction<EditingImage[]>>;
      max: number;
      maxSize: number;
      sizeMsg: string;
      uploader: (file: File) => Promise<string>;
    }
  ) => {
    if (files.length === 0) return;

    const activeCount = config.images.filter((img) => !img.markedForDelete).length;
    const remaining = config.max - activeCount;
    if (remaining <= 0) {
      setError(`이미지는 최대 ${config.max}장까지 등록할 수 있습니다.`);
      return;
    }

    const accepted: { key: string; file: File }[] = [];
    let warn = "";
    for (const file of files) {
      if (accepted.length >= remaining) break;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        warn = "허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp)";
        continue;
      }
      if (file.size > config.maxSize) {
        warn = config.sizeMsg;
        continue;
      }
      accepted.push({ key: crypto.randomUUID(), file });
    }

    if (accepted.length === 0) {
      setError(warn || "추가할 수 있는 이미지가 없습니다.");
      return;
    }
    if (!warn && files.length > remaining) {
      warn = `이미지는 최대 ${config.max}장까지 등록할 수 있어 일부만 추가됩니다.`;
    }
    setError(warn);

    config.setImages((prev) => [
      ...prev,
      ...accepted.map((a) => ({
        id: null,
        tempKey: a.key,
        url: "",
        uploading: true,
        markedForDelete: false,
      })),
    ]);

    await Promise.all(
      accepted.map(async (a) => {
        try {
          const url = await config.uploader(a.file);
          config.setImages((prev) =>
            prev.map((img) =>
              img.tempKey === a.key ? { ...img, url, uploading: false } : img
            )
          );
        } catch {
          config.setImages((prev) => prev.filter((img) => img.tempKey !== a.key));
          setError("일부 이미지 업로드에 실패했습니다.");
        }
      })
    );
  };

  // 이미지 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = "";
    uploadFilesInto(files, {
      images: editingImages,
      setImages: setEditingImages,
      max: MAX_IMAGES,
      maxSize: MAX_FILE_SIZE,
      sizeMsg: "파일 크기는 5MB 이하만 가능합니다.",
      uploader: uploadProductImage,
    });
  };

  // X 버튼: 삭제 마킹만 (S3 삭제는 저장 시점에)
  const handleMarkRemoveImage = (index: number) => {
    const img = editingImages[index];
    if (img.uploading) return;
    setEditingImages((prev) =>
      prev.map((it, i) => (i === index ? { ...it, markedForDelete: true } : it))
    );
  };

  // 마킹 복원
  const handleUndoRemoveImage = (index: number) => {
    setEditingImages((prev) =>
      prev.map((it, i) => (i === index ? { ...it, markedForDelete: false } : it))
    );
  };

  // 상세 설명 이미지 핸들러 (10MB)
  const handleDetailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (e.target) e.target.value = "";
    uploadFilesInto(files, {
      images: detailEditingImages,
      setImages: setDetailEditingImages,
      max: MAX_DETAIL_IMAGES,
      maxSize: MAX_DETAIL_FILE_SIZE,
      sizeMsg: "상세 이미지는 10MB 이하만 가능합니다.",
      uploader: uploadProductDetailImage,
    });
  };

  const handleMarkRemoveDetailImage = (index: number) => {
    const img = detailEditingImages[index];
    if (img.uploading) return;
    setDetailEditingImages((prev) =>
      prev.map((it, i) => (i === index ? { ...it, markedForDelete: true } : it))
    );
  };

  const handleUndoRemoveDetailImage = (index: number) => {
    setDetailEditingImages((prev) =>
      prev.map((it, i) => (i === index ? { ...it, markedForDelete: false } : it))
    );
  };

  // 취소: 신규 업로드된 이미지(아직 DB에 없음)는 S3에서 제거 후 목록 페이지로 이동
  const handleCancel = async () => {
    const newlyUploaded = [...editingImages, ...detailEditingImages].filter(
      (img) => img.id === null && !img.markedForDelete && !img.uploading && img.url
    );
    await Promise.all(
      newlyUploaded.map((img) => deleteProductImage(img.url).catch(() => {}))
    );
    router.push("/admin/products");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) { setError("상품명을 입력해주세요."); return; }
    if (basePrice <= 0) { setError("기본가격을 입력해주세요."); return; }

    for (const opt of editingOptions) {
      if (!opt.value.trim()) { setError("옵션값을 입력해주세요."); return; }
      if (opt.stockQuantity < 0) { setError("재고는 0 이상이어야 합니다."); return; }
    }

    if (editingImages.some((img) => img.uploading) || detailEditingImages.some((img) => img.uploading)) {
      setError("이미지 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 삭제 마킹된 항목 S3에서 삭제 (성공/실패 무관하게 진행)
    const toDeleteFromS3 = [...editingImages, ...detailEditingImages].filter(
      (img) => img.markedForDelete && !img.uploading && img.url
    );
    await Promise.all(
      toDeleteFromS3.map((img) =>
        deleteProductImage(img.url).catch(() => {
          // S3 삭제 실패해도 DB에서는 제거 진행
        })
      )
    );

    const galleryPayload = editingImages
      .filter((img) => !img.uploading && img.url && !img.markedForDelete)
      .map((img, i) => ({
        id: img.id,
        url: img.url,
        sortOrder: i,
        isThumbnail: i === 0,
        detail: false,
        isHover: false,
      }));
    const detailPayload = detailEditingImages
      .filter((img) => !img.uploading && img.url && !img.markedForDelete)
      .map((img, i) => ({
        id: img.id,
        url: img.url,
        sortOrder: i,
        isThumbnail: false,
        detail: true,
        isHover: false,
      }));
    const hoverPayload =
      hoverImage && !hoverImage.uploading && hoverImage.url && !hoverImage.markedForDelete
        ? [{ id: hoverImage.id, url: hoverImage.url, sortOrder: 0, isThumbnail: false, detail: false, isHover: true }]
        : [];
    const images = [...galleryPayload, ...detailPayload, ...hoverPayload];

    mutation.mutate({
      name: name.trim(),
      basePrice,
      discountRate,
      categoryId,
      status,
      description,
      productInfo,
      optionGroupName: "옵션",
      optionValues: editingOptions,
      images,
    });
  };

  const inputClass =
    "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors";

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-400">상품 정보를 불러올 수 없습니다.</p>
        <button
          onClick={() => router.push("/admin/products")}
          className="mt-4 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← 상품 목록
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <button
        onClick={handleCancel}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 transition-colors"
      >
        ← 상품 목록
      </button>
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        상품 수정
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 기본 정보 */}
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded p-6">
            <h2 className="text-sm font-light tracking-wider text-[var(--text-primary)] mb-4">
              기본 정보
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">상품명</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="상품명을 입력하세요"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">카테고리</label>
                  <select
                    value={categoryId ?? 0}
                    onChange={(e) => setCategoryId(Number(e.target.value) || null)}
                    className={inputClass}
                  >
                    <option value={0}>선택하세요</option>
                    {flatCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">상태</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">설명</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className={inputClass}
                  placeholder="상품 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">사이즈/소재 정보</label>
                <textarea
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  rows={6}
                  className={inputClass}
                  placeholder="사이즈, 소재 등 부가 정보를 입력하세요"
                />
              </div>
            </div>

            {/* 에러 + 버튼 (좌측 하단) */}
            <div className="mt-6">
              <div className="min-h-[1.5rem]">
                {error && <p className="text-sm text-red-400">{error}</p>}
                {success && <p className="text-sm text-[var(--badge-green-text)]">{success}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-50"
                >
                  {mutation.isPending ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 옵션 + 이미지 */}
          <div className="space-y-6">
            {/* 옵션 관리 */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded p-6">
              <h2 className="text-sm font-light tracking-wider text-[var(--text-primary)] mb-4">
                옵션 관리
              </h2>

              {editingOptions.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>옵션값</div>
                    <div style={{ width: "80px", textAlign: "right" }}>재고</div>
                    <div style={{ width: "48px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {editingOptions.map((opt, index) => (
                      <div
                        key={index}
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                      >
                        <input
                          type="text"
                          value={opt.value}
                          onChange={(e) => updateOption(index, { value: e.target.value })}
                          placeholder="예: M-블랙"
                          style={{
                            flex: 1,
                            backgroundColor: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            padding: "8px 12px",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            outline: "none",
                          }}
                        />
                        <input
                          type="number"
                          min={0}
                          value={opt.stockQuantity}
                          onChange={(e) =>
                            updateOption(index, {
                              stockQuantity: Math.max(0, parseInt(e.target.value, 10) || 0),
                            })
                          }
                          onFocus={(e) => e.target.select()}
                          style={{
                            width: "80px",
                            backgroundColor: "var(--input-bg)",
                            border: "1px solid var(--border-color)",
                            padding: "8px 12px",
                            fontSize: "13px",
                            color: "var(--text-secondary)",
                            textAlign: "right",
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          style={{
                            width: "48px",
                            padding: "8px 0",
                            fontSize: "12px",
                            color: "var(--badge-red-text)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={addOption}
                className="mt-3 w-full py-2 text-xs border border-dashed border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
              >
                + 옵션 추가
              </button>
            </div>

            {/* 이미지 관리 */}
            {(() => {
              const activeCount = editingImages.filter(
                (img) => !img.uploading && !img.markedForDelete
              ).length;
              const firstActiveIdx = editingImages.findIndex(
                (img) => !img.uploading && !img.markedForDelete
              );
              return (
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded p-6">
                  <h2 className="text-sm font-light tracking-wider text-[var(--text-primary)] mb-4">
                    이미지 관리 ({activeCount}/{MAX_IMAGES})
                  </h2>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-3">
                    {editingImages.map((img, idx) => (
                      <div
                        key={`${img.id ?? "new"}-${idx}`}
                        className={`relative w-[100px] h-[100px] border border-[var(--border-color)] bg-[var(--input-bg)] ${
                          img.markedForDelete ? "opacity-40" : ""
                        }`}
                      >
                        {img.uploading ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <span className="text-xs text-[var(--text-muted)] animate-pulse">
                              업로드 중...
                            </span>
                          </div>
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={`상품 이미지 ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {img.markedForDelete ? (
                              <button
                                type="button"
                                onClick={() => handleUndoRemoveImage(idx)}
                                title="삭제 취소"
                                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                              >
                                ↺
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkRemoveImage(idx)}
                                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                              >
                                ✕
                              </button>
                            )}
                            {img.markedForDelete && (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white bg-black/40 pointer-events-none">
                                삭제 예정
                              </span>
                            )}
                            {!img.markedForDelete && idx === firstActiveIdx && (
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]">
                                대표
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    {activeCount < MAX_IMAGES && (
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
              );
            })()}

            {/* 상세 설명 이미지 관리 */}
            {(() => {
              const activeCount = detailEditingImages.filter(
                (img) => !img.uploading && !img.markedForDelete
              ).length;
              return (
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded p-6">
                  <h2 className="text-sm font-light tracking-wider text-[var(--text-primary)] mb-1">
                    상세 설명 이미지 ({activeCount}/{MAX_DETAIL_IMAGES})
                  </h2>
                  <p className="text-[11px] text-[var(--text-dim)] mb-4">
                    상품 상세 페이지 하단에 추가한 순서대로 세로로 표시됩니다. (장당 최대 10MB)
                  </p>
                  <input
                    ref={detailFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDetailFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-3">
                    {detailEditingImages.map((img, idx) => (
                      <div
                        key={`${img.id ?? "new"}-${idx}`}
                        className={`relative w-[100px] h-[100px] border border-[var(--border-color)] bg-[var(--input-bg)] ${
                          img.markedForDelete ? "opacity-40" : ""
                        }`}
                      >
                        {img.uploading ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <span className="text-xs text-[var(--text-muted)] animate-pulse">
                              업로드 중...
                            </span>
                          </div>
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt={`상세 이미지 ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {img.markedForDelete ? (
                              <button
                                type="button"
                                onClick={() => handleUndoRemoveDetailImage(idx)}
                                title="삭제 취소"
                                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                              >
                                ↺
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkRemoveDetailImage(idx)}
                                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/60 text-white text-xs hover:bg-black/80 transition-colors"
                              >
                                ✕
                              </button>
                            )}
                            {img.markedForDelete ? (
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white bg-black/40 pointer-events-none">
                                삭제 예정
                              </span>
                            ) : (
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[10px] bg-black/60 text-white">
                                {idx + 1}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                    {activeCount < MAX_DETAIL_IMAGES && (
                      <button
                        type="button"
                        onClick={() => detailFileInputRef.current?.click()}
                        className="w-[100px] h-[100px] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                      >
                        <span className="text-2xl leading-none">+</span>
                        <span className="text-[10px] mt-1">이미지 추가</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 호버 이미지 */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded p-6">
              <h2 className="text-sm font-light tracking-wider text-[var(--text-primary)] mb-1">
                호버 이미지
              </h2>
              <p className="text-[11px] text-[var(--text-dim)] mb-4">
                상품 목록에서 마우스를 올렸을 때 표시되는 이미지입니다. (최대 5MB, 1장)
              </p>
              <input
                ref={hoverFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (e.target) e.target.value = "";
                  if (!file) return;
                  if (file.size > MAX_FILE_SIZE) {
                    setError("호버 이미지는 5MB 이하만 가능합니다.");
                    return;
                  }
                  setHoverImage({ id: null, url: "", uploading: true, markedForDelete: false });
                  try {
                    const url = await uploadProductImage(file);
                    setHoverImage({ id: null, url, uploading: false, markedForDelete: false });
                  } catch {
                    setError("호버 이미지 업로드에 실패했습니다.");
                    setHoverImage(null);
                  }
                }}
              />
              {hoverImage && !hoverImage.markedForDelete ? (
                <div className="relative w-[150px] h-[200px] border border-[var(--border-color)] bg-[var(--input-bg)]">
                  {hoverImage.uploading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-[var(--text-muted)]">업로드 중...</span>
                    </div>
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={hoverImage.url} alt="호버 이미지" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          if (hoverImage.url) deleteProductImage(hoverImage.url).catch(() => {});
                          setHoverImage(null);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => hoverFileInputRef.current?.click()}
                  className="w-[150px] h-[200px] border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-[10px] mt-1">이미지 추가</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
