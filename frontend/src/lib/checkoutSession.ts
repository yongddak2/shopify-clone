import type { CartItem } from "@/types";

const CART_ITEM_IDS_KEY = "orderCartItemIds";
const PENDING_CHECKOUT_KEY = "pendingCheckout";

export interface PendingCheckout {
  orderId: number;
  cartItemIds: number[];
  items: CartItem[];
  orderNumber: string;
  finalAmount: number;
  orderName: string;
  customerName: string;
  memberCouponId: number | null;
}

export function beginCheckout(cartItemIds: number[]) {
  sessionStorage.setItem(CART_ITEM_IDS_KEY, JSON.stringify(cartItemIds));
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}

export function readCheckoutCartItemIds(): number[] | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(CART_ITEM_IDS_KEY) ?? "null");
    if (!Array.isArray(parsed) || !parsed.every((id) => Number.isInteger(id))) return null;
    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function savePendingCheckout(checkout: PendingCheckout) {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkout));
}

export function readPendingCheckout(): PendingCheckout | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(PENDING_CHECKOUT_KEY) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;

    const value = parsed as Partial<PendingCheckout>;
    if (
      !Array.isArray(value.cartItemIds) ||
      !Array.isArray(value.items) ||
      typeof value.orderId !== "number" ||
      typeof value.orderNumber !== "string" ||
      typeof value.finalAmount !== "number" ||
      typeof value.orderName !== "string" ||
      typeof value.customerName !== "string"
    ) {
      return null;
    }
    return value as PendingCheckout;
  } catch {
    return null;
  }
}

export function clearCheckoutSession() {
  sessionStorage.removeItem(CART_ITEM_IDS_KEY);
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
}
