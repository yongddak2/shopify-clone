import api from "./api";
import type { ApiResponse, WishlistItem } from "@/types";

export async function getWishlists() {
  const res = await api.get<ApiResponse<WishlistItem[]>>("/api/wishlists");
  return res.data;
}

export async function toggleWishlist(productId: number) {
  const res = await api.post<ApiResponse<null>>(
    `/api/wishlists/${productId}`
  );
  return res.data;
}
