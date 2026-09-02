import { COMBO_DISCOUNT_PERCENT, roundRupees } from "./types.js";

/**
 * A combo is always priced live at COMBO_DISCOUNT_PERCENT off the sum of its
 * constituent items' CURRENT base prices — never a stored bundle price. A later
 * menu edit changes future combo prices automatically and correctly.
 */
export function computeComboPrice(constituentBasePrices: number[]): number {
  const sum = constituentBasePrices.reduce((s, p) => s + p, 0);
  return roundRupees(sum * (1 - COMBO_DISCOUNT_PERCENT / 100));
}
