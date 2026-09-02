import type { Brand } from "@lickyeat/shared-types";
import { assetUrl } from "@/lib/format";

/**
 * Brand-owned hero. Uses the brand's own palette (via the surrounding
 * <BrandTheme>) and logo/hero image from its record — nothing hardcoded. Falls
 * back to a layered colour composition when no photograph is set.
 */
export function BrandHero({ brand }: { brand: Brand }) {
  const logo = assetUrl(brand.logoUrl);
  const hero = assetUrl(brand.heroImageUrl);

  return (
    <section className="relative overflow-hidden bg-brand text-brand-ink">
      {hero && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(60% 90% at 15% 0%, rgb(var(--brand-accent) / 0.8), transparent 60%), radial-gradient(50% 80% at 100% 100%, rgb(255 255 255 / 0.25), transparent 55%)",
        }}
      />
      <div className="container-page relative flex flex-col gap-5 py-14 sm:py-20">
        <div className="flex items-center gap-4">
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              className="h-16 w-16 rounded-2xl ring-4 ring-white/20"
            />
          )}
          <span className="chip bg-white/15 text-brand-ink">A Lickyeat kitchen</span>
        </div>
        <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl">
          {brand.name}
        </h1>
        <p className="max-w-xl text-lg text-brand-ink/85">{brand.description || brand.tagline}</p>
      </div>
    </section>
  );
}
