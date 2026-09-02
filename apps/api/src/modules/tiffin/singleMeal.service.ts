import type { CreateTiffinSingleMealRequest } from "@lickyeat/shared-types";
import { SINGLE_MEAL_CANCELLATION_WINDOW_MINUTES } from "@lickyeat/shared-types";
import { TiffinSingleMealOrderModel } from "../../db/models/TiffinSingleMealOrder.model.js";
import type { AuthedUser } from "../../middleware/auth.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { accessToken, orderCode } from "../../lib/ids.js";
import { serialize } from "../../lib/serialize.js";
import { sendWhatsAppOrderUpdate } from "../../integrations/whatsapp.js";
import { isWithinDeliveryZone } from "../orders/deliveryZone.js";
import { pickDeliveryPartner } from "../orders/deliveryPartner.js";
import { getActiveClosures } from "./tiffin.service.js";
import {
  getSingleMealBasePrice,
  getSingleMealDish,
  isMealOrderableForDate,
  priceAddOns,
  resolveAddOns,
} from "./singleMealMenu.js";

export function getSingleMealMenu(dateStr: string) {
  const diets = ["veg", "non-veg"] as const;
  const tiers = ["regular", "mini", "premium"] as const;
  const meals = ["breakfast", "lunch", "dinner"] as const;
  const out = [];
  for (const meal of meals) {
    if (!isMealOrderableForDate(meal, dateStr)) continue;
    for (const diet of diets) {
      for (const tier of tiers) {
        out.push({
          meal,
          diet,
          tier,
          date: dateStr,
          dishName: getSingleMealDish(meal, diet, tier, dateStr),
          basePrice: getSingleMealBasePrice(meal, tier),
          addOns: resolveAddOns(tier, meal, diet),
        });
      }
    }
  }
  return out;
}

export async function createSingleMealOrder(
  input: CreateTiffinSingleMealRequest,
  user: AuthedUser | undefined,
) {
  if (!isWithinDeliveryZone(input.address)) {
    throw badRequest("Sorry, we don't deliver to that address yet (Patna only for now).");
  }
  if (!isMealOrderableForDate(input.meal, input.date)) {
    throw badRequest("The ordering window for that meal has closed.");
  }
  const closures = await getActiveClosures();
  if (closures.some((c) => input.date >= c.startDate && input.date <= c.endDate)) {
    throw badRequest("GG Tiffin is closed on that date.");
  }

  const dishName = getSingleMealDish(input.meal, input.diet, input.tier, input.date);
  const basePrice = getSingleMealBasePrice(input.meal, input.tier);
  const addOns = priceAddOns(input.tier, input.meal, input.diet, input.addOns);
  const addOnsPrice = addOns.reduce((s, a) => s + a.price, 0);
  const total = (basePrice + addOnsPrice) * input.quantity;

  const order = await TiffinSingleMealOrderModel.create({
    userId: user?.id ?? null,
    accessToken: accessToken(),
    code: orderCode("GGT"),
    diet: input.diet,
    tier: input.tier,
    meal: input.meal,
    date: input.date,
    dishName,
    quantity: input.quantity,
    addOns,
    baseprice: basePrice,
    addOnsPrice,
    total,
    address: input.address,
    contactName: user?.name ?? input.guestName ?? "Guest",
    contactPhone: input.guestPhone ?? "",
    status: "received",
    statusHistory: [{ status: "received", at: new Date() }],
    payment: {
      method: input.paymentMethod,
      status: "pending",
      amount: total,
      razorpay: { orderId: null, paymentId: null, signature: null },
    },
  });

  return serialize(order.toObject());
}

export async function trackSingleMeal(token: string) {
  const order = await TiffinSingleMealOrderModel.findOne({ accessToken: token }).lean();
  if (!order) throw notFound("Order not found");
  return serialize(order);
}

export async function cancelSingleMeal(token: string) {
  const order = await TiffinSingleMealOrderModel.findOne({ accessToken: token });
  if (!order) throw notFound("Order not found");
  if (order.status === "cancelled") throw badRequest("Already cancelled.");

  const ageMin = (Date.now() - order.createdAt.getTime()) / 60_000;
  const withinWindow = ageMin <= SINGLE_MEAL_CANCELLATION_WINDOW_MINUTES;
  const refundPercent = withinWindow ? 100 : 0;
  const payment = order.payment!;
  const paid = payment.status === "paid" ? payment.amount ?? 0 : 0;
  const refundAmount = Math.round((paid * refundPercent) / 100);

  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled", at: new Date() });
  order.cancellation = { cancelledAt: new Date(), refundPercent, refundAmount };
  if (refundAmount > 0) payment.status = "refunded";
  await order.save();
  return serialize(order.toObject());
}

export async function listMySingleMeals(userId: string) {
  const orders = await TiffinSingleMealOrderModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  return orders.map((o) => serialize(o));
}

export async function advanceSingleMealStatus(id: string, next: string) {
  const flow = ["received", "preparing", "out-for-delivery", "delivered"];
  const order = await TiffinSingleMealOrderModel.findById(id);
  if (!order) throw notFound("Order not found");
  const cur = flow.indexOf(order.status);
  const nxt = flow.indexOf(next);
  if (nxt === -1 || nxt !== cur + 1) throw badRequest(`Cannot move from ${order.status} to ${next}.`);
  order.status = next as typeof order.status;
  order.statusHistory.push({ status: next, at: new Date() });
  if (next === "out-for-delivery" && !order.deliveryPartner) {
    order.deliveryPartner = pickDeliveryPartner(String(order._id), "tiffin");
  }
  await order.save();
  void sendWhatsAppOrderUpdate(order.contactPhone, `GG Tiffin: order ${order.code} is now ${next}.`);
  return serialize(order.toObject());
}
