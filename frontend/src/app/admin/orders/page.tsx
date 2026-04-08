"use client";

import { useState, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminOrders, updateOrderStatus } from "@/lib/admin";
import { invalidateOrderRelated } from "@/lib/queryInvalidator";
import type { AdminOrder } from "@/types";

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("ko-KR");
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "주문대기",
  PAID: "결제완료",
  PREPARING: "배송준비중",
  SHIPPED: "배송중",
  DELIVERED: "배송완료",
  CANCELLED: "주문취소",
  REFUNDED: "환불완료",
  RETURN_REQUESTED: "반품신청",
  EXCHANGE_REQUESTED: "교환신청",
};

// 관리자가 직접 변경 가능한 상태 (반품/교환 신청 상태는 제외)
const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]",
  PAID: "bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]",
  PREPARING: "bg-[var(--badge-orange-bg)] text-[var(--badge-orange-text)]",
  SHIPPED: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]",
  DELIVERED: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  CANCELLED: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
  REFUNDED: "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]",
  RETURN_REQUESTED: "bg-orange-500/20 text-orange-300",
  EXCHANGE_REQUESTED: "bg-orange-500/20 text-orange-300",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusChange, setStatusChange] = useState<{
    order: AdminOrder;
    newStatus: string;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", page],
    queryFn: () => getAdminOrders(page),
    staleTime: 0,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      setStatusChange(null);
    },
  });

  const orders = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div className="p-8">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        ORDERS
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left">주문번호</th>
                <th className="py-3 px-3 text-center">주문자ID</th>
                <th className="py-3 px-3 text-left">수령인</th>
                <th className="py-3 px-3 text-left">상품</th>
                <th className="py-3 px-3 text-right">결제금액</th>
                <th className="py-3 px-3 text-center">상태</th>
                <th className="py-3 px-3 text-left">주문일</th>
                <th className="py-3 px-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: AdminOrder) => {
                const itemSummary =
                  o.items.length === 0
                    ? "—"
                    : o.items.length === 1
                      ? o.items[0].productNameSnapshot
                      : `${o.items[0].productNameSnapshot} 외 ${o.items.length - 1}건`;
                const isExpanded = expandedId === o.id;
                return (
                  <Fragment key={o.id}>
                    <tr
                      className="border-b border-[var(--border-color)] hover:bg-[var(--card-bg)] transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : o.id)}
                    >
                      <td className="py-3 px-3 text-[var(--text-muted)] text-xs font-mono">
                        {o.orderNumber.length > 16
                          ? o.orderNumber.slice(0, 16) + "..."
                          : o.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-center text-[var(--text-muted)]">{o.memberId}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{o.recipient}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)] text-xs">{itemSummary}</td>
                      <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                        {formatPrice(o.finalAmount)}원
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_BADGE[o.status] ?? ""}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">{formatDate(o.createdAt)}</td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setStatusChange({ order: o, newStatus: e.target.value });
                            }
                          }}
                          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] px-2 py-1 focus:outline-none"
                        >
                          <option value="">상태변경</option>
                          {ORDER_STATUSES.filter((s) => s !== o.status).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    {/* 아코디언 확장 */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="bg-[var(--section-bg)] px-6 py-4 border-b border-[var(--border-color)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            <div>
                              <p className="text-[var(--text-muted)] mb-2 tracking-wider">주문 상품</p>
                              {o.items.map((item) => (
                                <div key={item.id} className="flex justify-between py-1 text-[var(--text-secondary)]">
                                  <span>{item.productNameSnapshot} ({item.optionInfoSnapshot}) × {item.quantity}</span>
                                  <span>{formatPrice(item.subtotal)}원</span>
                                </div>
                              ))}
                            </div>
                            <div>
                              <p className="text-[var(--text-muted)] mb-2 tracking-wider">배송 정보</p>
                              <div className="space-y-1 text-[var(--text-secondary)]">
                                <p>수령인: {o.recipient}</p>
                                <p>연락처: {o.phone}</p>
                                <p>주소: {o.address}</p>
                                {o.memo && <p>메모: {o.memo}</p>}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

      {/* 상태 변경 확인 모달 */}
      {statusChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={() => setStatusChange(null)} />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">주문 상태를 변경하시겠습니까?</p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              {STATUS_LABELS[statusChange.order.status] ?? statusChange.order.status} → {STATUS_LABELS[statusChange.newStatus] ?? statusChange.newStatus}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStatusChange(null)} className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">취소</button>
              <button
                onClick={() => statusMutation.mutate({ id: statusChange.order.id, status: statusChange.newStatus })}
                className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? "변경 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

