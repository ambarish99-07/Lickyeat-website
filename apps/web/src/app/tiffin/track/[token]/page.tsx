"use client";

import { use } from "react";
import useSWR from "swr";
import type { TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { SINGLE_MEAL_CANCELLATION_WINDOW_MINUTES } from "@lickyeat/shared-types";
import { OrderTracker, type TrackableOrder } from "@/components/OrderTracker";

export default function TiffinTrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, mutate, isLoading } = useSWR<{ order: TiffinSingleMealOrder }>(
    `/tiffin/single-meal/track/${token}`,
    { refreshInterval: 15000 },
  );

  if (isLoading) return <p className="container-page py-16 text-center text-muted">Loading…</p>;
  if (!data) return <p className="container-page py-16 text-center text-muted">Order not found.</p>;

  const o = data.order;
  const trackable: TrackableOrder = {
    code: o.code,
    status: o.status,
    address: o.address,
    paymentMethod: o.payment.method,
    paymentStatus: o.payment.status,
    total: o.total,
    deliveryPartner: o.deliveryPartner,
    statusHistory: o.statusHistory,
    cancellation: o.cancellation
      ? { refundPercent: o.cancellation.refundPercent, refundAmount: o.cancellation.refundAmount }
      : null,
    cancelPolicy: `Full refund if cancelled within ${SINGLE_MEAL_CANCELLATION_WINDOW_MINUTES} minutes of placing the order; none after that.`,
    items: [
      {
        name: `${o.dishName}${o.tier !== "regular" ? ` (${o.tier})` : ""}`,
        quantity: o.quantity,
        lineSubtotal: o.total,
      },
      ...o.addOns.map((a) => ({ name: a.name, quantity: 1, lineSubtotal: a.price })),
    ],
    pricing: null,
    createdAt: o.createdAt,
  };

  return (
    <OrderTracker
      order={trackable}
      cancelPath={`/tiffin/single-meal/track/${token}/cancel`}
      onChanged={() => mutate()}
    />
  );
}
