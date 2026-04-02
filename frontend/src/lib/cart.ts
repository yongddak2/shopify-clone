import api from "./api";
import type { ApiResponse, CartItem } from "@/types";

export async function getCart() {
  const res = await api.get<ApiResponse<CartItem[]>>("/api/cart");
  return res.data;
}

export async function addToCart(
  productId: number,
  optionValueId: number,
  quantity: number
) {
  const res = await api.post<ApiResponse<null>>("/api/cart", {
    productId,
    optionValueId,
    quantity,
  });
  return res.data;
}

export async function updateCartQuantity(
  cartItemId: number,
  quantity: number
) {
  const res = await api.patch<ApiResponse<null>>(`/api/cart/${cartItemId}`, {
    quantity,
  });
  return res.data;
}

export async function removeCartItem(cartItemId: number) {
  await api.delete(`/api/cart/${cartItemId}`);
}
