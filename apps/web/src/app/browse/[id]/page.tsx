import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serverGetOrNull, serverGet } from "@/lib/serverApi";
import type { BrandsResponse, BrowseCategoryItemsResponse } from "@/lib/apiTypes";
import { assetUrl, rupees } from "@/lib/format";
import { DietDot } from "@/components/menu/DietDot";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await serverGetOrNull<BrowseCategoryItemsResponse>(`/menu/browse/${id}`);
  return { title: data ? `${data.label} — browse` : "Browse" };
}

export default async function BrowseCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await serverGetOrNull<BrowseCategoryItemsResponse>(`/menu/browse/${id}`, {
    revalidate: 120,
  });
  if (!data) notFound();

  let brandName: Record<string, string> = {};
  try {
    const { brands } = await serverGet<BrandsResponse>("/brands", { revalidate: 300 });
    brandName = Object.fromEntries(brands.map((b) => [b.brandId, b.name]));
  } catch {
    /* names fall back to ids */
  }

  const byBrand = new Map<string, typeof data.items>();
  for (const item of data.items) {
    const list = byBrand.get(item.brandId) ?? [];
    list.push(item);
    byBrand.set(item.brandId, list);
  }

  return (
    <div className="container-page py-12">
      <Link href="/browse" className="link text-sm">
        ← All categories
      </Link>
      <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">{data.label}</h1>
      <p className="mt-1 text-muted">
        {data.items.length} across {byBrand.size} kitchen{byBrand.size === 1 ? "" : "s"}.
      </p>

      {[...byBrand.entries()].map(([brandId, items]) => (
        <section key={brandId} className="mt-9">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold">{brandName[brandId] ?? brandId}</h2>
            <Link href={`/b/${brandId}`} className="link text-sm">
              Open menu →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const img = assetUrl(item.imageUrl);
              const sold = !item.isAvailable;
              const salePrice = item.salePercent
                ? Math.round(item.price * (1 - item.salePercent / 100))
                : item.price;
              return (
                <Link
                  key={item.id}
                  href={`/b/${brandId}`}
                  className="card overflow-hidden transition hover:shadow-lift"
                >
                  <div className="aspect-[4/3] bg-sand">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        className={`h-full w-full object-cover ${sold ? "grayscale" : ""}`}
                      />
                    ) : (
                      <div className="grid h-full place-items-center font-display text-2xl text-muted">
                        {item.signatureName[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p
                      className={`flex items-center gap-1.5 font-display text-sm font-bold leading-tight ${
                        sold ? "text-muted line-through" : ""
                      }`}
                    >
                      <DietDot nonVeg={item.dietType === "non-veg"} className="shrink-0" />
                      {item.signatureName}
                    </p>
                    <p className="text-xs text-muted">{item.commonName}</p>
                    <p className="mt-1.5 text-sm font-semibold">
                      {item.salePercent ? (
                        <>
                          <span className="mr-1 font-normal text-muted line-through">
                            {rupees(item.price)}
                          </span>
                          {rupees(salePrice)}
                        </>
                      ) : (
                        rupees(item.price)
                      )}
                      {sold && <span className="ml-2 text-xs uppercase text-muted">sold out</span>}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
