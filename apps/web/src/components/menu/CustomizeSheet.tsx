"use client";

import { useMemo, useState } from "react";
import type { MenuAddOnPrice, MenuItem } from "@lickyeat/shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Stepper, Price, cn } from "@/components/ui/misc";
import { rupees } from "@/lib/format";
import { useCart, type CartCustomization } from "@/state/cartStore";
import { toast } from "@/state/toastStore";

const LEVELS = ["none", "less", "normal", "extra"] as const;

export function CustomizeSheet({
  item,
  addOnCatalog,
  open,
  onClose,
}: {
  item: MenuItem;
  addOnCatalog: MenuAddOnPrice[];
  open: boolean;
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);

  const sizes = useMemo(
    () => [
      { label: item.portionSize || "Regular", price: item.price, isAvailable: true, isDefault: true },
      ...item.sizeVariants.map((v) => ({ ...v, isDefault: false })),
    ],
    [item],
  );
  const firstAvailable = sizes.find((s) => s.isAvailable) ?? sizes[0]!;

  const [sizeLabel, setSizeLabel] = useState(firstAvailable.label);
  const [sugar, setSugar] = useState<CartCustomization["sugar"]>(
    item.supportsSugar ? "normal" : undefined,
  );
  const [ice, setIce] = useState<CartCustomization["ice"]>(item.supportsIce ? "normal" : undefined);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [qty, setQty] = useState(1);

  const allowed = useMemo(
    () =>
      item.allowedAddOns
        .map((n) => addOnCatalog.find((a) => a.name === n))
        .filter((a): a is MenuAddOnPrice => Boolean(a)),
    [item.allowedAddOns, addOnCatalog],
  );

  const size = sizes.find((s) => s.label === sizeLabel) ?? firstAvailable;
  const addOnTotal = addOns.reduce(
    (s, n) => s + (allowed.find((a) => a.name === n)?.price ?? 0),
    0,
  );
  const saleUnit =
    item.salePercent > 0 ? Math.round(size.price * (1 - item.salePercent / 100)) : size.price;
  const unit = saleUnit + addOnTotal;

  function submit() {
    add({
      brandId: item.brandId,
      kind: "item",
      refId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      unitBasePrice: size.price,
      salePercent: item.salePercent,
      unitAddOnsPrice: addOnTotal,
      quantity: qty,
      customization: {
        sugar,
        ice,
        selectedSizeLabel: size.isDefault ? undefined : size.label,
        addOns,
        comboItemIds: [],
      },
    });
    toast(`Added ${qty} × ${item.name}`, { tone: "success", href: "/cart", hrefLabel: "View cart" });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.name}
      footer={
        <div className="flex items-center justify-between gap-4">
          <Stepper value={qty} onChange={setQty} />
          <Button onClick={submit} className="flex-1">
            Add · {rupees(unit * qty)}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">{item.description}</p>

      {sizes.length > 1 && (
        <Group label="Size">
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <Pill
                key={s.label}
                active={sizeLabel === s.label}
                disabled={!s.isAvailable}
                onClick={() => setSizeLabel(s.label)}
              >
                {s.label} · {rupees(s.price)}
                {!s.isAvailable && " · sold out"}
              </Pill>
            ))}
          </div>
        </Group>
      )}

      {item.supportsSugar && (
        <Group label="Sugar">
          <Levels value={sugar} onChange={setSugar} />
        </Group>
      )}
      {item.supportsIce && (
        <Group label="Ice">
          <Levels value={ice} onChange={setIce} />
        </Group>
      )}

      {allowed.length > 0 && (
        <Group label="Add-ons">
          <div className="space-y-1.5">
            {allowed.map((a) => {
              const on = addOns.includes(a.name);
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={!a.isAvailable}
                  onClick={() =>
                    setAddOns((cur) =>
                      cur.includes(a.name) ? cur.filter((x) => x !== a.name) : [...cur, a.name],
                    )
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition",
                    on ? "border-brand bg-brand-soft" : "border-ink/12 hover:border-ink/25",
                    !a.isAvailable && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className={cn(!a.isAvailable && "line-through")}>
                    {a.name}
                    {!a.isAvailable && " — out of stock"}
                  </span>
                  <span className="flex items-center gap-2 text-muted">
                    +{rupees(a.price)}
                    <span
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded-full border text-[10px]",
                        on ? "border-brand bg-brand text-brand-ink" : "border-ink/25",
                      )}
                    >
                      {on ? "✓" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Group>
      )}

      <p className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">Item total</span>
        <Price value={unit} original={item.salePercent > 0 ? item.price + addOnTotal : undefined} />
      </p>
    </Modal>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="field-label">{label}</p>
      {children}
    </div>
  );
}

function Pill({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active ? "border-brand bg-brand-soft text-brand" : "border-ink/15 hover:border-ink/30",
        disabled && "cursor-not-allowed text-muted line-through opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function Levels({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: "none" | "less" | "normal" | "extra") => void;
}) {
  return (
    <div className="flex gap-2">
      {LEVELS.map((l) => (
        <Pill key={l} active={value === l} onClick={() => onChange(l)}>
          <span className="capitalize">{l}</span>
        </Pill>
      ))}
    </div>
  );
}
