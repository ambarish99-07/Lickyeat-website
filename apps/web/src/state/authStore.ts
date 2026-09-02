"use client";

import { create } from "zustand";
import type { AuthResponse, User } from "@lickyeat/shared-types";

const TOKEN_KEY = "lky_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (res: AuthResponse) => void;
  setUser: (user: User | null) => void;
  hydrate: () => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  ready: false,
  setSession: (res) => {
    setStoredToken(res.token);
    set({ user: res.user, token: res.token, ready: true });
  },
  setUser: (user) => set({ user }),
  hydrate: () => set({ token: getToken(), ready: true }),
  logout: () => {
    setStoredToken(null);
    set({ user: null, token: null });
  },
}));
