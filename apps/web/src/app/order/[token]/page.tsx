"use client";

import { use } from "react";
import useSWR from "swr";
import type { Order } from "@lickyeat/shared-types";
import { OrderTracker, type TrackableOrder } from "@/components/OrderTracker";

function policyText(order: Order): string {
  if (order.payment.method === "cod") {
    return "COD orders collected no payment upfront, so cancelling is always free. Full cancellation until we start preparing; after that the order may already be on its way.";
  }
  switch (order.status) {
    case "received":
      return "Full refund — we haven't started preparing yet.";
    case "preparing":
    case "out-for-delivery":
      return "50% refund — your order is already being prepared or dispatched.";
    case "delivered":
      return "Post-delivery complaints are eligible for a 30% goodwill refund.";
    default:
      return "";
  }
}

export default function OrderTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, mutate, isLoading } = useSWR<{ order: Order }>(`/orders/track/${token}`, {
    refreshInterval: 15000,
  });

  if (isLoading) return <p className="py-16 text-center text-black/40">Loading order…</p>;
  if (!data) return <p className="py-16 text-center text-black/50">Order not found.</p>;

  const o = data.order;
  const trackable: TrackableOrder = {
    code: o.code,
    status: o.status,
    address: o.address,
    contactPhone: o.contactPhone,
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
  };

  return (
    <OrderTracker
      order={trackable}
      cancelPath={`/orders/track/${token}/cancel`}
      onChanged={() => mutate()}
    />
  );
}
