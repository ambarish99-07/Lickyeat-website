"use client";

import useSWR from "swr";
import type { StoreStatus } from "@lickyeat/shared-types";
import { formatDate } from "@/lib/format";

export function useStoreStatus(brandId: string | null) {
  return useSWR<{ status: StoreStatus }>(brandId ? `/brands/${brandId}/status` : null, {
    refreshInterval: 60_000,
  });
}

/**
 * Whether a brand can be ordered from right now is a separate gate from the menu
 * (GET /brands/:brandId/status combines the Lickyeat-wide switch with the
 * brand's own switch / hours / planned closures). Pass a server-fetched
 * `status` to avoid a flash, or let it fetch client-side.
 */
export function StoreClosedBanner({
  brandId,
  status: initial,
}: {
  brandId: string | null;
  status?: StoreStatus;
}) {
  const { data } = useStoreStatus(initial ? null : brandId);
  const status = initial ?? data?.status;
  if (!status) return null;

  if (!status.open) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800">
        <strong className="font-bold">Not accepting orders right now.</strong> {status.reason} You
        can still browse the menu.
      </div>
    );
  }
  if (status.upcomingClosure) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
        Heads up — closed {formatDate(status.upcomingClosure.startDate)} to{" "}
        {formatDate(status.upcomingClosure.endDate)}
        {status.upcomingClosure.reason ? ` · ${status.upcomingClosure.reason}` : ""}.
      </div>
    );
  }
  return null;
}
