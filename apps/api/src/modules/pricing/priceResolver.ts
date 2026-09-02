import type {
  CreateOrderLine,
  PricingCartLine,
  PricingInput,
  PricingResult,
} from "@lickyeat/shared-types";
import { CROSS_BRAND_ID } from "@lickyeat/shared-types";
import { computeComboPrice, computePricing } from "@lickyeat/pricing";
import { MenuItemModel } from "../../db/models/MenuItem.model.js";
import { MenuAddOnModel } from "../../db/models/MenuAddOn.model.js";
import { ComboModel } from "../../db/models/Combo.model.js";
import { badRequest, unprocessable } from "../../lib/errors.js";

export interface ResolvedLineSnapshot {
  lineId: string;
  kind: "item" | "combo";
  refId: string;
  name: string;
  signatureName: string;
  commonName: string;
  imageUrl: string | null;
  quantity: number;
  unitBasePrice: number;
  unitAddOnsPrice: number;
  addOns: Array<{ name: string; price: number }>;
  selectedSizeLabel: string | null;
  sugar: string | null;
  ice: string | null;
  comment: string | null;
  lineSubtotal: number;
  isCombo: boolean;
}

export interface ResolvedCart {
  brandId: string;
  pricingLines: PricingCartLine[];
  snapshots: ResolvedLineSnapshot[];
}

/** Resolve the cart against the DB — prices and availability NEVER come from the client. */
export async function resolveCart(lines: CreateOrderLine[]): Promise<ResolvedCart> {
  if (lines.length === 0) throw badRequest("Cart is empty.");

  const brandIds = new Set(lines.map((l) => l.brandId));
  brandIds.delete(CROSS_BRAND_ID);
  if (brandIds.size > 1) {
    throw badRequest("All items in one order must belong to the same brand.");
  }
  const brandId = lines[0]!.brandId;

  const addOnCatalog = await MenuAddOnModel.find({}).lean();
  const addOnByName = new Map(addOnCatalog.map((a) => [a.name, a]));

  const pricingLines: PricingCartLine[] = [];
  const snapshots: ResolvedLineSnapshot[] = [];

  for (const line of lines) {
    if (line.kind === "item") {
      const item = await MenuItemModel.findById(line.refId).lean();
      if (!item) throw unprocessable("An item in your cart is no longer available.");
      if (item.brandId !== line.brandId && line.brandId !== CROSS_BRAND_ID) {
        throw badRequest("Cart item does not match its brand.");
      }
      if (!(item.isAvailable ?? true)) {
        throw unprocessable(`"${item.signatureName}" is currently out of stock.`);
      }

      // size resolution
      let unitBasePrice = item.price;
      let selectedSizeLabel: string | null = null;
      const sizeLabel = line.customization.selectedSizeLabel;
      if (sizeLabel && sizeLabel !== item.portionSize) {
        const variant = (item.sizeVariants ?? []).find((v) => v.label === sizeLabel);
        if (!variant) throw badRequest(`Unknown size "${sizeLabel}" for ${item.signatureName}.`);
        if (!(variant.isAvailable ?? true)) {
          throw unprocessable(`The ${sizeLabel} size of "${item.signatureName}" is out of stock.`);
        }
        unitBasePrice = variant.price;
        selectedSizeLabel = variant.label;
      }

      // add-on resolution (against the item's own offered list + shared catalog)
      const addOns: Array<{ name: string; price: number }> = [];
      for (const name of line.customization.addOns) {
        if (!(item.addOnNames ?? []).includes(name)) {
          throw badRequest(`"${name}" is not available for ${item.signatureName}.`);
        }
        const catalogEntry = addOnByName.get(name);
        if (!catalogEntry) throw badRequest(`Unknown add-on "${name}".`);
        if (!(catalogEntry.isAvailable ?? true)) {
          throw unprocessable(`Add-on "${name}" is currently out of stock.`);
        }
        addOns.push({ name, price: catalogEntry.price });
      }
      const unitAddOnsPrice = addOns.reduce((s, a) => s + a.price, 0);

      const salePct = item.salePercent ?? 0;
      const unitSale = salePct > 0 ? Math.round(unitBasePrice * (1 - salePct / 100)) : unitBasePrice;
      const lineSubtotal = (unitSale + unitAddOnsPrice) * line.quantity;
      const hasSugarIce = item.hasSugarIceCustomization ?? true;

      pricingLines.push({
        lineId: line.lineId,
        brandId: line.brandId,
        name: item.signatureName,
        unitBasePrice,
        quantity: line.quantity,
        unitAddOnsPrice,
        salePercent: salePct,
        isCombo: false,
        category: item.category,
      });
      snapshots.push({
        lineId: line.lineId,
        kind: "item",
        refId: String(item._id),
        name: item.signatureName,
        signatureName: item.signatureName,
        commonName: item.commonName,
        imageUrl: item.imageUrl ?? null,
        quantity: line.quantity,
        unitBasePrice,
        unitAddOnsPrice,
        addOns,
        selectedSizeLabel,
        sugar: hasSugarIce ? line.customization.sugar ?? null : null,
        ice: hasSugarIce ? line.customization.ice ?? null : null,
        comment: line.customization.comment ?? null,
        lineSubtotal,
        isCombo: false,
      });
    } else {
      const combo = await ComboModel.findById(line.refId).lean();
      if (!combo) throw unprocessable("A combo in your cart is no longer available.");
      if (!(combo.isAvailable ?? true)) throw unprocessable(`"${combo.name}" is unavailable.`);

      let constituentIds: string[];
      if (combo.type === "curated") {
        constituentIds = combo.itemIds.map(String);
      } else {
        const picked = line.customization.comboItemIds.map(String);
        if (picked.length !== (combo.chooseCount ?? 0)) {
          throw badRequest(`This combo needs exactly ${combo.chooseCount} items.`);
        }
        const eligible = new Set(combo.eligibleItemIds.map(String));
        if (!picked.every((id) => eligible.has(id))) {
          throw badRequest("A chosen combo item is not eligible for this combo.");
        }
        constituentIds = picked;
      }

      const items = await MenuItemModel.find({ _id: { $in: constituentIds } }).lean();
      if (items.length !== new Set(constituentIds).size) {
        throw unprocessable("A combo item is no longer on the menu.");
      }
      for (const it of items) {
        if (!(it.isAvailable ?? true)) {
          throw unprocessable(`"${it.signatureName}" (in ${combo.name}) is out of stock.`);
        }
      }
      const byId = new Map(items.map((i) => [String(i._id), i]));
      const orderedPrices = constituentIds.map((id) => byId.get(id)!.price);
      const unitBasePrice = computeComboPrice(orderedPrices, combo.discountPercent ?? undefined);
      const lineSubtotal = unitBasePrice * line.quantity;

      pricingLines.push({
        lineId: line.lineId,
        brandId: line.brandId,
        name: combo.name,
        unitBasePrice,
        quantity: line.quantity,
        unitAddOnsPrice: 0,
        salePercent: 0,
        isCombo: true,
        category: "combo",
      });
      snapshots.push({
        lineId: line.lineId,
        kind: "combo",
        refId: String(combo._id),
        name: combo.name,
        signatureName: combo.name,
        commonName: constituentIds.map((id) => byId.get(id)!.signatureName).join(" + "),
        imageUrl: combo.imageUrl ?? byId.get(constituentIds[0]!)?.imageUrl ?? null,
        quantity: line.quantity,
        unitBasePrice,
        unitAddOnsPrice: 0,
        addOns: [],
        selectedSizeLabel: null,
        sugar: null,
        ice: null,
        comment: line.customization.comment ?? null,
        lineSubtotal,
        isCombo: true,
      });
    }
  }

  return { brandId, pricingLines, snapshots };
}

export function price(
  input: Omit<PricingInput, "lines"> & { lines: PricingCartLine[] },
): PricingResult {
  return computePricing(input);
}
