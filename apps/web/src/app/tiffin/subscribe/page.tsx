"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";
import type {
  Address,
  CreateTiffinSubscriptionResponse,
  TiffinPlan,
} from "@lickyeat/shared-types";
import { RequireAuth } from "@/components/RequireAuth";
import { TiffinShell } from "@/components/tiffin/TiffinShell";
import { api, ApiError } from "@/lib/api";
import { payWithRazorpay, RazorpayCancelled } from "@/lib/razorpay";
import { useAuth } from "@/state/authStore";
import { rupees, assetUrl } from "@/lib/format";
import { Field, Input, SegmentedControl } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/misc";

const STYLE_LABEL: Record<string, string> = {
  single: "One meal a day",
  "twice-daily": "Lunch & dinner",
  "thrice-daily": "All three meals",
};

export default function SubscribePage() {
  return (
    <RequireAuth>
      <TiffinShell title="Choose your tiffin plan">
        <Suspense>
          <SubscribeForm />
        </Suspense>
      </TiffinShell>
    </RequireAuth>
  );
}

function SubscribeForm() {
  const router = useRouter();
  const { user } = useAuth();
  const preselect = useSearchParams().get("plan");
  const { data } = useSWR<{ plans: TiffinPlan[] }>("/tiffin/plans");
  const plans = data?.plans ?? [];

  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const [duration, setDuration] = useState<"weekly" | "monthly">("monthly");
  const [planId, setPlanId] = useState<string | null>(preselect);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner">("lunch");
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

  const visible = useMemo(
    () => plans.filter((p) => p.diet === diet && p.duration === duration),
    [plans, diet, duration],
  );
  const selected = plans.find((p) => p.id === planId) ?? null;

  async function subscribe() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post<CreateTiffinSubscriptionResponse>("/tiffin/subscriptions", {
        planId: selected.id,
        mealType: selected.style === "single" ? mealType : undefined,
        startDate,
        address,
        paymentMethod: method,
      });

      if (res.razorpayOrder) {
        const rp = await payWithRazorpay({
          order: res.razorpayOrder,
          description: `GG Tiffin · ${res.subscription.planName}`,
          prefill: { name: user?.name, email: user?.email ?? undefined, contact: user?.phone ?? undefined },
        });
        await api.post(`/tiffin/subscriptions/${res.subscription.id}/verify-payment`, rp);
      }

      router.push(`/tiffin/subscriptions?new=${res.subscription.id}`);
    } catch (e) {
      if (e instanceof RazorpayCancelled) {
        setError("Payment cancelled — the plan is saved as unpaid, you can pay from My subscriptions.");
      } else {
        setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Could not create the subscription.");
      }
    } finally {
      setBusy(false);
    }
  }

  function charged(p: TiffinPlan) {
    return p.salePercent ? Math.round(p.price * (1 - p.salePercent / 100)) : p.price;
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex flex-wrap gap-3">
        <SegmentedControl
          value={diet}
          onChange={setDiet}
          options={[
            { value: "veg", label: "Veg" },
            { value: "non-veg", label: "Non-veg" },
          ]}
        />
        <SegmentedControl
          value={duration}
          onChange={setDuration}
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "monthly", label: "Monthly" },
          ]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {visible.map((p) => {
          const img = assetUrl(p.imageUrl);
          return (
            <button
              key={p.id}
              onClick={() => setPlanId(p.id)}
              className={cn(
                "card overflow-hidden p-0 text-left transition",
                planId === p.id ? "ring-2 ring-brand" : "hover:shadow-lift",
              )}
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" className="h-24 w-full object-cover" />
              )}
              <div className="p-3">
                <p className="text-sm font-bold">{STYLE_LABEL[p.style]}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {p.durationDays} delivery days
                </p>
                <p className="mt-1.5 font-display font-extrabold">
                  {rupees(charged(p))}
                  {p.salePercent && (
                    <span className="ml-1 text-xs font-normal text-muted line-through">
                      {rupees(p.price)}
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selected?.style === "single" && (
        <Field label="Which meal each day?">
          <SegmentedControl
            value={mealType}
            onChange={setMealType}
            options={(["breakfast", "lunch", "dinner"] as const).map((m) => ({ value: m, label: m }))}
          />
        </Field>
      )}

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
        Weekly plans run their course. Monthly plans: 50% refund if cancelled within the first 15
        days. Pause the plan or skip individual days anytime.
      </p>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Button
        className="w-full"
        size="lg"
        onClick={subscribe}
        disabled={busy || !selected || !address.line1}
      >
        {busy
          ? "Creating…"
          : selected
            ? `Subscribe · ${rupees(charged(selected))}`
            : "Pick a plan"}
      </Button>
    </div>
  );
}
