import { Schema, model, type InferSchemaType } from "mongoose";

const sizeVariantSchema = new Schema(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false },
);

/** `_id` is the slug (e.g. "choco-crush") — also the image slug and the id
 *  `pairsWith` / combos reference. */
const menuItemSchema = new Schema(
  {
    _id: { type: String },
    brandId: { type: String, required: true, index: true, lowercase: true },
    signatureName: { type: String, required: true },
    commonName: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    portionSize: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    flavorBadges: { type: [String], default: [] },
    isPopular: { type: Boolean },
    isNew: { type: Boolean },
    isStaffPick: { type: Boolean },
    salePercent: { type: Number, min: 1, max: 99 },
    sizeVariants: { type: [sizeVariantSchema], default: [] },
    pairsWith: { type: [String], default: [] },
    hasSugarIceCustomization: { type: Boolean, default: true },
    addOnNames: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

export type MenuItemDoc = InferSchemaType<typeof menuItemSchema>;
export const MenuItemModel = model("MenuItem", menuItemSchema);
