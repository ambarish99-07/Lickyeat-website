"use client";

import Link from "next/link";
import useSWR from "swr";
import type { Brand, TiffinClosure } from "@lickyeat/shared-types";
import { useTiffinPrefs } from "@/state/tiffinPreferencesStore";
import { assetUrl, formatDate } from "@/lib/format";
import { cn } from "@/components/ui/misc";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TiffinLanding({
  brand,
  closures,
}: {
  brand: Brand | null;
  closures: TiffinClosure[];
}) {
  const { vegOnly, setVegOnly } = useTiffinPrefs();
  const diet = vegOnly ? "veg" : "non-veg";
  const { data } = useSWR<{
    table: Array<{ meal: string; days: Array<{ name: string; imageUrl: string | null }> }>;
  }>(`/tiffin/weekly-menu?diet=${diet}`);
  const logo = assetUrl(brand?.logoUrl);
  const today = new Date().toISOString().slice(0, 10);
  const activeClosure = closures.find((c) => c.endDate >= today);

  return (
    <div>
      <section className="relative overflow-hidden bg-brand text-brand-ink">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(55% 90% at 12% 0%, rgb(var(--brand-accent) / 0.9), transparent 60%)",
          }}
        />
        <div className="container-page relative py-16 sm:py-20">
          <div className="flex items-center gap-4">
            {logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-16 w-16 rounded-2xl ring-4 ring-white/20" />
            )}
            <span className="chip bg-white/15 text-brand-ink">A Lickyeat kitchen</span>
          </div>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
            {brand?.name ?? "GG Tiffin Service"}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-brand-ink/85">
            {brand?.description ??
              "Home-style tiffin, delivered daily. Subscribe weekly or monthly, or order a single meal."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/tiffin/subscribe" className="btn-dark btn-lg">
              Start a subscription
            </Link>
            <Link href="/tiffin/single-meal" className="btn-ghost btn-lg !bg-white/10 !text-brand-ink !border-white/30">
              Order a single meal
            </Link>
          </div>
        </div>
      </section>

      <div className="container-page py-10">
        {activeClosure && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
            <strong>Kitchen closure:</strong> {formatDate(activeClosure.startDate)} –{" "}
            {formatDate(activeClosure.endDate)}
            {activeClosure.reason ? ` · ${activeClosure.reason}` : ""}. Affected subscription days are
            added back on to the end of your plan; single-meal orders for these dates are refunded.
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-extrabold">This week&rsquo;s menu</h2>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
            Veg only
          </label>
        </div>

        <div className="space-y-6">
          {(data?.table ?? []).map((row) => (
            <div key={row.meal}>
              <p className="mb-2 font-display text-sm font-bold capitalize text-charcoal">{row.meal}</p>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {row.days.map((dish, i) => {
                  const img = assetUrl(dish.imageUrl);
                  return (
                    <div key={i} className="w-36 shrink-0 overflow-hidden rounded-xl border border-line bg-surface">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt="" className="h-20 w-full object-cover" />
                      ) : (
                        <div className="h-20 w-full bg-sand" />
                      )}
                      <div className="p-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">{DAYS[i]}</p>
                        <p className="mt-0.5 text-xs leading-tight text-charcoal">{dish.name}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            ["Weekly or monthly", "7 or 30 delivery days. Veg or non-veg. One, two or three meals a day."],
            ["Pause & skip", "Going away? Pause the plan or skip individual days — no charge for skipped meals."],
            ["Fair cancellation", "Monthly plans: full refund inside the first 15 days. Weekly plans run their course."],
          ].map(([t, d]) => (
            <div key={t} className="card p-5">
              <h3 className="font-display font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>

        <Link href="/tiffin/subscriptions" className="link mt-8 inline-block text-sm">
          Manage my subscriptions →
        </Link>
      </div>
    </div>
  );
}
