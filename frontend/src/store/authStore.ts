import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name?: string;
  city?: string | null;
  verified?: boolean;
  /** ISO date string or null. If set and in the future, user has an active subscription. */
  subscriptionExpiresAt?: string | null;
}

export function hasActiveSubscription(user: User | null | undefined): boolean {
  if (!user?.subscriptionExpiresAt) return false;
  return new Date(user.subscriptionExpiresAt) > new Date();
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

// Simple localStorage persistence
const loadAuth = (): { token: string | null; user: User | null } => {
  try {
    const stored = localStorage.getItem("auth-storage");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // Ignore
  }
  return { token: null, user: null };
};

const saveAuth = (token: string | null, user: User | null) => {
  try {
    localStorage.setItem("auth-storage", JSON.stringify({ token, user }));
  } catch (e) {
    // Ignore
  }
};

const initialState = loadAuth();

export const useAuthStore = create<AuthState>((set) => ({
  token: initialState.token,
  user: initialState.user,
  setAuth: (token, user) => {
    saveAuth(token, user);
    set({ token, user });
  },
  setUser: (user) => {
    const token = useAuthStore.getState().token;
    saveAuth(token, user);
    set({ user });
  },
  clearAuth: () => {
    saveAuth(null, null);
    set({ token: null, user: null });
  },
}));
