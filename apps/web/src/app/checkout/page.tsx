"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Address,
  CreateOrderResponse,
  Order,
  PricingResult,
} from "@lickyeat/shared-types";
import { useCart } from "@/state/cartStore";
import { useAuth } from "@/state/authStore";
import { api, ApiError } from "@/lib/api";
import { cartToOrderLines } from "@/lib/cart";
import { rupees } from "@/lib/format";
import { PriceBreakdown } from "@/components/PriceBreakdown";

const emptyAddress: Address = {
  label: "Home",
  line1: "",
  line2: "",
  city: "Patna",
  pincode: "",
  withinDeliveryRadius: false,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, clear } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState<Address>(emptyAddress);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingRazorpay, setPendingRazorpay] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    if (lines.length === 0) return;
    api
      .post<{ pricing: PricingResult }>("/pricing/preview", { lines: cartToOrderLines(lines) })
      .then((r) => setPricing(r.pricing))
      .catch(() => {});
  }, [lines]);

  useEffect(() => {
    if (user) {
      api
        .get<{ addresses: Address[] }>("/account/addresses")
        .then((r) => r.addresses[0] && setAddress(r.addresses[0]))
        .catch(() => {});
    }
  }, [user]);

  if (lines.length === 0) {
    return <p className="py-16 text-center text-black/50">Nothing to check out.</p>;
  }

  async function placeOrder() {
    setError("");
    setBusy(true);
    try {
      const res = await api.post<CreateOrderResponse>("/orders", {
        lines: cartToOrderLines(lines),
        address,
        paymentMethod: method,
        guestName: user ? undefined : guestName,
        guestPhone: user ? undefined : guestPhone,
      });
      if (method === "cod") {
        clear();
        router.push(`/order/${res.order.accessToken}`);
      } else {
        setPendingRazorpay(res);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function simulatePayment() {
    if (!pendingRazorpay?.razorpayOrder) return;
    setBusy(true);
    setError("");
    try {
      const verified = await api.post<{ order: Order }>("/orders/verify-payment", {
        orderId: pendingRazorpay.order.id,
        razorpayOrderId: pendingRazorpay.razorpayOrder.id,
        razorpayPaymentId: `pay_sim_${Date.now()}`,
        razorpaySignature: "dev-ok",
      });
      clear();
      router.push(`/order/${verified.order.accessToken}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Checkout</h1>

        {!user && (
          <div className="card space-y-3 p-4">
            <h2 className="font-semibold">Contact</h2>
            <div>
              <span className="label">Name</span>
              <input className="input" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>
            <div>
              <span className="label">Phone</span>
              <input
                className="input"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="10-digit mobile"
              />
            </div>
          </div>
        )}

        <div className="card space-y-3 p-4">
          <h2 className="font-semibold">Delivery address</h2>
          <p className="text-xs text-black/45">We currently deliver within Patna only.</p>
          <div>
            <span className="label">Address line 1</span>
            <input
              className="input"
              value={address.line1}
              onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            />
          </div>
          <div>
            <span className="label">Address line 2</span>
            <input
              className="input"
              value={address.line2}
              onChange={(e) => setAddress({ ...address, line2: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">City</span>
              <input
                className="input"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
              />
            </div>
            <div>
              <span className="label">Pincode</span>
              <input
                className="input"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={address.withinDeliveryRadius}
              onChange={(e) => setAddress({ ...address, withinDeliveryRadius: e.target.checked })}
            />
            This address is close to the shop (may qualify for free delivery)
          </label>
        </div>

        <div className="card space-y-2 p-4">
          <h2 className="font-semibold">Payment</h2>
          {(["cod", "razorpay"] as const).map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm">
              <input type="radio" checked={method === m} onChange={() => setMethod(m)} />
              {m === "cod" ? "Cash on delivery" : "Pay online (Razorpay — simulated in this demo)"}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {pendingRazorpay ? (
          <button className="btn-primary" onClick={simulatePayment} disabled={busy}>
            Simulate Razorpay payment · {rupees(pricing?.total ?? 0)}
          </button>
        ) : (
          <button className="btn-primary" onClick={placeOrder} disabled={busy}>
            {busy ? "Placing…" : `Place order · ${rupees(pricing?.total ?? 0)}`}
          </button>
        )}
      </div>

      <aside className="card h-fit space-y-3 p-5">
        <h2 className="font-bold">Order summary</h2>
        {pricing ? <PriceBreakdown pricing={pricing} /> : <p className="text-sm text-black/40">Loading…</p>}
      </aside>
    </div>
  );
}
