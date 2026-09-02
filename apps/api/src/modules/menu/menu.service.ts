import type {
  CreateComboRequest,
  CreateMenuItemRequest,
  UpdateComboRequest,
  UpdateMenuItemRequest,
} from "@lickyeat/shared-types";
import { computeComboPrice } from "@lickyeat/pricing";
import { MenuItemModel } from "../../db/models/MenuItem.model.js";
import { MenuAddOnModel } from "../../db/models/MenuAddOn.model.js";
import { ComboModel } from "../../db/models/Combo.model.js";
import { notFound } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";

/**
 * The public menu returns EVERY item for the brand — including out-of-stock
 * ones. The convention across this app is to show an unavailable item (or size
 * variant, or add-on) struck through / disabled, never hidden, so the customer
 * knows it exists and is just temporarily unorderable. Availability is still
 * enforced server-side at order time (priceResolver.ts). `opts` is retained for
 * callers that genuinely want only orderable items.
 */
export async function listMenuItems(
  brandId: string,
  opts: { onlyAvailable?: boolean } = {},
) {
  const filter: Record<string, unknown> = { brandId };
  if (opts.onlyAvailable) filter.isAvailable = true;
  const items = await MenuItemModel.find(filter)
    .collation({ locale: "en" })
    .sort({ category: 1, isAvailable: -1, name: 1 })
    .lean();
  return items.map((i) => serialize(i));
}

export async function getMenuItem(id: string) {
  const item = await MenuItemModel.findById(id).lean();
  if (!item) throw notFound("Menu item not found");
  return serialize(item);
}

/** Categories in a stable, curated order (falls back to alpha for unknown ones). */
export async function listCategories(brandId: string) {
  const items = await MenuItemModel.find({ brandId }).select("category").lean();
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const it of items) {
    if (it.category && !seen.has(it.category)) {
      seen.add(it.category);
      ordered.push(it.category);
    }
  }
  return ordered.sort((a, b) => a.localeCompare(b));
}

/** The shared add-on catalog — always returns every entry (disabled ones included). */
export async function listAddOns(opts: { onlyAvailable?: boolean } = {}) {
  const filter = opts.onlyAvailable ? { isAvailable: true } : {};
  const addOns = await MenuAddOnModel.find(filter)
    .collation({ locale: "en" })
    .sort({ isAvailable: -1, name: 1 })
    .lean();
  return addOns.map((a) => serialize(a));
}

/** Combos with a freshly-computed live price (never a stored bundle price). */
export async function listCombos(brandId: string) {
  const combos = await ComboModel.find({ brandId }).sort({ isAvailable: -1, name: 1 }).lean();
  const out = [];
  for (const combo of combos) {
    const ids =
      combo.type === "curated" ? combo.itemIds : combo.eligibleItemIds;
    const items = await MenuItemModel.find({ _id: { $in: ids } }).lean();
    const basePrices = items.map((i) => i.price);
    const livePrice =
      combo.type === "curated"
        ? computeComboPrice(basePrices)
        : computeComboPrice(
            [...basePrices].sort((a, b) => a - b).slice(0, combo.chooseCount ?? basePrices.length),
          );
    const allConstituentsAvailable = items.every((i) => i.isAvailable ?? true);
    out.push({
      ...serialize<Record<string, unknown>>(combo),
      livePrice,
      orderable: (combo.isAvailable ?? true) && allConstituentsAvailable,
      constituents: items.map((i) => serialize(i)),
    });
  }
  return out;
}

export async function createMenuItem(input: CreateMenuItemRequest) {
  const item = await MenuItemModel.create(input);
  return serialize(item.toObject());
}

export async function updateMenuItem(id: string, input: UpdateMenuItemRequest) {
  const item = await MenuItemModel.findByIdAndUpdate(id, input, { new: true }).lean();
  if (!item) throw notFound("Menu item not found");
  return serialize(item);
}

export async function deleteMenuItem(id: string) {
  const res = await MenuItemModel.findByIdAndDelete(id).lean();
  if (!res) throw notFound("Menu item not found");
}

export async function createCombo(input: CreateComboRequest) {
  const combo = await ComboModel.create(input);
  return serialize(combo.toObject());
}

export async function updateCombo(id: string, input: UpdateComboRequest) {
  const combo = await ComboModel.findByIdAndUpdate(id, input, { new: true }).lean();
  if (!combo) throw notFound("Combo not found");
  return serialize(combo);
}
