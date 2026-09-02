"use client";

import Link from "next/link";
import useSWR from "swr";
import { useTiffinPrefs } from "@/state/tiffinPreferencesStore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TiffinLandingPage() {
  const { vegOnly, setVegOnly } = useTiffinPrefs();
  const diet = vegOnly ? "veg" : "non-veg";
  const { data } = useSWR<{
    table: Array<{ meal: string; days: string[] }>;
  }>(`/tiffin/weekly-menu?diet=${diet}`);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-amber-600 to-lime-600 px-6 py-12 text-white">
        <h1 className="text-3xl font-extrabold sm:text-4xl">GG Tiffin Service</h1>
        <p className="mt-2 max-w-lg text-white/90">
          Ghar-jaisa khana, delivered daily. Subscribe weekly or monthly, or just order a single
          meal whenever you like.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/tiffin/subscribe" className="btn bg-white text-amber-700">
            Start a subscription
          </Link>
          <Link href="/tiffin/single-meal" className="btn border border-white text-white">
            Order a single meal
          </Link>
        </div>
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">This week&rsquo;s menu</h2>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
          Veg only
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-black/40"></th>
              {DAYS.map((d) => (
                <th key={d} className="p-2 text-black/50">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.table ?? []).map((row) => (
              <tr key={row.meal}>
                <td className="p-2 font-semibold capitalize">{row.meal}</td>
                {row.days.map((dish, i) => (
                  <td key={i} className="rounded-lg bg-white p-2 text-center text-xs">
                    {dish}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/tiffin/subscriptions" className="text-sm font-semibold text-brand">
          Manage my subscriptions →
        </Link>
      </div>
    </div>
  );
}
