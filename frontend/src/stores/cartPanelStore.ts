import { create } from "zustand";

// 전역 장바구니 슬라이드 패널 상태 (옵션선택 → 장바구니 결과 2단계)
type PanelMode = "quickadd" | "cart" | null;

interface CartPanelState {
  mode: PanelMode;
  productId: number | null;
  openQuickAdd: (productId: number) => void;
  openCart: () => void;
  close: () => void;
}

export const useCartPanelStore = create<CartPanelState>((set) => ({
  mode: null,
  productId: null,
  openQuickAdd: (productId) => set({ mode: "quickadd", productId }),
  openCart: () => set({ mode: "cart" }),
  close: () => set({ mode: null, productId: null }),
}));
