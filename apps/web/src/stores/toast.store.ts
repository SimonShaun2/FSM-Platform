"use client";

import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  durationMs: number;
}

interface ToastStore {
  toasts: ToastItem[];
  pushToast: (input: Omit<ToastItem, "id" | "durationMs"> & { durationMs?: number }) => string;
  dismissToast: (id: string) => void;
}

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  pushToast: (input) => {
    const id = createToastId();
    const toast: ToastItem = {
      id,
      title: input.title,
      tone: input.tone,
      durationMs: input.durationMs ?? 3200,
      ...(input.description ? { description: input.description } : {})
    };

    set((state) => ({
      toasts: [...state.toasts, toast]
    }));

    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
}));

export function showToast(input: Omit<ToastItem, "id" | "durationMs"> & { durationMs?: number }) {
  return useToastStore.getState().pushToast(input);
}
