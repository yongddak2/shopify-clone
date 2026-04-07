"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  deleteCoupon,
  getAdminCoupons,
  updateCoupon,
  type UpdateCouponRequest,
} from "@/lib/admin";
import type { AdminCoupon } from "@/types";

type ErrorResponse = { success: boolean; message: string | null; data: unknown };

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}
function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateCouponRequest>({
    name: "",
    totalQuantity: 0,
    startDate: "",
    endDate: "",
  });
  const [editError, setEditError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons", page],
    queryFn: () => getAdminCoupons(page),
  });

  const coupons = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCouponRequest }) =>
      updateCoupon(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setEditingId(null);
      setEditError("");
    },
    onError: (err: AxiosError<ErrorResponse>) => {
      setEditError(err.response?.data?.message ?? "쿠폰 수정에 실패했습니다");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<ErrorResponse>) => {
      alert(err.response?.data?.message ?? "쿠폰 삭제에 실패했습니다");
      setDeleteTarget(null);
    },
  });

  const startEdit = (c: AdminCoupon) => {
    setEditingId(c.id);
    setEditError("");
    setEditForm({
      name: c.name,
      totalQuantity: c.totalQuantity,
      startDate: toDateTimeLocal(c.startDate),
      endDate: toDateTimeLocal(c.endDate),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const submitEdit = (id: number) => {
    setEditError("");
    if (!editForm.name.trim()) {
      setEditError("쿠폰명을 입력하세요");
      return;
    }
    if (!editForm.totalQuantity || editForm.totalQuantity < 1) {
      setEditError("총 수량을 입력하세요");
      return;
    }
    if (!editForm.startDate || !editForm.endDate) {
      setEditError("기간을 입력하세요");
      return;
    }
    updateMutation.mutate({
      id,
      data: {
        name: editForm.name.trim(),
        totalQuantity: Number(editForm.totalQuantity),
        startDate: new Date(editForm.startDate).toISOString(),
        endDate: new Date(editForm.endDate).toISOString(),
      },
    });
  };

  const inputClass =
    "w-full bg-[var(--input-bg)] border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-muted)] transition-colors";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          COUPONS
        </h1>
        <Link
          href="/admin/coupons/new"
          className="px-4 py-2 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
        >
          쿠폰 생성
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1050px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left">ID</th>
                <th className="py-3 px-3 text-left">쿠폰명</th>
                <th className="py-3 px-3 text-center">할인타입</th>
                <th className="py-3 px-3 text-right">할인값</th>
                <th className="py-3 px-3 text-right">최소주문</th>
                <th className="py-3 px-3 text-center">발급/총수량</th>
                <th className="py-3 px-3 text-left">기간</th>
                <th className="py-3 px-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c: AdminCoupon) => {
                const isEditing = editingId === c.id;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors align-middle"
                  >
                    <td className="py-3 px-3 text-[var(--text-muted)]">{c.id}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)]">
                      {isEditing ? (
                        <input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          className={inputClass}
                        />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]">
                        {c.discountType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                      {c.discountType === "PERCENT"
                        ? `${c.discountValue}%`
                        : `${formatPrice(c.discountValue)}원`}
                    </td>
                    <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                      {formatPrice(c.minOrderAmount)}원
                    </td>
                    <td className="py-3 px-3 text-center text-[var(--text-secondary)]">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <span>{c.issuedQuantity}</span>
                          <span>/</span>
                          <input
                            type="number"
                            min={c.issuedQuantity}
                            value={editForm.totalQuantity}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                totalQuantity: Number(e.target.value),
                              })
                            }
                            className={`${inputClass} w-20`}
                          />
                        </div>
                      ) : (
                        <>
                          {c.issuedQuantity} / {c.totalQuantity}
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[var(--text-muted)] text-xs">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            type="datetime-local"
                            value={editForm.startDate}
                            onChange={(e) =>
                              setEditForm({ ...editForm, startDate: e.target.value })
                            }
                            className={inputClass}
                          />
                          <input
                            type="datetime-local"
                            value={editForm.endDate}
                            onChange={(e) =>
                              setEditForm({ ...editForm, endDate: e.target.value })
                            }
                            className={inputClass}
                          />
                        </div>
                      ) : (
                        <>
                          {formatDate(c.startDate)} ~ {formatDate(c.endDate)}
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isEditing ? (
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex gap-1">
                            <button
                              onClick={() => submitEdit(c.id)}
                              disabled={updateMutation.isPending}
                              className="px-2 py-1 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-2 py-1 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              취소
                            </button>
                          </div>
                          {editError && (
                            <p className="text-[10px] text-red-400">{editError}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => startEdit(c)}
                            className="px-2 py-1 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => setDeleteTarget(c)}
                            className="px-2 py-1 text-xs border border-[var(--border-color)] text-red-400 hover:text-red-300 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      )}
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
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 text-xs transition-colors ${
                page === i
                  ? "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6 max-w-sm w-full mx-4">
            <h2 className="text-sm tracking-wider text-[var(--text-primary)] mb-4">
              쿠폰 삭제
            </h2>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              <span className="text-[var(--text-secondary)]">{deleteTarget.name}</span>{" "}
              쿠폰을 삭제하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-xs bg-red-500/80 text-white hover:bg-red-500 transition-colors"
              >
                {deleteMutation.isPending ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
