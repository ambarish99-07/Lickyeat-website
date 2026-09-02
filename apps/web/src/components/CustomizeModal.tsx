"use client";

import { useMemo, useState } from "react";
import type { MenuAddOnPrice, MenuItem } from "@lickyeat/shared-types";
import { rupees } from "@/lib/format";
import { useCart, type CartCustomization } from "@/state/cartStore";

const LEVELS = ["none", "less", "normal", "extra"] as const;

export function CustomizeModal({
  item,
  addOnCatalog,
  onClose,
}: {
  item: MenuItem;
  addOnCatalog: MenuAddOnPrice[];
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);
  const sizes = [
    { label: item.portionSize || "Regular", price: item.price, isAvailable: true, isDefault: true },
    ...item.sizeVariants.map((v) => ({ ...v, isDefault: false })),
  ];
  const [sizeLabel, setSizeLabel] = useState(sizes[0]!.label);
  const [sugar, setSugar] = useState<CartCustomization["sugar"]>(
    item.supportsSugar ? "normal" : undefined,
  );
  const [ice, setIce] = useState<CartCustomization["ice"]>(item.supportsIce ? "normal" : undefined);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const allowed = useMemo(
    () => addOnCatalog.filter((a) => item.allowedAddOns.includes(a.name)),
    [addOnCatalog, item.allowedAddOns],
  );

  const chosenSize = sizes.find((s) => s.label === sizeLabel) ?? sizes[0]!;
  const addOnTotal = addOns.reduce(
    (s, n) => s + (allowed.find((a) => a.name === n)?.price ?? 0),
    0,
  );
  const saleMult = item.salePercent > 0 ? 1 - item.salePercent / 100 : 1;
  const estUnit = Math.round(chosenSize.price * saleMult) + addOnTotal;

  function toggleAddOn(name: string, available: boolean) {
    if (!available) return;
    setAddOns((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]));
  }

  function submit() {
    add({
      brandId: item.brandId,
      kind: "item",
      refId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      estUnitPrice: estUnit,
      quantity: qty,
      customization: {
        sugar,
        ice,
        selectedSizeLabel: chosenSize.isDefault ? undefined : chosenSize.label,
        addOns,
        comboItemIds: [],
      },
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="card w-full max-w-md p-5 sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{item.name}</h3>
            <p className="text-sm text-black/50">{item.description}</p>
          </div>
          <button onClick={onClose} className="text-black/40 hover:text-black">
            ✕
          </button>
        </div>

        {sizes.length > 1 && (
          <Field label="Size">
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.label}
                  disabled={!s.isAvailable}
                  onClick={() => setSizeLabel(s.label)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    sizeLabel === s.label ? "border-brand bg-brand/10" : "border-black/15"
                  } ${!s.isAvailable ? "line-through opacity-40" : ""}`}
                >
                  {s.label} · {rupees(s.price)}
                </button>
              ))}
            </div>
          </Field>
        )}

        {item.supportsSugar && (
          <Field label="Sugar">
            <LevelPicker value={sugar} onChange={setSugar} />
          </Field>
        )}
        {item.supportsIce && (
          <Field label="Ice">
            <LevelPicker value={ice} onChange={setIce} />
          </Field>
        )}

        {allowed.length > 0 && (
          <Field label="Add-ons">
            <div className="space-y-1">
              {allowed.map((a) => {
                const available = a.isAvailable;
                return (
                  <label
                    key={a.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      available ? "border-black/10" : "border-black/10 opacity-40"
                    }`}
                  >
                    <span className={available ? "" : "line-through"}>
                      {a.name} · {rupees(a.price)}
                      {!available && " (out of stock)"}
                    </span>
                    <input
                      type="checkbox"
                      disabled={!available}
                      checked={addOns.includes(a.name)}
                      onChange={() => toggleAddOn(a.name, available)}
                    />
                  </label>
                );
              })}
            </div>
          </Field>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="btn-ghost !h-9 !w-9 !p-0" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              −
            </button>
            <span className="w-6 text-center font-semibold">{qty}</span>
            <button className="btn-ghost !h-9 !w-9 !p-0" onClick={() => setQty((q) => q + 1)}>
              +
            </button>
          </div>
          <button className="btn-primary" onClick={submit}>
            Add · {rupees(estUnit * qty)}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-black/40">
          Final price is confirmed at checkout.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

function LevelPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: "none" | "less" | "normal" | "extra") => void;
}) {
  return (
    <div className="flex gap-2">
      {LEVELS.map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
            value === l ? "border-brand bg-brand/10" : "border-black/15"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
