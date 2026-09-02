import { Schema, model, Types, type InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    label: String,
    line1: String,
    line2: { type: String, default: "" },
    city: String,
    pincode: String,
    withinDeliveryRadius: { type: Boolean, default: false },
  },
  { _id: false },
);

const singleMealSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", default: null, index: true },
    accessToken: { type: String, required: true, index: true },
    code: { type: String, required: true, unique: true },
    diet: { type: String, enum: ["veg", "non-veg"], required: true },
    tier: { type: String, enum: ["regular", "mini", "premium"], required: true },
    meal: { type: String, enum: ["breakfast", "lunch", "dinner"], required: true },
    date: { type: String, required: true, index: true },
    dishName: String,
    quantity: { type: Number, default: 1 },
    addOns: { type: [{ name: String, price: Number, _id: false }], default: [] },
    baseprice: Number,
    addOnsPrice: { type: Number, default: 0 },
    total: Number,
    address: addressSchema,
    contactName: String,
    contactPhone: String,
    status: {
      type: String,
      enum: ["received", "preparing", "out-for-delivery", "delivered", "cancelled"],
      default: "received",
    },
    statusHistory: { type: [{ status: String, at: Date, _id: false }], default: [] },
    deliveryPartner: {
      type: { name: String, phone: String, vehicle: String, _id: false },
      default: null,
    },
    payment: {
      method: { type: String, enum: ["cod", "razorpay"], required: true },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      amount: Number,
      razorpay: {
        orderId: { type: String, default: null },
        paymentId: { type: String, default: null },
        signature: { type: String, default: null },
      },
    },
    cancellation: {
      type: {
        cancelledAt: Date,
        refundPercent: Number,
        refundAmount: Number,
        _id: false,
      },
      default: null,
    },
  },
  { timestamps: true },
);

export type TiffinSingleMealOrderDoc = InferSchemaType<typeof singleMealSchema>;
export const TiffinSingleMealOrderModel = model(
  "TiffinSingleMealOrder",
  singleMealSchema,
);
