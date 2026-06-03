import { create } from "zustand";

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    sessionStorage.removeItem("access_token");
    set({ user: null, isAuthenticated: false });
  },
}));
