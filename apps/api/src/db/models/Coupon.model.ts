import { Schema, model, type InferSchemaType } from "mongoose";

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    kind: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: null },
    minOrderAmount: { type: Number, default: 0 },
    brandId: { type: String, default: null, lowercase: true },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CouponDoc = InferSchemaType<typeof couponSchema>;
export const CouponModel = model("Coupon", couponSchema);
