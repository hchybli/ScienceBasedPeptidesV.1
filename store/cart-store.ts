import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/lib/cart";

interface CartStore {
  items: CartItem[];
  loyaltyPointsToRedeem: number;
  discountCode: string | null;
  discountData: { code: string; type: string; value: number } | null;
  isSubscription: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  setDiscount: (data: { code: string; type: string; value: number } | null) => void;
  setLoyaltyRedemption: (points: number) => void;
  setIsSubscription: (val: boolean) => void;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      loyaltyPointsToRedeem: 0,
      discountCode: null,
      discountData: null,
      isSubscription: false,
      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === newItem.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        }),
      removeItem: (variantId) =>
        set((state) => ({ items: state.items.filter((i) => i.variantId !== variantId) })),
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        })),
      clearCart: () =>
        set({ items: [], loyaltyPointsToRedeem: 0, discountCode: null, discountData: null }),
      setDiscount: (data) => set({ discountData: data, discountCode: data?.code ?? null }),
      setLoyaltyRedemption: (points) => set({ loyaltyPointsToRedeem: points }),
      setIsSubscription: (val) => set({ isSubscription: val }),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "peptide-cart" }
  )
);
