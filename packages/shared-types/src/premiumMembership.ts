import { z } from "zod";
import { ObjectIdSchema, RupeesSchema } from "./common.js";
import { RazorpayRefsSchema } from "./order.js";

/** Purchased, time-limited membership. Razorpay-only (COD deliberately removed). */
export const PREMIUM_MEMBERSHIP_PRICE = 21;
export const PREMIUM_MEMBERSHIP_DAYS = 60;
export const PREMIUM_MEMBERSHIP_EXPIRY_REMINDER_DAYS = 2;

export const PremiumMembershipSchema = z.object({
  id: ObjectIdSchema,
  userId: ObjectIdSchema,
  startsAt: z.string(),
  expiresAt: z.string(),
  pricePaid: RupeesSchema,
  payment: z.object({
    status: z.enum(["pending", "paid", "failed"]),
    amount: RupeesSchema,
    razorpay: RazorpayRefsSchema,
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PremiumMembership = z.infer<typeof PremiumMembershipSchema>;

export const PremiumMembershipStatusSchema = z.object({
  active: z.boolean(),
  expiresAt: z.string().nullable(),
  daysRemaining: z.number().int().nullable(),
  expiringSoon: z.boolean(),
});
export type PremiumMembershipStatus = z.infer<typeof PremiumMembershipStatusSchema>;
