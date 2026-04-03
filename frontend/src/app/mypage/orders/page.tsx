"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOrders } from "@/lib/order";
import { useAuthStore } from "@/stores/authStore";
import type { OrderResponse } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: "주문 대기", bg: "var(--badge-gray-bg)", text: "var(--badge-gray-text)" },
  PAID: { label: "결제 완료", bg: "var(--badge-blue-bg)", text: "var(--badge-blue-text)" },
  PREPARING: { label: "배송 준비", bg: "var(--badge-yellow-bg)", text: "var(--badge-yellow-text)" },
  SHIPPED: { label: "배송 중", bg: "var(--badge-orange-bg)", text: "var(--badge-orange-text)" },
  DELIVERED: { label: "배송 완료", bg: "var(--badge-green-bg)", text: "var(--badge-green-text)" },
  CANCELLED: { label: "주문 취소", bg: "var(--badge-red-bg)", text: "var(--badge-red-text)" },
  REFUNDED: { label: "환불 완료", bg: "var(--badge-purple-bg)", text: "var(--badge-purple-text)" },
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    bg: "var(--badge-gray-bg)",
    text: "var(--badge-gray-text)",
  };
  return (
    <span
      className="inline-block px-2 py-0.5 text-xs rounded"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

function orderSummary(order: OrderResponse) {
  if (!order.orderItems?.length) return "상품 없음";
  const first = order.orderItems[0].productNameSnapshot;
  const rest = order.orderItems.length - 1;
  return rest > 0 ? `${first} 외 ${rest}건` : first;
}

export default function MypageOrdersPage() {
  const { isLoggedIn } = useAuthStore();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => getOrders(page, 10),
    enabled: isLoggedIn(),
  });

  const orders = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-8">
        주문내역
      </h2>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)] mb-6">
            주문 내역이 없습니다.
          </p>
          <Link
            href="/products"
            className="text-sm text-[var(--text-primary)] underline underline-offset-4"
          >
            쇼핑하러 가기
          </Link>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order: OrderResponse) => (
            <Link
              key={order.id}
              href={`/mypage/orders/${order.id}`}
              className="block border border-[var(--border-color)] p-5 hover:border-[var(--text-muted)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] mb-1">
                    {formatDate(order.createdAt)} · {order.orderNumber}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {orderSummary(order)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm font-medium text-right text-[var(--text-primary)]">
                {formatPrice(order.finalAmount)}원
              </p>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-9 h-9 text-xs transition-colors ${
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
