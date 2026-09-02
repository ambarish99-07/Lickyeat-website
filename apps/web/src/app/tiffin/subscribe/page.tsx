"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Address, TiffinSubscription } from "@lickyeat/shared-types";
import { RequireAuth } from "@/components/RequireAuth";
import { TiffinShell } from "@/components/tiffin/TiffinShell";
import { api, ApiError } from "@/lib/api";
import { Field, Input, SegmentedControl } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function SubscribePage() {
  return (
    <RequireAuth>
      <TiffinShell title="Build your tiffin plan">
        <SubscribeForm />
      </TiffinShell>
    </RequireAuth>
  );
}

function SubscribeForm() {
  const router = useRouter();
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
      setError(e instanceof ApiError ? e.message : "Could not create the subscription.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Field label="Diet">
        <SegmentedControl
          value={diet}
          onChange={setDiet}
          options={[
            { value: "veg", label: "Veg" },
            { value: "non-veg", label: "Non-veg" },
          ]}
        />
      </Field>
      <Field label="Meals per day">
        <SegmentedControl
          value={mealStyle}
          onChange={setMealStyle}
          options={[
            { value: "single", label: "One (lunch)" },
            { value: "twice", label: "Two" },
            { value: "thrice", label: "Three" },
          ]}
        />
      </Field>
      <Field label="Plan length">
        <SegmentedControl
          value={duration}
          onChange={setDuration}
          options={[
            { value: "weekly", label: "Weekly · 7 days" },
            { value: "monthly", label: "Monthly · 30 days" },
          ]}
        />
      </Field>
      <Field label="Start date">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </Field>

      <div className="card space-y-3 p-4">
        <h2 className="font-display font-bold">Delivery address</h2>
        <Input placeholder="Address line 1" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <Input placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
        </div>
      </div>

      <Field label="Payment">
        <SegmentedControl
          value={method}
          onChange={setMethod}
          options={[
            { value: "cod", label: "Cash on delivery" },
            { value: "razorpay", label: "Pay online" },
          ]}
        />
      </Field>

      <p className="text-xs text-muted">
        Weekly plans can&rsquo;t be cancelled once started. Monthly plans: full refund if cancelled
        within the first 15 days.
      </p>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Button className="w-full" size="lg" onClick={subscribe} disabled={busy || !address.line1}>
        {busy ? "Creating…" : "Create subscription"}
      </Button>
    </div>
  );
}
