import crypto from "node:crypto";
import { env } from "../../config/env.js";

export interface RazorpayOrderStub {
  id: string;
  amount: number;
  currency: string;
  keyId: string;
}

/**
 * Create a Razorpay order. If Razorpay is not configured we return a local stub
 * id so the flow is still exercisable end-to-end in dev (payment stays "pending"
 * and can be completed with the dev verify shortcut).
 */
export async function createRazorpayOrder(
  amountRupees: number,
  receipt: string,
): Promise<RazorpayOrderStub> {
  const amount = Math.round(amountRupees * 100);
  if (!env.razorpay.configured) {
    return { id: `order_local_${receipt}`, amount, currency: "INR", keyId: "rzp_test_local" };
  }

  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString("base64");
  const resp = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "INR", receipt }),
  });
  if (!resp.ok) throw new Error(`Razorpay order creation failed: ${resp.status}`);
  const data = (await resp.json()) as { id: string; amount: number; currency: string };
  return { id: data.id, amount: data.amount, currency: data.currency, keyId: env.razorpay.keyId! };
}

/** HMAC-SHA256 signature verification (server-side, always). */
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  // Dev shortcut: local stub orders are auto-verified when Razorpay is unconfigured.
  if (!env.razorpay.configured && params.razorpayOrderId.startsWith("order_local_")) {
    return params.razorpaySignature === "dev-ok";
  }
  const expected = crypto
    .createHmac("sha256", env.razorpay.keySecret ?? "")
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(params.razorpaySignature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
