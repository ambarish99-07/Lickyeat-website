"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { Address, TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { MAX_SINGLE_MEAL_QUANTITY } from "@lickyeat/shared-types";
import { TiffinShell } from "@/components/tiffin/TiffinShell";
import { useAuth } from "@/state/authStore";
import { useTiffinPrefs } from "@/state/tiffinPreferencesStore";
import { api, ApiError } from "@/lib/api";
import { rupees, assetUrl } from "@/lib/format";
import type { SingleMealOption } from "@/lib/apiTypes";
import { Field, Input, SegmentedControl } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Stepper, cn } from "@/components/ui/misc";

export default function SingleMealPage() {
  return (
    <TiffinShell title="Order a single meal">
      <SingleMealForm />
    </TiffinShell>
  );
}

function SingleMealForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { vegOnly } = useTiffinPrefs();

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(tomorrow);
  const { data } = useSWR<{ options: SingleMealOption[] }>(`/tiffin/single-meal/menu?date=${date}`);

  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner">("lunch");
  const [tier, setTier] = useState<"regular" | "mini" | "premium">("regular");
  const [diet, setDiet] = useState<"veg" | "non-veg">("veg");
  const [qty, setQty] = useState(1);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [address, setAddress] = useState<Address>({
    label: "Home",
    line1: "",
    line2: "",
    city: "Patna",
    pincode: "",
    withinDeliveryRadius: false,
  });
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [method, setMethod] = useState<"cod" | "razorpay">("cod");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const effDiet = vegOnly ? "veg" : diet;
  const options = data?.options ?? [];
  const selected = useMemo(
    () => options.find((o) => o.meal === meal && o.tier === tier && o.diet === effDiet),
    [options, meal, tier, effDiet],
  );
  const mealAvailable = options.some((o) => o.meal === meal);

  const addOnTotal = (selected?.addOns ?? [])
    .filter((a) => addOns.includes(a.name))
    .reduce((s, a) => s + a.price, 0);
  const total = ((selected?.basePrice ?? 0) + addOnTotal) * qty;

  async function order() {
    setBusy(true);
    setError("");
    try {
      const res = await api.post<{ order: TiffinSingleMealOrder }>("/tiffin/single-meal/orders", {
        diet: effDiet,
        tier,
        meal,
        date,
        quantity: qty,
        addOns,
        address,
        paymentMethod: method,
        guestName: user ? undefined : guestName,
        guestPhone: user ? undefined : guestPhone,
      });
      router.push(`/tiffin/track/${res.order.accessToken}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not place the order.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <Field label="Date">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={tomorrow > date ? undefined : undefined} />
      </Field>
      <Field label="Meal" error={!mealAvailable ? "Ordering window for this meal has closed for the date." : undefined}>
        <SegmentedControl
          value={meal}
          onChange={setMeal}
          options={(["breakfast", "lunch", "dinner"] as const).map((m) => ({ value: m, label: m }))}
        />
      </Field>
      <Field label="Tier">
        <SegmentedControl
          value={tier}
          onChange={setTier}
          options={(["regular", "mini", "premium"] as const).map((t) => ({ value: t, label: t }))}
        />
      </Field>
      {!vegOnly && (
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
      )}

      {selected ? (
        <div className="card overflow-hidden">
          {assetUrl(selected.imageUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(selected.imageUrl)!} alt="" className="h-40 w-full object-cover" />
          )}
          <div className="p-4">
          <p className="font-display font-bold">{selected.dishName}</p>
          <p className="text-sm text-muted">
            {rupees(selected.basePrice)} base · <span className="capitalize">{selected.tier}</span>{" "}
            {selected.diet}
          </p>
          {selected.addOns.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="field-label">Add-ons</p>
              {selected.addOns.map((a) => {
                const on = addOns.includes(a.name);
                return (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() =>
                      setAddOns((c) => (c.includes(a.name) ? c.filter((x) => x !== a.name) : [...c, a.name]))
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm",
                      on ? "border-brand bg-brand-soft" : "border-ink/12",
                    )}
                  >
                    <span>{a.name}</span>
                    <span className="text-muted">+{rupees(a.price)}</span>
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">That combination isn&rsquo;t available for this date.</p>
      )}

      <div className="flex items-center gap-3">
        <span className="field-label !mb-0">Quantity</span>
        <Stepper value={qty} onChange={setQty} min={1} max={MAX_SINGLE_MEAL_QUANTITY} size="sm" />
      </div>

      {!user && (
        <div className="card space-y-2 p-4">
          <Input placeholder="Name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          <Input placeholder="Phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
        </div>
      )}

      <div className="card space-y-2 p-4">
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

      <p className="text-xs text-muted">Full refund if cancelled within 15 minutes of placing the order.</p>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <Button className="w-full" size="lg" onClick={order} disabled={busy || !selected || !address.line1}>
        {busy ? "Placing…" : `Order · ${rupees(total)}`}
      </Button>
    </div>
  );
}
