"use client";

import Link from "next/link";
import useSWR from "swr";
import type { TiffinSubscription } from "@lickyeat/shared-types";
import { RequireAuth } from "@/components/RequireAuth";
import { TiffinShell } from "@/components/tiffin/TiffinShell";
import { api } from "@/lib/api";
import { rupees, formatDate } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui/misc";
import { toast } from "@/state/toastStore";

export default function SubscriptionsPage() {
  return (
    <RequireAuth>
      <TiffinShell title="My subscriptions">
        <Subs />
      </TiffinShell>
    </RequireAuth>
  );
}

function Subs() {
  const { data, mutate } = useSWR<{ subscriptions: TiffinSubscription[] }>("/tiffin/subscriptions");

  async function act(id: string, path: string, body?: unknown, ok?: string) {
    try {
      await api.post(`/tiffin/subscriptions/${id}/${path}`, body);
      mutate();
      if (ok) toast(ok, { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", { tone: "error" });
    }
  }

  if (data && data.subscriptions.length === 0) {
    return (
      <EmptyState
        title="No subscriptions yet"
        action={<Link href="/tiffin/subscribe" className="btn-primary btn-md">Start a plan</Link>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/tiffin/subscribe" className="btn-primary btn-md">
        New plan
      </Link>

      {data?.subscriptions.map((s) => {
        const upcoming = s.meals.filter((m) => m.status === "scheduled").slice(0, 8);
        return (
          <div key={s.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display font-bold capitalize">
                  {s.duration} · {s.mealStyle} · {s.diet}
                </p>
                <p className="text-xs text-muted">
                  {formatDate(s.startDate)} – {formatDate(s.endDate)} · {rupees(s.pricePaid)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={s.status === "cancelled" ? "bad" : s.status === "paused" ? "warn" : "good"}>
                  {s.status}
                </Badge>
                {s.status === "active" && (
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => act(s.id, "pause", { pause: true }, "Paused")}
                  >
                    Pause
                  </button>
                )}
                {s.status === "paused" && (
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => act(s.id, "pause", { pause: false }, "Resumed")}
                  >
                    Resume
                  </button>
                )}
                {s.status !== "cancelled" && s.duration === "monthly" && (
                  <button
                    className="btn-ghost btn-sm !border-rose-300 !text-rose-700"
                    onClick={() => act(s.id, "cancel", undefined, "Cancelled")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {s.cancellation && (
              <p className="mt-2 text-sm text-charcoal">
                Cancelled · refund {rupees(s.cancellation.refundAmount)} ({s.cancellation.refundPercent}%)
              </p>
            )}

            {upcoming.length > 0 && (
              <div className="mt-4">
                <p className="field-label">Next meals</p>
                <div className="space-y-1">
                  {upcoming.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-sm"
                    >
                      <span>
                        {m.date} · <span className="capitalize">{m.meal}</span> · {m.dishName}
                      </span>
                      <button
                        className="text-xs font-semibold text-muted hover:text-rose-600"
                        onClick={() =>
                          act(s.id, "skip", { date: m.date, meal: m.meal, skip: true }, "Meal skipped")
                        }
                      >
                        Skip
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
