"use client";

import Link from "next/link";
import useSWR from "swr";
import type { TiffinSingleMealOrder, TiffinSubscription } from "@lickyeat/shared-types";
import { rupees, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/misc";

const SUB_TONE = {
  active: "good",
  paused: "warn",
  cancelled: "bad",
  completed: "neutral",
} as const;

const ORDER_TONE = (s: string) =>
  s === "cancelled" ? "bad" : s === "delivered" ? "good" : "brand";

/**
 * "My Tiffin" — the customer's GG Tiffin standing, shown in the profile next to
 * Order history: their live subscription (with the next few meals) and recent
 * one-off single-meal orders. Full management lives on /tiffin/subscriptions.
 */
export function MyTiffinSection() {
  const { data: subData } = useSWR<{ subscriptions: TiffinSubscription[] }>("/tiffin/subscriptions");
  const { data: mealData } = useSWR<{ orders: TiffinSingleMealOrder[] }>(
    "/tiffin/single-meal/orders/mine",
  );

  const subs = subData?.subscriptions ?? [];
  const meals = mealData?.orders ?? [];
  const live = subs.find((s) => s.status === "active" || s.status === "paused");
  const recentMeals = meals.slice(0, 3);
  const loaded = Boolean(subData && mealData);
  const nothing = loaded && !live && subs.length === 0 && meals.length === 0;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold">My Tiffin</h2>
        <Link href="/tiffin/subscriptions" className="link text-sm">
          Manage →
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Your GG Tiffin plan and single-meal orders.
      </p>

      {nothing && (
        <p className="mt-3 text-sm text-muted">
          No tiffin yet.{" "}
          <Link href="/tiffin" className="link">
            Explore GG Tiffin
          </Link>
          .
        </p>
      )}

      {live && (
        <div className="mt-3 rounded-xl border border-line p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold capitalize">
              {live.planName || `${live.duration} · ${live.style} · ${live.diet}`}
            </span>
            <Badge tone={SUB_TONE[live.status]}>{live.status}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {formatDate(live.startDate)} – {formatDate(live.endDate)} · {rupees(live.pricePaid)}
          </p>

          {(() => {
            const upcoming = live.meals.filter((m) => m.status === "scheduled").slice(0, 3);
            if (upcoming.length === 0) return null;
            return (
              <div className="mt-2.5 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Next meals</p>
                {upcoming.map((m, i) => (
                  <p key={i} className="text-sm text-charcoal">
                    {formatDate(m.date)} · <span className="capitalize">{m.meal}</span> · {m.dishName}
                  </p>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {recentMeals.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
            Recent single meals
          </p>
          {recentMeals.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl border border-line px-3.5 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {o.dishName} <span className="capitalize text-muted">· {o.meal}</span>
                </p>
                <p className="text-xs text-muted">
                  {formatDate(o.date)} · {rupees(o.total)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={ORDER_TONE(o.status)}>{o.status.replace(/-/g, " ")}</Badge>
                <Link href={`/tiffin/track/${o.accessToken}`} className="btn-ghost btn-sm">
                  Track
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
