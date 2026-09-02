"use client";

import useSWR from "swr";
import type { Brand, BrandStoreSettings, StoreSettings } from "@lickyeat/shared-types";
import { api } from "@/lib/api";

export default function AdminStore() {
  const { data: lky, mutate: mutateLky } = useSWR<{ settings: StoreSettings }>(
    "/store-settings/lickyeat",
  );
  const { data: brandData } = useSWR<{ brands: Brand[] }>("/brands");
  const catalogBrands = (brandData?.brands ?? []).filter((b) => b.orderingModel === "catalog");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Store status</h1>

      <section className="card p-5">
        <h2 className="font-bold">Lickyeat-wide</h2>
        <p className="text-sm text-black/50">
          Master switch. If this is off, every catalog brand is closed regardless of its own setting.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lky?.settings.manualOpen ?? true}
            onChange={async (e) => {
              await api.patch("/store-settings/lickyeat", { manualOpen: e.target.checked });
              mutateLky();
            }}
          />
          Accepting orders
        </label>
      </section>

      {catalogBrands.map((b) => (
        <BrandStore key={b.brandId} brand={b} />
      ))}
    </div>
  );
}

function BrandStore({ brand }: { brand: Brand }) {
  const { data, mutate } = useSWR<{ settings: BrandStoreSettings }>(
    `/store-settings/brand/${brand.brandId}`,
  );
  return (
    <section className="card p-5">
      <h2 className="font-bold">{brand.name}</h2>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={data?.settings.manualOpen ?? true}
          onChange={async (e) => {
            await api.patch(`/store-settings/brand/${brand.brandId}`, {
              manualOpen: e.target.checked,
            });
            mutate();
          }}
        />
        This brand is open
      </label>
    </section>
  );
}
