import api from "./api";
import type { ApiResponse, PageResponse, Review } from "@/types";

export async function getProductReviews(productId: number, page = 0, size = 10) {
  const res = await api.get<ApiResponse<PageResponse<Review>>>(
    `/api/products/${productId}/reviews`,
    { params: { page, size } }
  );
  return res.data;
}

export async function createReview(data: {
  orderItemId: number;
  rating: number;
  content?: string;
  imageUrls?: string[];
}) {
  const res = await api.post<ApiResponse<Review>>("/api/reviews", data);
  return res.data;
}

export async function deleteReview(id: number) {
  const res = await api.delete<ApiResponse<null>>(`/api/reviews/${id}`);
  return res.data;
}
