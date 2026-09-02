import { Schema } from "mongoose";

export const addressSubSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    line1: { type: String, required: true },
    line2: { type: String, default: "" },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    withinDeliveryRadius: { type: Boolean, default: false },
  },
  { _id: false },
);

export const razorpayRefsSubSchema = new Schema(
  {
    orderId: { type: String, default: null },
    paymentId: { type: String, default: null },
    signature: { type: String, default: null },
  },
  { _id: false },
);

export const paymentSubSchema = new Schema(
  {
    method: { type: String, enum: ["cod", "razorpay"], required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    amount: { type: Number, required: true },
    razorpay: { type: razorpayRefsSubSchema, default: () => ({}) },
  },
  { _id: false },
);

/** Membership payment has no COD path and no "refunded". */
export const membershipPaymentSubSchema = new Schema(
  {
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    amount: { type: Number, required: true },
    razorpay: { type: razorpayRefsSubSchema, default: () => ({}) },
  },
  { _id: false },
);
