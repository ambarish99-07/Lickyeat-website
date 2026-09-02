"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type { Address } from "@lickyeat/shared-types";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/state/authStore";
import { api, ApiError } from "@/lib/api";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { toast } from "@/state/toastStore";

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountInner />
    </RequireAuth>
  );
}

function AccountInner() {
  const { user, setUser } = useAuth();
  const { data: addrData, mutate } = useSWR<{ addresses: Address[] }>("/account/addresses");
  const [name, setName] = useState(user?.name ?? "");
  const [addr, setAddr] = useState<Address>({
    label: "Home",
    line1: "",
    line2: "",
    city: "Patna",
    pincode: "",
    withinDeliveryRadius: false,
  });

  async function saveName() {
    try {
      const r = await api.patch<{ user: typeof user }>("/account/profile", { name });
      if (r.user) setUser(r.user);
      toast("Name updated", { tone: "success" });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed", { tone: "error" });
    }
  }

  async function addAddress() {
    try {
      await api.post("/account/addresses", addr);
      setAddr({ ...addr, line1: "", line2: "", pincode: "" });
      mutate();
      toast("Address saved", { tone: "success" });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Failed", { tone: "error" });
    }
  }

  const completed = user?.completedOrderCount ?? 0;
  const toPremiumTier = Math.max(0, 15 - completed);

  return (
    <div className="container-page max-w-2xl space-y-8 py-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{user?.name}</h1>
        <p className="text-sm text-muted">
          {user?.email}
          {user?.phone ? ` · ${user.phone}` : ""}
        </p>
      </div>

      <section className="card p-5">
        <p className="eyebrow">Loyalty</p>
        <p className="mt-1 text-sm text-charcoal">
          {completed} completed order{completed === 1 ? "" : "s"}.{" "}
          {toPremiumTier === 0 ? (
            <span className="font-semibold text-brand">Premium tier unlocked — 25% off, always.</span>
          ) : (
            <>Just {toPremiumTier} more to reach the Premium tier (a permanent 25% off).</>
          )}
        </p>
        <Link href="/premium" className="link mt-2 inline-block text-sm">
          Lickyeat Premium Membership →
        </Link>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display font-bold">Profile</h2>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button variant="ghost" onClick={saveName} disabled={name === user?.name || !name.trim()}>
          Save
        </Button>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-display font-bold">Saved addresses</h2>
        <div className="space-y-2">
          {addrData?.addresses.map((a, i) => (
            <div key={i} className="rounded-xl border border-line px-3.5 py-2.5 text-sm">
              <span className="font-semibold">{a.label}</span> · {a.line1}
              {a.line2 && `, ${a.line2}`}, {a.city} {a.pincode}
            </div>
          ))}
          {addrData?.addresses.length === 0 && (
            <p className="text-sm text-muted">No saved addresses yet.</p>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input placeholder="Address line 1" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
          <Input placeholder="Line 2" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} />
          <Input placeholder="City" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
          <Input placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} />
        </div>
        <Button variant="ghost" onClick={addAddress} disabled={!addr.line1 || !addr.pincode}>
          Add address
        </Button>
      </section>
    </div>
  );
}
