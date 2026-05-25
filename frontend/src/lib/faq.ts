import api from "./api";
import type { ApiResponse, Faq } from "@/types";

export async function getFaqs() {
  const res = await api.get<ApiResponse<Faq[]>>("/api/faqs");
  return res.data.data;
}
