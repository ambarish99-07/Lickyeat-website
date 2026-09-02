import { Schema, model, type InferSchemaType } from "mongoose";

const AddressSchema = new Schema(
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

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: null, lowercase: true, trim: true },
    phone: { type: String, default: null, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    completedOrderCount: { type: Number, default: 0 },
    premiumTierOverride: { type: Boolean, default: false },
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const UserModel = model("User", userSchema);
