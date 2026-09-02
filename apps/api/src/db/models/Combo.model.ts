import { Schema, model, type InferSchemaType } from "mongoose";

/** `_id` is the slug (e.g. "choco-hazelnut-duo"). */
const comboSchema = new Schema(
  {
    _id: { type: String },
    brandId: { type: String, required: true, index: true, lowercase: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["curated", "choose-n"], required: true },
    imageUrl: { type: String, default: null },
    itemIds: { type: [String], default: [] },
    chooseCount: { type: Number, default: null },
    eligibleItemIds: { type: [String], default: [] },
    discountPercent: { type: Number, min: 1, max: 99, default: null },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

export type ComboDoc = InferSchemaType<typeof comboSchema>;
export const ComboModel = model("Combo", comboSchema);
