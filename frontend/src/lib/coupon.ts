import api from "./api";
import type { ApiResponse, MemberCoupon } from "@/types";

export async function getMyCoupons() {
  const res = await api.get<ApiResponse<MemberCoupon[]>>("/api/coupons/me");
  return res.data;
}
