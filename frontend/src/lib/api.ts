import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

function resolveApiBaseUrl(value: string | undefined): string {
  const configuredUrl = value?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:8080";
    }
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be set in production");
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be a valid absolute URL");
  }

  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an HTTP(S) URL without credentials");
  }
  if (url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must not contain a query string or fragment");
  }

  return url.toString().replace(/\/$/, "");
}

const apiBaseUrl = resolveApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: accessToken을 Authorization 헤더에 추가
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터: 401 에러 시 토큰 재발급 시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const status = error.response?.status;
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${apiBaseUrl}/api/auth/refresh`, {
          refreshToken,
        });
        const { accessToken: newAccess, refreshToken: newRefresh } =
          res.data.data;
        setTokens(newAccess, newRefresh);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
