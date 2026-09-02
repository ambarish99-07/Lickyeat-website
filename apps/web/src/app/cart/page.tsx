"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PricingResult } from "@lickyeat/shared-types";
import { useCart, lineUnitPrice } from "@/state/cartStore";
import { useAuth } from "@/state/authStore";
import { api, ApiError } from "@/lib/api";
import { cartToOrderLines } from "@/lib/cart";
import { estimatePricing } from "@/lib/clientPricing";
import { rupees } from "@/lib/format";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import { StoreClosedBanner } from "@/components/StoreClosedBanner";
import { Stepper, EmptyState, Badge } from "@/components/ui/misc";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function CartPage() {
  const router = useRouter();
  const { lines, setQty, remove, cartBrandId, pricingLines } = useCart();
  const { user } = useAuth();
  const brandId = cartBrandId();

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [serverPricing, setServerPricing] = useState<PricingResult | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const localEstimate = useMemo(
    () => (lines.length ? estimatePricing(pricingLines(), user) : null),
    [lines, user, pricingLines],
  );

  useEffect(() => {
    if (lines.length === 0) {
      setServerPricing(null);
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
        setServerPricing(r.pricing);
        setCouponMsg(r.couponMessage ?? "");
      })
      .catch((e: ApiError) => !cancelled && setCouponMsg(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [lines, appliedCoupon]);

  const pricing = serverPricing ?? localEstimate;

  if (lines.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Your cart is empty"
          action={<ButtonLink href="/#brands">Browse the kitchens</ButtonLink>}
        >
          Add a shake, a mocktail or a combo and it&rsquo;ll show up here.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Your cart</h1>
        {brandId && (
          <p className="mt-1 text-sm text-muted">
            From <span className="font-semibold text-ink">{brandId}</span>
          </p>
        )}

        <div className="mt-5 space-y-3">
          {brandId && (
            <StoreClosedBanner brandId={brandId} />
          )}

          {lines.map((l) => (
            <div key={l.lineId} className="card flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{l.name}</p>
                  {l.kind === "combo" && <Badge tone="good">Combo</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {[
                    l.customization.selectedSizeLabel,
                    l.customization.sugar && `sugar: ${l.customization.sugar}`,
                    l.customization.ice && `ice: ${l.customization.ice}`,
                    l.customization.addOns.length > 0 && `+ ${l.customization.addOns.join(", ")}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No customisation"}
                </p>
                <p className="mt-1 text-xs text-muted">{rupees(lineUnitPrice(l))} each</p>
                <button
                  className="mt-2 text-xs font-semibold text-muted hover:text-rose-600"
                  onClick={() => remove(l.lineId)}
                >
                  Remove
                </button>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="font-semibold">{rupees(lineUnitPrice(l) * l.quantity)}</span>
                <Stepper
                  size="sm"
                  value={l.quantity}
                  onChange={(q) => setQty(l.lineId, q)}
                  min={0}
                />
              </div>
            </div>
          ))}
        </div>

        {brandId && (
          <Link href={`/b/${brandId}`} className="link mt-4 inline-block text-sm">
            + Add more from {brandId}
          </Link>
        )}
      </div>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <h2 className="font-display font-bold">Summary</h2>

        <div className="flex gap-2">
          <input
            className="field"
            placeholder="Coupon code"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          />
          <Button
            variant="ghost"
            onClick={() => setAppliedCoupon(couponInput.trim() || null)}
          >
            Apply
          </Button>
        </div>
        {appliedCoupon && (
          <button
            className="text-xs font-semibold text-muted hover:text-ink"
            onClick={() => {
              setAppliedCoupon(null);
              setCouponInput("");
            }}
          >
            Remove coupon
          </button>
        )}
        {couponMsg && <p className="text-xs text-charcoal">{couponMsg}</p>}

        {pricing && (
          <PriceBreakdown pricing={pricing} pending={!serverPricing || loading} />
        )}

        <Button className="w-full" onClick={() => router.push("/checkout")} disabled={!pricing}>
          Go to checkout
        </Button>
        <p className="text-center text-[11px] text-muted">
          Final price is confirmed server-side at checkout.
        </p>
      </aside>
    </div>
  );
}
