import api from "./api";
import type { ApiResponse, SeasonDetail, SeasonSummary } from "@/types";

export async function getPublicSeasonList() {
  const res = await api.get<ApiResponse<SeasonSummary[]>>(
    "/api/season-collections",
    { skipAuth: true }
  );
  return res.data.data;
}

export async function getSeasonBySlug(slug: string) {
  const res = await api.get<ApiResponse<SeasonDetail>>(
    `/api/season-collections/${encodeURIComponent(slug)}`,
    { skipAuth: true }
  );
  return res.data.data;
}
