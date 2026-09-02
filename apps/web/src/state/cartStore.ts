"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CROSS_BRAND_ID } from "@lickyeat/shared-types";

export interface CartCustomization {
  sugar?: "none" | "less" | "normal" | "extra";
  ice?: "none" | "less" | "normal" | "extra";
  selectedSizeLabel?: string;
  addOns: string[];
  comboItemIds: string[];
}

export interface CartLine {
  /** stable client id */
  lineId: string;
  /** fixed at add-time — checkout derives the order's brand from the lines,
   *  never from whatever brand is ambiently selected in the UI. */
  brandId: string;
  kind: "item" | "combo";
  refId: string;
  name: string;
  imageUrl: string | null;
  /** display-only estimate; the server always resolves the real price. */
  estUnitPrice: number;
  quantity: number;
  customization: CartCustomization;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "lineId" | "quantity"> & { quantity?: number }) => void;
  setQty: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  /** the single brand this cart belongs to (or null when empty). */
  cartBrandId: () => string | null;
  count: () => number;
}

function makeLineId() {
  return `l_${Math.random().toString(36).slice(2, 10)}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const quantity = line.quantity ?? 1;
          // merge identical item+customization lines
          const key = JSON.stringify([line.refId, line.kind, line.customization]);
          const existing = s.lines.find(
            (l) => JSON.stringify([l.refId, l.kind, l.customization]) === key,
          );
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.lineId === existing.lineId
                  ? { ...l, quantity: l.quantity + quantity }
                  : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, quantity, lineId: makeLineId() }] };
        }),
      setQty: (lineId, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.lineId !== lineId)
              : s.lines.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
        })),
      remove: (lineId) => set((s) => ({ lines: s.lines.filter((l) => l.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
      cartBrandId: () => {
        const brands = new Set(get().lines.map((l) => l.brandId));
        brands.delete(CROSS_BRAND_ID);
        if (brands.size === 0) return get().lines[0]?.brandId ?? null;
        return [...brands][0] ?? null;
      },
      count: () => get().lines.reduce((n, l) => n + l.quantity, 0),
    }),
    { name: "lky_cart" },
  ),
);
