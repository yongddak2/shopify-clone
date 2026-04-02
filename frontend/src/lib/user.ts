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

export async function addMyAddress(data: {
  label: string;
  recipient: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  defaultAddress: boolean;
}) {
  const res = await api.post<ApiResponse<MemberAddress>>(
    "/api/users/me/addresses",
    data
  );
  return res.data;
}

export async function updateMyAddress(
  id: number,
  data: {
    label: string;
    recipient: string;
    phone: string;
    zipcode: string;
    address: string;
    addressDetail: string;
    defaultAddress: boolean;
  }
) {
  const res = await api.patch<ApiResponse<MemberAddress>>(
    `/api/users/me/addresses/${id}`,
    data
  );
  return res.data;
}

export async function deleteMyAddress(id: number) {
  const res = await api.delete<ApiResponse<null>>(
    `/api/users/me/addresses/${id}`
  );
  return res.data;
}
