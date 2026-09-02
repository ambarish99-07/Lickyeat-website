import Link from "next/link";
import type { Brand } from "@lickyeat/shared-types";
import { BrandTheme } from "./BrandTheme";
import { assetUrl } from "@/lib/format";

export function BrandShowcaseCard({ brand }: { brand: Brand }) {
  const live = brand.status === "live";
  const href = live
    ? brand.orderingModel === "tiffin"
      ? "/tiffin"
      : `/b/${brand.brandId}`
    : `/coming-soon/${brand.brandId}`;
  const logo = assetUrl(brand.logoUrl);

  return (
    <BrandTheme brand={brand} className="group">
      <Link
        href={href}
        className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand opacity-[0.12] blur-2xl transition group-hover:opacity-20"
        />
        <div className="flex items-start justify-between gap-3">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-14 w-14 rounded-2xl" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-brand-ink font-display text-xl font-extrabold">
              {brand.name[0]}
            </span>
          )}
          {!live && (
            <span className="chip bg-ink/8 text-charcoal">Coming soon</span>
          )}
        </div>

        <div className="mt-6">
          <h3 className="font-display text-xl font-extrabold">{brand.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{brand.tagline}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
            {live
              ? brand.orderingModel === "tiffin"
                ? "See tiffin plans"
                : "Browse the menu"
              : "Take a look"}
            <span aria-hidden className="transition group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </Link>
    </BrandTheme>
  );
}
