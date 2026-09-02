"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CROSS_BRAND_ID, type PricingCartLine } from "@lickyeat/shared-types";

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
  /**
   * Fixed at add-time. Checkout derives the order's brand from the cart's own
   * lines (`cartBrandId()`), never from whatever brand is ambiently selected.
   */
  brandId: string;
  kind: "item" | "combo";
  refId: string;
  name: string;
  imageUrl: string | null;
  category: string;
  /** size-resolved unit price, BEFORE per-item sale and add-ons. */
  unitBasePrice: number;
  salePercent: number;
  /** resolved per-unit add-on total. */
  unitAddOnsPrice: number;
  quantity: number;
  customization: CartCustomization;
}

/** Per-unit price a line displays for (sale applied, add-ons added). */
export function lineUnitPrice(l: CartLine): number {
  const sale = l.salePercent > 0 ? Math.round(l.unitBasePrice * (1 - l.salePercent / 100)) : l.unitBasePrice;
  return sale + l.unitAddOnsPrice;
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
  /** map to the pure pricing engine's input shape for an instant local estimate. */
  pricingLines: () => PricingCartLine[];
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
      pricingLines: () =>
        get().lines.map((l) => ({
          lineId: l.lineId,
          brandId: l.brandId,
          name: l.name,
          unitBasePrice: l.unitBasePrice,
          quantity: l.quantity,
          unitAddOnsPrice: l.unitAddOnsPrice,
          salePercent: l.salePercent,
          isCombo: l.kind === "combo",
          category: l.category,
        })),
    }),
    { name: "lky_cart", version: 2 },
  ),
);
