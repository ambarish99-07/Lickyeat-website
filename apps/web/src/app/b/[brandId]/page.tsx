import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { serverGet, serverGetOrNull } from "@/lib/serverApi";
import type {
  BrandResponse,
  BrandStatusResponse,
  CategoriesResponse,
  CombosResponse,
  MenuItemsResponse,
} from "@/lib/apiTypes";
import { BrandTheme } from "@/components/BrandTheme";
import { BrandHero } from "@/components/BrandHero";
import { BrandMenu } from "@/components/menu/BrandMenu";

export const revalidate = 60;

async function loadBrand(brandId: string) {
  return serverGetOrNull<BrandResponse>(`/brands/${brandId}`, { revalidate: 300 });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brandId: string }>;
}): Promise<Metadata> {
  const { brandId } = await params;
  const data = await loadBrand(brandId);
  if (!data) return { title: "Menu" };
  return {
    title: data.brand.name,
    description: data.brand.description || data.brand.tagline,
    openGraph: { title: `${data.brand.name} · Lickyeat`, description: data.brand.tagline },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;
  const brandData = await loadBrand(brandId);
  if (!brandData) notFound();
  const { brand } = brandData;

  if (brand.status === "coming-soon") redirect(`/coming-soon/${brand.brandId}`);
  if (brand.orderingModel === "tiffin") redirect("/tiffin");

  const [status, items, categories, combos] = await Promise.all([
    serverGet<BrandStatusResponse>(`/brands/${brandId}/status`, { revalidate: 30 }),
    serverGet<MenuItemsResponse>(`/menu/${brandId}/items`, { revalidate: 60 }),
    serverGet<CategoriesResponse>(`/menu/${brandId}/categories`, { revalidate: 60 }),
    serverGet<CombosResponse>(`/menu/${brandId}/combos`, { revalidate: 60 }),
  ]);

  return (
    <BrandTheme brand={brand} as="div">
      <BrandHero brand={brand} />
      <BrandMenu
        brand={brand}
        items={items.items}
        categories={categories.categories}
        combos={combos.combos}
        status={status.status}
      />
    </BrandTheme>
  );
}
