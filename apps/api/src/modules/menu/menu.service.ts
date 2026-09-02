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

export async function listMenuItems(brandId: string, opts: { includeUnavailable?: boolean } = {}) {
  const filter: Record<string, unknown> = { brandId };
  if (!opts.includeUnavailable) filter.isAvailable = true;
  const items = await MenuItemModel.find(filter).sort({ category: 1, name: 1 }).lean();
  return items.map((i) => serialize(i));
}

export async function getMenuItem(id: string) {
  const item = await MenuItemModel.findById(id).lean();
  if (!item) throw notFound("Menu item not found");
  return serialize(item);
}

export async function listCategories(brandId: string) {
  return MenuItemModel.distinct("category", { brandId, isAvailable: true });
}

export async function listAddOns(opts: { includeUnavailable?: boolean } = {}) {
  const filter = opts.includeUnavailable ? {} : { isAvailable: true };
  const addOns = await MenuAddOnModel.find(filter).sort({ name: 1 }).lean();
  return addOns.map((a) => serialize(a));
}

/** Combos with a freshly-computed live price (never a stored bundle price). */
export async function listCombos(brandId: string) {
  const combos = await ComboModel.find({ brandId, isAvailable: true }).lean();
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
    out.push({
      ...serialize<Record<string, unknown>>(combo),
      livePrice,
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
