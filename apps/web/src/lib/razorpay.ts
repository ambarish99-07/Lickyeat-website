import {
  isSimulatedRazorpayOrder,
  type RazorpayOrderInfo,
} from "@lickyeat/shared-types";

/**
 * Razorpay Checkout — client side. When the API returns a real order this loads
 * checkout.js and opens the widget; when it returns a stub (no keys configured)
 * it resolves immediately with the values the server's dev shortcut accepts, so
 * the whole flow works today and goes live the moment keys are added.
 *
 * Still to integrate later: real RAZORPAY_KEY_ID / _SECRET, a payment webhook
 * for reconciliation, and wiring cancellations to the Razorpay refunds API.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const THEME_COLOR = "#0EA5E9";

export interface RazorpayResult {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export class RazorpayCancelled extends Error {
  constructor() {
    super("Payment cancelled");
    this.name = "RazorpayCancelled";
  }
}

interface RazorpayCtor {
  new (options: Record<string, unknown>): {
    open: () => void;
    on: (event: string, cb: (resp: unknown) => void) => void;
  };
}
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

let scriptPromise: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not load the payment library. Check your connection and retry."));
    };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export async function payWithRazorpay(opts: {
  order: RazorpayOrderInfo;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
}): Promise<RazorpayResult> {
  // No real keys → simulate (server auto-verifies `order_local_*` + "dev-ok").
  if (isSimulatedRazorpayOrder(opts.order)) {
    return {
      razorpayOrderId: opts.order.id,
      razorpayPaymentId: `pay_sim_${Date.now()}`,
      razorpaySignature: "dev-ok",
    };
  }

  await loadScript();
  const Ctor = window.Razorpay;
  if (!Ctor) throw new Error("Payment library unavailable.");

  return new Promise<RazorpayResult>((resolve, reject) => {
    let settled = false;
    const rzp = new Ctor({
      key: opts.order.keyId,
      amount: opts.order.amount,
      currency: opts.order.currency,
      order_id: opts.order.id,
      name: "Lickyeat",
      description: opts.description,
      prefill: opts.prefill ?? {},
      notes: opts.notes ?? {},
      theme: { color: THEME_COLOR },
      handler: (resp: unknown) => {
        settled = true;
        const r = resp as {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        };
        resolve({
          razorpayOrderId: r.razorpay_order_id,
          razorpayPaymentId: r.razorpay_payment_id,
          razorpaySignature: r.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          if (!settled) reject(new RazorpayCancelled());
        },
      },
    });
    rzp.on("payment.failed", (resp: unknown) => {
      settled = true;
      const e = resp as { error?: { description?: string } };
      reject(new Error(e.error?.description ?? "Payment failed. Please try again."));
    });
    rzp.open();
  });
}
