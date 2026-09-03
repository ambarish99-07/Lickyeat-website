"use client";

import Link from "next/link";
import useSWR from "swr";
import type { Order, TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { RequireAuth } from "@/components/RequireAuth";
import { rupees, formatDateTime } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui/misc";
import { ReorderButton } from "@/components/ReorderButton";

export default function MyOrdersPage() {
  return (
    <RequireAuth>
      <OrdersInner />
    </RequireAuth>
  );
}

function OrdersInner() {
  const { data: reg } = useSWR<{ orders: Order[] }>("/orders/mine");
  const { data: tif } = useSWR<{ orders: TiffinSingleMealOrder[] }>(
    "/tiffin/single-meal/orders/mine",
  );

  const empty =
    reg?.orders.length === 0 && tif?.orders.length === 0;

  return (
    <div className="container-page space-y-8 py-10">
      <h1 className="font-display text-3xl font-extrabold">My orders</h1>

      {empty && (
        <EmptyState title="No orders yet" action={<Link href="/#brands" className="btn-primary btn-md">Start an order</Link>} />
      )}

      {reg && reg.orders.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3">Food &amp; drinks</h2>
          <div className="space-y-2">
            {reg.orders.map((o) => (
              <div
                key={o.id}
                className="card flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <Link href={`/order/${o.accessToken}`} className="min-w-0 flex-1 transition hover:opacity-80">
                  <p className="font-semibold">{o.code}</p>
                  <p className="text-xs text-muted">
                    {formatDateTime(o.createdAt)} · {o.brandId}
                  </p>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{rupees(o.pricing.total)}</span>
                  <Badge tone={o.status === "cancelled" ? "bad" : o.status === "delivered" ? "good" : "brand"}>
                    {o.status.replace(/-/g, " ")}
                  </Badge>
                  {o.status === "delivered" && <ReorderButton orderId={o.id} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tif && tif.orders.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3">GG Tiffin — single meals</h2>
          <div className="space-y-2">
            {tif.orders.map((o) => (
              <Link
                key={o.id}
                href={`/tiffin/track/${o.accessToken}`}
                className="card flex items-center justify-between p-4 transition hover:shadow-lift"
              >
                <div>
                  <p className="font-semibold">{o.code}</p>
                  <p className="text-xs text-muted">
                    {o.dishName} · {o.meal} · {o.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{rupees(o.total)}</span>
                  <Badge tone={o.status === "cancelled" ? "bad" : o.status === "delivered" ? "good" : "brand"}>
                    {o.status.replace(/-/g, " ")}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Link href="/tiffin/subscriptions" className="link inline-block text-sm">
        Manage tiffin subscriptions →
      </Link>
    </div>
  );
}
