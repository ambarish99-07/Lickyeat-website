"use client";

import useSWR from "swr";
import type { Order, OrderStatus } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { rupees, formatDateTime } from "@/lib/format";
import { Badge, EmptyState, cn } from "@/components/ui/misc";
import { toast } from "@/state/toastStore";

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
    try {
      await api.post(`/orders/admin/${id}/status`, { status });
      mutate();
      if (status === "out-for-delivery") toast("Delivery partner assigned", { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", { tone: "error" });
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-extrabold">Orders</h1>
      <p className="text-sm text-muted">
        Moving an order to <em>out-for-delivery</em> assigns a delivery partner — the only way to
        reach the tracking screen&rsquo;s delivery state.
      </p>

      {data?.orders.length === 0 && <EmptyState title="No orders yet" />}

      <div className="space-y-2">
        {data?.orders.map((o) => {
          const next = NEXT[o.status];
          return (
            <div key={o.id} className="card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-[110px]">
                <p className="font-semibold">{o.code}</p>
                <p className="text-xs text-muted">{formatDateTime(o.createdAt)}</p>
              </div>
              <div className="text-sm text-charcoal">
                {o.brandId} · {rupees(o.pricing.total)} ·{" "}
                <span className="text-muted">
                  {o.payment.method}/{o.payment.status}
                </span>
              </div>
              <Badge tone={o.status === "cancelled" ? "bad" : o.status === "delivered" ? "good" : "brand"}>
                {o.status.replace(/-/g, " ")}
              </Badge>
              {o.deliveryPartner && (
                <span className="text-xs text-muted">🛵 {o.deliveryPartner.name}</span>
              )}
              {next && (
                <button
                  className={cn("btn-primary btn-sm ml-auto")}
                  onClick={() => advance(o.id, next)}
                >
                  → {next.replace(/-/g, " ")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
