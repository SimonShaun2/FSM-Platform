"use client";

import { create } from "zustand";

import type { AuthCompany, AuthUser } from "@/src/lib/auth";

interface AuthStore {
  user: AuthUser | null;
  company: AuthCompany | null;
  token: string | null;
  setAuth: (user: AuthUser, company: AuthCompany, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  company: null,
  token: null,
  setAuth: (user, company, token) => {
    set({
      user,
      company,
      token
    });
  },
  clearAuth: () => {
    set({
      user: null,
      company: null,
      token: null
    });
  }
}));
