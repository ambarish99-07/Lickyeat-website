"use client";

import { use, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { LiveMap } from "@/components/LiveMap";

interface RiderView {
  orderCode: string;
  active: boolean;
  customerName: string;
  dropAddress: string;
  drop: { lat: number; lng: number } | null;
}

const PING_EVERY_MS = 10_000;

export default function RiderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data, error } = useSWR<RiderView>(`/orders/rider/${token}`, { refreshInterval: 20_000 });

  const [sharing, setSharing] = useState(false);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const watchId = useRef<number | null>(null);
  const lastPing = useRef(0);

  useEffect(() => {
    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function start() {
    setErr("");
    if (!("geolocation" in navigator)) {
      setErr("This phone can't share location.");
      return;
    }
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const next = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(next);
        const now = Date.now();
        if (now - lastPing.current >= PING_EVERY_MS) {
          lastPing.current = now;
          api
            .post(`/orders/rider/${token}/ping`, next)
            .then(() => setSentAt(Date.now()))
            .catch(() => {});
        }
      },
      (e) => setErr(e.code === e.PERMISSION_DENIED ? "Location permission denied." : "Couldn't get a location fix."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20_000 },
    );
    setSharing(true);
  }

  function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSharing(false);
  }

  if (error) {
    return <Shell>This link is invalid or has expired.</Shell>;
  }
  if (!data) {
    return <Shell>Loading…</Shell>;
  }
  if (!data.active) {
    return (
      <Shell>
        <h1 className="font-display text-xl font-extrabold">Order {data.orderCode}</h1>
        <p className="mt-2 text-sm text-muted">
          This delivery isn&rsquo;t out for delivery right now — nothing to share. You can close this
          page.
        </p>
      </Shell>
    );
  }

  return (
    <div className="container-narrow py-8">
      <p className="eyebrow">Rider · live location</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold">Order {data.orderCode}</h1>
      <p className="mt-1 text-sm text-muted">
        Dropping to <span className="font-semibold text-charcoal">{data.customerName}</span> ·{" "}
        {data.dropAddress}
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-line">
        <LiveMap rider={pos} drop={data.drop} className="h-56 w-full" />
      </div>

      {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}

      {!sharing ? (
        <button onClick={start} className="btn-primary btn-lg mt-5 w-full">
          Start sharing my location
        </button>
      ) : (
        <>
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="font-semibold">Sharing your location</span>
            {sentAt && (
              <span className="ml-1 text-emerald-700">
                · last sent {Math.round((Date.now() - sentAt) / 1000)}s ago
              </span>
            )}
            <br />
            The customer sees you move on their tracking screen. Keep this page open until you
            deliver.
          </div>
          <button onClick={stop} className="btn-ghost btn-md mt-3 w-full">
            Stop sharing
          </button>
        </>
      )}

      <p className="mt-4 text-xs text-muted">
        Your location is used only for this one delivery and stops the moment the order is marked
        delivered.
      </p>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="container-narrow py-16 text-center text-muted">{children}</div>;
}
