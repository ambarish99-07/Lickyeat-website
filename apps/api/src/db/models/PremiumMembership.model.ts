import { Schema, model, Types, type InferSchemaType } from "mongoose";

const membershipSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    pricePaid: Number,
    payment: {
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
      amount: Number,
      razorpay: {
        orderId: { type: String, default: null },
        paymentId: { type: String, default: null },
        signature: { type: String, default: null },
      },
    },
  },
  { timestamps: true },
);

export type PremiumMembershipDoc = InferSchemaType<typeof membershipSchema>;
export const PremiumMembershipModel = model("PremiumMembership", membershipSchema);
