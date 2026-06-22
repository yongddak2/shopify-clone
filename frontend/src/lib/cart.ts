import api from "./api";
import { useAuthStore } from "@/stores/authStore";
import {
  readGuestCart,
  guestUpdateQuantity,
  guestRemoveItem,
  clearGuestCart,
} from "./guestCart";
import type { ApiResponse, CartItem } from "@/types";

function loggedIn() {
  return useAuthStore.getState().isLoggedIn();
}

export async function getCart(): Promise<ApiResponse<CartItem[]>> {
  if (!loggedIn()) {
    return { success: true, data: readGuestCart(), error: null };
  }
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
): Promise<ApiResponse<null>> {
  if (!loggedIn()) {
    guestUpdateQuantity(cartItemId, quantity);
    return { success: true, data: null, error: null };
  }
  const res = await api.patch<ApiResponse<null>>(`/api/cart/${cartItemId}`, {
    quantity,
  });
  return res.data;
}

export async function removeCartItem(cartItemId: number) {
  if (!loggedIn()) {
    guestRemoveItem(cartItemId);
    return;
  }
  await api.delete(`/api/cart/${cartItemId}`);
}

// 로그인 직후 호출: 비회원 장바구니(localStorage)를 서버로 병합 후 비운다.
// 서버 addToCart는 같은 옵션이면 수량을 합산한다.
export async function mergeGuestCartToServer() {
  const items = readGuestCart();
  if (items.length === 0) return;
  for (const it of items) {
    try {
      await addToCart(it.productId, it.optionValueId, it.quantity);
    } catch (err) {
      console.error("장바구니 병합 실패 (항목 건너뜀):", it.productId, err);
    }
  }
  clearGuestCart();
}
