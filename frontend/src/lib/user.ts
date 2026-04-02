import api from "./api";
import type { ApiResponse, MemberAddress, User } from "@/types";

export async function getMyInfo() {
  const res = await api.get<ApiResponse<User>>("/api/users/me");
  return res.data;
}

export async function getMyAddresses() {
  const res = await api.get<ApiResponse<MemberAddress[]>>(
    "/api/users/me/addresses"
  );
  return res.data;
}
