import api from "./api";
import type { ApiResponse, ReviewPage, ReviewLikeResponse, Review } from "@/types";

export async function getProductReviews(
  productId: number,
  page: number = 0,
  size: number = 10,
  sort: string = "latest"
) {
  const res = await api.get<ApiResponse<ReviewPage>>(
    `/api/products/${productId}/reviews`,
    { params: { page, size, sort } }
  );
  return res.data;
}

export async function getMyReviews() {
  const res = await api.get<ApiResponse<Review[]>>("/api/reviews/me");
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

export async function toggleReviewLike(reviewId: number) {
  const res = await api.post<ApiResponse<ReviewLikeResponse>>(
    `/api/reviews/${reviewId}/like`
  );
  return res.data;
}

export async function uploadReviewImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiResponse<string>>("/api/reviews/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}
