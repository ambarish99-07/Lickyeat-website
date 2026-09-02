import { Schema, model, Types, type InferSchemaType } from "mongoose";

const comboSchema = new Schema(
  {
    brandId: { type: String, required: true, index: true, lowercase: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["curated", "choose-your-own"], required: true },
    imageUrl: { type: String, default: null },
    itemIds: { type: [Types.ObjectId], ref: "MenuItem", default: [] },
    chooseCount: { type: Number, default: null },
    eligibleItemIds: { type: [Types.ObjectId], ref: "MenuItem", default: [] },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ComboDoc = InferSchemaType<typeof comboSchema>;
export const ComboModel = model("Combo", comboSchema);
