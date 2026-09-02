"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { Address, TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { MAX_SINGLE_MEAL_QUANTITY } from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";
import { useTiffinPrefs } from "@/state/tiffinPreferencesStore";
import { api, ApiError } from "@/lib/api";
import { rupees } from "@/lib/format";

interface MenuOption {
  meal: "breakfast" | "lunch" | "dinner";
  diet: "veg" | "non-veg";
  tier: "regular" | "mini" | "premium";
  date: string;
  dishName: string;
  basePrice: number;
  addOns: Array<{ name: string; price: number }>;
}

export default function SingleMealPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { vegOnly } = useTiffinPrefs();

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [date, setDate] = useState(tomorrow);
  const { data } = useSWR<{ options: MenuOption[] }>(`/tiffin/single-meal/menu?date=${date}`);

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
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-2xl font-bold">Order a single meal</h1>

      <div>
        <span className="label">Date</span>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <Pick label="Meal" value={meal} options={["breakfast", "lunch", "dinner"]} onChange={setMeal} />
      <Pick label="Tier" value={tier} options={["regular", "mini", "premium"]} onChange={setTier} />
      {!vegOnly && (
        <Pick label="Diet" value={diet} options={["veg", "non-veg"]} onChange={setDiet} />
      )}

      {selected ? (
        <div className="card p-4">
          <p className="font-semibold">{selected.dishName}</p>
          <p className="text-sm text-black/50">{rupees(selected.basePrice)} base</p>
          {selected.addOns.length > 0 && (
            <div className="mt-3 space-y-1">
              <span className="label">Add-ons</span>
              {selected.addOns.map((a) => (
                <label key={a.name} className="flex items-center justify-between text-sm">
                  <span>
                    {a.name} · {rupees(a.price)}
                  </span>
                  <input
                    type="checkbox"
                    checked={addOns.includes(a.name)}
                    onChange={() =>
                      setAddOns((c) =>
                        c.includes(a.name) ? c.filter((x) => x !== a.name) : [...c, a.name],
                      )
                    }
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-black/50">
          That combination isn&rsquo;t available for this date (ordering window may have closed).
        </p>
      )}

      <div className="flex items-center gap-3">
        <span className="label !mb-0">Quantity</span>
        <button className="btn-ghost !h-8 !w-8 !p-0" onClick={() => setQty((q) => Math.max(1, q - 1))}>
          −
        </button>
        <span className="w-6 text-center font-semibold">{qty}</span>
        <button
          className="btn-ghost !h-8 !w-8 !p-0"
          onClick={() => setQty((q) => Math.min(MAX_SINGLE_MEAL_QUANTITY, q + 1))}
        >
          +
        </button>
      </div>

      {!user && (
        <div className="card space-y-2 p-4">
          <input
            className="input"
            placeholder="Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Phone"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </div>
      )}

      <div className="card space-y-2 p-4">
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

      <Pick label="Payment" value={method} options={["cod", "razorpay"]} onChange={setMethod} />

      <p className="text-xs text-black/45">
        Full refund if cancelled within 15 minutes of placing the order.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" onClick={order} disabled={busy || !selected}>
        {busy ? "Placing…" : `Order · ${rupees(total)}`}
      </button>
    </div>
  );
}

function Pick<T extends string>({
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
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
