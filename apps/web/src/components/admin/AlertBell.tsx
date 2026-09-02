"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { AdminAlert } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import type { AlertCountResponse, AlertsResponse } from "@/lib/apiTypes";
import { relativeTime } from "@/lib/format";
import { BellIcon } from "@/components/ui/icons";

/**
 * Durable alert queue for the admin team. Counts poll every 30s; the list loads
 * when opened. Because alerts live in the DB, anything raised while the panel was
 * closed is still here the next time an admin signs in.
 */
export function AlertBell() {
  const [open, setOpen] = useState(false);
  const { data: count, mutate: mutateCount } = useSWR<AlertCountResponse>(
    "/leads/alerts/count",
    { refreshInterval: 30_000 },
  );
  const { data: list, mutate: mutateList } = useSWR<AlertsResponse>(
    open ? "/leads/alerts/list?unread=1" : null,
  );

  const unread = count?.total ?? 0;
  const callbacks = count?.callbacks ?? 0;

  async function markAllRead() {
    const ids = (list?.alerts ?? []).map((a) => a.id);
    await api.post("/leads/alerts/read", { ids });
    mutateCount();
    mutateList();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Alerts${unread ? `, ${unread} unread` : ""}`}
        className="relative grid h-8 w-8 place-items-center rounded-full border border-cream/20 text-cream/80 hover:text-cream"
      >
        <BellIcon className="h-4 w-4" />
        {unread > 0 && (
          <span
            className={`absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold ${
              callbacks > 0 ? "bg-rose-500 text-white" : "bg-brand text-brand-ink"
            }`}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} role="presentation" />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <p className="text-sm font-bold">
                Alerts {unread > 0 && <span className="text-muted">({unread})</span>}
              </p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs font-semibold text-brand hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {(list?.alerts ?? []).length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted">Nothing waiting.</p>
              ) : (
                (list?.alerts ?? []).map((a: AdminAlert) => (
                  <Link
                    key={a.id}
                    href={a.href ?? "/admin/leads"}
                    onClick={() => setOpen(false)}
                    className="block border-b border-line px-4 py-3 last:border-0 hover:bg-ink/5"
                  >
                    <div className="flex items-center gap-2">
                      {a.priority === "high" && (
                        <span className="chip bg-rose-100 text-rose-700">call back</span>
                      )}
                      <span className="text-sm font-semibold">{a.title}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{a.body}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{relativeTime(a.createdAt)}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
