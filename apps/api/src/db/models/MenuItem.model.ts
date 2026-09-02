import { Schema, model, type InferSchemaType } from "mongoose";

const sizeVariantSchema = new Schema(
  {
    label: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false },
);

const menuItemSchema = new Schema(
  {
    brandId: { type: String, required: true, index: true, lowercase: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    portionSize: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    salePercent: { type: Number, default: 0, min: 0, max: 100 },
    sizeVariants: { type: [sizeVariantSchema], default: [] },
    allowedAddOns: { type: [String], default: [] },
    supportsSugar: { type: Boolean, default: false },
    supportsIce: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type MenuItemDoc = InferSchemaType<typeof menuItemSchema>;
export const MenuItemModel = model("MenuItem", menuItemSchema);
