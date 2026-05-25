import api from "./api";
import type {
  ApiResponse,
  PageResponse,
  QnaCreateRequest,
  QnaDetail,
  QnaListItem,
  QnaUpdateRequest,
  SupportCategory,
} from "@/types";

export async function getQnas(page = 0, size = 10, category?: SupportCategory) {
  const res = await api.get<ApiResponse<PageResponse<QnaListItem>>>("/api/qnas", {
    params: { page, size, category: category ?? undefined },
  });
  return res.data;
}

export async function getMyQnas(page = 0, size = 10) {
  const res = await api.get<ApiResponse<PageResponse<QnaListItem>>>("/api/qnas/me", {
    params: { page, size },
  });
  return res.data;
}

export async function getQnaDetail(id: number) {
  const res = await api.get<ApiResponse<QnaDetail>>(`/api/qnas/${id}`);
  return res.data.data;
}

export async function createQna(data: QnaCreateRequest) {
  const res = await api.post<ApiResponse<QnaDetail>>("/api/qnas", data);
  return res.data.data;
}

export async function updateQna(id: number, data: QnaUpdateRequest) {
  const res = await api.patch<ApiResponse<QnaDetail>>(`/api/qnas/${id}`, data);
  return res.data.data;
}

export async function deleteQna(id: number) {
  await api.delete(`/api/qnas/${id}`);
}

export async function uploadQnaImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiResponse<string>>("/api/qnas/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}
