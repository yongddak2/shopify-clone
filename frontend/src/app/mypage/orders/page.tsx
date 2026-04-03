"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrders, cancelOrder } from "@/lib/order";
import { useAuthStore } from "@/stores/authStore";
import type { OrderResponse } from "@/types";

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const day = DAY_NAMES[d.getDay()];
  return `${yy}.${mm}.${dd}(${day})`;
}

const STATUS_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "주문대기", bg: "var(--badge-gray-bg)", text: "var(--badge-gray-text)" },
  PAID: { label: "결제완료", bg: "var(--badge-blue-bg)", text: "var(--badge-blue-text)" },
  PREPARING: { label: "배송준비", bg: "var(--badge-blue-bg)", text: "var(--badge-blue-text)" },
  SHIPPED: { label: "배송중", bg: "var(--badge-blue-bg)", text: "var(--badge-blue-text)" },
  DELIVERED: { label: "배송완료", bg: "var(--badge-green-bg)", text: "var(--badge-green-text)" },
  CANCELLED: { label: "주문취소", bg: "var(--badge-red-bg)", text: "var(--badge-red-text)" },
  REFUNDED: { label: "환불완료", bg: "var(--badge-red-bg)", text: "var(--badge-red-text)" },
};

const TABS: { key: string; label: string; statuses: string[] }[] = [
  { key: "all", label: "전체", statuses: [] },
  { key: "PENDING", label: "주문대기", statuses: ["PENDING"] },
  { key: "PAID", label: "결제완료", statuses: ["PAID"] },
  { key: "PREPARING", label: "배송준비", statuses: ["PREPARING"] },
  { key: "SHIPPED", label: "배송중", statuses: ["SHIPPED"] },
  { key: "DELIVERED", label: "배송완료", statuses: ["DELIVERED"] },
  { key: "CANCEL", label: "취소·환불", statuses: ["CANCELLED", "REFUNDED"] },
];

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

export default function MypageOrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  const [page, setPage] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [cancelTarget, setCancelTarget] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<number | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<number>>(() => {
    try {
      const stored = localStorage.getItem("confirmedOrderIds");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const confirmOrder = (id: number) => {
    const next = new Set(confirmedIds).add(id);
    setConfirmedIds(next);
    localStorage.setItem("confirmedOrderIds", JSON.stringify([...next]));
    setConfirmTarget(null);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page],
    queryFn: () => getOrders(page, 100),
    enabled: isLoggedIn(),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCancelTarget(null);
    },
    onError: () => {
      alert("주문 취소에 실패했습니다.");
      setCancelTarget(null);
    },
  });

  const allOrders = data?.data?.content ?? [];

  // 탭별 건수
  const tabCounts: Record<string, number> = {};
  for (const tab of TABS) {
    if (tab.key === "all") {
      tabCounts[tab.key] = allOrders.length;
    } else {
      tabCounts[tab.key] = allOrders.filter((o: OrderResponse) =>
        tab.statuses.includes(o.status)
      ).length;
    }
  }

  const currentTab = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const filteredOrders =
    currentTab.statuses.length === 0
      ? allOrders
      : allOrders.filter((o: OrderResponse) =>
          currentTab.statuses.includes(o.status)
        );

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-6">
        주문내역
      </h2>

      {/* 상태 탭 */}
      <div className="overflow-x-auto scrollbar-hide mb-8 border-b border-[var(--border-color)]">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const count = tabCounts[tab.key] ?? 0;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(0);
                }}
                className={`px-4 py-3 text-xs tracking-wider whitespace-nowrap transition-colors ${
                  active
                    ? "text-[var(--text-primary)] border-b-2 border-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1 ${
                      active ? "text-[var(--text-primary)]" : "text-[var(--text-dim)]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filteredOrders.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {activeTab === "all"
              ? "주문 내역이 없습니다."
              : "해당 상태의 주문이 없습니다."}
          </p>
          {activeTab === "all" && (
            <Link
              href="/products"
              className="text-sm text-[var(--text-primary)] underline underline-offset-4"
            >
              쇼핑하러 가기
            </Link>
          )}
        </div>
      )}

      {!isLoading && filteredOrders.length > 0 && (
        <div className="space-y-6">
          {filteredOrders.map((order: OrderResponse) => {
            const canCancel =
              order.status === "PENDING" || order.status === "PAID";
            const isDelivered = order.status === "DELIVERED";

            return (
              <div
                key={order.id}
                className="border border-[var(--border-color)]"
              >
                {/* 주문 헤더 */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="text-xs text-[var(--text-dim)]">
                      {order.orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <Link
                      href={`/mypage/orders/${order.id}`}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      주문 상세 &rsaquo;
                    </Link>
                  </div>
                </div>

                {/* 주문 상품 목록 */}
                <div className="divide-y divide-[var(--border-color)]">
                  {(order.orderItems ?? []).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="w-[60px] h-[60px] bg-[var(--card-bg)] flex-shrink-0 overflow-hidden">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.productNameSnapshot}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--section-bg)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--text-secondary)] truncate">
                          {item.productNameSnapshot}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {item.optionInfoSnapshot} / {item.quantity}개
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-[var(--text-primary)]">
                          {formatPrice(item.subtotal)}원
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 주문 푸터: 합계 + 액션 */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border-color)] bg-[var(--card-bg)]">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {formatPrice(order.finalAmount)}원
                  </span>
                  <div className="flex gap-2">
                    {canCancel && (
                      <>
                        <button
                          onClick={() => setCancelTarget(order.id)}
                          className="px-3 py-1.5 text-xs border border-[var(--border-color)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400 transition-colors"
                        >
                          주문 취소
                        </button>
                        <button
                          onClick={() => alert("옵션 변경 기능은 준비 중입니다.")}
                          className="px-3 py-1.5 text-xs border border-[var(--border-color)] text-[var(--text-muted)] opacity-70 hover:text-[var(--text-primary)] transition-colors"
                        >
                          옵션 변경
                        </button>
                      </>
                    )}
                    {isDelivered && !confirmedIds.has(order.id) && (
                      <>
                        <button
                          onClick={() => setConfirmTarget(order.id)}
                          className="px-3 py-1.5 text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          구매 확정
                        </button>
                        <button
                          onClick={() => alert("반품 요청 기능은 준비 중입니다.")}
                          className="px-3 py-1.5 text-xs border border-[var(--border-color)] text-[var(--text-muted)] opacity-70 hover:text-[var(--text-primary)] transition-colors"
                        >
                          반품 요청
                        </button>
                        <button
                          onClick={() => alert("교환 요청 기능은 준비 중입니다.")}
                          className="px-3 py-1.5 text-xs border border-[var(--border-color)] text-[var(--text-muted)] opacity-70 hover:text-[var(--text-primary)] transition-colors"
                        >
                          교환 요청
                        </button>
                      </>
                    )}
                    {isDelivered && confirmedIds.has(order.id) && (
                      <button
                        onClick={() => router.push("/mypage/reviews")}
                        className="px-3 py-1.5 text-xs bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
                      >
                        리뷰 작성
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 주문 취소 확인 모달 */}
      {cancelTarget !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setCancelTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-8">
              주문을 취소하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                돌아가기
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelTarget)}
                disabled={cancelMutation.isPending}
                className="flex-1 py-3 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                {cancelMutation.isPending ? "취소 중..." : "주문 취소"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 구매 확정 모달 */}
      {confirmTarget !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setConfirmTarget(null)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 max-w-sm w-full mx-6 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              구매를 확정하시겠습니까?
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              확정 후에는 반품/교환이 불가합니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTarget(null)}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => confirmOrder(confirmTarget)}
                className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
              >
                확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
