import type { Brand } from "@lickyeat/shared-types";
import { assetUrl } from "@/lib/format";

/**
 * Brand-owned hero. Uses the brand's own palette (via the surrounding
 * <BrandTheme>) and logo/hero image from its record — nothing hardcoded.
 *
 * With a hero photograph: shown full-strength as a banner (the supplied art
 * already carries the brand mark), with the name + tagline in a brand-coloured
 * caption band beneath. With no photo: a layered colour composition.
 */
export function BrandHero({ brand }: { brand: Brand }) {
  const logo = assetUrl(brand.logoUrl);
  const hero = assetUrl(brand.heroImageUrl);

  return (
    <section className="relative overflow-hidden bg-brand text-brand-ink">
      {hero && (
        <div className="mx-auto max-w-[1600px]">
          {/* Every brand hero is authored 1600×600 (8:3); object-cover keeps the
              band identical even if a future upload isn't exactly that. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt=""
            className="block w-full object-cover object-center"
            style={{ aspectRatio: "8 / 3" }}
          />
        </div>
      )}

      {!hero && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 90% at 15% 0%, rgb(var(--brand-accent) / 0.8), transparent 60%), radial-gradient(50% 80% at 100% 100%, rgb(255 255 255 / 0.25), transparent 55%)",
          }}
        />
      )}

      <div
        className={`container-page relative flex flex-col ${
          hero ? "gap-2.5 py-7 sm:py-8" : "gap-5 py-14 sm:py-20"
        }`}
      >
        <div className="flex items-center gap-4">
          {logo && !hero && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-14 w-14 rounded-2xl ring-4 ring-white/20" />
          )}
          <span className="chip bg-white/15 text-brand-ink">A Lickyeat kitchen</span>
        </div>
        <h1
          className={`max-w-2xl font-display font-extrabold ${
            hero ? "text-xl leading-tight sm:text-2xl" : "text-4xl leading-[1.05] sm:text-5xl"
          }`}
        >
          {brand.name}
        </h1>
        <p className="max-w-2xl text-brand-ink/85 sm:text-lg">
          {brand.description || brand.tagline}
        </p>
      </div>
    </section>
  );
}
