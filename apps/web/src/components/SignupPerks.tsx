"use client";

import Link from "next/link";
import { useAuth } from "@/state/authStore";

export function SignupPerks() {
  const { user, ready } = useAuth();
  if (ready && user) return null;

  return (
    <section className="container-page py-10">
      <p className="eyebrow">Two reasons to sign up</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
        Your first order can pay for itself
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Buy 1 Get 1 */}
        <div className="surface-brand relative overflow-hidden rounded-3xl p-7">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-ink/15 text-brand-ink">
            <SparkleIcon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-display text-xl font-extrabold text-brand-ink">Buy 1 Get 1 Free</h3>
          <p className="mt-1.5 max-w-sm text-sm text-brand-ink/80">
            On your first order after signing up, add code <span className="font-bold">BOGO1</span> —
            the cheapest eligible drink comes off, automatically. Excludes combos.
          </p>
          <Link href="/signup" className="btn-dark btn-md mt-5">
            Create an account
          </Link>
        </div>

        {/* Premium */}
        <div className="card relative overflow-hidden rounded-3xl p-7">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-brand">
            <BoltIcon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 font-display text-xl font-extrabold text-ink">
            Lickyeat Premium — ₹21 / 60 days
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-charcoal">
            Free delivery on every order across every kitchen — no minimum, no distance cap, join
            anytime. Manage it from your account.
          </p>
          <Link href="/premium" className="btn-primary btn-md mt-5">
            See Premium
          </Link>
        </div>
      </div>
    </section>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2l1.8 5.5L19 9l-5.2 1.5L12 16l-1.8-5.5L5 9l5.2-1.5L12 2Z" />
      <path d="M19 14l.9 2.6L22 17.5l-2.1.9L19 21l-.9-2.6L16 17.5l2.1-.9L19 14Z" opacity="0.7" />
    </svg>
  );
}

function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10.5H13l0-8.5Z" />
    </svg>
  );
}
