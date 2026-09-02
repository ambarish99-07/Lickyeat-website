"use client";

import { use } from "react";
import useSWR from "swr";
import type { Order } from "@lickyeat/shared-types";
import { refundPercentForCancellation } from "@lickyeat/shared-types";
import { OrderTracker, type TrackableOrder } from "@/components/OrderTracker";

function policyText(order: Order): string {
  if (order.payment.method === "cod") {
    return "COD orders take no payment upfront, so cancelling is always free. Full cancellation until we start preparing.";
  }
  const pct = refundPercentForCancellation(order.status);
  if (order.status === "delivered") {
    return "Post-delivery complaints (spilled, never arrived) are eligible for a 30% goodwill refund.";
  }
  return pct === 100
    ? "Full refund — we haven't started preparing yet."
    : `${pct}% refund — your order is already being prepared or is on its way.`;
}

export default function OrderTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, mutate, isLoading } = useSWR<{ order: Order }>(`/orders/track/${token}`, {
    refreshInterval: 15000,
  });

  if (isLoading) return <p className="container-page py-16 text-center text-muted">Loading order…</p>;
  if (!data) return <p className="container-page py-16 text-center text-muted">Order not found.</p>;

  const o = data.order;
  const trackable: TrackableOrder = {
    code: o.code,
    status: o.status,
    address: o.address,
    paymentMethod: o.payment.method,
    paymentStatus: o.payment.status,
    total: o.pricing.total,
    deliveryPartner: o.deliveryPartner,
    statusHistory: o.statusHistory,
    cancellation: o.cancellation
      ? {
          refundPercent: o.cancellation.refundPercent,
          refundAmount: o.cancellation.refundAmount,
          reason: o.cancellation.reason,
        }
      : null,
    cancelPolicy: policyText(o),
    items: o.lines.map((l) => ({ name: l.name, quantity: l.quantity, lineSubtotal: l.lineSubtotal })),
    pricing: o.pricing,
    createdAt: o.createdAt,
  };

  return (
    <OrderTracker order={trackable} cancelPath={`/orders/track/${token}/cancel`} onChanged={() => mutate()} />
  );
}
