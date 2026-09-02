import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { serverGetOrNull } from "@/lib/serverApi";
import type { BrandResponse } from "@/lib/apiTypes";
import { BrandTheme } from "@/components/BrandTheme";
import { assetUrl } from "@/lib/format";

export const revalidate = 300;

async function load(brandId: string) {
  return serverGetOrNull<BrandResponse>(`/brands/${brandId}`, { revalidate: 300 });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brandId: string }>;
}): Promise<Metadata> {
  const { brandId } = await params;
  const data = await load(brandId);
  if (!data) return { title: "Coming soon" };
  return {
    title: `${data.brand.name} — coming soon`,
    description: data.brand.description || data.brand.tagline,
  };
}

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const data = await load(brandId);
  if (!data) notFound();
  const { brand } = data;
  if (brand.status === "live") redirect(brand.orderingModel === "tiffin" ? "/tiffin" : `/b/${brand.brandId}`);

  const logo = assetUrl(brand.logoUrl);

  return (
    <BrandTheme brand={brand} as="div">
      <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-brand text-brand-ink">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 90% at 20% 10%, rgb(var(--brand-accent) / 0.8), transparent 60%), radial-gradient(50% 80% at 100% 100%, rgb(255 255 255 / 0.25), transparent 55%)",
          }}
        />
        <div className="container-page relative flex flex-col items-start gap-6 py-20">
          <span className="chip bg-white/15 text-brand-ink">Coming soon · Patna</span>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-20 w-20 rounded-2xl ring-4 ring-white/20" />
          )}
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            {brand.name}
          </h1>
          <p className="max-w-xl text-lg text-brand-ink/85">{brand.description || brand.tagline}</p>
          <p className="text-sm text-brand-ink/70">
            This kitchen isn&rsquo;t taking orders yet — we&rsquo;ll light it up here the moment it
            opens.
          </p>
          <Link href="/#brands" className="btn-dark btn-lg">
            Back to the kitchens that are open
          </Link>
        </div>
      </section>
    </BrandTheme>
  );
}
