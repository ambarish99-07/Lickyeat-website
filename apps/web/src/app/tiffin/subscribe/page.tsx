"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Address, TiffinSubscription } from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";
import { api, ApiError } from "@/lib/api";

export default function SubscribePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const [mealStyle, setMealStyle] = useState<"single" | "twice" | "thrice">("single");
  const [duration, setDuration] = useState<"weekly" | "monthly">("monthly");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [address, setAddress] = useState<Address>({
    label: "Home",
    line1: "",
    line2: "",
    city: "Patna",
    pincode: "",
    withinDeliveryRadius: false,
  });
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (ready && !user) {
    return (
      <p className="py-16 text-center">
        <Link href="/login" className="btn-primary">
          Log in to subscribe
        </Link>
      </p>
    );
  }

  async function subscribe() {
    setBusy(true);
    setError("");
    try {
      const res = await api.post<{ subscription: TiffinSubscription }>("/tiffin/subscriptions", {
        diet,
        mealStyle,
        duration,
        startDate,
        address,
        paymentMethod: method,
      });
      router.push(`/tiffin/subscriptions?new=${res.subscription.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create subscription.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">Build your tiffin plan</h1>

      <Choice label="Diet" value={diet} options={["veg", "non-veg"]} onChange={setDiet} />
      <Choice
        label="Meals per day"
        value={mealStyle}
        options={["single", "twice", "thrice"]}
        onChange={setMealStyle}
      />
      <Choice label="Plan" value={duration} options={["weekly", "monthly"]} onChange={setDuration} />

      <div>
        <span className="label">Start date</span>
        <input
          type="date"
          className="input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="card space-y-2 p-4">
        <h2 className="font-semibold">Delivery address</h2>
        <input
          className="input"
          placeholder="Address line 1"
          value={address.line1}
          onChange={(e) => setAddress({ ...address, line1: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input"
            placeholder="City"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />
          <input
            className="input"
            placeholder="Pincode"
            value={address.pincode}
            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
          />
        </div>
      </div>

      <Choice label="Payment" value={method} options={["cod", "razorpay"]} onChange={setMethod} />

      <p className="text-xs text-black/45">
        Weekly plans can&rsquo;t be cancelled. Monthly plans: full refund if cancelled within the
        first 15 days.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" onClick={subscribe} disabled={busy}>
        {busy ? "Creating…" : "Create subscription"}
      </button>
    </div>
  );
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`rounded-full border px-4 py-1.5 text-sm capitalize ${
              value === o ? "border-brand bg-brand/10" : "border-black/15"
            }`}
          >
            {o.replace(/-/g, " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
