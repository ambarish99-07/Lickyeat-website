import type {
  CancelOrderRequest,
  CreateOrderRequest,
  OrderStatus,
} from "@lickyeat/shared-types";
import { refundPercentForCancellation } from "@lickyeat/shared-types";
import { OrderModel } from "../../db/models/Order.model.js";
import { UserModel } from "../../db/models/User.model.js";
import { MenuItemModel } from "../../db/models/MenuItem.model.js";
import { MenuAddOnModel } from "../../db/models/MenuAddOn.model.js";
import { ComboModel } from "../../db/models/Combo.model.js";
import { computeComboPrice } from "@lickyeat/pricing";
import type { AuthedUser } from "../../middleware/auth.js";
import { badRequest, forbidden, notFound } from "../../lib/errors.js";
import { accessToken, orderCode } from "../../lib/ids.js";
import { serialize } from "../../lib/serialize.js";
import { sendWhatsAppOrderUpdate } from "../../integrations/whatsapp.js";
import { resolveCart, price } from "../pricing/priceResolver.js";
import { buildLoyaltyState } from "../pricing/loyalty.js";
import { resolveCouponForCart } from "../coupons/coupons.service.js";
import { getBrandStoreStatus } from "../storeSettings/storeSettings.service.js";
import { isWithinDeliveryZone } from "./deliveryZone.js";
import { pickDeliveryPartner } from "./deliveryPartner.js";

const STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "out-for-delivery",
  "delivered",
];

export async function createOrder(input: CreateOrderRequest, user: AuthedUser | undefined) {
  if (!isWithinDeliveryZone(input.address)) {
    throw badRequest("Sorry, we don't deliver to that address yet (Patna only for now).");
  }

  const cart = await resolveCart(input.lines);

  const store = await getBrandStoreStatus(cart.brandId);
  if (!store.open) throw badRequest(store.reason);

  const loyalty = await buildLoyaltyState(user, input.address);

  const rawSubtotal = cart.pricingLines.reduce(
    (s, l) => s + (l.unitBasePrice + l.unitAddOnsPrice) * l.quantity,
    0,
  );
  const coupon = input.couponCode
    ? await resolveCouponForCart(
        input.couponCode,
        {
          subtotal: rawSubtotal,
          brandId: cart.brandId,
          userId: user?.id ?? null,
          pricingLines: cart.pricingLines,
        },
        { throwOnInvalid: true },
      )
    : { discountAmount: 0, code: null as string | null, message: "" };

  const pricing = price({
    lines: cart.pricingLines,
    loyalty,
    couponDiscountAmount: coupon.discountAmount,
    couponCode: coupon.code,
  });

  const isPremiumMemberAtOrder =
    loyalty.premiumTierOverride ||
    loyalty.completedOrderCount >= 15 ||
    loyalty.hasActivePaidMembership;

  const contactName = user?.name ?? input.guestName ?? "Guest";
  const contactPhone = input.guestPhone ?? "";

  const now = new Date();
  const paymentStatus = input.paymentMethod === "cod" ? "pending" : "pending";

  const order = await OrderModel.create({
    code: orderCode(),
    brandId: cart.brandId,
    userId: user?.id ?? null,
    accessToken: accessToken(),
    contactName,
    contactPhone,
    address: input.address,
    lines: cart.snapshots,
    pricing,
    couponCode: coupon.code,
    discountReason: pricing.discountReason,
    rewardReason: pricing.rewardReason,
    isPremiumMemberAtOrder,
    status: "received",
    statusHistory: [{ status: "received", at: now }],
    payment: {
      method: input.paymentMethod,
      status: paymentStatus,
      amount: pricing.total,
      razorpay: { orderId: null, paymentId: null, signature: null },
    },
    deliveryPartner: null,
    cancellation: null,
    notes: input.notes,
  });

  let razorpayOrder = null;
  if (input.paymentMethod === "razorpay") {
    const { createRazorpayOrder } = await import("../payments/razorpay.js");
    const rzp = await createRazorpayOrder(pricing.total, order.code);
    order.payment.razorpay.orderId = rzp.id;
    await order.save();
    razorpayOrder = { id: rzp.id, amount: rzp.amount, currency: rzp.currency, keyId: rzp.keyId };
  } else {
    // COD is trusted immediately.
    await advanceLoyaltyIfComplete(order.userId ? String(order.userId) : null, order.payment.method, "pending");
    void sendWhatsAppOrderUpdate(contactPhone, `Lickyeat: order ${order.code} received. We'll start preparing it shortly.`);
  }

  return { order: serialize(order.toObject()), razorpayOrder };
}

export async function verifyPayment(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const order = await OrderModel.findById(params.orderId);
  if (!order) throw notFound("Order not found");
  if (order.payment.method !== "razorpay") throw badRequest("This order is not a Razorpay order.");
  if (order.payment.razorpay.orderId !== params.razorpayOrderId) {
    throw badRequest("Razorpay order id mismatch.");
  }

  const { verifyRazorpaySignature } = await import("../payments/razorpay.js");
  const ok = verifyRazorpaySignature(params);
  if (!ok) {
    order.payment.status = "failed";
    await order.save();
    throw badRequest("Payment signature verification failed.");
  }

  order.payment.status = "paid";
  order.payment.razorpay.paymentId = params.razorpayPaymentId;
  order.payment.razorpay.signature = params.razorpaySignature;
  await order.save();

  await advanceLoyaltyIfComplete(
    order.userId ? String(order.userId) : null,
    order.payment.method,
    order.payment.status,
  );
  void sendWhatsAppOrderUpdate(
    order.contactPhone,
    `Lickyeat: payment received for ${order.code}. Your order is confirmed!`,
  );

  return serialize(order.toObject());
}

export async function getOrderByAccessToken(token: string) {
  const order = await OrderModel.findOne({ accessToken: token }).lean();
  if (!order) throw notFound("Order not found");
  return serialize(order);
}

export async function listMyOrders(userId: string) {
  const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((o) => serialize(o));
}

/**
 * Re-resolve a delivered order's lines against the CURRENT menu so the customer
 * can drop them back into the cart. Every price is recomputed here — the old
 * snapshot is only used for *what* was ordered, never for how much it cost.
 */
export async function buildReorder(orderId: string, user: AuthedUser) {
  const order = await OrderModel.findById(orderId).lean();
  if (!order) throw notFound("Order not found");
  if (user.role !== "admin" && String(order.userId ?? "") !== user.id) {
    throw forbidden("That's not your order.");
  }
  if (order.status !== "delivered") {
    throw badRequest("Only delivered orders can be reordered.");
  }

  const addOnCatalog = await MenuAddOnModel.find({}).lean();
  const addOnByName = new Map(addOnCatalog.map((a) => [a.name, a]));

  const lines: Array<Record<string, unknown>> = [];
  const unavailable: string[] = [];
  let priceChanged = false;

  for (const snap of order.lines) {
    const label = snap.signatureName || snap.name || "An item";

    if (snap.kind === "item") {
      const item = await MenuItemModel.findById(snap.refId).lean();
      if (!item || !(item.isAvailable ?? true)) {
        unavailable.push(label);
        continue;
      }

      let unitBasePrice = item.price;
      let selectedSizeLabel: string | undefined;
      if (snap.selectedSizeLabel && snap.selectedSizeLabel !== item.portionSize) {
        const variant = (item.sizeVariants ?? []).find((v) => v.label === snap.selectedSizeLabel);
        if (variant && (variant.isAvailable ?? true)) {
          unitBasePrice = variant.price;
          selectedSizeLabel = variant.label;
        }
        // variant gone → silently fall back to the base size
      }

      const addOns: string[] = [];
      let unitAddOnsPrice = 0;
      for (const a of snap.addOns ?? []) {
        const name = a.name;
        if (!name) continue;
        const catalog = addOnByName.get(name);
        if ((item.addOnNames ?? []).includes(name) && catalog && (catalog.isAvailable ?? true)) {
          addOns.push(name);
          unitAddOnsPrice += catalog.price;
        }
      }

      const salePercent = item.salePercent ?? 0;
      const wasUnit = (snap.unitBasePrice ?? 0) + (snap.unitAddOnsPrice ?? 0);
      if (wasUnit !== unitBasePrice + unitAddOnsPrice) priceChanged = true;

      const hasSugarIce = item.hasSugarIceCustomization ?? true;
      lines.push({
        brandId: order.brandId,
        kind: "item",
        refId: String(item._id),
        signatureName: item.signatureName,
        commonName: item.commonName,
        imageUrl: item.imageUrl ?? null,
        category: item.category,
        unitBasePrice,
        salePercent,
        unitAddOnsPrice,
        quantity: snap.quantity ?? 1,
        customization: {
          addOns,
          comboItemIds: [],
          ...(selectedSizeLabel ? { selectedSizeLabel } : {}),
          ...(hasSugarIce && snap.sugar ? { sugar: snap.sugar } : {}),
          ...(hasSugarIce && snap.ice ? { ice: snap.ice } : {}),
          ...(snap.comment ? { comment: snap.comment } : {}),
        },
      });
    } else {
      const combo = await ComboModel.findById(snap.refId).lean();
      if (!combo || !(combo.isAvailable ?? true)) {
        unavailable.push(label);
        continue;
      }

      let constituentIds: string[];
      if (combo.type === "curated") {
        constituentIds = combo.itemIds.map(String);
      } else {
        // choose-n: recover the picks from the snapshot's "Sig + Sig" commonName.
        const wanted = (snap.commonName ?? "").split(" + ").map((s) => s.trim()).filter(Boolean);
        const eligible = await MenuItemModel.find({
          _id: { $in: combo.eligibleItemIds.map(String) },
        }).lean();
        const bySig = new Map(eligible.map((i) => [i.signatureName, String(i._id)]));
        const picked = wanted.map((w) => bySig.get(w)).filter((x): x is string => Boolean(x));
        if (picked.length !== (combo.chooseCount ?? 0)) {
          unavailable.push(combo.name);
          continue;
        }
        constituentIds = picked;
      }

      const items = await MenuItemModel.find({ _id: { $in: constituentIds } }).lean();
      if (items.length !== new Set(constituentIds).size || items.some((i) => !(i.isAvailable ?? true))) {
        unavailable.push(combo.name);
        continue;
      }
      const byId = new Map(items.map((i) => [String(i._id), i]));
      const unitBasePrice = computeComboPrice(
        constituentIds.map((id) => byId.get(id)!.price),
        combo.discountPercent ?? undefined,
      );
      if ((snap.unitBasePrice ?? 0) !== unitBasePrice) priceChanged = true;

      lines.push({
        brandId: order.brandId,
        kind: "combo",
        refId: String(combo._id),
        signatureName: combo.name,
        commonName: constituentIds.map((id) => byId.get(id)!.signatureName).join(" + "),
        imageUrl: combo.imageUrl ?? byId.get(constituentIds[0]!)?.imageUrl ?? null,
        category: "combo",
        unitBasePrice,
        salePercent: 0,
        unitAddOnsPrice: 0,
        quantity: snap.quantity ?? 1,
        customization: {
          addOns: [],
          comboItemIds: constituentIds,
          ...(snap.comment ? { comment: snap.comment } : {}),
        },
      });
    }
  }

  if (lines.length === 0) {
    throw badRequest("None of the items on that order are available to reorder right now.");
  }

  return { sourceCode: order.code, brandId: order.brandId, lines, unavailable, priceChanged };
}

export async function cancelOrder(token: string, body: CancelOrderRequest) {
  const order = await OrderModel.findOne({ accessToken: token });
  if (!order) throw notFound("Order not found");
  if (order.status === "cancelled") throw badRequest("This order is already cancelled.");

  const fromStatus = order.status as OrderStatus;
  const refundPercent = refundPercentForCancellation(fromStatus);
  const paidAmount = order.payment.status === "paid" ? order.payment.amount ?? 0 : 0;
  const refundAmount = Math.round((paidAmount * refundPercent) / 100);

  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled", at: new Date() });
  order.cancellation = {
    cancelledAt: new Date(),
    cancelledFromStatus: fromStatus,
    reason: body.reason ?? "",
    refundPercent,
    refundAmount,
  };
  if (refundAmount > 0) order.payment.status = "refunded";
  await order.save();

  void sendWhatsAppOrderUpdate(
    order.contactPhone,
    refundAmount > 0
      ? `Lickyeat: order ${order.code} cancelled. ₹${refundAmount} will be refunded (settled manually).`
      : `Lickyeat: order ${order.code} cancelled.`,
  );

  return serialize(order.toObject());
}

// ---- admin ----

export async function advanceOrderStatus(orderId: string, next: OrderStatus) {
  const order = await OrderModel.findById(orderId);
  if (!order) throw notFound("Order not found");
  if (order.status === "cancelled") throw badRequest("Order is cancelled.");

  const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
  const nextIdx = STATUS_FLOW.indexOf(next);
  if (nextIdx === -1) throw badRequest("Invalid status.");
  if (nextIdx !== currentIdx + 1) {
    throw badRequest(`Cannot move from ${order.status} to ${next}.`);
  }

  order.status = next;
  order.statusHistory.push({ status: next, at: new Date() });

  if (next === "out-for-delivery" && !order.deliveryPartner) {
    order.deliveryPartner = pickDeliveryPartner(String(order._id), "regular");
  }
  await order.save();

  void sendWhatsAppOrderUpdate(order.contactPhone, statusMessage(order.code, next));
  return serialize(order.toObject());
}

export async function listAllOrders(filter: { brandId?: string; status?: string } = {}) {
  const q: Record<string, unknown> = {};
  if (filter.brandId) q.brandId = filter.brandId;
  if (filter.status) q.status = filter.status;
  const orders = await OrderModel.find(q).sort({ createdAt: -1 }).limit(200).lean();
  return orders.map((o) => serialize(o));
}

function statusMessage(code: string, status: OrderStatus): string {
  switch (status) {
    case "preparing":
      return `Lickyeat: order ${code} is being prepared.`;
    case "out-for-delivery":
      return `Lickyeat: order ${code} is out for delivery!`;
    case "delivered":
      return `Lickyeat: order ${code} delivered. Enjoy!`;
    default:
      return `Lickyeat: order ${code} update: ${status}.`;
  }
}

/**
 * Loyalty counter advances only for a genuinely completed order:
 * COD (trusted immediately) or a Razorpay order whose payment is "paid".
 */
async function advanceLoyaltyIfComplete(
  userId: string | null,
  method: "cod" | "razorpay",
  paymentStatus: string,
) {
  if (!userId) return;
  const counts = method === "cod" || paymentStatus === "paid";
  if (!counts) return;
  await UserModel.updateOne({ _id: userId }, { $inc: { completedOrderCount: 1 } });
}
