"use client";

import { useState } from "react";
import useSWR from "swr";
import { cn } from "@/components/ui/misc";

interface Offer {
  code: string;
  summary: string;
  brandId: string | null;
  oncePerCustomer: boolean;
}

export function OffersList({
  brandId,
  appliedCode,
  onApply,
}: {
  brandId: string | null;
  appliedCode: string | null;
  onApply: (code: string) => void;
}) {
  const { data } = useSWR<{ coupons: Offer[] }>("/coupons/available");
  const [expanded, setExpanded] = useState(false);

  const offers = (data?.coupons ?? []).filter(
    (o) => !o.brandId || o.brandId === brandId,
  );
  if (offers.length === 0) return null;

  const shown = expanded ? offers : offers.slice(0, 3);

  return (
    <div className="rounded-xl border border-line bg-sand/40 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Offers for you</p>
      <ul className="space-y-1.5">
        {shown.map((o) => {
          const active = appliedCode === o.code;
          return (
            <li key={o.code} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0">
                <span className="font-mono font-bold">{o.code}</span>{" "}
                <span className="text-muted">— {o.summary}</span>
                {o.oncePerCustomer && (
                  <span className="text-muted"> · one per account</span>
                )}
              </span>
              <button
                onClick={() => onApply(o.code)}
                disabled={active}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition",
                  active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-brand text-brand-ink hover:brightness-105",
                )}
              >
                {active ? "Applied" : "Apply"}
              </button>
            </li>
          );
        })}
      </ul>
      {offers.length > 3 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[11px] font-semibold text-brand hover:underline"
        >
          {expanded ? "Show fewer" : `Show all ${offers.length} offers`}
        </button>
      )}
    </div>
  );
}
