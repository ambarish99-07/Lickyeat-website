"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Address, DeliveryPartner } from "@lickyeat/shared-types";
import { rupees, formatDateTime } from "@/lib/format";
import { mapEmbedSrcDoc } from "@/lib/mapEmbed";
import { api, ApiError } from "@/lib/api";

const STEPS = ["received", "preparing", "out-for-delivery", "delivered"] as const;
const STEP_LABEL: Record<string, string> = {
  received: "Order received",
  preparing: "Preparing",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
};

export interface TrackableOrder {
  code: string;
  status: string;
  address: Address;
  contactPhone: string;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: string;
  total: number;
  deliveryPartner: DeliveryPartner | null;
  statusHistory: Array<{ status: string; at: string }>;
  cancellation: { refundPercent: number; refundAmount: number; reason?: string } | null;
  cancelPolicy: string;
}

export function OrderTracker({
  order,
  cancelPath,
  onChanged,
}: {
  order: TrackableOrder;
  cancelPath: string;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancelled = order.status === "cancelled";
  const currentIdx = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  async function cancel() {
    setBusy(true);
    setError("");
    try {
      await api.post(cancelPath, { reason });
      onChanged();
      if (order.paymentMethod === "cod") {
        setTimeout(() => router.push("/"), 3000);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not cancel.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Order {order.code}</h1>
        <p className="text-sm text-black/50">
          {rupees(order.total)} · {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
        </p>
      </div>

      {cancelled ? (
        <div className="card p-5">
          <p className="font-semibold text-red-700">This order was cancelled.</p>
          {order.cancellation && order.cancellation.refundAmount > 0 ? (
            <p className="mt-1 text-sm">
              Refund of {rupees(order.cancellation.refundAmount)} ({order.cancellation.refundPercent}%)
              will be settled manually.
            </p>
          ) : (
            <p className="mt-1 text-sm text-black/60">
              No payment was collected, so there is nothing to refund.
              {order.paymentMethod === "cod" && " Redirecting to home in a moment…"}
            </p>
          )}
        </div>
      ) : (
        <div className="card p-5">
          <ol className="space-y-4">
            {STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const at = order.statusHistory.find((h) => h.status === step)?.at;
              return (
                <li key={step} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                      done ? "border-brand bg-brand" : "border-black/20"
                    }`}
                  />
                  <div>
                    <p className={done ? "font-semibold" : "text-black/40"}>{STEP_LABEL[step]}</p>
                    {at && <p className="text-xs text-black/40">{formatDateTime(at)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {order.deliveryPartner && !cancelled && (
        <div className="card p-5">
          <h2 className="font-semibold">Delivery partner</h2>
          <p className="mt-1 text-sm">
            {order.deliveryPartner.name} · {order.deliveryPartner.vehicle}
          </p>
          <div className="mt-3 flex gap-2">
            <a className="btn-ghost" href={`tel:${order.deliveryPartner.phone}`}>
              Call
            </a>
            <a className="btn-ghost" href={`sms:${order.deliveryPartner.phone}`}>
              Text
            </a>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <iframe
          title="Delivery location"
          className="h-64 w-full"
          srcDoc={mapEmbedSrcDoc(
            `${order.address.line1}, ${order.address.city} ${order.address.pincode}`,
          )}
        />
        <p className="px-4 py-2 text-xs text-black/45">
          Showing the delivery address — not a live rider position.
        </p>
      </div>

      {!cancelled && order.status !== "delivered" && (
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold">Cancel this order</h2>
          <p className="text-sm text-black/55">{order.cancelPolicy}</p>
          <input
            className="input"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-ghost !border-red-300 !text-red-700" onClick={cancel} disabled={busy}>
            {busy ? "Cancelling…" : "Cancel order"}
          </button>
        </div>
      )}

      {order.status === "delivered" && !cancelled && (
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold">Something wrong with the order?</h2>
          <p className="text-sm text-black/55">{order.cancelPolicy}</p>
          <input
            className="input"
            placeholder="Tell us what happened"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-ghost !border-red-300 !text-red-700" onClick={cancel} disabled={busy}>
            Report a problem
          </button>
        </div>
      )}
    </div>
  );
}
