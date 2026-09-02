"use client";

import useSWR from "swr";
import type { Order, OrderStatus } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { rupees, formatDateTime } from "@/lib/format";

const NEXT: Record<string, OrderStatus | null> = {
  received: "preparing",
  preparing: "out-for-delivery",
  "out-for-delivery": "delivered",
  delivered: null,
  cancelled: null,
};

export default function AdminOrders() {
  const { data, mutate } = useSWR<{ orders: Order[] }>("/orders/admin/all");

  async function advance(id: string, status: OrderStatus) {
    await api.post(`/orders/admin/${id}/status`, { status });
    mutate();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-sm text-black/50">
        Advancing an order to <em>out-for-delivery</em> assigns a delivery partner — the only way to
        reach the tracking-screen delivery state.
      </p>
      <div className="space-y-2">
        {data?.orders.map((o) => {
          const next = NEXT[o.status];
          return (
            <div key={o.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-[120px]">
                <p className="font-semibold">{o.code}</p>
                <p className="text-xs text-black/45">{formatDateTime(o.createdAt)}</p>
              </div>
              <div className="text-sm text-black/60">
                {o.brandId} · {rupees(o.pricing.total)} · {o.payment.method}/{o.payment.status}
              </div>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold capitalize">
                {o.status.replace(/-/g, " ")}
              </span>
              {o.deliveryPartner && (
                <span className="text-xs text-black/45">🛵 {o.deliveryPartner.name}</span>
              )}
              <div className="ml-auto">
                {next && (
                  <button className="btn-primary !py-1.5" onClick={() => advance(o.id, next)}>
                    → {next.replace(/-/g, " ")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {data?.orders.length === 0 && <p className="text-sm text-black/50">No orders yet.</p>}
      </div>
    </div>
  );
}
