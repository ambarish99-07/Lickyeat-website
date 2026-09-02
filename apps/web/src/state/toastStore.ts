"use client";

import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  tone: "default" | "success" | "error";
  href?: string;
  hrefLabel?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function toast(message: string, opts: Partial<Omit<Toast, "id" | "message">> = {}) {
  useToasts.getState().push({ message, tone: opts.tone ?? "default", href: opts.href, hrefLabel: opts.hrefLabel });
}
