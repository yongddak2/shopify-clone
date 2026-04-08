"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { getInventory, updateStock } from "@/lib/admin";
import { invalidateProductRelated } from "@/lib/queryInvalidator";
import type { InventoryItem } from "@/types";

type StatusFilter = "전체" | "정상" | "부족" | "품절";

const STATUS_BADGE: Record<InventoryItem["status"], string> = {
  품절: "bg-red-500/20 text-red-400",
  부족: "bg-orange-500/20 text-orange-400",
  정상: "bg-green-500/20 text-green-400",
};

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("전체");
  const [editingStock, setEditingStock] = useState<Record<number, number>>({});
  const [error, setError] = useState("");

  const { data: inventory, isLoading } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: getInventory,
  });

  const items = inventory ?? [];

  const summary = useMemo(() => {
    const total = items.length;
    const soldOut = items.filter((i) => i.status === "품절").length;
    const low = items.filter((i) => i.status === "부족").length;
    const normal = items.filter((i) => i.status === "정상").length;
    return { total, soldOut, low, normal };
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        keyword === "" ||
        item.productName.toLowerCase().includes(keyword) ||
        item.optionValue.toLowerCase().includes(keyword);
      const matchStatus = statusFilter === "전체" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  const updateMutation = useMutation({
    mutationFn: ({ optionValueId, stockQuantity }: { optionValueId: number; stockQuantity: number }) =>
      updateStock(optionValueId, stockQuantity),
    onSuccess: (_data, variables) => {
      invalidateProductRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      setEditingStock((prev) => {
        const next = { ...prev };
        delete next[variables.optionValueId];
        return next;
      });
      setError("");
    },
    onError: () => {
      setError("재고 저장에 실패했습니다.");
    },
  });

  const handleSave = (item: InventoryItem) => {
    const next = editingStock[item.optionValueId];
    if (next === undefined || next === item.stockQuantity) return;
    if (next < 0) {
      setError("재고는 0 이상이어야 합니다.");
      return;
    }
    updateMutation.mutate({ optionValueId: item.optionValueId, stockQuantity: next });
  };

  const handleStockChange = (optionValueId: number, raw: string) => {
    const v = parseInt(raw, 10);
    setEditingStock((prev) => ({
      ...prev,
      [optionValueId]: isNaN(v) || v < 0 ? 0 : v,
    }));
  };

  const stockColor = (qty: number) => {
    if (qty === 0) return "text-red-400";
    if (qty <= 10) return "text-orange-400";
    return "text-[var(--text-secondary)]";
  };

  const inputClass =
    "w-20 bg-[var(--input-bg)] border border-[var(--border-color)] px-2 py-1 text-sm text-right text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div className="p-8">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        INVENTORY
      </h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="전체 옵션" value={summary.total} />
        <SummaryCard label="품절" value={summary.soldOut} valueClass="text-red-400" />
        <SummaryCard label="부족 (1~10)" value={summary.low} valueClass="text-orange-400" />
        <SummaryCard label="정상" value={summary.normal} valueClass="text-green-400" />
      </div>

      {/* 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품명 또는 옵션 검색"
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] pl-10 pr-3 py-2 text-sm text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)]"
          />
        </div>
        <div className="flex gap-2">
          {(["전체", "정상", "부족", "품절"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs border transition-colors ${
                statusFilter === s
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-muted)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {/* 테이블 */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-16">
          등록된 상품이 없습니다.
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] text-center py-16">
          검색 결과가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead>
              <tr className="border-b border-white/10 text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left w-[260px]">상품명</th>
                <th className="py-3 px-3 text-left">옵션</th>
                <th className="py-3 px-3 text-right w-[100px]">현재 재고</th>
                <th className="py-3 px-3 text-right w-[110px]">수정</th>
                <th className="py-3 px-3 text-center w-[80px]">상태</th>
                <th className="py-3 px-3 text-center w-[80px]">저장</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                const prev = idx > 0 ? filteredItems[idx - 1] : null;
                const showProductName = !prev || prev.productId !== item.productId;
                const editingValue = editingStock[item.optionValueId];
                const currentEdit = editingValue ?? item.stockQuantity;
                const dirty = editingValue !== undefined && editingValue !== item.stockQuantity;
                const isSaving =
                  updateMutation.isPending &&
                  updateMutation.variables?.optionValueId === item.optionValueId;
                return (
                  <tr
                    key={item.optionValueId}
                    className="border-b border-white/10 hover:bg-[var(--card-bg)] transition-colors"
                  >
                    <td className="py-3 px-3 align-top">
                      {showProductName ? (
                        <div>
                          <div className="text-[var(--text-secondary)] font-medium">
                            {item.productName}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-0.5">
                            {formatPrice(item.basePrice)}원
                          </div>
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {item.optionValue}
                    </td>
                    <td className={`py-3 px-3 text-right ${stockColor(item.stockQuantity)}`}>
                      {item.stockQuantity}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min={0}
                        value={currentEdit}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleStockChange(item.optionValueId, e.target.value)}
                        className={inputClass}
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_BADGE[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleSave(item)}
                        disabled={!dirty || isSaving}
                        className="px-3 py-1 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "..." : "저장"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass = "text-[var(--text-primary)]",
}: {
  label: string;
  value: number;
  valueClass?: string;
}) {
  return (
    <div className="bg-[#2a2a2a] border border-[var(--border-color)] rounded p-5">
      <div className="text-xs text-[var(--text-muted)] tracking-wider mb-2">{label}</div>
      <div className={`text-2xl font-light ${valueClass}`}>{value.toLocaleString("ko-KR")}</div>
    </div>
  );
}
