import { Schema, model, type InferSchemaType } from "mongoose";

const tiffinPlanSchema = new Schema(
  {
    name: { type: String, required: true },
    diet: { type: String, enum: ["veg", "non-veg"], required: true },
    style: {
      type: String,
      enum: ["single", "twice-daily", "thrice-daily"],
      required: true,
    },
    duration: { type: String, enum: ["weekly", "monthly"], required: true },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
    salePercent: { type: Number, min: 1, max: 99, default: null },
    imageUrl: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type TiffinPlanDoc = InferSchemaType<typeof tiffinPlanSchema>;
export const TiffinPlanModel = model("TiffinPlan", tiffinPlanSchema);
