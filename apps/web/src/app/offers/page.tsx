import type { Metadata } from "next";
import { serverGet } from "@/lib/serverApi";
import type { BrandsResponse } from "@/lib/apiTypes";
import { rupees } from "@/lib/format";
import { CopyCode } from "@/components/CopyCode";

export const metadata: Metadata = {
  title: "Offers & coupons",
  description:
    "Every live Lickyeat coupon in one place — welcome offers, flat discounts and Buy 1 Get 1, across The Blenders Club, The Alchemy Tails, GG Tiffin and The Biryani Lane.",
};

export const revalidate = 120;

interface Offer {
  code: string;
  kind: "percent" | "flat" | "bogo";
  minOrderAmount: number;
  brandId: string | null;
  oncePerCustomer: boolean;
  summary: string;
}

export default async function OffersPage() {
  let offers: Offer[] = [];
  let brandName: Record<string, string> = {};
  try {
    const [{ coupons }, { brands }] = await Promise.all([
      serverGet<{ coupons: Offer[] }>("/coupons/available", { revalidate: 120 }),
      serverGet<BrandsResponse>("/brands", { revalidate: 300 }),
    ]);
    offers = coupons;
    brandName = Object.fromEntries(brands.map((b) => [b.brandId, b.name]));
  } catch {
    /* shell — ISR fills in */
  }

  const anyBrand = offers.filter((o) => !o.brandId);
  const byBrand = offers.filter((o) => o.brandId);

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Offers</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Coupons &amp; offers</h1>
      <p className="mt-2 max-w-lg text-muted">
        Tap a code to copy it, then paste it at checkout. Discounts are applied server-side — the
        cart shows the exact amount.
      </p>

      {offers.length === 0 && (
        <p className="mt-8 text-sm text-muted">No offers running right now — check back soon.</p>
      )}

      {anyBrand.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-extrabold">Use on any kitchen</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {anyBrand.map((o) => (
              <OfferCard key={o.code} offer={o} brandName={brandName} />
            ))}
          </div>
        </section>
      )}

      {byBrand.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-extrabold">Kitchen-specific</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {byBrand.map((o) => (
              <OfferCard key={o.code} offer={o} brandName={brandName} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OfferCard({ offer, brandName }: { offer: Offer; brandName: Record<string, string> }) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <CopyCode code={offer.code} />
        {offer.oncePerCustomer && (
          <span className="chip bg-ink/8 text-charcoal">once per account</span>
        )}
      </div>
      <p className="text-sm text-charcoal">{offer.summary}</p>
      <p className="text-xs text-muted">
        {offer.brandId ? `${brandName[offer.brandId] ?? offer.brandId} only` : "Any Lickyeat kitchen"}
        {offer.minOrderAmount > 0 && ` · min. ${rupees(offer.minOrderAmount)}`}
      </p>
    </div>
  );
}
