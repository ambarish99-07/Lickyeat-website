"use client";

import { useMemo, useState } from "react";
import type { IceLevel, MenuItem, SugarLevel } from "@lickyeat/shared-types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Stepper, Price, cn } from "@/components/ui/misc";
import { rupees, assetUrl } from "@/lib/format";
import { useCart, type CartCustomization } from "@/state/cartStore";
import { toast } from "@/state/toastStore";

const LEVELS = ["less", "regular", "extra"] as const;

export function CustomizeSheet({
  item,
  open,
  onClose,
}: {
  item: MenuItem;
  open: boolean;
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);
  const hasSugarIce = item.hasSugarIceCustomization ?? true;

  const sizes = useMemo(
    () => [
      { label: item.portionSize || "Regular", price: item.price, isAvailable: true, isDefault: true },
      ...item.sizeVariants.map((v) => ({ ...v, isDefault: false })),
    ],
    [item],
  );
  const firstAvailable = sizes.find((s) => s.isAvailable) ?? sizes[0]!;

  const [sizeLabel, setSizeLabel] = useState(firstAvailable.label);
  const [sugar, setSugar] = useState<SugarLevel>("regular");
  const [ice, setIce] = useState<IceLevel>("regular");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [qty, setQty] = useState(1);

  const allowed = item.addOns ?? [];
  const size = sizes.find((s) => s.label === sizeLabel) ?? firstAvailable;
  const addOnTotal = addOns.reduce(
    (s, n) => s + (allowed.find((a) => a.name === n)?.price ?? 0),
    0,
  );
  const salePct = item.salePercent ?? 0;
  const saleUnit = salePct > 0 ? Math.round(size.price * (1 - salePct / 100)) : size.price;
  const unit = saleUnit + addOnTotal;
  const img = assetUrl(item.imageUrl);

  function submit() {
    add({
      brandId: item.brandId,
      kind: "item",
      refId: item.id,
      signatureName: item.signatureName,
      commonName: item.commonName,
      imageUrl: item.imageUrl,
      category: item.category,
      unitBasePrice: size.price,
      salePercent: salePct,
      unitAddOnsPrice: addOnTotal,
      quantity: qty,
      customization: {
        sugar: hasSugarIce ? sugar : undefined,
        ice: hasSugarIce ? ice : undefined,
        selectedSizeLabel: size.isDefault ? undefined : size.label,
        addOns,
        comboItemIds: [],
        comment: comment.trim() || undefined,
      },
    });
    toast(`Added ${qty} × ${item.signatureName}`, { tone: "success", href: "/cart", hrefLabel: "View cart" });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item.signatureName}
      footer={
        <div className="flex items-center justify-between gap-4">
          <Stepper value={qty} onChange={setQty} max={20} />
          <Button onClick={submit} className="flex-1">
            Add · {rupees(unit * qty)}
          </Button>
        </div>
      }
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />
      )}
      <p className="text-xs font-semibold text-muted">{item.commonName}</p>
      <p className="mt-1 text-sm text-muted">{item.description}</p>

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

      {hasSugarIce && (
        <>
          <Group label="Sugar">
            <Levels value={sugar} onChange={setSugar} />
          </Group>
          <Group label="Ice">
            <Levels value={ice} onChange={setIce} />
          </Group>
        </>
      )}

      {allowed.length > 0 && (
        <Group label="Add-ons">
          <div className="space-y-1.5">
            {allowed.map((a) => {
              const on = addOns.includes(a.name);
              return (
                <button
                  key={a.name}
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

      <Group label="Special instructions">
        <input
          className="field"
          placeholder="e.g. no straw, extra cold"
          maxLength={200}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Group>

      <p className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted">Item total</span>
        <Price value={unit} original={salePct > 0 ? item.price + addOnTotal : undefined} />
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

function Levels<T extends string>({
  value,
  onChange,
}: {
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {LEVELS.map((l) => (
        <Pill key={l} active={value === l} onClick={() => onChange(l as T)}>
          <span className="capitalize">{l}</span>
        </Pill>
      ))}
    </div>
  );
}
