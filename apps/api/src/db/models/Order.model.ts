import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { addressSubSchema, paymentSubSchema } from "./_shared.js";

// Keep in sync with DiscountReasonSchema / RewardReasonSchema in shared-types
// and DISCOUNT_LABELS / REWARD_LABELS in apps/web.
const DISCOUNT_REASONS = ["none", "premium-member", "quantity-tier"] as const;
const REWARD_REASONS = [
  "none",
  "milestone-half-cold-coffee",
  "milestone-free-drink",
] as const;
const ORDER_STATUSES = [
  "received",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
] as const;

const lineSnapshotSchema = new Schema(
  {
    lineId: String,
    kind: { type: String, enum: ["item", "combo"] },
    refId: Types.ObjectId,
    name: String,
    quantity: Number,
    unitBasePrice: Number,
    unitAddOnsPrice: { type: Number, default: 0 },
    addOns: { type: [{ name: String, price: Number, _id: false }], default: [] },
    selectedSizeLabel: { type: String, default: null },
    sugar: { type: String, default: null },
    ice: { type: String, default: null },
    lineSubtotal: Number,
    isCombo: { type: Boolean, default: false },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },
    brandId: { type: String, required: true, index: true, lowercase: true },
    userId: { type: Types.ObjectId, ref: "User", default: null, index: true },
    accessToken: { type: String, required: true, index: true },
    contactName: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    address: { type: addressSubSchema, required: true },
    lines: { type: [lineSnapshotSchema], default: [] },
    pricing: { type: Schema.Types.Mixed, required: true },
    discountReason: { type: String, enum: DISCOUNT_REASONS, default: "none" },
    rewardReason: { type: String, enum: REWARD_REASONS, default: "none" },
    isPremiumMemberAtOrder: { type: Boolean, default: false },
    status: { type: String, enum: ORDER_STATUSES, default: "received" },
    statusHistory: {
      type: [{ status: String, at: Date, _id: false }],
      default: [],
    },
    payment: { type: paymentSubSchema, required: true },
    deliveryPartner: {
      type: { name: String, phone: String, vehicle: String, _id: false },
      default: null,
    },
    cancellation: {
      type: {
        cancelledAt: Date,
        cancelledFromStatus: String,
        reason: { type: String, default: "" },
        refundPercent: Number,
        refundAmount: Number,
        _id: false,
      },
      default: null,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;
export const OrderModel = model("Order", orderSchema);
