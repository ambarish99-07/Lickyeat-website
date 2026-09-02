"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Address, DeliveryPartner, PricingResult } from "@lickyeat/shared-types";
import { rupees, formatDateTime } from "@/lib/format";
import { mapEmbedSrcDoc } from "@/lib/mapEmbed";
import { api, ApiError } from "@/lib/api";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge, cn } from "@/components/ui/misc";
import { PriceBreakdown } from "@/components/PriceBreakdown";

const STEPS = ["received", "preparing", "out-for-delivery", "delivered"] as const;
const STEP_LABEL: Record<string, string> = {
  received: "Order received",
  preparing: "Being prepared",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
};

export interface TrackableOrder {
  code: string;
  status: string;
  address: Address;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: string;
  total: number;
  deliveryPartner: DeliveryPartner | null;
  statusHistory: Array<{ status: string; at: string }>;
  cancellation: { refundPercent: number; refundAmount: number; reason?: string } | null;
  cancelPolicy: string;
  items: Array<{ name: string; quantity: number; lineSubtotal: number }>;
  pricing?: PricingResult | null;
  createdAt: string;
}

export function OrderTracker({
  order,
  cancelPath,
  onChanged,
}: {
  order: TrackableOrder;
  cancelPath: string;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const currentIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      await api.post(cancelPath, { reason });
      onChanged();
      if (order.paymentMethod === "cod") setTimeout(() => router.push("/"), 3000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <div>
          <p className="eyebrow">
            {cancelled ? "Cancelled" : delivered ? "Delivered" : "On the way"}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">Order {order.code}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed {formatDateTime(order.createdAt)} · {rupees(order.total)} ·{" "}
            {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
          </p>
        </div>

        {cancelled ? (
          <div className="card p-5">
            <p className="font-semibold text-rose-700">This order was cancelled.</p>
            {order.cancellation && order.cancellation.refundAmount > 0 ? (
              <p className="mt-1 text-sm text-charcoal">
                Refund of {rupees(order.cancellation.refundAmount)} ({order.cancellation.refundPercent}%)
                will be settled manually.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                No payment was collected, so there&rsquo;s nothing to refund.
                {order.paymentMethod === "cod" && " Taking you home in a moment…"}
              </p>
            )}
          </div>
        ) : (
          <div className="card p-5">
            <ol className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i <= currentIdx;
                const at = order.statusHistory.find((h) => h.status === step)?.at;
                return (
                  <li key={step} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold",
                        done ? "border-brand bg-brand text-brand-ink" : "border-ink/20 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                    <div>
                      <p className={done ? "font-semibold" : "text-muted"}>{STEP_LABEL[step]}</p>
                      {at && <p className="text-xs text-muted">{formatDateTime(at)}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {order.deliveryPartner && !cancelled && (
          <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="eyebrow">Your delivery partner</p>
              <p className="mt-1 font-semibold">{order.deliveryPartner.name}</p>
              <p className="text-xs text-muted">{order.deliveryPartner.vehicle}</p>
            </div>
            <div className="flex gap-2">
              <a className="btn-ghost btn-sm" href={`tel:${order.deliveryPartner.phone}`}>
                Call
              </a>
              <a className="btn-ghost btn-sm" href={`sms:${order.deliveryPartner.phone}`}>
                Text
              </a>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <iframe
            title="Delivery location"
            className="h-64 w-full border-0"
            srcDoc={mapEmbedSrcDoc(
              `${order.address.line1}, ${order.address.city} ${order.address.pincode}`,
            )}
          />
          <p className="px-4 py-2.5 text-xs text-muted">
            Showing the delivery address — not a live rider position.
          </p>
        </div>

        {(!cancelled && !delivered) || (delivered && !cancelled) ? (
          <div className="card space-y-3 p-5">
            <h2 className="font-display font-bold">
              {delivered ? "Something wrong with the order?" : "Need to cancel?"}
            </h2>
            <p className="text-sm text-muted">{order.cancelPolicy}</p>
            <Field label={delivered ? "What happened?" : "Reason (optional)"}>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button
              variant="ghost"
              className="!border-rose-300 !text-rose-700"
              onClick={cancel}
              disabled={busy}
            >
              {busy ? "Working…" : delivered ? "Report a problem" : "Cancel order"}
            </Button>
          </div>
        ) : null}
      </div>

      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <h2 className="font-display font-bold">Order</h2>
        <ul className="space-y-1.5 text-sm">
          {order.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 text-charcoal">
              <span className="truncate">
                {it.quantity} × {it.name}
              </span>
              <span className="tabular-nums text-muted">{rupees(it.lineSubtotal)}</span>
            </li>
          ))}
        </ul>
        {order.pricing && (
          <div className="border-t border-line pt-3">
            <PriceBreakdown pricing={order.pricing} />
          </div>
        )}
        <div className="rounded-xl bg-sand/60 p-3 text-xs text-charcoal">
          <p className="font-semibold">{order.address.label}</p>
          <p>
            {order.address.line1}
            {order.address.line2 && `, ${order.address.line2}`}, {order.address.city}{" "}
            {order.address.pincode}
          </p>
        </div>
        <Badge tone={cancelled ? "bad" : delivered ? "good" : "brand"}>
          {order.status.replace(/-/g, " ")}
        </Badge>
      </aside>
    </div>
  );
}
