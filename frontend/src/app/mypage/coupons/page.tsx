"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyCoupons } from "@/lib/coupon";
import { useAuthStore } from "@/stores/authStore";
import type { MemberCoupon } from "@/types";

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

function discountLabel(coupon: MemberCoupon) {
  if (coupon.discountType === "FIXED") {
    return `${formatPrice(coupon.discountValue)}원 할인`;
  }
  const pct = `${coupon.discountValue}% 할인`;
  if (coupon.maxDiscountAmount) {
    return `${pct} (최대 ${formatPrice(coupon.maxDiscountAmount)}원)`;
  }
  return pct;
}

function couponStatus(coupon: MemberCoupon): "active" | "used" | "expired" {
  if (!coupon.usable) return "used";
  if (new Date(coupon.expiredAt) < new Date()) return "expired";
  return "active";
}

export default function MypageCouponsPage() {
  const { isLoggedIn } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["myCoupons"],
    queryFn: getMyCoupons,
    enabled: isLoggedIn(),
  });

  const coupons = data?.data ?? [];

  return (
    <div>
      <h2 className="text-lg tracking-[0.1em] font-light text-[var(--text-primary)] mb-8">
        쿠폰함
      </h2>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--skeleton)] animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && coupons.length === 0 && (
        <div className="text-center py-20">
          <p className="text-sm text-[var(--text-muted)]">
            보유한 쿠폰이 없습니다.
          </p>
        </div>
      )}

      {!isLoading && coupons.length > 0 && (
        <div className="space-y-4">
          {coupons.map((coupon) => {
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
                  <span>
                    최소 주문 {formatPrice(coupon.minOrderAmount)}원
                  </span>
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
