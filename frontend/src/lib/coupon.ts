import api from "./api";
import type { ApiResponse, CouponListItem, MemberCoupon } from "@/types";

export async function getMyCoupons() {
  const res = await api.get<ApiResponse<MemberCoupon[]>>("/api/coupons/me");
  return res.data;
}

export async function getAvailableCoupons() {
  const res = await api.get<ApiResponse<CouponListItem[]>>("/api/coupons");
  return res.data;
}

export async function issueCoupon(couponId: number) {
  const res = await api.post<ApiResponse<MemberCoupon>>(`/api/coupons/${couponId}/issue`);
  return res.data;
}
