import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        void fetch("/api/auth/logout", { method: "POST" });
        set({ user: null });
      },
    }),
    { name: "peptide-auth" }
  )
);
