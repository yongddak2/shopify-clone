import type { CartItem } from "@/types";

// 비회원(비로그인) 장바구니 — localStorage 영속 저장. 창을 닫아도 유지된다.
const GUEST_CART_KEY = "pantrka_guest_cart";

export function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeGuestCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
}

// 같은 옵션이면 수량 합산(재고 한도), 없으면 신규 추가. 임시 id는 음수(서버 양수 id와 충돌 방지).
export function guestAddItem(item: Omit<CartItem, "id">): void {
  const items = readGuestCart();
  const existing = items.find((i) => i.optionValueId === item.optionValueId);
  if (existing) {
    existing.quantity = Math.min(
      existing.quantity + item.quantity,
      item.stockQuantity
    );
  } else {
    items.push({ ...item, id: -Date.now() });
  }
  writeGuestCart(items);
}

export function guestUpdateQuantity(cartItemId: number, quantity: number): void {
  const items = readGuestCart();
  const target = items.find((i) => i.id === cartItemId);
  if (target) {
    target.quantity = quantity;
    writeGuestCart(items);
  }
}

export function guestRemoveItem(cartItemId: number): void {
  writeGuestCart(readGuestCart().filter((i) => i.id !== cartItemId));
}
