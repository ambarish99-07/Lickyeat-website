import { Schema, model, type InferSchemaType } from "mongoose";

/** Shared, named add-on catalog. Availability is global, not per-item. */
const menuAddOnSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type MenuAddOnDoc = InferSchemaType<typeof menuAddOnSchema>;
export const MenuAddOnModel = model("MenuAddOn", menuAddOnSchema);
