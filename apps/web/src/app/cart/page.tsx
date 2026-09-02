"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PricingResult } from "@lickyeat/shared-types";
import { useCart } from "@/state/cartStore";
import { api, ApiError } from "@/lib/api";
import { cartToOrderLines } from "@/lib/cart";
import { rupees } from "@/lib/format";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { StoreClosedBanner } from "@/components/StoreClosedBanner";

export default function CartPage() {
  const router = useRouter();
  const { lines, setQty, remove, cartBrandId } = useCart();
  const brandId = cartBrandId();

  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lines.length === 0) {
      setPricing(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api
      .post<{ pricing: PricingResult; couponMessage: string }>("/pricing/preview", {
        lines: cartToOrderLines(lines),
        couponCode: appliedCoupon,
      })
      .then((r) => {
        if (cancelled) return;
        setPricing(r.pricing);
        setMsg(r.couponMessage ?? "");
      })
      .catch((e: ApiError) => !cancelled && setMsg(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [lines, appliedCoupon]);

  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <Link href="/" className="btn-primary mt-4">
          Browse menus
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Your cart</h1>
        <StoreClosedBanner brandId={brandId} />
        {lines.map((l) => (
          <div key={l.lineId} className="card flex items-center gap-3 p-3">
            <div className="flex-1">
              <p className="font-semibold">{l.name}</p>
              <p className="text-xs text-black/45">
                {l.kind === "combo" ? "Combo" : ""}
                {l.customization.selectedSizeLabel ? ` · ${l.customization.selectedSizeLabel}` : ""}
                {l.customization.sugar ? ` · sugar: ${l.customization.sugar}` : ""}
                {l.customization.ice ? ` · ice: ${l.customization.ice}` : ""}
                {l.customization.addOns.length > 0 ? ` · + ${l.customization.addOns.join(", ")}` : ""}
              </p>
              <p className="text-xs text-black/45">~ {rupees(l.estUnitPrice)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost !h-8 !w-8 !p-0" onClick={() => setQty(l.lineId, l.quantity - 1)}>
                −
              </button>
              <span className="w-5 text-center text-sm font-semibold">{l.quantity}</span>
              <button className="btn-ghost !h-8 !w-8 !p-0" onClick={() => setQty(l.lineId, l.quantity + 1)}>
                +
              </button>
            </div>
            <button className="text-xs text-black/40 hover:text-red-600" onClick={() => remove(l.lineId)}>
              Remove
            </button>
          </div>
        ))}
        {brandId && (
          <Link href={`/b/${brandId}`} className="inline-block text-sm font-semibold text-brand">
            + Add more
          </Link>
        )}
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <h2 className="font-bold">Summary</h2>

        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Coupon code"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          />
          <button
            className="btn-ghost"
            onClick={() => setAppliedCoupon(coupon.trim() || null)}
          >
            Apply
          </button>
        </div>
        {msg && <p className="text-xs text-black/55">{msg}</p>}

        {pricing ? (
          <PriceBreakdown pricing={pricing} />
        ) : (
          <p className="text-sm text-black/40">{loading ? "Calculating…" : ""}</p>
        )}

        <button
          className="btn-primary w-full"
          disabled={!pricing}
          onClick={() => router.push("/checkout")}
        >
          Checkout
        </button>
      </aside>
    </div>
  );
}
