import type {
  CreateTiffinClosureRequest,
  CreateTiffinSubscriptionRequest,
} from "@lickyeat/shared-types";
import {
  CANCELLATION_FULL_REFUND_WINDOW_DAYS,
  TIFFIN_PLAN_DAYS,
} from "@lickyeat/shared-types";
import { TiffinSubscriptionModel } from "../../db/models/TiffinSubscription.model.js";
import { TiffinSingleMealOrderModel } from "../../db/models/TiffinSingleMealOrder.model.js";
import { TiffinClosureModel } from "../../db/models/TiffinClosure.model.js";
import { badRequest, forbidden, notFound } from "../../lib/errors.js";
import { serialize } from "../../lib/serialize.js";
import { computeMealsForRangeSkippingClosedDates, mealsForStyle } from "./tiffinSchedule.js";
import { getSingleMealBasePrice } from "./singleMealMenu.js";

const PLAN_DISCOUNT: Record<"weekly" | "monthly", number> = { weekly: 0.05, monthly: 0.12 };

export async function getActiveClosures() {
  const today = new Date().toISOString().slice(0, 10);
  const closures = await TiffinClosureModel.find({ endDate: { $gte: today } }).lean();
  return closures.map((c) => ({ startDate: c.startDate, endDate: c.endDate }));
}

export function priceSubscription(input: {
  meals: Array<{ meal: "breakfast" | "lunch" | "dinner"; status: string }>;
  duration: "weekly" | "monthly";
}): number {
  const gross = input.meals
    .filter((m) => m.status === "scheduled")
    .reduce((s, m) => s + getSingleMealBasePrice(m.meal, "regular"), 0);
  return Math.round(gross * (1 - PLAN_DISCOUNT[input.duration]));
}

export async function createSubscription(
  userId: string,
  input: CreateTiffinSubscriptionRequest,
) {
  const closureRanges = await getActiveClosures();
  const { meals, endDate } = computeMealsForRangeSkippingClosedDates({
    startDate: input.startDate,
    deliveryDays: TIFFIN_PLAN_DAYS[input.duration],
    diet: input.diet,
    style: input.mealStyle,
    closureRanges,
  });

  const pricePaid = priceSubscription({ meals, duration: input.duration });

  const sub = await TiffinSubscriptionModel.create({
    userId,
    diet: input.diet,
    tier: "regular",
    mealStyle: input.mealStyle,
    duration: input.duration,
    startDate: input.startDate,
    endDate,
    address: input.address,
    status: "active",
    meals: meals.map((m) => ({ ...m, status: m.status === "closed" ? "closed" : "scheduled" })),
    pricePaid,
    payment: {
      method: input.paymentMethod,
      status: input.paymentMethod === "cod" ? "pending" : "pending",
      amount: pricePaid,
      razorpay: { orderId: null, paymentId: null, signature: null },
    },
    cancellation: null,
  });

  return serialize(sub.toObject());
}

export async function listSubscriptions(userId: string) {
  const subs = await TiffinSubscriptionModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return subs.map((s) => serialize(s));
}

export async function getSubscription(userId: string, id: string) {
  const sub = await TiffinSubscriptionModel.findById(id).lean();
  if (!sub) throw notFound("Subscription not found");
  if (String(sub.userId) !== userId) throw forbidden();
  return serialize(sub);
}

export async function pauseSubscription(userId: string, id: string, pause: boolean) {
  const sub = await TiffinSubscriptionModel.findById(id);
  if (!sub) throw notFound("Subscription not found");
  if (String(sub.userId) !== userId) throw forbidden();
  if (sub.status === "cancelled") throw badRequest("Subscription is cancelled.");
  sub.status = pause ? "paused" : "active";
  sub.pausedAt = pause ? new Date() : null;
  await sub.save();
  return serialize(sub.toObject());
}

export async function skipMeal(
  userId: string,
  id: string,
  date: string,
  meal: string,
  skip: boolean,
) {
  const sub = await TiffinSubscriptionModel.findById(id);
  if (!sub) throw notFound("Subscription not found");
  if (String(sub.userId) !== userId) throw forbidden();
  const entry = sub.meals.find((m) => m.date === date && m.meal === meal);
  if (!entry) throw notFound("No meal scheduled for that date.");
  if (entry.status === "closed" || entry.status === "delivered") {
    throw badRequest("That meal can no longer be changed.");
  }
  entry.status = skip ? "skipped" : "scheduled";
  await sub.save();
  return serialize(sub.toObject());
}

export async function cancelSubscription(userId: string, id: string) {
  const sub = await TiffinSubscriptionModel.findById(id);
  if (!sub) throw notFound("Subscription not found");
  if (String(sub.userId) !== userId) throw forbidden();
  if (sub.duration === "weekly") {
    throw badRequest("Weekly plans cannot be cancelled.");
  }
  if (sub.status === "cancelled") throw badRequest("Already cancelled.");

  const daysSinceStart = Math.floor(
    (Date.now() - new Date(sub.startDate + "T00:00:00Z").getTime()) / 86_400_000,
  );
  const withinWindow = daysSinceStart <= CANCELLATION_FULL_REFUND_WINDOW_DAYS;
  const refundPercent = withinWindow ? 100 : 0;
  const subPayment = sub.payment!;
  const paid = subPayment.status === "paid" ? subPayment.amount ?? 0 : 0;
  const refundAmount = Math.round((paid * refundPercent) / 100);

  sub.status = "cancelled";
  sub.cancellation = { cancelledAt: new Date(), refundPercent, refundAmount };
  if (refundAmount > 0) subPayment.status = "refunded";
  for (const m of sub.meals) if (m.status === "scheduled") m.status = "skipped";
  await sub.save();
  return serialize(sub.toObject());
}

// ---- Emergency closures ----

export async function listClosures() {
  const closures = await TiffinClosureModel.find({}).sort({ startDate: -1 }).lean();
  return closures.map((c) => serialize(c));
}

/** Declaring a closure is a one-shot, irreversible action with side effects. */
export async function declareClosure(input: CreateTiffinClosureRequest) {
  if (input.endDate < input.startDate) throw badRequest("End date is before start date.");
  const closure = await TiffinClosureModel.create(input);

  const inRange = (d: string) => d >= input.startDate && d <= input.endDate;
  const closureDays = daySpan(input.startDate, input.endDate);

  // 1. Affected subscriptions: mark meals closed + push endDate out.
  const subs = await TiffinSubscriptionModel.find({
    status: { $in: ["active", "paused"] },
    endDate: { $gte: input.startDate },
  });
  for (const sub of subs) {
    let affected = 0;
    for (const m of sub.meals) {
      if (m.date && inRange(m.date) && m.status === "scheduled") {
        m.status = "closed";
        affected++;
      }
    }
    if (affected > 0) {
      const extra = computeMealsForRangeSkippingClosedDates({
        startDate: nextDay(sub.endDate ?? input.startDate),
        deliveryDays: Math.ceil(affected / mealsForStyle(sub.mealStyle).length),
        diet: sub.diet,
        style: sub.mealStyle,
        closureRanges: [{ startDate: input.startDate, endDate: input.endDate }],
      });
      sub.meals.push(
        ...extra.meals.map((m) => ({
          date: m.date,
          meal: m.meal,
          dishName: m.dishName,
          status: (m.status === "closed" ? "closed" : "scheduled") as
            | "scheduled"
            | "closed",
        })),
      );
      sub.endDate = extra.endDate;
      await sub.save();
    }
  }

  // 2. Auto-cancel + full-refund single-meal orders in range.
  const orders = await TiffinSingleMealOrderModel.find({
    date: { $gte: input.startDate, $lte: input.endDate },
    status: { $nin: ["delivered", "cancelled"] },
  });
  for (const o of orders) {
    const oPayment = o.payment!;
    const paid = oPayment.status === "paid" ? oPayment.amount ?? 0 : 0;
    o.status = "cancelled";
    o.statusHistory.push({ status: "cancelled", at: new Date() });
    o.cancellation = { cancelledAt: new Date(), refundPercent: 100, refundAmount: paid };
    if (paid > 0) oPayment.status = "refunded";
    await o.save();
  }

  return { closure: serialize(closure.toObject()), closureDays };
}

function daySpan(a: string, b: string): number {
  return (
    Math.floor(
      (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) /
        86_400_000,
    ) + 1
  );
}
function nextDay(d: string): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}
