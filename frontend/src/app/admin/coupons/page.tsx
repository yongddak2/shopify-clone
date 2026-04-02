"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAdminCoupons } from "@/lib/admin";
import type { AdminCoupon } from "@/types";

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

export default function AdminCouponsPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons", page],
    queryFn: () => getAdminCoupons(page),
  });

  const coupons = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left">ID</th>
                <th className="py-3 px-3 text-left">쿠폰명</th>
                <th className="py-3 px-3 text-center">할인타입</th>
                <th className="py-3 px-3 text-right">할인값</th>
                <th className="py-3 px-3 text-right">최소주문</th>
                <th className="py-3 px-3 text-center">발급/총수량</th>
                <th className="py-3 px-3 text-left">기간</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c: AdminCoupon) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors"
                >
                  <td className="py-3 px-3 text-[var(--text-muted)]">{c.id}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{c.name}</td>
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
                    {c.issuedQuantity} / {c.totalQuantity}
                  </td>
                  <td className="py-3 px-3 text-[var(--text-muted)] text-xs">
                    {formatDate(c.startDate)} ~ {formatDate(c.endDate)}
                  </td>
                </tr>
              ))}
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
    </div>
  );
}
