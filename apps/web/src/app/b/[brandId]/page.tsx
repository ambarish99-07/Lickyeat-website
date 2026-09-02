"use client";

import { use } from "react";
import useSWR from "swr";
import type { Brand, Combo, MenuAddOnPrice, MenuItem } from "@lickyeat/shared-types";
import { MenuItemCard } from "@/components/MenuItemCard";
import { ComboCard } from "@/components/ComboCard";
import { StoreClosedBanner } from "@/components/StoreClosedBanner";

export default function BrandMenuPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { brandId } = use(params);
  const { data: brandData } = useSWR<{ brand: Brand }>(`/brands/${brandId}`);
  const { data: itemsData } = useSWR<{ items: MenuItem[] }>(`/menu/${brandId}/items`);
  const { data: combosData } = useSWR<{
    combos: Array<Combo & { livePrice: number; constituents: MenuItem[] }>;
  }>(`/menu/${brandId}/combos`);
  const { data: addOnData } = useSWR<{ addOns: MenuAddOnPrice[] }>("/menu/addons");

  const brand = brandData?.brand;
  const items = itemsData?.items ?? [];
  const addOnCatalog = addOnData?.addOns ?? [];

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold" style={{ color: brand?.primaryColor }}>
          {brand?.name ?? "Menu"}
        </h1>
        <p className="text-black/55">{brand?.tagline}</p>
      </div>

      <StoreClosedBanner brandId={brandId} />

      {combosData && combosData.combos.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Combos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {combosData.combos.map((c) => (
              <ComboCard key={c.id} combo={c} />
            ))}
          </div>
        </section>
      )}

      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="mb-3 text-lg font-bold">{cat}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <MenuItemCard key={item.id} item={item} addOnCatalog={addOnCatalog} />
              ))}
          </div>
        </section>
      ))}

      {items.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      )}
    </div>
  );
}
