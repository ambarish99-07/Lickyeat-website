import {
  PREMIUM_MEMBERSHIP_DAYS,
  PREMIUM_MEMBERSHIP_EXPIRY_REMINDER_DAYS,
  PREMIUM_MEMBERSHIP_PRICE,
  type PremiumMembershipStatus,
} from "@lickyeat/shared-types";
import { PremiumMembershipModel } from "../../db/models/PremiumMembership.model.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../payments/razorpay.js";

export async function getStatus(userId: string): Promise<PremiumMembershipStatus> {
  const membership = await PremiumMembershipModel.findOne({
    userId,
    "payment.status": "paid",
  })
    .sort({ expiresAt: -1 })
    .lean();

  if (!membership || membership.expiresAt.getTime() < Date.now()) {
    return {
      active: false,
      expiresAt: membership?.expiresAt.toISOString() ?? null,
      daysRemaining: null,
      expiringSoon: false,
    };
  }
  const daysRemaining = Math.ceil((membership.expiresAt.getTime() - Date.now()) / 86_400_000);
  return {
    active: true,
    expiresAt: membership.expiresAt.toISOString(),
    daysRemaining,
    expiringSoon: daysRemaining <= PREMIUM_MEMBERSHIP_EXPIRY_REMINDER_DAYS,
  };
}

/** Razorpay-only (COD deliberately removed once validated). */
export async function purchase(userId: string) {
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + PREMIUM_MEMBERSHIP_DAYS * 86_400_000);

  const membership = await PremiumMembershipModel.create({
    userId,
    startsAt,
    expiresAt,
    pricePaid: PREMIUM_MEMBERSHIP_PRICE,
    payment: {
      status: "pending",
      amount: PREMIUM_MEMBERSHIP_PRICE,
      razorpay: { orderId: null, paymentId: null, signature: null },
    },
  });

  const rzp = await createRazorpayOrder(PREMIUM_MEMBERSHIP_PRICE, `mem_${membership._id}`);
  membership.payment!.razorpay!.orderId = rzp.id;
  await membership.save();

  return {
    membership: serialize(membership.toObject()),
    razorpayOrder: { id: rzp.id, amount: rzp.amount, currency: rzp.currency, keyId: rzp.keyId },
  };
}

export async function verify(params: {
  membershipId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const membership = await PremiumMembershipModel.findById(params.membershipId);
  if (!membership) throw notFound("Membership not found");
  const payment = membership.payment!;
  if (payment.razorpay!.orderId !== params.razorpayOrderId) {
    throw badRequest("Razorpay order id mismatch.");
  }
  const ok = verifyRazorpaySignature(params);
  if (!ok) {
    payment.status = "failed";
    await membership.save();
    throw badRequest("Payment signature verification failed.");
  }
  payment.status = "paid";
  payment.razorpay!.paymentId = params.razorpayPaymentId;
  payment.razorpay!.signature = params.razorpaySignature;
  await membership.save();
  return serialize(membership.toObject());
}
