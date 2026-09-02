"use client";

import { useState } from "react";
import useSWR from "swr";
import type { Brand, BrandStoreSettings, StoreSettings } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { toast } from "@/state/toastStore";

export default function AdminStore() {
  const { data: lky, mutate } = useSWR<{ settings: StoreSettings }>("/store-settings/lickyeat");
  const { data: brandData } = useSWR<{ brands: Brand[] }>("/brands");
  const catalogBrands = (brandData?.brands ?? []).filter((b) => b.orderingModel === "catalog");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-extrabold">Store status</h1>

      <StorePanel
        title="Lickyeat-wide"
        note="Master switch. If this is off, every catalog brand is closed regardless of its own setting."
        settings={lky?.settings}
        onToggle={async (open) => {
          await api.patch("/store-settings/lickyeat", { manualOpen: open });
          mutate();
        }}
        onAddClosure={async (c) => {
          await api.patch("/store-settings/lickyeat", {
            plannedClosures: [...(lky?.settings.plannedClosures ?? []), c],
          });
          mutate();
        }}
      />

      {catalogBrands.map((b) => (
        <BrandStorePanel key={b.brandId} brand={b} />
      ))}
    </div>
  );
}

function BrandStorePanel({ brand }: { brand: Brand }) {
  const { data, mutate } = useSWR<{ settings: BrandStoreSettings }>(
    `/store-settings/brand/${brand.brandId}`,
  );
  return (
    <StorePanel
      title={brand.name}
      settings={data?.settings}
      onToggle={async (open) => {
        await api.patch(`/store-settings/brand/${brand.brandId}`, { manualOpen: open });
        mutate();
      }}
      onAddClosure={async (c) => {
        await api.patch(`/store-settings/brand/${brand.brandId}`, {
          plannedClosures: [...(data?.settings.plannedClosures ?? []), c],
        });
        mutate();
      }}
    />
  );
}

function StorePanel({
  title,
  note,
  settings,
  onToggle,
  onAddClosure,
}: {
  title: string;
  note?: string;
  settings?: { manualOpen: boolean; plannedClosures: Array<{ startDate: string; endDate: string; reason: string }> };
  onToggle: (open: boolean) => Promise<void>;
  onAddClosure: (c: { startDate: string; endDate: string; reason: string }) => Promise<void>;
}) {
  const [c, setC] = useState({ startDate: "", endDate: "", reason: "" });

  return (
    <section className="card p-5">
      <h2 className="font-display font-bold">{title}</h2>
      {note && <p className="mt-1 text-sm text-muted">{note}</p>}

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={settings?.manualOpen ?? true}
          onChange={(e) => onToggle(e.target.checked)}
        />
        Accepting orders
      </label>

      <div className="mt-4">
        <p className="field-label">Planned closures</p>
        <div className="space-y-1">
          {(settings?.plannedClosures ?? []).map((pc, i) => (
            <div key={i} className="rounded-lg border border-line px-3 py-1.5 text-sm">
              {formatDate(pc.startDate)} – {formatDate(pc.endDate)}
              {pc.reason && ` · ${pc.reason}`}
            </div>
          ))}
          {(settings?.plannedClosures ?? []).length === 0 && (
            <p className="text-xs text-muted">None declared.</p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input type="date" className="field !w-40" value={c.startDate} onChange={(e) => setC({ ...c, startDate: e.target.value })} />
          <input type="date" className="field !w-40" value={c.endDate} onChange={(e) => setC({ ...c, endDate: e.target.value })} />
          <input className="field !w-48" placeholder="Reason" value={c.reason} onChange={(e) => setC({ ...c, reason: e.target.value })} />
          <button
            className="btn-ghost btn-sm"
            disabled={!c.startDate || !c.endDate}
            onClick={async () => {
              await onAddClosure(c);
              setC({ startDate: "", endDate: "", reason: "" });
              toast("Closure declared", { tone: "success" });
            }}
          >
            Declare
          </button>
        </div>
      </div>
    </section>
  );
}
