"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TiffinPrefs {
  vegOnly: boolean;
  setVegOnly: (v: boolean) => void;
}

/** One persisted preference shared across every GG Tiffin screen. */
export const useTiffinPrefs = create<TiffinPrefs>()(
  persist(
    (set) => ({
      vegOnly: false,
      setVegOnly: (v) => set({ vegOnly: v }),
    }),
    { name: "lky_tiffin_prefs" },
  ),
);
