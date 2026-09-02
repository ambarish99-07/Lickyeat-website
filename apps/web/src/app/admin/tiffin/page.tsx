"use client";

import { useState } from "react";
import useSWR from "swr";
import type { TiffinClosure, TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { formatDate, rupees } from "@/lib/format";

const NEXT: Record<string, string | null> = {
  received: "preparing",
  preparing: "out-for-delivery",
  "out-for-delivery": "delivered",
  delivered: null,
  cancelled: null,
};

export default function AdminTiffin() {
  const { data: closures, mutate: mutateClosures } = useSWR<{ closures: TiffinClosure[] }>(
    "/tiffin/closures",
  );
  const { data: orders, mutate: mutateOrders } = useSWR<{ orders: TiffinSingleMealOrder[] }>(
    "/admin/tiffin/single-meal/orders",
  );
  const [range, setRange] = useState({ startDate: "", endDate: "", reason: "" });

  async function declareClosure() {
    await api.post("/tiffin/admin/closures", range);
    setRange({ startDate: "", endDate: "", reason: "" });
    mutateClosures();
    mutateOrders();
  }

  async function advance(id: string, status: string) {
    await api.post(`/tiffin/admin/single-meal/${id}/status`, { status });
    mutateOrders();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">GG Tiffin</h1>

      <section className="card p-5">
        <h2 className="font-bold">Emergency closure</h2>
        <p className="text-sm text-muted">
          One-shot and irreversible: marks affected subscription meals closed, pushes those plans&rsquo;
          end dates out, and auto-cancels + refunds single-meal orders in range.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <input
            type="date"
            className="input !w-40"
            value={range.startDate}
            onChange={(e) => setRange({ ...range, startDate: e.target.value })}
          />
          <input
            type="date"
            className="input !w-40"
            value={range.endDate}
            onChange={(e) => setRange({ ...range, endDate: e.target.value })}
          />
          <input
            className="input !w-48"
            placeholder="Reason"
            value={range.reason}
            onChange={(e) => setRange({ ...range, reason: e.target.value })}
          />
          <button
            className="btn-ghost !border-red-300 !py-2 !text-red-700"
            onClick={declareClosure}
            disabled={!range.startDate || !range.endDate}
          >
            Declare closure
          </button>
        </div>
        <div className="mt-4 space-y-1 text-sm">
          {closures?.closures.map((c) => (
            <div key={c.id} className="rounded border border-line px-3 py-1.5">
              {formatDate(c.startDate)} – {formatDate(c.endDate)} {c.reason && `· ${c.reason}`}
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Single-meal orders</h2>
        <div className="space-y-2">
          {orders?.orders.map((o) => {
            const next = NEXT[o.status];
            return (
              <div key={o.id} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-semibold">{o.code}</span>
                <span className="text-charcoal">
                  {o.dishName} · {o.meal} · {o.date} · {rupees(o.total)}
                </span>
                <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs capitalize">
                  {o.status.replace(/-/g, " ")}
                </span>
                {next && (
                  <button className="btn-primary !py-1 !text-xs" onClick={() => advance(o.id, next)}>
                    → {next.replace(/-/g, " ")}
                  </button>
                )}
              </div>
            );
          })}
          {orders?.orders.length === 0 && <p className="text-muted">No orders yet.</p>}
        </div>
      </section>
    </div>
  );
}
