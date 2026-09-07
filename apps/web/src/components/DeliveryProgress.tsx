"use client";

import { useEffect, useState } from "react";

/**
 * A time-based "where's my order" strip — a 🛵 moving along a shop → home track,
 * plus an "arriving in ~N min" countdown when there's an ETA. This is an estimate
 * derived from the order's own timestamps, NOT a live GPS feed (there's no rider
 * location feed in this system) — said plainly on the strip itself.
 */
const CAP = 0.95; // never look "arrived" before the real status says so

export function DeliveryProgress({
  outForDeliveryAt,
  etaMinutes,
  partnerName,
}: {
  outForDeliveryAt: string | null;
  /** omit for tiffin single meals (scheduled to a window, no ASAP ETA). */
  etaMinutes?: number;
  partnerName?: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  const startedMs = outForDeliveryAt ? new Date(outForDeliveryAt).getTime() : now;
  const totalMs = etaMinutes ? etaMinutes * 60000 : undefined;
  const elapsedMs = Math.max(0, now - startedMs);
  const progress = totalMs ? Math.min(CAP, elapsedMs / totalMs) : CAP;
  const remaining = totalMs ? Math.max(0, Math.ceil((totalMs - elapsedMs) / 60000)) : undefined;

  return (
    <div className="card p-5">
      <p className="font-display font-bold">
        {partnerName ? `${partnerName} is on the way 🛵` : "Your order is on the way 🛵"}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-brand">
        {remaining !== undefined
          ? remaining > 0
            ? `Arriving in ~${remaining} min`
            : "Arriving any moment now"
          : "On the way — arriving soon"}
      </p>

      <div className="relative mt-4 h-10">
        <div className="absolute inset-x-3 top-1/2 h-[3px] -translate-y-1/2 rounded bg-line" />
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 text-lg">🏪</span>
        <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-lg">🏠</span>
        <span
          className="absolute top-1/2 -ml-3 -translate-y-1/2 text-xl transition-[left] duration-[15000ms] ease-linear"
          style={{ left: `${progress * 100}%` }}
        >
          🛵
        </span>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted">
        Estimated progress based on delivery time, not a live GPS pin.
      </p>
    </div>
  );
}
