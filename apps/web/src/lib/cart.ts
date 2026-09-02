import type { CreateOrderLine } from "@lickyeat/shared-types";
import type { CartLine } from "@/state/cartStore";

export function cartToOrderLines(lines: CartLine[]): CreateOrderLine[] {
  return lines.map((l) => ({
    lineId: l.lineId,
    brandId: l.brandId,
    kind: l.kind,
    refId: l.refId,
    quantity: l.quantity,
    customization: {
      sugar: l.customization.sugar,
      ice: l.customization.ice,
      selectedSizeLabel: l.customization.selectedSizeLabel,
      addOns: l.customization.addOns,
      comboItemIds: l.customization.comboItemIds,
      comment: l.customization.comment,
    },
  }));
}
