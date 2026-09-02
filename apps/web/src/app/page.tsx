import Link from "next/link";
import type { Metadata } from "next";
import { serverGet } from "@/lib/serverApi";
import type { BrandsResponse } from "@/lib/apiTypes";
import { BrandShowcaseCard } from "@/components/BrandShowcaseCard";
import { HomeRecommendations } from "@/components/HomeRecommendations";

export const metadata: Metadata = {
  description:
    "One Lickyeat, many kitchens. Order thick shakes, zero-proof cocktails and home-style tiffin — delivered across Patna.",
};

export const revalidate = 120;

export default async function HomePage() {
  let brands: BrandsResponse["brands"] = [];
  try {
    ({ brands } = await serverGet<BrandsResponse>("/brands", { revalidate: 120 }));
  } catch {
    // API unreachable at build/render time — render the shell; ISR will fill in.
  }
  const live = brands.filter((b) => b.status === "live").sort((a, b) => a.sortOrder - b.sortOrder);
  const comingSoon = brands.filter((b) => b.status === "coming-soon");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-sand/50 bg-grain">
        <div className="container-page relative grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="eyebrow">Patna · quick delivery</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              One Lickyeat.
              <br />
              <span className="text-brand">Many kitchens.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-charcoal">
              Thick shakes, cocktail-grade mocktails and proper ghar-ka-khana tiffin — each its own
              brand, all in one order flow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#brands" className="btn-primary btn-lg">
                Order now
              </Link>
              <Link href="/tiffin" className="btn-ghost btn-lg">
                Explore GG Tiffin
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {live.slice(0, 4).map((b, i) => (
              <div
                key={b.brandId}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <BrandShowcaseCard brand={b} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section id="brands" className="container-page py-16">
        <p className="eyebrow">The brands</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold">Pick a kitchen</h2>
        <p className="mt-2 max-w-lg text-muted">
          Each brand has its own menu, identity and pace. Cart and checkout are shared — GG Tiffin
          runs on its own subscription flow.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {brands.length === 0 && (
            <p className="text-sm text-muted">Loading kitchens…</p>
          )}
          {live.map((b) => (
            <BrandShowcaseCard key={b.brandId} brand={b} />
          ))}
          {comingSoon.map((b) => (
            <BrandShowcaseCard key={b.brandId} brand={b} />
          ))}
        </div>
      </section>

      <HomeRecommendations />

      {/* How it works */}
      <section className="border-y border-line bg-sand/40">
        <div className="container-page grid gap-8 py-14 sm:grid-cols-3">
          {[
            ["Pick a kitchen", "Browse a brand's full menu — shakes, mocktails, or a tiffin plan."],
            ["Customise & add", "Sugar, ice, size, add-ons — all optional, all per item. Combos too."],
            ["Track to your door", "Live status, your rider's number, and a map. Cancel by policy if plans change."],
          ].map(([t, d], i) => (
            <div key={t}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-ink font-display font-extrabold">
                {i + 1}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Premium strip */}
      <section className="container-page py-16">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-ink px-7 py-10 text-cream sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow text-cream/50">Lickyeat Premium</p>
            <h3 className="mt-1 font-display text-2xl font-extrabold">
              Free delivery on everything, for 60 days
            </h3>
            <p className="mt-1 text-sm text-cream/70">
              One membership across every brand. No minimum order.
            </p>
          </div>
          <Link href="/premium" className="btn-primary btn-lg shrink-0">
            See Premium
          </Link>
        </div>
      </section>
    </div>
  );
}
