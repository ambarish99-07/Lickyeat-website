"use client";

import useSWR from "swr";
import type { StoreStatus } from "@lickyeat/shared-types";
import { formatDate } from "@/lib/format";

export function useStoreStatus(brandId: string | null) {
  return useSWR<{ status: StoreStatus }>(brandId ? `/brands/${brandId}/status` : null);
}

export function StoreClosedBanner({ brandId }: { brandId: string | null }) {
  const { data } = useStoreStatus(brandId);
  if (!data) return null;
  const s = data.status;

  if (!s.open) {
    return (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <strong>Currently closed.</strong> {s.reason} You can browse the menu but can’t place
        an order right now.
      </div>
    );
  }
  if (s.upcomingClosure) {
    return (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Heads up — closed {formatDate(s.upcomingClosure.startDate)} to{" "}
        {formatDate(s.upcomingClosure.endDate)}
        {s.upcomingClosure.reason ? ` (${s.upcomingClosure.reason})` : ""}.
      </div>
    );
  }
  return null;
}
