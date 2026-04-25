import { create } from "zustand";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "customer" | "admin";
  loyaltyPoints: number;
  referralCode: string;
}

interface AuthStore {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      set({ user: null });
    }
  },
}));
