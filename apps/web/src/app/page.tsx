"use client";

import Link from "next/link";
import useSWR from "swr";
import type { Brand } from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";

export default function HomePage() {
  const { data } = useSWR<{ brands: Brand[] }>("/brands");
  const { user } = useAuth();
  const brands = data?.brands ?? [];
  const live = brands.filter((b) => b.status === "live");
  const comingSoon = brands.filter((b) => b.status === "coming-soon");

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-brand to-brand-light px-6 py-14 text-center text-white">
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Three kitchens. One Lickyeat.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Thick shakes, craft mocktails and ghar-jaisa tiffin — delivered fast across Patna.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Order now</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((b) => (
            <BrandCard key={b.brandId} brand={b} />
          ))}
          {live.length === 0 && <SkeletonRow />}
        </div>
      </section>

      {user && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Recommended for you</h2>
          <Recommendations />
        </section>
      )}

      {comingSoon.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Coming soon</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoon.map((b) => (
              <div
                key={b.brandId}
                className="card flex flex-col justify-between p-5 opacity-80"
                style={{ borderColor: b.accentColor }}
              >
                <div>
                  <h3 className="text-lg font-bold" style={{ color: b.primaryColor }}>
                    {b.name}
                  </h3>
                  <p className="text-sm text-black/55">{b.tagline}</p>
                </div>
                <span className="mt-4 inline-block w-fit rounded-full bg-black/5 px-3 py-1 text-xs font-semibold">
                  Launching soon
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  const href = brand.orderingModel === "tiffin" ? "/tiffin" : `/b/${brand.brandId}`;
  return (
    <Link
      href={href}
      className="card group flex flex-col justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderTopColor: brand.primaryColor, borderTopWidth: 4 }}
    >
      <div>
        <h3 className="text-lg font-bold" style={{ color: brand.primaryColor }}>
          {brand.name}
        </h3>
        <p className="mt-1 text-sm text-black/55">{brand.tagline}</p>
      </div>
      <span className="mt-4 text-sm font-semibold text-brand group-hover:underline">
        {brand.orderingModel === "tiffin" ? "See tiffin plans →" : "Browse menu →"}
      </span>
    </Link>
  );
}

function Recommendations() {
  const { data } = useSWR<{ recommendations: Array<{ itemId: string; name: string; brandId: string }> }>(
    "/account/recommendations",
  );
  if (!data) return <SkeletonRow />;
  if (data.recommendations.length === 0)
    return <p className="text-sm text-black/50">Place an order and we’ll tailor picks for you.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {data.recommendations.map((r) => (
        <Link
          key={r.itemId}
          href={`/b/${r.brandId}`}
          className="rounded-full border border-black/15 bg-white px-4 py-2 text-sm hover:border-brand"
        >
          {r.name}
        </Link>
      ))}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="col-span-full grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-2xl bg-black/5" />
      ))}
    </div>
  );
}
