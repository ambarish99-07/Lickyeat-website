import type {
  CreateComboRequest,
  CreateMenuItemRequest,
  MenuAddOn,
  UpdateComboRequest,
  UpdateMenuItemRequest,
} from "@lickyeat/shared-types";
import { computeComboPrice } from "@lickyeat/pricing";
import { MenuItemModel } from "../../db/models/MenuItem.model.js";
import { MenuAddOnModel } from "../../db/models/MenuAddOn.model.js";
import { ComboModel } from "../../db/models/Combo.model.js";
import { notFound } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";

// ---------------------------------------------------------------------------
// Add-on catalog resolution
// ---------------------------------------------------------------------------

export async function buildAddOnLookup(): Promise<
  Map<string, { price: number; isAvailable: boolean }>
> {
  const rows = await MenuAddOnModel.find({}).lean();
  return new Map(rows.map((r) => [r.name, { price: r.price, isAvailable: r.isAvailable ?? true }]));
}

/** Resolve `addOnNames` into priced `{name, price, isAvailable}`. A name whose
 *  catalog entry was deleted is dropped; an unavailable one stays (shown disabled). */
function resolveItemAddOns(
  names: string[],
  lookup: Map<string, { price: number; isAvailable: boolean }>,
): MenuAddOn[] {
  return names
    .map((name) => {
      const e = lookup.get(name);
      return e ? { name, price: e.price, isAvailable: e.isAvailable } : null;
    })
    .filter((a): a is MenuAddOn => a !== null);
}

async function withResolvedAddOns<T extends { addOnNames?: string[] | null }>(items: T[]) {
  const lookup = await buildAddOnLookup();
  return items.map((i) => ({
    ...serialize<Record<string, unknown>>(i),
    addOns: resolveItemAddOns(i.addOnNames ?? [], lookup),
  }));
}

// ---------------------------------------------------------------------------
// Menu items
// ---------------------------------------------------------------------------

export async function listMenuItems(brandId: string, opts: { onlyAvailable?: boolean } = {}) {
  const filter: Record<string, unknown> = { brandId };
  if (opts.onlyAvailable) filter.isAvailable = true;
  const items = await MenuItemModel.find(filter)
    .collation({ locale: "en" })
    .sort({ category: 1, isAvailable: -1, signatureName: 1 })
    .lean();
  return withResolvedAddOns(items);
}

export async function getMenuItem(id: string) {
  const item = await MenuItemModel.findById(id).lean();
  if (!item) throw notFound("Menu item not found");
  const [resolved] = await withResolvedAddOns([item]);
  return resolved;
}

/** Categories in first-seen order (the seed lists items category-by-category). */
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
  return ordered;
}

/** The shared add-on catalog — every entry (disabled ones included). */
export async function listAddOns() {
  const addOns = await MenuAddOnModel.find({})
    .collation({ locale: "en" })
    .sort({ isAvailable: -1, name: 1 })
    .lean();
  return addOns.map((a) => serialize(a));
}

// ---------------------------------------------------------------------------
// Combos — live price = discountPercent (or 15%) off the constituents.
// ---------------------------------------------------------------------------

export async function listCombos(brandId: string) {
  const combos = await ComboModel.find({ brandId }).sort({ isAvailable: -1, name: 1 }).lean();
  const out = [];
  for (const combo of combos) {
    const ids = combo.type === "curated" ? combo.itemIds : combo.eligibleItemIds;
    const items = await MenuItemModel.find({ _id: { $in: ids } }).lean();
    const availableCount = items.filter((i) => i.isAvailable ?? true).length;
    const need = combo.type === "curated" ? items.length : (combo.chooseCount ?? items.length);
    const pct = combo.discountPercent ?? undefined;

    const availablePrices = items
      .filter((i) => i.isAvailable ?? true)
      .map((i) => i.price)
      .sort((a, b) => a - b);
    const livePrice =
      combo.type === "curated"
        ? computeComboPrice(items.map((i) => i.price), pct)
        : computeComboPrice(availablePrices.slice(0, need), pct);

    out.push({
      ...serialize<Record<string, unknown>>(combo),
      livePrice,
      orderable: (combo.isAvailable ?? true) && availableCount >= need,
      constituents: items.map((i) => serialize(i)),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createMenuItem(input: CreateMenuItemRequest) {
  const _id = input.id ?? slugify(input.signatureName);
  const item = await MenuItemModel.create({ ...input, _id });
  const [r] = await withResolvedAddOns([item.toObject()]);
  return r;
}

export async function updateMenuItem(id: string, input: UpdateMenuItemRequest) {
  const item = await MenuItemModel.findByIdAndUpdate(id, input, { new: true }).lean();
  if (!item) throw notFound("Menu item not found");
  const [r] = await withResolvedAddOns([item]);
  return r;
}

export async function deleteMenuItem(id: string) {
  const res = await MenuItemModel.findByIdAndDelete(id).lean();
  if (!res) throw notFound("Menu item not found");
}

export async function createAddOn(input: { name: string; price: number; isAvailable?: boolean }) {
  const addOn = await MenuAddOnModel.create(input);
  return serialize(addOn.toObject());
}

export async function updateAddOn(
  id: string,
  input: Partial<{ name: string; price: number; isAvailable: boolean }>,
) {
  const addOn = await MenuAddOnModel.findByIdAndUpdate(id, input, { new: true }).lean();
  if (!addOn) throw notFound("Add-on not found");
  return serialize(addOn);
}

export async function createCombo(input: CreateComboRequest) {
  const _id = input.id ?? slugify(input.name);
  const combo = await ComboModel.create({ ...input, _id });
  return serialize(combo.toObject());
}

export async function updateCombo(id: string, input: UpdateComboRequest) {
  const combo = await ComboModel.findByIdAndUpdate(id, input, { new: true }).lean();
  if (!combo) throw notFound("Combo not found");
  return serialize(combo);
}
