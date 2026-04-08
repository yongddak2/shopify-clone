import api from "./api";
import { useAuthStore } from "@/stores/authStore";
import { getMyInfo } from "./user";
import type { ApiResponse, LoginResponse } from "@/types";

export async function signup(
  email: string,
  password: string,
  name: string,
  phone: string
) {
  const res = await api.post<ApiResponse<null>>("/api/auth/signup", {
    email,
    password,
    name,
    phone,
  });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await api.post<ApiResponse<LoginResponse>>("/api/auth/login", {
    email,
    password,
  });
  const { accessToken, refreshToken } = res.data.data;
  useAuthStore.getState().setTokens(accessToken, refreshToken);

  // 로그인 후 사용자 정보(role 포함)를 가져와서 저장
  try {
    const userRes = await getMyInfo();
    useAuthStore.getState().setUser(userRes.data);
  } catch (err) {
    console.error("사용자 정보 조회 실패:", err);
  }

  return res.data;
}

export async function logout() {
  try {
    await api.post("/api/auth/logout");
  } catch (err) {
    console.error("로그아웃 API 호출 실패 (무시됨):", err);
  }
  useAuthStore.getState().logout();
}

export async function sendResetCode(email: string) {
  const res = await api.post<ApiResponse<null>>(
    "/api/auth/password-reset/send",
    { email }
  );
  return res.data;
}

export async function verifyResetCode(email: string, code: string) {
  const res = await api.post<ApiResponse<null>>(
    "/api/auth/password-reset/verify",
    { email, code }
  );
  return res.data;
}

export async function resetPassword(
  email: string,
  newPassword: string,
  newPasswordConfirm: string
) {
  const res = await api.post<ApiResponse<null>>(
    "/api/auth/password-reset/reset",
    { email, newPassword, newPasswordConfirm }
  );
  return res.data;
}

export async function refresh(refreshToken: string) {
  const res = await api.post<ApiResponse<LoginResponse>>(
    "/api/auth/refresh",
    { refreshToken }
  );
  return res.data.data;
}
