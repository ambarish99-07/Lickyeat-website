"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Brand, MenuItem } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { rupees } from "@/lib/format";

export default function AdminCatalog() {
  const { data: brandData, mutate: mutateBrands } = useSWR<{ brands: Brand[] }>("/brands");
  const brands = brandData?.brands ?? [];
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const brandId = activeBrand ?? brands.find((b) => b.orderingModel === "catalog")?.brandId ?? null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Menu &amp; brands</h1>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">Brands</h2>
        <div className="space-y-2">
          {brands.map((b) => (
            <div key={b.brandId} className="flex items-center gap-3 text-sm">
              <span className="w-40 font-medium">{b.name}</span>
              <select
                className="input !w-auto !py-1"
                value={b.status}
                onChange={async (e) => {
                  await api.patch(`/brands/${b.brandId}`, { status: e.target.value });
                  mutateBrands();
                }}
              >
                <option value="live">live</option>
                <option value="coming-soon">coming-soon</option>
              </select>
              <span className="text-black/40">{b.orderingModel}</span>
            </div>
          ))}
        </div>
        <AddBrand onAdded={mutateBrands} />
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-bold">Menu items</h2>
          <select
            className="input !w-auto !py-1"
            value={brandId ?? ""}
            onChange={(e) => setActiveBrand(e.target.value)}
          >
            {brands
              .filter((b) => b.orderingModel === "catalog")
              .map((b) => (
                <option key={b.brandId} value={b.brandId}>
                  {b.name}
                </option>
              ))}
          </select>
        </div>
        {brandId && <MenuItems brandId={brandId} />}
      </section>
    </div>
  );
}

function MenuItems({ brandId }: { brandId: string }) {
  const { data, mutate } = useSWR<{ items: MenuItem[] }>(`/menu/${brandId}/items?all=1`);
  const items = data?.items ?? [];

  async function toggle(item: MenuItem) {
    await api.patch(`/menu/items/${item.id}`, { isAvailable: !item.isAvailable });
    mutate();
  }
  async function setPrice(item: MenuItem, price: number) {
    await api.patch(`/menu/items/${item.id}`, { price });
    mutate();
  }

  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-3 text-sm">
          <span className={`w-52 ${i.isAvailable ? "" : "text-black/40 line-through"}`}>{i.name}</span>
          <input
            type="number"
            defaultValue={i.price}
            className="input !w-24 !py-1"
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v && v !== i.price) setPrice(i, v);
            }}
          />
          <span className="text-black/40">{rupees(i.price)}</span>
          <button className="btn-ghost !py-1 !text-xs" onClick={() => toggle(i)}>
            {i.isAvailable ? "Mark out of stock" : "Mark available"}
          </button>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-black/50">No items.</p>}
    </div>
  );
}

function AddBrand({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ brandId: "", name: "", tagline: "" });
  if (!open)
    return (
      <button className="btn-ghost mt-3 !py-1.5" onClick={() => setOpen(true)}>
        + Add brand
      </button>
    );
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <input
        className="input !w-40"
        placeholder="brand-id"
        value={form.brandId}
        onChange={(e) => setForm({ ...form, brandId: e.target.value })}
      />
      <input
        className="input !w-48"
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        className="input !w-56"
        placeholder="Tagline"
        value={form.tagline}
        onChange={(e) => setForm({ ...form, tagline: e.target.value })}
      />
      <button
        className="btn-primary !py-1.5"
        onClick={async () => {
          await api.post("/brands", { ...form, status: "coming-soon" });
          setOpen(false);
          setForm({ brandId: "", name: "", tagline: "" });
          onAdded();
        }}
      >
        Create
      </button>
    </div>
  );
}
