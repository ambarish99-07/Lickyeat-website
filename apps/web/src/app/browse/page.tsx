import type { Metadata } from "next";
import Link from "next/link";
import { serverGet } from "@/lib/serverApi";
import type { BrandsResponse, BrowseCategoriesResponse } from "@/lib/apiTypes";
import { assetUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "Browse everything",
  description:
    "Shop all of Lickyeat by kind — shakes, cold coffee, mocktails, biryani, pure-veg and non-veg — across every kitchen in one place.",
};

export const revalidate = 300;

export default async function BrowsePage() {
  let categories: BrowseCategoriesResponse["categories"] = [];
  let brandCount = 0;
  try {
    const [cats, brands] = await Promise.all([
      serverGet<BrowseCategoriesResponse>("/menu/browse", { revalidate: 300 }),
      serverGet<BrandsResponse>("/brands", { revalidate: 300 }),
    ]);
    categories = cats.categories.filter((c) => c.itemCount > 0);
    brandCount = brands.brands.filter((b) => b.status === "live").length;
  } catch {
    /* shell */
  }

  return (
    <div className="container-page py-12">
      <p className="eyebrow">Browse</p>
      <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Everything Lickyeat</h1>
      <p className="mt-2 max-w-lg text-muted">
        Shop by kind across all {brandCount || "the"} kitchens — pick a category, see every option,
        then jump to that kitchen&rsquo;s menu to order.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const img = assetUrl(c.image);
          return (
            <Link
              key={c.id}
              href={`/browse/${c.id}`}
              className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-[16/10] bg-sand">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="grid h-full place-items-center font-display text-3xl text-muted">
                    {c.label[0]}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg font-extrabold">{c.label}</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {c.itemCount} item{c.itemCount === 1 ? "" : "s"}
                  {c.brandCount > 1 ? ` · ${c.brandCount} kitchens` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {categories.length === 0 && (
        <p className="mt-8 text-sm text-muted">Loading the catalogue…</p>
      )}
    </div>
  );
}
