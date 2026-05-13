"use client";

import { useState, useEffect, Fragment } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { getAdminOrders, updateOrderStatus } from "@/lib/admin";
import { invalidateOrderRelated } from "@/lib/queryInvalidator";
import { Info, X } from "lucide-react";
import type { AdminOrder, PaymentMethod } from "@/types";

const CARRIERS = ["CJ대한통운", "롯데택배", "한진택배", "우체국택배", "로젠택배", "기타"];

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

// 필터 탭에 노출하는 모든 상태 (반품·교환 포함, 9개)
const FILTER_STATUSES = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "RETURN_REQUESTED",
  "EXCHANGE_REQUESTED",
];

// 관리자가 직접 변경 가능한 상태 (반품/교환 신청 상태는 admin/requests에서 관리)
const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "카드",
  TRANSFER: "계좌이체",
  VIRTUAL: "가상계좌",
};

const DATE_PRESETS: { label: string; days: number }[] = [
  { label: "오늘", days: 0 },
  { label: "7일", days: 6 },
  { label: "15일", days: 14 },
  { label: "1개월", days: 29 },
  { label: "3개월", days: 89 },
];

const PAGE_SIZES = [20, 50, 100];

const SEARCH_TYPES: { value: string; label: string }[] = [
  { value: "ORDER_NUMBER", label: "주문번호" },
  { value: "MEMBER_NAME", label: "주문자명" },
  { value: "RECIPIENT", label: "수령자명" },
  { value: "MEMBER_EMAIL", label: "회원 이메일" },
  { value: "PRODUCT_NAME", label: "상품명" },
];

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)]",
  PAID: "bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)]",
  PREPARING: "bg-[var(--badge-orange-bg)] text-[var(--badge-orange-text)]",
  SHIPPED: "bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)]",
  DELIVERED: "bg-[var(--badge-green-bg)] text-[var(--badge-green-text)]",
  CANCELLED: "bg-[var(--badge-red-bg)] text-[var(--badge-red-text)]",
  REFUNDED: "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]",
  RETURN_REQUESTED: "bg-pink-100 text-pink-800",
  EXCHANGE_REQUESTED: "bg-pink-100 text-pink-800",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("ORDER_NUMBER");
  const [keywordInput, setKeywordInput] = useState<string>("");
  const [appliedKeyword, setAppliedKeyword] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusChange, setStatusChange] = useState<{
    order: AdminOrder;
    newStatus: string;
  } | null>(null);
  const [carrier, setCarrier] = useState(CARRIERS[0]);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [statusError, setStatusError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (statusChange?.newStatus === "SHIPPED") {
      setCarrier(CARRIERS[0]);
      setTrackingNumber("");
    }
  }, [statusChange?.order.id, statusChange?.newStatus]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", { page, pageSize, statusFilter, startDate, endDate, searchType, appliedKeyword }],
    queryFn: () => getAdminOrders({
      page,
      size: pageSize,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      searchType: appliedKeyword ? searchType : undefined,
      keyword: appliedKeyword || undefined,
    }),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });

  const applyDatePreset = (days: number) => {
    setStartDate(daysAgoISO(days));
    setEndDate(todayISO());
    setPage(0);
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const handleStatusTab = (s: string) => {
    setStatusFilter(s);
    setPage(0);
  };

  const handlePageSizeChange = (n: number) => {
    setPageSize(n);
    setPage(0);
  };

  const executeSearch = () => {
    setAppliedKeyword(keywordInput.trim());
    setPage(0);
  };

  const clearSearch = () => {
    setKeywordInput("");
    setAppliedKeyword("");
    setPage(0);
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status, shipping }: {
      id: number;
      status: string;
      shipping?: { carrier: string; trackingNumber: string };
    }) => updateOrderStatus(id, status, shipping),
    onSuccess: () => {
      invalidateOrderRelated(queryClient);
      setStatusChange(null);
      setStatusError("");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "상태 변경에 실패했습니다.";
      setStatusError(message);
    },
  });

  const isShipped = statusChange?.newStatus === "SHIPPED";
  const confirmDisabled =
    statusMutation.isPending || (isShipped && trackingNumber.trim() === "");

  const handleConfirm = () => {
    if (!statusChange) return;
    if (isShipped) {
      statusMutation.mutate({
        id: statusChange.order.id,
        status: statusChange.newStatus,
        shipping: { carrier, trackingNumber: trackingNumber.trim() },
      });
    } else {
      statusMutation.mutate({
        id: statusChange.order.id,
        status: statusChange.newStatus,
      });
    }
  };

  const orders = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)]">
          ORDERS
        </h1>
        <button
          onClick={() => setGuideOpen(true)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="사용 가이드 열기"
          title="사용 가이드"
        >
          <Info className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* 상태 탭 */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-1 whitespace-nowrap border-b border-[var(--border-color)]">
          {(["ALL", ...FILTER_STATUSES]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusTab(s)}
              className={`px-4 py-2 text-xs tracking-wider transition-colors border-b-2 -mb-px ${
                statusFilter === s
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {s === "ALL" ? "전체" : STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* 날짜 필터 + 페이지당 개수 */}
      <div className="flex flex-wrap items-center gap-3 mb-6 text-xs">
        <div className="flex gap-1">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyDatePreset(p.days)}
              className="px-3 py-1.5 border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] px-2 py-1.5 focus:outline-none"
          />
          <span className="text-[var(--text-muted)]">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] px-2 py-1.5 focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              onClick={clearDates}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2"
            >초기화</button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[var(--text-muted)]">총 {totalElements}건</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] px-2 py-1.5 focus:outline-none"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}개씩</option>
            ))}
          </select>
        </div>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] px-3 py-1.5 focus:outline-none"
        >
          {SEARCH_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") executeSearch(); }}
          placeholder="검색어를 입력하세요"
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-secondary)] px-3 py-1.5 w-72 focus:outline-none"
        />
        <button
          onClick={executeSearch}
          className="bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] px-4 py-1.5 transition-colors"
        >
          검색
        </button>
        {appliedKeyword && (
          <button
            onClick={clearSearch}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-2"
          >
            검색 해제
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)] text-xs tracking-wider">
                <th className="py-3 px-3 text-left">주문일</th>
                <th className="py-3 px-3 text-left">주문번호</th>
                <th className="py-3 px-3 text-left">주문자</th>
                <th className="py-3 px-3 text-left">수령인</th>
                <th className="py-3 px-3 text-left">상품</th>
                <th className="py-3 px-3 text-right">상품구매금액</th>
                <th className="py-3 px-3 text-right">실결제금액</th>
                <th className="py-3 px-3 text-center">결제수단</th>
                <th className="py-3 px-3 text-center">상태</th>
                <th className="py-3 px-3 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-[var(--text-muted)] text-sm">
                    검색된 주문이 없습니다.
                  </td>
                </tr>
              )}
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
                      <td className="py-3 px-3 text-[var(--text-muted)]">{formatDate(o.createdAt)}</td>
                      <td className="py-3 px-3 text-[var(--text-muted)] text-xs font-mono">
                        {o.orderNumber.length > 16
                          ? o.orderNumber.slice(0, 16) + "..."
                          : o.orderNumber}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">
                        {o.memberName}
                        <span className="text-[var(--text-muted)] text-xs ml-1.5">#{o.memberId}</span>
                      </td>
                      <td className="py-3 px-3 text-[var(--text-secondary)]">{o.recipient}</td>
                      <td className="py-3 px-3 text-[var(--text-secondary)] text-xs">{itemSummary}</td>
                      <td className="py-3 px-3 text-right text-[var(--text-muted)]">
                        {formatPrice(o.totalAmount)}원
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--text-secondary)]">
                        {formatPrice(o.finalAmount)}원
                      </td>
                      <td className="py-3 px-3 text-center text-[var(--text-muted)] text-xs">
                        {o.paymentMethod ? PAYMENT_METHOD_LABELS[o.paymentMethod] : "-"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_BADGE[o.status] ?? ""}`}>
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              setStatusChange({ order: o, newStatus: e.target.value });
                              setStatusError("");
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
                        <td colSpan={10} className="bg-[var(--section-bg)] px-6 py-4 border-b border-[var(--border-color)]">
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

      {/* 상태 변경 확인 모달 (SHIPPED는 운송장 입력 포함) */}
      {statusChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-[var(--overlay-bg)]" onClick={() => setStatusChange(null)} />
          <div className={`relative bg-[var(--card-bg)] border border-[var(--border-color)] px-8 py-8 w-full mx-6 ${isShipped ? "max-w-md" : "max-w-sm text-center"}`}>
            <p className="text-sm text-[var(--text-secondary)] mb-2 text-center">주문 상태를 변경하시겠습니까?</p>
            <p className="text-xs text-[var(--text-muted)] mb-4 text-center">
              {STATUS_LABELS[statusChange.order.status] ?? statusChange.order.status} → {STATUS_LABELS[statusChange.newStatus] ?? statusChange.newStatus}
            </p>
            {statusError && (
              <p className="text-xs text-red-600 mb-4 text-center">{statusError}</p>
            )}

            {isShipped && (
              <div className="mb-8 space-y-4 text-left">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] tracking-wider mb-2">배송사</label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] px-3 py-2 focus:outline-none"
                  >
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] tracking-wider mb-2">운송장번호</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="운송장번호를 입력하세요"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStatusChange(null);
                  setStatusError("");
                }}
                className="flex-1 py-3 text-sm border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >취소</button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={confirmDisabled}
              >
                {statusMutation.isPending ? "변경 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사용 가이드 모달 */}
      {guideOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[var(--overlay-bg)]"
            onClick={() => setGuideOpen(false)}
          />
          <div className="relative bg-[var(--card-bg)] border border-[var(--border-color)] w-full max-w-2xl mx-6 max-h-[85vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-color)] flex-shrink-0">
              <h2 className="text-base font-medium tracking-[0.1em] text-[var(--text-primary)]">
                주문관리 사용 가이드
              </h2>
              <button
                onClick={() => setGuideOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* 본문 (스크롤) */}
            <div className="px-8 py-6 overflow-y-auto space-y-7 text-sm text-[var(--text-secondary)] leading-relaxed">
              {/* 1) 상태 설명 */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  📋 각 상태의 의미
                </h3>
                <ul className="space-y-2 text-[13px]">
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-yellow-bg)] text-[var(--badge-yellow-text)] mr-2">주문대기</span>
                    고객이 주문은 했으나 아직 결제 전 상태입니다.
                  </li>
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-blue-bg)] text-[var(--badge-blue-text)] mr-2">결제완료</span>
                    결제가 정상 완료된 상태입니다. 보통 이 단계에서 상품 발송 준비를 시작합니다.
                  </li>
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-orange-bg)] text-[var(--badge-orange-text)] mr-2">배송준비중</span>
                    상품을 포장하고 택배 발송 직전 단계입니다.
                  </li>
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-purple-bg)] text-[var(--badge-purple-text)] mr-2">배송중</span>
                    택배사에 상품을 전달했고 운송장이 등록된 상태입니다.
                  </li>
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-green-bg)] text-[var(--badge-green-text)] mr-2">배송완료</span>
                    고객이 상품을 수령한 상태입니다.
                  </li>
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] mr-2">주문취소</span>
                    주문이 취소된 상태입니다 (결제 전 취소 또는 결제 후 취소).
                  </li>
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)] mr-2">환불완료</span>
                    결제 금액을 고객에게 돌려준 상태입니다.
                  </li>
                  <li>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-pink-100 text-pink-800 mr-2">반품신청</span>
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-pink-100 text-pink-800 mr-2">교환신청</span>
                    고객이 신청한 상태입니다. 좌측 메뉴 <b>반품/교환 관리</b>에서 처리하세요.
                  </li>
                </ul>
              </section>

              {/* 2) 일반 흐름 */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  🔄 일반적인 주문 흐름
                </h3>
                <p className="text-[13px] mb-3">
                  정상 주문은 보통 아래 순서로 진행됩니다:
                </p>
                <div className="text-[13px] text-[var(--text-muted)] bg-[var(--section-bg)] px-4 py-3 rounded">
                  주문대기 → <b className="text-[var(--text-primary)]">결제완료</b> (자동) → 배송준비중 → 배송중 → 배송완료
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px] list-disc list-inside text-[var(--text-secondary)]">
                  <li>고객이 결제하면 <b>주문대기 → 결제완료</b>는 시스템이 자동 처리합니다.</li>
                  <li>발송 준비가 되면 관리자가 <b>배송준비중</b>으로 변경합니다.</li>
                  <li>택배사에 전달했으면 <b>배송중</b>으로 변경 (운송장번호 입력 필수).</li>
                  <li>고객이 수령했으면 <b>배송완료</b>로 변경합니다.</li>
                </ul>
              </section>

              {/* 3) 이메일 자동 발송 */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  ✉️ 자동 발송되는 안내 이메일
                </h3>
                <p className="text-[13px] mb-3 text-[var(--text-muted)]">
                  아래 상태로 변경되면 고객에게 이메일이 자동 발송됩니다. 관리자가 따로 안 보내도 됩니다.
                </p>
                <ul className="space-y-2 text-[13px]">
                  <li>
                    <b className="text-[var(--text-primary)]">결제완료</b> 시 — 주문 확인 메일 (시스템 자동)
                  </li>
                  <li>
                    <b className="text-[var(--text-primary)]">배송중</b>으로 변경 시 — 발송 안내 메일 (배송사 + 운송장번호 포함)
                  </li>
                  <li>
                    <b className="text-[var(--text-primary)]">주문취소</b>로 변경 시 — 취소 안내 메일 (단, 관리자가 직접 취소한 경우만. 고객이 마이페이지에서 직접 취소한 경우는 발송 안 됨)
                  </li>
                </ul>
              </section>

              {/* 4) 운송장 입력 */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  📦 운송장 정보
                </h3>
                <ul className="space-y-1.5 text-[13px] list-disc list-inside">
                  <li><b>배송중</b>으로 변경할 때 배송사와 운송장번호를 입력하는 창이 뜹니다.</li>
                  <li>입력한 정보는 고객 이메일과 마이페이지에서 그대로 보입니다.</li>
                  <li>운송장번호 없이는 배송중으로 변경할 수 없습니다.</li>
                </ul>
              </section>

              {/* 5) 자주 묻는 상황 */}
              <section>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                  ❓ 자주 묻는 상황
                </h3>
                <div className="space-y-3 text-[13px]">
                  <div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">실수로 상태를 잘못 변경했어요</p>
                    <p className="text-[var(--text-muted)]">
                      어떤 상태로든 다시 되돌릴 수 있습니다. 단, 이메일이 이미 발송됐다면 고객에게 별도로 안내가 필요할 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">반품/교환 신청이 들어왔어요</p>
                    <p className="text-[var(--text-muted)]">
                      이 페이지가 아니라 좌측 메뉴의 <b>반품/교환 관리</b>에서 승인/거절/완료 처리를 합니다.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">고객이 결제했는데 결제완료 표시가 안 떠요</p>
                    <p className="text-[var(--text-muted)]">
                      결제 처리 중일 수 있습니다. 잠시 후 페이지를 새로고침해 보세요.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)] mb-1">취소된 주문의 환불은 어떻게 하나요?</p>
                    <p className="text-[var(--text-muted)]">
                      결제 시스템에서 환불 처리 후, 이 페이지에서 상태를 <b>환불완료</b>로 변경해 주세요. (현재 시스템에선 결제사 환불은 별도 절차로 진행됩니다.)
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* 푸터 */}
            <div className="px-8 py-4 border-t border-[var(--border-color)] flex-shrink-0">
              <button
                onClick={() => setGuideOpen(false)}
                className="w-full py-2.5 text-sm bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover)] transition-colors"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

