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

const scheduledMealSchema = new Schema(
  {
    date: String,
    meal: { type: String, enum: ["breakfast", "lunch", "dinner"] },
    dishName: String,
    status: {
      type: String,
      enum: ["scheduled", "delivered", "skipped", "closed"],
      default: "scheduled",
    },
  },
  { _id: false },
);

const subscriptionSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Types.ObjectId, ref: "TiffinPlan", required: true },
    planName: { type: String, default: "" },
    diet: { type: String, enum: ["veg", "non-veg"], required: true },
    style: {
      type: String,
      enum: ["single", "twice-daily", "thrice-daily"],
      required: true,
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      default: null,
    },
    duration: { type: String, enum: ["weekly", "monthly"], required: true },
    startDate: String,
    endDate: String,
    address: addressSchema,
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "completed"],
      default: "active",
    },
    pausedAt: { type: Date, default: null },
    meals: { type: [scheduledMealSchema], default: [] },
    pricePaid: Number,
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

export type TiffinSubscriptionDoc = InferSchemaType<typeof subscriptionSchema>;
export const TiffinSubscriptionModel = model("TiffinSubscription", subscriptionSchema);
