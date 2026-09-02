"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Brand, MenuAddOnPrice, MenuItem } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { rupees } from "@/lib/format";
import { Badge, cn } from "@/components/ui/misc";
import { toast } from "@/state/toastStore";

export default function AdminCatalog() {
  const { data: brandData, mutate: mutateBrands } = useSWR<{ brands: Brand[] }>("/brands");
  const brands = brandData?.brands ?? [];
  const catalogBrands = brands.filter((b) => b.orderingModel === "catalog");
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const brandId = activeBrand ?? catalogBrands[0]?.brandId ?? null;

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-extrabold">Menu &amp; brands</h1>

      <section className="card p-5">
        <h2 className="mb-3 font-display font-bold">Brands</h2>
        <div className="space-y-2">
          {brands.map((b) => (
            <div key={b.brandId} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="w-44 font-medium">{b.name}</span>
              <select
                className="field !w-auto !py-1"
                value={b.status}
                onChange={async (e) => {
                  await api.patch(`/brands/${b.brandId}`, { status: e.target.value });
                  mutateBrands();
                  toast("Brand updated", { tone: "success" });
                }}
              >
                <option value="live">live</option>
                <option value="coming-soon">coming-soon</option>
              </select>
              <span className="text-muted">{b.orderingModel}</span>
              <span className="inline-flex gap-1">
                <span
                  className="h-4 w-4 rounded-full border border-line"
                  style={{ background: b.primaryColor }}
                />
                <span
                  className="h-4 w-4 rounded-full border border-line"
                  style={{ background: b.accentColor }}
                />
              </span>
            </div>
          ))}
        </div>
        <AddBrand onAdded={mutateBrands} />
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display font-bold">Menu items</h2>
          <select
            className="field !w-auto !py-1"
            value={brandId ?? ""}
            onChange={(e) => setActiveBrand(e.target.value)}
          >
            {catalogBrands.map((b) => (
              <option key={b.brandId} value={b.brandId}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        {brandId && <MenuItems brandId={brandId} />}
      </section>

      <AddOnCatalog />
    </div>
  );
}

function MenuItems({ brandId }: { brandId: string }) {
  const { data, mutate } = useSWR<{ items: MenuItem[] }>(`/menu/${brandId}/items`);
  const items = data?.items ?? [];

  async function patch(id: string, body: Record<string, unknown>) {
    await api.patch(`/menu/items/${id}`, body);
    mutate();
  }

  return (
    <div className="space-y-3">
      {items.map((i) => (
        <div key={i.id} className="rounded-xl border border-line p-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={cn("w-56 font-medium", !i.isAvailable && "text-muted line-through")}>
              {i.name}
            </span>
            <span className="text-muted">{i.category}</span>
            <label className="flex items-center gap-1.5">
              ₹
              <input
                type="number"
                defaultValue={i.price}
                className="field !w-20 !py-1"
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v && v !== i.price) patch(i.id, { price: v });
                }}
              />
            </label>
            <button
              className="btn-ghost btn-sm ml-auto"
              onClick={() => patch(i.id, { isAvailable: !i.isAvailable })}
            >
              {i.isAvailable ? "Mark sold out" : "Mark available"}
            </button>
          </div>
          {i.sizeVariants.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 pl-2">
              {i.sizeVariants.map((v, vi) => (
                <button
                  key={vi}
                  onClick={() =>
                    patch(i.id, {
                      sizeVariants: i.sizeVariants.map((x, xi) =>
                        xi === vi ? { ...x, isAvailable: !x.isAvailable } : x,
                      ),
                    })
                  }
                  className={cn(
                    "chip border",
                    v.isAvailable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-line text-muted line-through",
                  )}
                >
                  {v.label} · {rupees(v.price)}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-muted">No items.</p>}
    </div>
  );
}

function AddOnCatalog() {
  const { data, mutate } = useSWR<{ addOns: MenuAddOnPrice[] }>("/menu/addons");
  const [form, setForm] = useState({ name: "", price: 20 });

  async function patch(id: string, body: Record<string, unknown>) {
    await api.patch(`/menu/addons/${id}`, body);
    mutate();
  }

  return (
    <section className="card p-5">
      <h2 className="mb-1 font-display font-bold">Add-on catalog</h2>
      <p className="mb-3 text-xs text-muted">
        Shared across every brand. Marking one unavailable disables it everywhere it&rsquo;s offered.
      </p>
      <div className="space-y-2">
        {data?.addOns.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 text-sm">
            <span className={cn("w-52", !a.isAvailable && "text-muted line-through")}>{a.name}</span>
            <label className="flex items-center gap-1.5">
              ₹
              <input
                type="number"
                defaultValue={a.price}
                className="field !w-20 !py-1"
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v && v !== a.price) patch(a.id, { price: v });
                }}
              />
            </label>
            <button
              onClick={() => patch(a.id, { isAvailable: !a.isAvailable })}
              className={cn("chip", a.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-ink/8 text-muted")}
            >
              {a.isAvailable ? "available" : "unavailable"}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <input
          className="field !w-48"
          placeholder="New add-on"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="number"
          className="field !w-24"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
        />
        <button
          className="btn-primary btn-sm"
          onClick={async () => {
            await api.post("/menu/addons", { name: form.name, price: form.price });
            setForm({ name: "", price: 20 });
            mutate();
          }}
          disabled={!form.name.trim()}
        >
          Add
        </button>
      </div>
    </section>
  );
}

function AddBrand({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ brandId: "", name: "", tagline: "", primaryColor: "#e8552d", accentColor: "#f4a259" });
  if (!open)
    return (
      <button className="btn-ghost btn-sm mt-3" onClick={() => setOpen(true)}>
        + Add brand
      </button>
    );
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <input className="field !w-36" placeholder="brand-id" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} />
      <input className="field !w-44" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="field !w-52" placeholder="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
      <input type="color" className="h-9 w-12 rounded" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
      <input type="color" className="h-9 w-12 rounded" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
      <button
        className="btn-primary btn-sm"
        onClick={async () => {
          await api.post("/brands", { ...form, status: "coming-soon" });
          setOpen(false);
          onAdded();
          toast("Brand created", { tone: "success" });
        }}
      >
        Create
      </button>
    </div>
  );
}
