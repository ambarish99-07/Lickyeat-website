"use client";

import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/state/authStore";

interface Rec {
  itemId: string;
  name: string;
  brandId: string;
}

export function HomeRecommendations() {
  const { user } = useAuth();
  const { data } = useSWR<{ recommendations: Rec[] }>(
    user ? "/account/recommendations" : null,
  );

  if (!user || !data || data.recommendations.length === 0) return null;

  return (
    <section className="container-page pb-4">
      <p className="eyebrow">Because you ordered before</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold">Picked for you</h2>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {data.recommendations.map((r) => (
          <Link
            key={r.itemId}
            href={`/b/${r.brandId}`}
            className="rounded-full border border-ink/15 bg-surface px-4 py-2 text-sm font-medium transition hover:border-brand hover:text-brand"
          >
            {r.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
