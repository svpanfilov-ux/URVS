import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  name: string;
  role: "manager" | "economist";
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  canManageObjects: () => boolean;
  canViewAllObjects: () => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isEconomist: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        window.location.href = "/login";
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.role === role;
      },

      canManageObjects: () => {
        const { user } = get();
        return user?.role === "economist";
      },

      canViewAllObjects: () => {
        const { user } = get();
        return user?.role === "economist";
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === "economist";
      },

      isManager: () => {
        const { user } = get();
        return user?.role === "manager";
      },

      isEconomist: () => {
        const { user } = get();
        return user?.role === "economist";
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);