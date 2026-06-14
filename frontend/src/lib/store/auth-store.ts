import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled: boolean;
  avatar_url?: string;
  currency: string;
  theme: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
        }
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "finpilot-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
