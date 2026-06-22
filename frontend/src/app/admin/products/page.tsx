"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { getAdminProducts, deleteProduct } from "@/lib/admin";
import { getCategories } from "@/lib/product";
import { invalidateProductRelated } from "@/lib/queryInvalidator";
import type { AdminProduct } from "@/types";

function formatPrice(n: number) { return n.toLocaleString("ko-KR"); }
function formatDate(s: string) { return new Date(s).toLocaleDateString("ko-KR"); }

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  SOLDOUT: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
  INACTIVE: "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // 검색어 디바운스 300ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(t);
  }, [keyword]);

  // 필터 변경 시 첫 페이지로
  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, categoryId]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page, debouncedKeyword, categoryId],
    queryFn: () => getAdminProducts(page, debouncedKeyword, categoryId),
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

  const products = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">PRODUCTS</h1>
        <Link href="/admin/products/new" className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors whitespace-nowrap">상품 등록</Link>
      </div>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="상품명 검색"
          className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--text-muted)]"
        />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setCategoryId(undefined)}
          className={`px-3 py-1.5 text-xs tracking-widest border transition-colors ${
            categoryId === undefined
              ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-bg)]"
              : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]"
          }`}
        >
          ALL
        </button>
        {(categoriesData?.data ?? []).map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryId(cat.id)}
            className={`px-3 py-1.5 text-xs tracking-widest border transition-colors ${
              categoryId === cat.id
                ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-bg)]"
                : "border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {deleteError && <p className="text-sm text-red-400 mb-4">{deleteError}</p>}

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />)}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left w-[60px]">ID</th>
                <th className="py-3 px-3 text-left w-[70px]">이미지</th>
                <th className="py-3 px-3 text-left w-[230px]">상품명</th>
                <th className="py-3 px-3 text-left w-[90px]">카테고리</th>
                <th className="py-3 px-3 text-right w-[100px]">가격</th>
                <th className="py-3 px-3 text-center w-[80px]">상태</th>
                <th className="py-3 px-3 text-left">옵션</th>
                <th className="py-3 px-3 text-left w-[100px]">등록일</th>
                <th className="py-3 px-3 text-center w-[100px]">관리</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--text-muted)] text-xs">
                    {debouncedKeyword ? `"${debouncedKeyword}" 검색 결과가 없습니다.` : "상품이 없습니다."}
                  </td>
                </tr>
              )}
              {products.map((p: AdminProduct) => {
                const optionValues = (p.optionGroups ?? []).flatMap((g) => (g.values ?? []).map((v) => v.value));
                return (
                  <tr key={p.id} className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors">
                    <td className="py-3 px-3 text-[var(--text-muted)]">{p.id}</td>
                    <td className="py-3 px-3">
                      {p.thumbnailUrl ? (
                        <img src={p.thumbnailUrl} alt={p.name} className="w-12 h-12 object-cover bg-[var(--section-bg)]" />
                      ) : (
                        <div className="w-12 h-12 bg-[var(--section-bg)] border border-[var(--border-color)]" />
                      )}
                    </td>
                    <td className="py-3 px-3"><Link href={`/products/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline">{p.name}</Link></td>
                    <td className="py-3 px-3 text-[var(--text-muted)] text-xs tracking-wider">{p.categoryName ?? "—"}</td>
                    <td className="py-3 px-3 text-right text-[var(--text-secondary)]">{formatPrice(p.basePrice)}원</td>
                    <td className="py-3 px-3 text-center"><span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_BADGE[p.status] ?? STATUS_BADGE.INACTIVE}`}>{p.status}</span></td>
                    <td className="py-3 px-3 text-[var(--text-muted)] text-xs">{optionValues.length > 0 ? optionValues.join(", ") : "—"}</td>
                    <td className="py-3 px-3 text-[var(--text-muted)]">{formatDate(p.createdAt)}</td>
                    <td className="py-3 px-3 text-center space-x-3">
                      <button onClick={() => router.push(`/admin/products/${p.id}/edit`)} className="text-xs text-[var(--badge-blue-text)] hover:underline">수정</button>
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
    </div>
  );
}
