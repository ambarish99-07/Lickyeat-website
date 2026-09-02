"use client";

import Link from "next/link";
import useSWR from "swr";
import type { TiffinSubscription } from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";
import { api } from "@/lib/api";
import { rupees, formatDate } from "@/lib/format";

export default function SubscriptionsPage() {
  const { user, ready } = useAuth();
  const { data, mutate } = useSWR<{ subscriptions: TiffinSubscription[] }>(
    user ? "/tiffin/subscriptions" : null,
  );

  if (ready && !user) {
    return (
      <p className="py-16 text-center">
        <Link href="/login" className="btn-primary">
          Log in
        </Link>
      </p>
    );
  }

  async function act(id: string, path: string, body?: unknown) {
    await api.post(`/tiffin/subscriptions/${id}/${path}`, body);
    mutate();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My tiffin subscriptions</h1>
        <Link href="/tiffin/subscribe" className="btn-primary">
          New plan
        </Link>
      </div>

      {data?.subscriptions.length === 0 && (
        <p className="text-sm text-black/50">No subscriptions yet.</p>
      )}

      {data?.subscriptions.map((s) => {
        const upcoming = s.meals.filter((m) => m.status === "scheduled").slice(0, 6);
        return (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold capitalize">
                  {s.duration} · {s.mealStyle} · {s.diet}
                </p>
                <p className="text-xs text-black/45">
                  {formatDate(s.startDate)} – {formatDate(s.endDate)} · {rupees(s.pricePaid)} ·{" "}
                  <span className="capitalize">{s.status}</span>
                </p>
              </div>
              <div className="flex gap-2">
                {s.status === "active" && (
                  <button className="btn-ghost !py-1.5" onClick={() => act(s.id, "pause", { pause: true })}>
                    Pause
                  </button>
                )}
                {s.status === "paused" && (
                  <button className="btn-ghost !py-1.5" onClick={() => act(s.id, "pause", { pause: false })}>
                    Resume
                  </button>
                )}
                {s.status !== "cancelled" && s.duration === "monthly" && (
                  <button
                    className="btn-ghost !border-red-300 !py-1.5 !text-red-700"
                    onClick={() => act(s.id, "cancel")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {s.cancellation && (
              <p className="mt-2 text-sm text-black/60">
                Cancelled · refund {rupees(s.cancellation.refundAmount)} ({s.cancellation.refundPercent}%)
              </p>
            )}

            {upcoming.length > 0 && (
              <div className="mt-4">
                <p className="label">Next meals</p>
                <div className="space-y-1">
                  {upcoming.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-1.5 text-sm"
                    >
                      <span>
                        {m.date} · <span className="capitalize">{m.meal}</span> · {m.dishName}
                      </span>
                      <button
                        className="text-xs text-black/40 hover:text-red-600"
                        onClick={() => act(s.id, "skip", { date: m.date, meal: m.meal, skip: true })}
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
