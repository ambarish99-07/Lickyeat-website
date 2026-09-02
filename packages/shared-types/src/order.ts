import { z } from "zod";
import { BrandIdSchema, ObjectIdSchema, RupeesSchema } from "./common.js";
import { AddressSchema } from "./auth.js";
import { IceLevelSchema, SugarLevelSchema } from "./menu.js";
import { DiscountReasonSchema, PricingResultSchema, RewardReasonSchema } from "./pricing.js";

// ---------------------------------------------------------------------------
// Cancellation refund policy (regular orders only — tiffin has its own, §4.6)
// ---------------------------------------------------------------------------
export const ORDER_CANCELLATION_PREPARING_REFUND_PERCENT = 50;
export const ORDER_CANCELLATION_DISPATCHED_REFUND_PERCENT = 50;
export const ORDER_CANCELLATION_DELIVERED_REFUND_PERCENT = 30;

export const OrderStatusSchema = z.enum([
  "received",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PaymentMethodSchema = z.enum(["cod", "razorpay"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentStatusSchema = z.enum(["pending", "paid", "failed", "refunded"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

// ---------------------------------------------------------------------------
// Request: NO price fields anywhere. Prices are resolved server-side.
// ---------------------------------------------------------------------------

export const CartLineCustomizationSchema = z.object({
  sugar: SugarLevelSchema.optional(),
  ice: IceLevelSchema.optional(),
  selectedSizeLabel: z.string().max(40).optional(),
  addOns: z.array(z.string()).default([]),
  /** choose-n combos: the item ids the customer picked. */
  comboItemIds: z.array(z.string()).default([]),
  /** free-text special instruction for this line, e.g. "no straw". */
  comment: z.string().max(200).optional(),
});
export type CartLineCustomization = z.infer<typeof CartLineCustomizationSchema>;

export const CreateOrderLineSchema = z.object({
  /** stable client id so the server can echo per-line results. */
  lineId: z.string().min(1),
  brandId: BrandIdSchema,
  kind: z.enum(["item", "combo"]),
  /** menu item slug or combo id. */
  refId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  customization: CartLineCustomizationSchema.default({ addOns: [], comboItemIds: [] }),
});
export type CreateOrderLine = z.infer<typeof CreateOrderLineSchema>;

export const CreateOrderRequestSchema = z.object({
  lines: z.array(CreateOrderLineSchema).min(1),
  address: AddressSchema,
  paymentMethod: PaymentMethodSchema,
  couponCode: z.string().max(32).nullable().default(null),
  /** contact for guest checkout; ignored (taken from account) when logged in. */
  guestName: z.string().max(120).optional(),
  guestPhone: z.string().max(15).optional(),
  notes: z.string().max(500).default(""),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

// ---------------------------------------------------------------------------
// Order document (everything price-related is a snapshot, never a live ref)
// ---------------------------------------------------------------------------

export const OrderLineSnapshotSchema = z.object({
  lineId: z.string(),
  kind: z.enum(["item", "combo"]),
  refId: z.string(),
  /** kept for order history / display — snapshotted at order time. */
  name: z.string(),
  signatureName: z.string().default(""),
  commonName: z.string().default(""),
  imageUrl: z.string().nullable().default(null),
  quantity: z.number().int(),
  unitBasePrice: RupeesSchema,
  unitAddOnsPrice: RupeesSchema,
  addOns: z.array(z.object({ name: z.string(), price: RupeesSchema })),
  selectedSizeLabel: z.string().nullable(),
  sugar: SugarLevelSchema.nullable(),
  ice: IceLevelSchema.nullable(),
  comment: z.string().nullable().default(null),
  lineSubtotal: RupeesSchema,
  isCombo: z.boolean(),
});

export const DeliveryPartnerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  vehicle: z.string(),
});
export type DeliveryPartner = z.infer<typeof DeliveryPartnerSchema>;

export const RazorpayRefsSchema = z.object({
  orderId: z.string().nullable(),
  paymentId: z.string().nullable(),
  signature: z.string().nullable(),
});

export const OrderCancellationSchema = z.object({
  cancelledAt: z.string(),
  cancelledFromStatus: OrderStatusSchema,
  reason: z.string().default(""),
  refundPercent: z.number(),
  refundAmount: RupeesSchema,
});

export const OrderSchema = z.object({
  id: ObjectIdSchema,
  /** short human-facing code, e.g. LKY-8F3A. */
  code: z.string(),
  brandId: BrandIdSchema,
  userId: ObjectIdSchema.nullable(),
  /** Capability token: possessing it authorizes status lookup + cancellation. */
  accessToken: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  address: AddressSchema,
  lines: z.array(OrderLineSnapshotSchema),
  pricing: PricingResultSchema,
  couponCode: z.string().nullable().default(null),
  discountReason: DiscountReasonSchema,
  rewardReason: RewardReasonSchema,
  isPremiumMemberAtOrder: z.boolean(),
  status: OrderStatusSchema,
  statusHistory: z.array(
    z.object({ status: OrderStatusSchema, at: z.string() }),
  ),
  payment: z.object({
    method: PaymentMethodSchema,
    status: PaymentStatusSchema,
    amount: RupeesSchema,
    razorpay: RazorpayRefsSchema,
  }),
  deliveryPartner: DeliveryPartnerSchema.nullable(),
  cancellation: OrderCancellationSchema.nullable(),
  notes: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CreateOrderResponseSchema = z.object({
  order: OrderSchema,
  /** present only for razorpay orders that still need client-side payment. */
  razorpayOrder: z
    .object({ id: z.string(), amount: z.number(), currency: z.string(), keyId: z.string() })
    .nullable(),
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

export const VerifyPaymentRequestSchema = z.object({
  orderId: ObjectIdSchema,
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
export type VerifyPaymentRequest = z.infer<typeof VerifyPaymentRequestSchema>;

export const CancelOrderRequestSchema = z.object({
  reason: z.string().max(500).default(""),
});
export type CancelOrderRequest = z.infer<typeof CancelOrderRequestSchema>;

/**
 * Refund percent for a regular order cancelled from a given status.
 * COD never collected money, so callers still gate the amount on payment.status.
 */
export function refundPercentForCancellation(status: OrderStatus): number {
  switch (status) {
    case "received":
      return 100;
    case "preparing":
    case "out-for-delivery":
      return ORDER_CANCELLATION_DISPATCHED_REFUND_PERCENT;
    case "delivered":
      return ORDER_CANCELLATION_DELIVERED_REFUND_PERCENT;
    case "cancelled":
      return 0;
  }
}
