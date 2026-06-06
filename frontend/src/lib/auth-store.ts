import { create } from "zustand";
import { apiClient, setAuthToken } from "./api-client";

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => {
    sessionStorage.removeItem("access_token");
    apiClient.post("/auth/logout").catch(() => {});
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    try {
      const { access_token } = await apiClient.post<{ access_token: string }>("/auth/refresh");
      setAuthToken(access_token);
      const user = await apiClient.get<User>("/auth/me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
