"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminProducts, updateProduct, deleteProduct } from "@/lib/admin";
import { invalidateProductRelated } from "@/lib/queryInvalidator";
import type { AdminProduct, AdminProductOptionUpdate } from "@/types";

function formatPrice(n: number) { return n.toLocaleString("ko-KR"); }
function formatDate(s: string) { return new Date(s).toLocaleDateString("ko-KR"); }
function toComma(n: number | string): string {
  const s = String(n).replace(/[^\d]/g, "");
  if (!s) return "";
  return Number(s).toLocaleString("ko-KR");
}
function fromComma(s: string): number { return Number(s.replace(/[^\d]/g, "")) || 0; }

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  SOLDOUT: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
  INACTIVE: "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]",
};

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page],
    queryFn: () => getAdminProducts(page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      invalidateProductRelated(queryClient);
      setDeleteTarget(null);
      setDeleteError("");
    },
    onError: () => {
      setDeleteTarget(null);
      setDeleteError("삭제에 실패했습니다. 이미 삭제되었거나 권한이 없습니다.");
    },
  });

  const allProducts = data?.data?.content ?? [];
  const products = allProducts.filter((p) => p.deletedAt === null);
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">PRODUCTS</h1>
        <Link href="/admin/products/new" className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors">상품 등록</Link>
      </div>

      {deleteError && <p className="text-sm text-red-400 mb-4">{deleteError}</p>}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left w-[60px]">ID</th>
                <th className="py-3 px-3 text-left w-[250px]">상품명</th>
                <th className="py-3 px-3 text-right w-[100px]">가격</th>
                <th className="py-3 px-3 text-center w-[80px]">상태</th>
                <th className="py-3 px-3 text-left">옵션</th>
                <th className="py-3 px-3 text-left w-[100px]">등록일</th>
                <th className="py-3 px-3 text-center w-[100px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: AdminProduct) => {
                const optionValues = (p.optionGroups ?? []).flatMap((g) => (g.values ?? []).map((v) => v.value));
                return (
                  <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors">
                    <td className="py-3 px-3 text-[var(--text-muted)]">{p.id}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">{p.name}</td>
                    <td className="py-3 px-3 text-right text-[var(--text-secondary)]">{formatPrice(p.basePrice)}원</td>
                    <td className="py-3 px-3 text-center"><span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_BADGE[p.status] ?? STATUS_BADGE.INACTIVE}`}>{p.status}</span></td>
                    <td className="py-3 px-3 text-[var(--text-muted)] text-xs">{optionValues.length > 0 ? optionValues.join(", ") : "—"}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{formatDate(p.createdAt)}</td>
                    <td className="py-3 px-3 text-center space-x-3">
                      <button onClick={() => setEditProduct(p)} className="text-xs text-[var(--badge-blue-text)] hover:underline">수정</button>
                      <button onClick={() => { setDeleteTarget(p); setDeleteError(""); }} className="text-xs text-[var(--badge-red-text)] hover:underline">삭제</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i)} className={`w-8 h-8 text-xs transition-colors ${page === i ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">상품을 삭제하시겠습니까?</p>
            <p className="text-xs text-[var(--text-muted)] mb-8">{deleteTarget.name} (ID: {deleteTarget.id})</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">취소</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} className="flex-1 py-3 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors">{deleteMutation.isPending ? "삭제 중..." : "삭제"}</button>
            </div>
          </div>
        </div>
      )}

      {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} />}
    </div>
  );
}

// --- 수정 모달 ---

function EditProductModal({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(product.name);
  const [priceDisplay, setPriceDisplay] = useState(toComma(product.basePrice));
  const [discountRate, setDiscountRate] = useState(product.discountRate);
  const [status, setStatus] = useState(product.status);
  const [description, setDescription] = useState(product.description ?? "");
  const [error, setError] = useState("");

  // 옵션 편집 상태
  const [editingOptions, setEditingOptions] = useState<AdminProductOptionUpdate[]>(() => {
    const firstGroup = (product.optionGroups ?? [])[0];
    return (firstGroup?.values ?? []).map((v) => ({
      id: v.id,
      value: v.value,
      additionalPrice: v.additionalPrice ?? 0,
      stockQuantity: v.stockQuantity,
    }));
  });

  const basePrice = fromComma(priceDisplay);
  const discountedPrice = discountRate > 0 ? Math.round(basePrice * (1 - discountRate / 100)) : basePrice;

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateProduct(product.id, data),
    onSuccess: () => {
      invalidateProductRelated(queryClient);
      setEditingOptions([]);
      onClose();
    },
    onError: () => setError("수정에 실패했습니다"),
  });

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
    if (!name.trim()) { setError("상품명을 입력하세요"); return; }
    for (const opt of editingOptions) {
      if (!opt.value.trim()) { setError("옵션값을 입력하세요"); return; }
      if (opt.stockQuantity < 0) { setError("재고는 0 이상이어야 합니다"); return; }
    }
    setError("");
    mutation.mutate({
      name: name.trim(),
      basePrice,
      discountRate,
      status,
      description,
      optionGroupName: "옵션",
      optionValues: editingOptions,
    });
  };

  const updateOption = (index: number, patch: Partial<AdminProductOptionUpdate>) => {
    setEditingOptions((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };
  const removeOption = (index: number) => {
    setEditingOptions((prev) => prev.filter((_, i) => i !== index));
  };
  const addOption = () => {
    setEditingOptions((prev) => [...prev, { id: null, value: "", additionalPrice: 0, stockQuantity: 0 }]);
  };

  const inputClass =
    "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] p-8 max-w-lg w-full mx-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-base font-light tracking-wider text-[var(--text-primary)] mb-6">상품 수정</h2>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">상품명</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">가격</label>
              <input inputMode="numeric" value={priceDisplay} onChange={(e) => setPriceDisplay(toComma(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">할인율 (%)</label>
              <input inputMode="numeric" value={discountRate === 0 ? "" : String(discountRate)} onChange={(e) => handleDiscountChange(e.target.value)} placeholder="0" className={inputClass} />
              {basePrice > 0 && discountRate > 0 && (
                <p className="text-xs text-[var(--badge-green-text)] mt-1">할인가: {discountedPrice.toLocaleString("ko-KR")}원</p>
              )}
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
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
          </div>

          {/* 옵션 편집 */}
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-2">옵션</label>
            {editingOptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] tracking-wider">
                  <div className="flex-1">옵션값</div>
                  <div className="w-20 text-right">재고</div>
                  <div className="w-12" />
                </div>
                {editingOptions.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.value}
                      onChange={(e) => updateOption(index, { value: e.target.value })}
                      placeholder="예: M-블랙"
                      className={`${inputClass} flex-1`}
                    />
                    <input
                      type="number"
                      min={0}
                      value={opt.stockQuantity}
                      onChange={(e) => updateOption(index, { stockQuantity: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      onFocus={(e) => e.target.select()}
                      className={`${inputClass} w-20 text-right`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="w-12 py-2 text-xs text-[var(--badge-red-text)] hover:underline"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 w-full py-2 text-xs border border-dashed border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
            >
              + 옵션 추가
            </button>
          </div>

          <div className="min-h-[1.5rem]">
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">취소</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors">
              {mutation.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
