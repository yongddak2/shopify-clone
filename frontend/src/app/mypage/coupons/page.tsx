"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { getAvailableCoupons, getMyCoupons, issueCoupon } from "@/lib/coupon";
import { invalidateCouponRelated } from "@/lib/queryInvalidator";
import { useAuthStore } from "@/stores/authStore";
import type { CouponListItem, MemberCoupon } from "@/types";

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

function discountLabel(coupon: {
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
}) {
  if (coupon.discountType === "FIXED") {
    return <>{formatPrice(coupon.discountValue)}원 할인</>;
  }
  return (
    <>
      {coupon.discountValue}% 할인
      {coupon.maxDiscountAmount && (
        <span className="ml-1 text-xs text-[var(--text-muted)]">
          (최대 {formatPrice(coupon.maxDiscountAmount)}원 할인)
        </span>
      )}
    </>
  );
}

function couponStatus(coupon: MemberCoupon): "active" | "used" | "expired" {
  if (coupon.usedAt) return "used";
  if (new Date(coupon.expiredAt) < new Date()) return "expired";
  return "active";
}

const TABS: { key: string; label: string }[] = [
  { key: "active", label: "사용가능" },
  { key: "used", label: "사용완료" },
  { key: "expired", label: "만료" },
];

export default function MypageCouponsPage() {
  const { isLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("active");
  const [showAvailable, setShowAvailable] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["myCoupons"],
    queryFn: getMyCoupons,
    enabled: isLoggedIn(),
  });

  const { data: availableData } = useQuery({
    queryKey: ["availableCoupons"],
    queryFn: getAvailableCoupons,
    enabled: isLoggedIn(),
  });

  const issueMutation = useMutation({
    mutationFn: (couponId: number) => issueCoupon(couponId),
    onSuccess: () => {
      invalidateCouponRelated(queryClient);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? "쿠폰 다운로드에 실패했습니다.";
      alert(message);
    },
  });

  const coupons = data?.data ?? [];
  const availableCoupons = availableData?.data ?? [];

  const grouped: Record<string, MemberCoupon[]> = {
    active: [],
    used: [],
    expired: [],
  };
  for (const coupon of coupons) {
    const status = couponStatus(coupon);
    grouped[status].push(coupon);
  }

  const filtered = grouped[activeTab] ?? [];

  const downloadButtonInfo = (coupon: CouponListItem) => {
    if (coupon.isIssued) {
      return { label: "다운로드 완료", disabled: true };
    }
    if (coupon.issuedQuantity >= coupon.totalQuantity) {
      return { label: "마감", disabled: true };
    }
    return { label: "다운로드", disabled: false };
  };

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-6">
        쿠폰함
      </h2>

      {/* 다운로드 가능한 쿠폰 */}
      {availableCoupons.length > 0 && (
        <div className="mb-10">
          <button
            type="button"
            onClick={() => setShowAvailable((prev) => !prev)}
            aria-expanded={showAvailable}
            className="w-full flex items-center justify-between px-5 py-4 border border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition-colors"
          >
            <span className="text-sm tracking-[0.1em] font-light text-[var(--text-primary)]">
              다운로드 가능한 쿠폰
              <span className="ml-2 text-[var(--text-muted)]">
                {availableCoupons.filter((c) => !c.isIssued && c.issuedQuantity < c.totalQuantity).length}
              </span>
            </span>
            <ChevronDown
              size={16}
              className={`text-[var(--text-muted)] transition-transform ${
                showAvailable ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAvailable && (
            <div className="space-y-4 mt-4">
              {availableCoupons.map((coupon) => {
              const btn = downloadButtonInfo(coupon);
              return (
                <div
                  key={coupon.id}
                  className="border border-[var(--border-color)] p-5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {coupon.name}
                      </span>
                    </div>
                    <p className="text-base font-medium text-[var(--badge-blue-text)] mb-1">
                      {discountLabel(coupon)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span>최소 주문 {formatPrice(coupon.minOrderAmount)}원</span>
                      <span>~{formatDate(coupon.endDate)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={btn.disabled || issueMutation.isPending}
                    onClick={() => issueMutation.mutate(coupon.id)}
                    className={`shrink-0 px-4 py-2 text-xs tracking-wider whitespace-nowrap transition-colors ${
                      btn.disabled
                        ? "bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)] cursor-not-allowed"
                        : "border border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)]"
                    }`}
                  >
                    {btn.label}
                  </button>
                </div>
              );
            })}
            </div>
          )}

          {/* 구분선 */}
          <div className="mt-10 border-t border-[var(--border-color)]" />
        </div>
      )}

      {/* 보유 쿠폰함 */}
      <h3 className="text-sm tracking-[0.1em] font-light text-[var(--text-primary)] mb-4">
        보유 쿠폰
      </h3>

      {/* 탭 */}
      <div className="overflow-x-auto scrollbar-hide mb-8 border-b border-[var(--border-color)]">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => {
            const count = grouped[tab.key]?.length ?? 0;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
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
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)]">
            {activeTab === "active"
              ? "사용 가능한 쿠폰이 없습니다."
              : activeTab === "used"
                ? "사용 완료된 쿠폰이 없습니다."
                : "만료된 쿠폰이 없습니다."}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((coupon) => {
            const status = couponStatus(coupon);
            const inactive = status !== "active";

            return (
              <div
                key={coupon.id}
                className={`border border-[var(--border-color)] p-5 ${
                  inactive ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {coupon.couponName}
                      </span>
                      {status === "used" && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-[var(--badge-gray-bg)] text-[var(--badge-gray-text)] rounded">
                          사용완료
                        </span>
                      )}
                      {status === "expired" && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-[var(--badge-red-bg)] text-[var(--badge-red-text)] rounded">
                          만료
                        </span>
                      )}
                    </div>
                    <p className="text-base font-medium text-[var(--badge-blue-text)]">
                      {discountLabel(coupon)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span>최소 주문 {formatPrice(coupon.minOrderAmount)}원</span>
                  <span>~{formatDate(coupon.expiredAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
