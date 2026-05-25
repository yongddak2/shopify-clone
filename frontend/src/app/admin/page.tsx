"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ClipboardList,
  Wallet,
  Users,
  RotateCcw,
  Receipt,
  UserPlus,
  ChevronDown,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { getDashboard } from "@/lib/admin";
import type {
  AdminDashboard,
  AdminDashboardLowStock,
} from "@/types";

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

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#d4a84b",
  PAID: "#5b9bd5",
  PREPARING: "#d48b4b",
  SHIPPED: "#a85bd4",
  DELIVERED: "#5bbd5b",
  CANCELLED: "#d45b5b",
  REFUNDED: "#999999",
  RETURN_REQUESTED: "#f97316",
  EXCHANGE_REQUESTED: "#fb923c",
};

const LOW_STOCK_PAGE_SIZE = 5;

function formatPrice(n: number) {
  return n.toLocaleString("ko-KR");
}

function formatDateTime(s: string) {
  const d = new Date(s);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function formatChartDate(dateStr: string) {
  const [, mm, dd] = dateStr.split("-");
  return `${mm}/${dd}`;
}

function relativeTime(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return formatDateTime(s).slice(5, 10).replace("-", "/");
}

type LowStockGroup = {
  productId: number;
  productName: string;
  options: AdminDashboardLowStock[];
  minStock: number;
};

function groupLowStock(items: AdminDashboardLowStock[]): LowStockGroup[] {
  const map = new Map<number, LowStockGroup>();
  for (const item of items) {
    const existing = map.get(item.productId);
    if (existing) {
      existing.options.push(item);
      existing.minStock = Math.min(existing.minStock, item.stockQuantity);
    } else {
      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        options: [item],
        minStock: item.stockQuantity,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.minStock - b.minStock);
}

const cards = [
  { key: "todayOrders" as const, label: "오늘 주문", icon: ClipboardList, color: "#5b9bd5", suffix: "건" },
  { key: "monthlyRevenue" as const, label: "이번 달 매출", icon: Wallet, color: "#d4a84b", suffix: "원" },
  { key: "monthlyAOV" as const, label: "월 평균 객단가", icon: Receipt, color: "#bd5b9b", suffix: "원" },
  { key: "totalMembers" as const, label: "전체 회원", icon: Users, color: "#5bbd5b", suffix: "명", href: "/admin/users" },
  { key: "newMembers" as const, label: "이번 달 신규 회원", icon: UserPlus, color: "#5bbdaa", suffix: "명", href: "/admin/users?filter=newThisMonth" },
  { key: "pendingRequests" as const, label: "처리 대기 반품/교환", icon: RotateCcw, color: "#d4715b", suffix: "건", href: "/admin/requests" },
  { key: "unansweredQna" as const, label: "미답변 Q&A", icon: MessageCircle, color: "#8c5bd4", suffix: "건", href: "/admin/qnas?answered=false" },
];

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<AdminDashboard>({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboard,
    staleTime: 60_000,
  });

  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [lowStockPage, setLowStockPage] = useState(0);

  const cardValues: Record<string, number> = {
    todayOrders: data?.todayOrderCount ?? 0,
    monthlyRevenue: data?.monthlyRevenue ?? 0,
    monthlyAOV: data?.monthlyAverageOrderValue ?? 0,
    totalMembers: data?.totalMemberCount ?? 0,
    newMembers: data?.newMembersThisMonth ?? 0,
    pendingRequests: data?.pendingRequestCount ?? 0,
    unansweredQna: data?.unansweredQnaCount ?? 0,
  };

  const chartData = (data?.dailyRevenue ?? []).map((d) => ({
    date: formatChartDate(d.date),
    "매출(만원)": Math.round(d.amount / 10000),
    rawAmount: d.amount,
  }));

  const lowStockGroups = useMemo(
    () => groupLowStock(data?.lowStockProducts ?? []),
    [data?.lowStockProducts]
  );
  const lowStockTotalPages = Math.max(1, Math.ceil(lowStockGroups.length / LOW_STOCK_PAGE_SIZE));
  const currentPage = Math.min(lowStockPage, lowStockTotalPages - 1);
  const pagedGroups = lowStockGroups.slice(
    currentPage * LOW_STOCK_PAGE_SIZE,
    currentPage * LOW_STOCK_PAGE_SIZE + LOW_STOCK_PAGE_SIZE
  );
  const totalLowOptions = data?.lowStockProducts.length ?? 0;

  const recentOrders = data?.recentOrders ?? [];
  const topProducts = data?.topProducts ?? [];

  const statusChartData = (data?.orderStatusCounts ?? [])
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] ?? s.status,
      value: s.count,
      status: s.status,
    }));
  const statusTotal = statusChartData.reduce((acc, s) => acc + s.value, 0);

  const toggleProduct = (productId: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-light tracking-[0.15em] text-[var(--text-primary)] mb-8">
        DASHBOARD
      </h1>

      {/* 상단 카드 6개 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = cardValues[card.key];
          const content = (
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-5 hover:border-[var(--text-muted)] transition-colors h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] tracking-wider text-[var(--text-muted)]">
                  {card.label}
                </span>
                <Icon
                  className="w-4 h-4"
                  style={{ color: card.color }}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-2xl font-light text-[var(--text-primary)]">
                {isLoading ? (
                  <span className="inline-block h-7 w-20 bg-[var(--border-color)] animate-pulse rounded" />
                ) : (
                  <>
                    {formatPrice(value)}
                    <span className="text-xs text-[var(--text-muted)] ml-1">
                      {card.suffix}
                    </span>
                  </>
                )}
              </p>
            </div>
          );
          return card.href ? (
            <Link key={card.key} href={card.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={card.key}>{content}</div>
          );
        })}
      </div>

      {/* 중단: 매출 차트 + 주문 상태 도넛 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
              최근 7일 매출
            </h2>
            <span className="text-xs text-[var(--text-muted)]">단위: 만원</span>
          </div>
          <div className="h-72">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="var(--border-color)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-color)" }}
                  />
                  <YAxis
                    tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-color)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-color)",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                    itemStyle={{ color: "var(--text-secondary)" }}
                    formatter={(value, _name, item) => {
                      const raw = (item.payload as { rawAmount: number }).rawAmount;
                      return [`${formatPrice(raw)}원 (${String(value)}만원)`, "매출"];
                    }}
                  />
                  <Bar dataKey="매출(만원)" fill="#5b9bd5" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 주문 상태 분포 */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
              주문 상태 분포
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              총 {formatPrice(statusTotal)}건
            </span>
          </div>
          <div className="h-72">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--text-muted)] border-t-[var(--text-primary)] rounded-full animate-spin" />
              </div>
            ) : statusChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
                주문 데이터 없음
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {statusChartData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLOR[entry.status] ?? "#999999"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border-color)",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--text-primary)" }}
                    itemStyle={{ color: "var(--text-secondary)" }}
                    formatter={(value) => [`${String(value)}건`, "주문"]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 인기 상품 TOP 5 */}
      <div className="bg-[var(--card-bg)] border border-[var(--border-color)] mb-8">
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <h2 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
            인기 상품 TOP 5
          </h2>
          <Link
            href="/admin/products"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            상품관리 →
          </Link>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-[var(--border-color)] animate-pulse rounded" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">
              판매 데이터 없음
            </p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map((p, idx) => (
                <li
                  key={p.productId}
                  className="flex items-center gap-4 py-2 border-b border-[var(--border-color)] last:border-0"
                >
                  <span className="w-6 text-center text-sm font-light text-[var(--text-muted)]">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 bg-[var(--border-color)] flex-shrink-0 overflow-hidden">
                    {p.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnailUrl}
                        alt={p.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <Link
                    href={`/admin/products/${p.productId}/edit`}
                    className="flex-1 text-sm text-[var(--text-primary)] hover:underline truncate"
                  >
                    {p.productName}
                  </Link>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {formatPrice(p.salesCount)}개
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 하단 2컬럼 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 재고 부족 상품 (그룹 + 페이지네이션) */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
                재고 부족 상품
              </h2>
              {!isLoading && lowStockGroups.length > 0 && (
                <span className="text-xs text-[var(--text-muted)]">
                  ({lowStockGroups.length}개 상품 / {totalLowOptions}개 옵션)
                </span>
              )}
            </div>
            <Link
              href="/admin/inventory"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              재고관리 →
            </Link>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-[var(--border-color)] animate-pulse rounded" />
                ))}
              </div>
            ) : lowStockGroups.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                재고 부족 상품 없음
              </p>
            ) : (
              <>
                <ul className="space-y-1">
                  {pagedGroups.map((group) => {
                    const expanded = expandedProducts.has(group.productId);
                    return (
                      <li
                        key={group.productId}
                        className="border-b border-[var(--border-color)] last:border-0"
                      >
                        <button
                          onClick={() => toggleProduct(group.productId)}
                          className="w-full flex items-center gap-2 py-3 text-left hover:bg-[var(--border-color)]/30 transition-colors"
                        >
                          {expanded ? (
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                          <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                            {group.productName}
                          </span>
                          <span className="text-xs text-[var(--text-muted)]">
                            옵션 {group.options.length}개
                          </span>
                          <span className="text-sm text-red-400 font-medium w-12 text-right">
                            최저 {group.minStock}
                          </span>
                        </button>
                        {expanded && (
                          <div className="pl-6 pb-3 space-y-1">
                            {group.options.map((opt) => (
                              <div
                                key={opt.optionValueId}
                                className="flex items-center gap-2 py-1.5 text-sm"
                              >
                                <span className="flex-1 text-[var(--text-secondary)]">
                                  {opt.optionValue === "FREE" ? "(옵션 없음)" : opt.optionValue}
                                </span>
                                <span className="text-red-400 font-medium w-12 text-right">
                                  {opt.stockQuantity}개
                                </span>
                              </div>
                            ))}
                            <Link
                              href={`/admin/products/${group.productId}/edit`}
                              className="inline-block mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              상품 수정 →
                            </Link>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {lowStockTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
                    <button
                      onClick={() => setLowStockPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    <span className="text-xs text-[var(--text-muted)]">
                      {currentPage + 1} / {lowStockTotalPages}
                    </span>
                    <button
                      onClick={() => setLowStockPage(Math.min(lowStockTotalPages - 1, currentPage + 1))}
                      disabled={currentPage === lowStockTotalPages - 1}
                      className="px-3 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 최근 주문 */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)]">
          <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-sm tracking-[0.15em] text-[var(--text-primary)]">
              최근 주문
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              주문관리 →
            </Link>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-[var(--border-color)] animate-pulse rounded" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                최근 주문 없음
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-[var(--text-muted)] border-b border-[var(--border-color)]">
                    <th className="text-left py-2 font-normal">시간</th>
                    <th className="text-left py-2 font-normal">이메일</th>
                    <th className="text-right py-2 font-normal">금액</th>
                    <th className="text-right py-2 font-normal">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.orderId}
                      className="border-b border-[var(--border-color)] last:border-0"
                    >
                      <td
                        className="py-3 text-[var(--text-secondary)] whitespace-nowrap"
                        title={formatDateTime(order.createdAt)}
                      >
                        {relativeTime(order.createdAt)}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)] truncate max-w-[140px]">
                        {order.memberEmail}
                      </td>
                      <td className="py-3 text-right text-[var(--text-primary)]">
                        {formatPrice(order.finalAmount)}원
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded ${
                            STATUS_BADGE[order.status] ??
                            "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)]"
                          }`}
                        >
                          {STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
