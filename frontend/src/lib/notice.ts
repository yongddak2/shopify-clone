import api from "./api";
import type { ApiResponse, NoticeDetail, NoticeListItem, PageResponse } from "@/types";

export async function getNotices(page = 0, size = 10) {
  const res = await api.get<ApiResponse<PageResponse<NoticeListItem>>>(
    "/api/notices",
    { params: { page, size } }
  );
  return res.data;
}

export async function getNoticeDetail(id: number) {
  const res = await api.get<ApiResponse<NoticeDetail>>(`/api/notices/${id}`);
  return res.data.data;
}
