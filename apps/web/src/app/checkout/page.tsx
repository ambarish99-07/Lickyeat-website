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
import { StoreClosedBanner, useStoreStatus } from "@/components/StoreClosedBanner";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/Button";

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
  const { lines, clear, cartBrandId } = useCart();
  const { user } = useAuth();
  const brandId = cartBrandId();
  const { data: storeStatus } = useStoreStatus(brandId);
  const closed = storeStatus?.status && !storeStatus.status.open;

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    if (lines.length === 0) return;
    api
      .post<{ pricing: PricingResult }>("/pricing/preview", {
        lines: cartToOrderLines(lines),
        couponCode,
        address: address.withinDeliveryRadius ? { withinDeliveryRadius: true } : undefined,
      })
      .then((r) => setPricing(r.pricing))
      .catch(() => {});
  }, [lines, couponCode, address.withinDeliveryRadius]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ addresses: Address[] }>("/account/addresses")
      .then((r) => {
        setSavedAddresses(r.addresses);
        if (r.addresses[0]) setAddress(r.addresses[0]);
      })
      .catch(() => {});
  }, [user]);

  if (lines.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Nothing to check out" action={<ButtonLink href="/#brands">Browse kitchens</ButtonLink>} />
      </div>
    );
  }

  async function placeOrder() {
    setError("");
    setBusy(true);
    try {
      const res = await api.post<CreateOrderResponse>("/orders", {
        lines: cartToOrderLines(lines),
        address,
        paymentMethod: method,
        couponCode,
        guestName: user ? undefined : guestName,
        guestPhone: user ? undefined : guestPhone,
      });
      if (method === "cod" || !res.razorpayOrder) {
        clear();
        router.push(`/order/${res.order.accessToken}`);
      } else {
        setPending(res);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function payNow() {
    if (!pending?.razorpayOrder) return;
    setBusy(true);
    setError("");
    try {
      const verified = await api.post<{ order: Order }>("/orders/verify-payment", {
        orderId: pending.order.id,
        razorpayOrderId: pending.razorpayOrder.id,
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
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-extrabold">Checkout</h1>

        {brandId && <StoreClosedBanner brandId={brandId} />}

        {!user && (
          <section className="card space-y-3 p-5">
            <h2 className="font-display font-bold">Contact</h2>
            <Field label="Name">
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </Field>
            <Field label="Phone" hint="We'll text order updates here.">
              <Input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="10-digit mobile"
              />
            </Field>
            <p className="text-xs text-muted">
              Have an account?{" "}
              <a href="/login" className="link">
                Log in
              </a>{" "}
              for saved addresses and rewards.
            </p>
          </section>
        )}

        <section className="card space-y-3 p-5">
          <h2 className="font-display font-bold">Delivery address</h2>
          <p className="text-xs text-muted">We currently deliver within Patna only.</p>

          {savedAddresses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedAddresses.map((a, i) => (
                <button
                  key={i}
                  onClick={() => setAddress(a)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs ${
                    address.line1 === a.line1 ? "border-brand bg-brand-soft" : "border-ink/15"
                  }`}
                >
                  <span className="font-semibold">{a.label}</span>
                  <br />
                  {a.line1}, {a.city}
                </button>
              ))}
            </div>
          )}

          <Field label="Address line 1">
            <Input value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
          </Field>
          <Field label="Address line 2">
            <Input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
            </Field>
            <Field label="Pincode">
              <Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-start gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={address.withinDeliveryRadius}
              onChange={(e) => setAddress({ ...address, withinDeliveryRadius: e.target.checked })}
            />
            This address is near the shop — may qualify for free delivery
          </label>
        </section>

        <section className="card space-y-2 p-5">
          <h2 className="font-display font-bold">Payment</h2>
          {(["cod", "razorpay"] as const).map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 text-sm ${
                method === m ? "border-brand bg-brand-soft" : "border-ink/12"
              }`}
            >
              <input type="radio" checked={method === m} onChange={() => setMethod(m)} />
              <span>
                {m === "cod" ? "Cash on delivery" : "Pay online"}
                <span className="ml-1 text-xs text-muted">
                  {m === "razorpay" && "· Razorpay (simulated in this demo)"}
                </span>
              </span>
            </label>
          ))}
        </section>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

        {pending ? (
          <Button onClick={payNow} disabled={busy} size="lg">
            Simulate payment · {rupees(pricing?.total ?? 0)}
          </Button>
        ) : (
          <Button onClick={placeOrder} disabled={busy || closed} size="lg">
            {busy ? "Placing…" : closed ? "Kitchen is closed" : `Place order · ${rupees(pricing?.total ?? 0)}`}
          </Button>
        )}
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
        <h2 className="font-display font-bold">Order summary</h2>
        <ul className="space-y-1.5 text-sm">
          {lines.map((l) => (
            <li key={l.lineId} className="flex justify-between gap-4 text-charcoal">
              <span className="truncate">
                {l.quantity} × {l.signatureName}
              </span>
            </li>
          ))}
        </ul>
        <div className="border-t border-line pt-3">
          {pricing ? <PriceBreakdown pricing={pricing} /> : <p className="text-sm text-muted">Calculating…</p>}
        </div>
      </aside>
    </div>
  );
}
