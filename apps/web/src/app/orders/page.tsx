"use client";

import Link from "next/link";
import useSWR from "swr";
import type { Order, TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";
import { rupees, formatDateTime } from "@/lib/format";

export default function MyOrdersPage() {
  const { user, ready } = useAuth();
  const { data: reg } = useSWR<{ orders: Order[] }>(user ? "/orders/mine" : null);
  const { data: tif } = useSWR<{ orders: TiffinSingleMealOrder[] }>(
    user ? "/tiffin/single-meal/orders/mine" : null,
  );

  if (ready && !user) {
    return (
      <p className="py-16 text-center">
        <Link href="/login" className="btn-primary">
          Log in to see your orders
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My orders</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/40">Food & drinks</h2>
        {reg?.orders.length === 0 && <p className="text-sm text-black/50">No orders yet.</p>}
        {reg?.orders.map((o) => (
          <Link key={o.id} href={`/order/${o.accessToken}`} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{o.code}</p>
              <p className="text-xs text-black/45">
                {formatDateTime(o.createdAt)} · {o.brandId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{rupees(o.pricing.total)}</p>
              <p className="text-xs capitalize text-black/45">{o.status.replace(/-/g, " ")}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-black/40">GG Tiffin — single meals</h2>
        {tif?.orders.length === 0 && <p className="text-sm text-black/50">No tiffin orders yet.</p>}
        {tif?.orders.map((o) => (
          <Link
            key={o.id}
            href={`/tiffin/track/${o.accessToken}`}
            className="card flex items-center justify-between p-4"
          >
            <div>
              <p className="font-semibold">{o.code}</p>
              <p className="text-xs text-black/45">
                {o.dishName} · {o.meal} · {o.date}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{rupees(o.total)}</p>
              <p className="text-xs capitalize text-black/45">{o.status.replace(/-/g, " ")}</p>
            </div>
          </Link>
        ))}
      </section>

      <Link href="/tiffin/subscriptions" className="inline-block text-sm font-semibold text-brand">
        View tiffin subscriptions →
      </Link>
    </div>
  );
}
