import { z } from "zod";

/**
 * What the API hands the browser so it can open Razorpay Checkout. When Razorpay
 * keys aren't configured the server returns a stub (`id` starts `order_local_`,
 * `keyId` is `rzp_test_local`) and the client simulates the payment instead.
 */
export const RazorpayOrderInfoSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  keyId: z.string(),
});
export type RazorpayOrderInfo = z.infer<typeof RazorpayOrderInfoSchema>;

/** The three fields Razorpay Checkout returns, posted back for server verification. */
export const RazorpayVerifyFieldsSchema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});
export type RazorpayVerifyFields = z.infer<typeof RazorpayVerifyFieldsSchema>;

export const PaymentsConfigSchema = z.object({
  /** true once real Razorpay keys are set — otherwise online payment is simulated. */
  razorpay: z.boolean(),
});
export type PaymentsConfig = z.infer<typeof PaymentsConfigSchema>;

export function isSimulatedRazorpayOrder(o: Pick<RazorpayOrderInfo, "id" | "keyId">): boolean {
  return o.keyId === "rzp_test_local" || o.id.startsWith("order_local_");
}
