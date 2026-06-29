import api from "./api";
import type { ApiResponse, Faq } from "@/types";

export async function getFaqs() {
  const res = await api.get<ApiResponse<Faq[]>>("/api/faqs", {
    skipAuth: true,
  });
  return res.data.data;
}
