"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import type {
  Address,
  PremiumMembership,
  PremiumMembershipStatus,
} from "@lickyeat/shared-types";
import { PREMIUM_MEMBERSHIP_PRICE, PREMIUM_MEMBERSHIP_DAYS } from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";
import { api, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function AccountPage() {
  const { user, ready } = useAuth();
  const { data: addrData, mutate: mutateAddr } = useSWR<{ addresses: Address[] }>(
    user ? "/account/addresses" : null,
  );
  const { data: premium, mutate: mutatePremium } = useSWR<{ status: PremiumMembershipStatus }>(
    user ? "/premium-membership/status" : null,
  );

  const [newAddr, setNewAddr] = useState<Address>({
    label: "Home",
    line1: "",
    line2: "",
    city: "Patna",
    pincode: "",
    withinDeliveryRadius: false,
  });
  const [msg, setMsg] = useState("");

  if (ready && !user) {
    return (
      <p className="py-16 text-center">
        <Link href="/login" className="btn-primary">
          Log in
        </Link>
      </p>
    );
  }

  async function addAddress() {
    try {
      await api.post("/account/addresses", newAddr);
      setNewAddr({ ...newAddr, line1: "", line2: "", pincode: "" });
      mutateAddr();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    }
  }

  async function buyPremium() {
    setMsg("");
    try {
      const res = await api.post<{
        membership: PremiumMembership;
        razorpayOrder: { id: string };
      }>("/premium-membership/purchase", {});
      await api.post("/premium-membership/verify", {
        membershipId: res.membership.id,
        razorpayOrderId: res.razorpayOrder.id,
        razorpayPaymentId: `pay_sim_${Date.now()}`,
        razorpaySignature: "dev-ok",
      });
      mutatePremium();
      setMsg("Premium membership active!");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Purchase failed");
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{user?.name}</h1>
        <p className="text-sm text-black/50">
          {user?.email} {user?.phone ? `· ${user.phone}` : ""}
        </p>
        <p className="mt-1 text-sm text-black/50">
          Completed orders: {user?.completedOrderCount ?? 0}
          {(user?.completedOrderCount ?? 0) >= 15 && " · Premium tier unlocked 🎉"}
        </p>
      </div>

      <section className="card p-5">
        <h2 className="font-bold">Premium Membership</h2>
        <p className="mt-1 text-sm text-black/55">
          ₹{PREMIUM_MEMBERSHIP_PRICE} for {PREMIUM_MEMBERSHIP_DAYS} days — free delivery on every
          order, no minimum.
        </p>
        {premium?.status.active ? (
          <p className="mt-3 text-sm font-semibold text-green-700">
            Active · expires {premium.status.expiresAt ? formatDate(premium.status.expiresAt) : ""}
            {premium.status.expiringSoon && " — expiring soon, renew to keep free delivery"}
          </p>
        ) : (
          <button className="btn-primary mt-3" onClick={buyPremium}>
            Get Premium (simulated payment)
          </button>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-bold">Saved addresses</h2>
        <div className="mt-3 space-y-2">
          {addrData?.addresses.map((a, i) => (
            <div key={i} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
              {a.line1}, {a.line2 && `${a.line2}, `}
              {a.city} {a.pincode}
            </div>
          ))}
          {addrData?.addresses.length === 0 && (
            <p className="text-sm text-black/45">No saved addresses.</p>
          )}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            className="input"
            placeholder="Address line 1"
            value={newAddr.line1}
            onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
          />
          <input
            className="input"
            placeholder="Line 2"
            value={newAddr.line2}
            onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
          />
          <input
            className="input"
            placeholder="City"
            value={newAddr.city}
            onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
          />
          <input
            className="input"
            placeholder="Pincode"
            value={newAddr.pincode}
            onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
          />
        </div>
        <button className="btn-ghost mt-3" onClick={addAddress}>
          Add address
        </button>
      </section>

      {msg && <p className="text-sm text-black/60">{msg}</p>}
    </div>
  );
}
