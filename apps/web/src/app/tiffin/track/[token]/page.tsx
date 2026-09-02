"use client";

import { use } from "react";
import useSWR from "swr";
import type { TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { OrderTracker, type TrackableOrder } from "@/components/OrderTracker";

export default function TiffinTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, mutate, isLoading } = useSWR<{ order: TiffinSingleMealOrder }>(
    `/tiffin/single-meal/track/${token}`,
    { refreshInterval: 15000 },
  );

  if (isLoading) return <p className="py-16 text-center text-black/40">Loading…</p>;
  if (!data) return <p className="py-16 text-center text-black/50">Order not found.</p>;

  const o = data.order;
  const trackable: TrackableOrder = {
    code: o.code,
    status: o.status,
    address: o.address,
    contactPhone: o.contactPhone,
    paymentMethod: o.payment.method,
    paymentStatus: o.payment.status,
    total: o.total,
    deliveryPartner: o.deliveryPartner,
    statusHistory: o.statusHistory,
    cancellation: o.cancellation
      ? { refundPercent: o.cancellation.refundPercent, refundAmount: o.cancellation.refundAmount }
      : null,
    cancelPolicy:
      "Full refund if cancelled within 15 minutes of placing the order; no refund after that.",
  };

  return (
    <OrderTracker
      order={trackable}
      cancelPath={`/tiffin/single-meal/track/${token}/cancel`}
      onChanged={() => mutate()}
    />
  );
}
