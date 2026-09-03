"use client";

import useSWR from "swr";
import type {
  PremiumMembership,
  PremiumMembershipStatus,
  RazorpayOrderInfo,
} from "@lickyeat/shared-types";
import {
  PREMIUM_MEMBERSHIP_DAYS,
  PREMIUM_MEMBERSHIP_PRICE,
} from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";
import { api, ApiError } from "@/lib/api";
import { payWithRazorpay, RazorpayCancelled } from "@/lib/razorpay";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { toast } from "@/state/toastStore";

export default function PremiumPage() {
  const { user, ready } = useAuth();
  const { data, mutate } = useSWR<{ status: PremiumMembershipStatus }>(
    user ? "/premium-membership/status" : null,
  );
  const status = data?.status;

  async function buy() {
    try {
      const res = await api.post<{
        membership: PremiumMembership;
        razorpayOrder: RazorpayOrderInfo;
      }>("/premium-membership/purchase", {});
      const rp = await payWithRazorpay({
        order: res.razorpayOrder,
        description: `Lickyeat Premium · ${PREMIUM_MEMBERSHIP_DAYS} days`,
        prefill: { name: user?.name, email: user?.email ?? undefined, contact: user?.phone ?? undefined },
      });
      await api.post("/premium-membership/verify", {
        membershipId: res.membership.id,
        ...rp,
      });
      mutate();
      toast("Premium is active — free delivery on everything!", { tone: "success" });
    } catch (e) {
      if (e instanceof RazorpayCancelled) {
        toast("Payment cancelled", { tone: "default" });
      } else {
        toast(e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Purchase failed", {
          tone: "error",
        });
      }
    }
  }

  return (
    <div className="container-page py-12">
      <div className="surface-brand mx-auto max-w-xl overflow-hidden rounded-3xl">
        <div className="bg-grain px-8 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-ink/55">Lickyeat Premium</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">
            ₹{PREMIUM_MEMBERSHIP_PRICE} · {PREMIUM_MEMBERSHIP_DAYS} days
          </h1>
          <p className="mt-3 text-brand-ink/80">
            Free delivery on every order, across every Lickyeat kitchen. No minimum, no distance
            cap. Separate from the loyalty tier — anyone can buy it.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-brand-ink/85">
            <li>✓ ₹0 delivery fee on TBC, Alchemy Tails and GG Tiffin single meals</li>
            <li>✓ Stacks with coupons and loyalty discounts</li>
            <li>✓ Auto-applied at checkout while active</li>
          </ul>

          <div className="mt-8">
            {!ready ? null : !user ? (
              <ButtonLink href="/login?next=/premium" size="lg" variant="dark">
                Log in to get Premium
              </ButtonLink>
            ) : status?.active ? (
              <div className="rounded-2xl bg-brand-ink/10 px-4 py-3 text-sm">
                <p className="font-semibold text-brand-ink">
                  Active — expires {status.expiresAt ? formatDate(status.expiresAt) : ""}
                </p>
                {status.expiringSoon && (
                  <p className="mt-1 text-brand-ink/70">
                    Expiring in {status.daysRemaining} day{status.daysRemaining === 1 ? "" : "s"}.
                    <button className="ml-1 underline" onClick={buy}>
                      Renew now
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <Button size="lg" variant="dark" onClick={buy}>
                Get Premium — simulated payment
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-brand-ink/45">
            Payment is simulated in this demo (Razorpay-only in production).
          </p>
        </div>
      </div>
    </div>
  );
}
