"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminNewArrivals,
  deleteNewArrival,
  reorderNewArrivals,
  replaceNewArrivals,
  getAdminProducts,
} from "@/lib/admin";
import { invalidateNewArrivalsRelated } from "@/lib/queryInvalidator";
import { Trash2, Pencil, X, Menu } from "lucide-react";
import type { NewArrivalEntry, AdminProduct } from "@/types";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const MAX_NEW_ARRIVALS = 10;

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function getThumbnailUrl(product: {
  images?: { url: string; isThumbnail?: boolean; sortOrder?: number }[];
  thumbnailUrl?: string | null;
} | null | undefined): string | null {
  if (!product) return null;
  if (product.images?.length) {
    const thumb = product.images.find((i) => i.isThumbnail);
    if (thumb) return thumb.url;
    const sorted = [...product.images].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    if (sorted[0]?.url) return sorted[0].url;
  }
  return product.thumbnailUrl ?? null;
}

export default function NewArrivalsSection() {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<NewArrivalEntry | null>(null);
  const [localOrder, setLocalOrder] = useState<NewArrivalEntry[] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "newArrivals"],
    queryFn: getAdminNewArrivals,
  });

  const serverEntries = useMemo(
    () => [...(data?.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [data]
  );

  const entries = localOrder ?? serverEntries;

  useEffect(() => {
    setLocalOrder(null);
  }, [serverEntries]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNewArrival(id),
    onSuccess: () => {
      invalidateNewArrivalsRelated(queryClient);
      setDeleteTarget(null);
    },
    onError: () => setError("삭제에 실패했습니다."),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: number[]) => reorderNewArrivals(orderedIds),
    onSuccess: () => {
      invalidateNewArrivalsRelated(queryClient);
    },
    onError: () => {
      setError("순서 변경에 실패했습니다.");
      setLocalOrder(null);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = entries.findIndex((e) => e.id === active.id);
    const newIdx = entries.findIndex((e) => e.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;

    const next = arrayMove(entries, oldIdx, newIdx);
    setLocalOrder(next);
    reorderMutation.mutate(next.map((e) => e.id));
  };

  return (
    <div className="mt-16 pt-10 border-t border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-light tracking-[0.15em] text-[var(--text-primary)]">
          NEW ARRIVALS 큐레이션
        </h2>
        <span className="text-sm text-[var(--text-muted)]">
          {entries.length} / {MAX_NEW_ARRIVALS}개
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-6">
        메인 페이지 NEW ARRIVALS 섹션에 노출할 상품을 선택합니다.
        비어 있으면 최신 등록순 4개가 자동 노출되고, 5개 이상이면 자동 슬라이드됩니다.
        우측 핸들을 드래그해 순서를 변경할 수 있습니다.
      </p>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="mb-6">
        <button
          onClick={() => {
            setError("");
            setEditorOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
        >
          <Pencil className="w-4 h-4" />
          상품 수정
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-[100px] bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--text-muted)] bg-[var(--card-bg)] border border-[var(--border-color)]">
          등록된 상품이 없습니다. 최신 등록순 4개가 자동 노출됩니다.
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={entries.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {entries.map((entry, idx) => (
                <SortableNewArrivalRow
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  onDelete={() => setDeleteTarget(entry)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editorOpen && (
        <ProductEditorModal
          initialSelection={entries.map((e) => e.product.id)}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            invalidateNewArrivalsRelated(queryClient);
            setEditorOpen(false);
          }}
          onError={(msg) => setError(msg)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              NEW ARRIVALS에서 이 상품을 제거하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              상품 자체는 삭제되지 않습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm tracking-wider border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-3 text-sm tracking-wider bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "제거 중..." : "제거"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableNewArrivalRow({
  entry,
  index,
  onDelete,
}: {
  entry: NewArrivalEntry;
  index: number;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.85 : 1,
    boxShadow: isDragging ? "0 12px 28px rgba(0,0,0,0.18)" : undefined,
  };

  const product = entry.product;
  const thumb = getThumbnailUrl(product as never);
  const hasDiscount = product.discountRate > 0;
  const finalPrice = hasDiscount
    ? Math.round(product.basePrice * (1 - product.discountRate / 100))
    : product.basePrice;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-[var(--card-bg)] border border-[var(--border-color)] p-4"
    >
      <span className="text-lg font-light text-[var(--text-muted)] w-6 text-center flex-shrink-0">
        {index + 1}
      </span>

      <Link
        href={`/products/${product.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-[80px] h-[100px] bg-[var(--section-bg)] flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity"
      >
        {thumb ? (
          <img
            src={thumb}
            alt={product.name}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="w-full h-full" />
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--text-primary)] truncate mb-1 block hover:underline"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2 text-xs">
          {hasDiscount && (
            <span className="text-[var(--text-dim)] line-through">
              {formatPrice(product.basePrice)}원
            </span>
          )}
          <span className="text-[var(--text-secondary)]">
            {formatPrice(finalPrice)}원
          </span>
          {hasDiscount && (
            <span className="text-red-400">{product.discountRate}%</span>
          )}
        </div>
        {product.status === "SOLDOUT" && (
          <p className="text-[10px] text-orange-500 mt-1">품절 상태</p>
        )}
        {product.status === "INACTIVE" && (
          <p className="text-[10px] text-red-500 mt-1">
            비활성 상품 — 공개 화면에 노출되지 않음
          </p>
        )}
      </div>

      <button
        onClick={onDelete}
        className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-red-600 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-grab active:cursor-grabbing touch-none"
        aria-label="드래그해서 순서 변경"
        title="드래그해서 순서 변경"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}

function ProductEditorModal({
  initialSelection,
  onClose,
  onSaved,
  onError,
}: {
  initialSelection: number[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<number[]>(initialSelection);
  const [localError, setLocalError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page],
    queryFn: () => getAdminProducts(page),
  });

  const replaceMutation = useMutation({
    mutationFn: (productIds: number[]) => replaceNewArrivals(productIds),
    onSuccess: () => {
      invalidateNewArrivalsRelated(queryClient);
      onSaved();
    },
    onError: (err: unknown) => {
      const msg = extractErrorMessage(err) ?? "저장에 실패했습니다.";
      setLocalError(msg);
      onError(msg);
    },
  });

  const pageData = data?.data;
  const products: AdminProduct[] = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const filteredProducts = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return products;
    return products.filter((p) => p.name.toLowerCase().includes(trimmed));
  }, [products, keyword]);

  const toggle = (id: number) => {
    setLocalError("");
    setSelectedOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx >= 0) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_NEW_ARRIVALS) {
        setLocalError(`최대 ${MAX_NEW_ARRIVALS}개까지만 선택 가능합니다.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const dirty = useMemo(() => {
    if (selectedOrder.length !== initialSelection.length) return true;
    return selectedOrder.some((id, i) => id !== initialSelection[i]);
  }, [selectedOrder, initialSelection]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={onClose} />
      <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] w-[min(900px,calc(100vw-3rem))] max-h-[calc(100vh-3rem)] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div>
            <h3 className="text-sm tracking-wider text-[var(--text-primary)]">
              NEW ARRIVALS 상품 수정
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              클릭한 순서대로 번호가 부여됩니다 · 다시 클릭하면 해제 · 선택{" "}
              {selectedOrder.length} / {MAX_NEW_ARRIVALS}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-3 border-b border-[var(--border-color)]">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="상품명 검색 (현재 페이지 내)"
            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-secondary)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-[var(--skeleton)] animate-pulse"
                />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="text-center py-12 text-sm text-[var(--text-muted)]">
              상품이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const orderIdx = selectedOrder.indexOf(product.id);
                const selected = orderIdx >= 0;
                const thumb = getThumbnailUrl(product);

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggle(product.id)}
                    className={`relative text-left border transition-all ${
                      selected
                        ? "border-[var(--text-primary)] ring-2 ring-[var(--text-primary)]"
                        : "border-[var(--border-color)] hover:border-[var(--text-secondary)]"
                    }`}
                  >
                    <div className="relative aspect-[3/4] bg-[var(--section-bg)] overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                      {/* 우상단 순서 번호 (카카오톡 스타일) */}
                      <div
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                          selected
                            ? "bg-[var(--text-primary)] text-[var(--btn-primary-text)] scale-100"
                            : "bg-white/70 backdrop-blur-sm border border-white/80 text-transparent scale-90"
                        }`}
                      >
                        {selected ? orderIdx + 1 : ""}
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-[var(--text-primary)] truncate mb-1">
                        {product.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatPrice(product.basePrice)}원
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-[var(--border-color)]">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {localError && (
          <p className="text-xs text-red-600 px-6 py-2">{localError}</p>
        )}

        <div className="flex gap-3 px-6 py-4 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            disabled={replaceMutation.isPending}
            className="flex-1 py-2.5 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={() => replaceMutation.mutate(selectedOrder)}
            disabled={!dirty || replaceMutation.isPending}
            className="flex-1 py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {replaceMutation.isPending
              ? "저장 중..."
              : `${selectedOrder.length}개 적용`}
          </button>
        </div>
      </div>
    </div>
  );
}

function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null && "response" in err) {
    const e = err as { response?: { data?: { message?: string } } };
    return e.response?.data?.message ?? null;
  }
  return null;
}
