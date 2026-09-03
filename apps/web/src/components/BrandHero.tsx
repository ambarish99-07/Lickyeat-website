import type { Brand } from "@lickyeat/shared-types";
import { assetUrl } from "@/lib/format";

/**
 * Brand-owned hero. The brand's palette comes from the surrounding <BrandTheme>
 * (CSS vars) and the logo / hero image from its record — nothing hardcoded.
 *
 * The photo (authored 1600×600 / 8:3, and already carrying the brand mark) runs
 * as a banner; the name + tagline sit below it on the plain page background with
 * the brand colour as the accent, so the block reads like the rest of the site
 * rather than a saturated slab. With no photo, a soft brand-tinted panel.
 */
export function BrandHero({ brand }: { brand: Brand }) {
  const logo = assetUrl(brand.logoUrl);
  const hero = assetUrl(brand.heroImageUrl);

  return (
    <section className="border-b border-line">
      {hero && (
        <div className="mx-auto max-w-[1600px]">
          {/* object-cover at 8:3 keeps the band identical even if a future
              upload isn't exactly 1600×600. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt=""
            className="block w-full object-cover object-center"
            style={{ aspectRatio: "8 / 3" }}
          />
        </div>
      )}

      <div
        className={`relative overflow-hidden ${hero ? "" : "bg-brand-soft"}`}
      >
        {!hero && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(55% 90% at 12% 0%, rgb(var(--brand) / 0.14), transparent 60%)",
            }}
          />
        )}

        <div
          className={`container-page relative flex flex-col ${
            hero ? "gap-2.5 py-7 sm:py-8" : "gap-4 py-12 sm:py-16"
          }`}
        >
          <div className="flex items-center gap-4">
            {logo && !hero && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="h-14 w-14 rounded-2xl" />
            )}
            <span
              className={`chip ${hero ? "bg-brand-soft text-brand" : "bg-brand text-brand-ink"}`}
            >
              A Lickyeat kitchen
            </span>
          </div>
          <h1
            className={`max-w-2xl font-display font-extrabold text-brand ${
              hero ? "text-xl leading-tight sm:text-2xl" : "text-4xl leading-[1.05] sm:text-5xl"
            }`}
          >
            {brand.name}
          </h1>
          <p className="max-w-2xl text-charcoal sm:text-lg">
            {brand.description || brand.tagline}
          </p>
        </div>
      </div>
    </section>
  );
}
