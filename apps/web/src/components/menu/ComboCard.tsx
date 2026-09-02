"use client";

import { useMemo, useState } from "react";
import { computeComboPrice } from "@lickyeat/pricing";
import type { ComboWithLive } from "@/lib/apiTypes";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Price, cn } from "@/components/ui/misc";
import { rupees } from "@/lib/format";
import { useCart } from "@/state/cartStore";
import { toast } from "@/state/toastStore";

export function ComboCard({ combo }: { combo: ComboWithLive }) {
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const sold = !combo.orderable;

  const pickedEstimate = useMemo(() => {
    if (picked.length === 0) return combo.livePrice;
    const prices = picked
      .map((id) => combo.constituents.find((c) => c.id === id)?.price ?? 0)
      .filter(Boolean);
    return computeComboPrice(prices);
  }, [picked, combo]);

  function addToCart(comboItemIds: string[], estimate: number) {
    add({
      brandId: combo.brandId,
      kind: "combo",
      refId: combo.id,
      name: combo.name,
      imageUrl: combo.imageUrl,
      category: "combo",
      unitBasePrice: estimate,
      salePercent: 0,
      unitAddOnsPrice: 0,
      customization: { addOns: [], comboItemIds },
    });
    toast(`Added ${combo.name}`, { tone: "success", href: "/cart", hrefLabel: "View cart" });
  }

  return (
    <>
      <article className={cn("card flex flex-col p-5", sold && "opacity-60")}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn("font-display font-bold", sold && "line-through")}>{combo.name}</h3>
          <span className="chip bg-emerald-100 text-emerald-800">Save 15%</span>
        </div>
        <p className="mt-1 flex-1 text-sm text-muted">{combo.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <Price value={combo.livePrice} className="text-[15px]" />
          {sold ? (
            <span className="text-xs font-bold uppercase text-muted">Unavailable</span>
          ) : combo.type === "curated" ? (
            <button
              className="btn-primary btn-sm"
              onClick={() => addToCart([], combo.livePrice)}
            >
              Add
            </button>
          ) : (
            <button className="btn-ghost btn-sm" onClick={() => setOpen(true)}>
              Choose {combo.chooseCount}
            </button>
          )}
        </div>
      </article>

      {combo.type === "choose-your-own" && (
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={combo.name}
          footer={
            <Button
              disabled={picked.length !== combo.chooseCount}
              className="w-full"
              onClick={() => {
                addToCart(picked, pickedEstimate);
                setOpen(false);
                setPicked([]);
              }}
            >
              Add combo · ~{rupees(pickedEstimate)}
            </Button>
          }
        >
          <p className="text-sm text-muted">
            Choose {combo.chooseCount} — {picked.length} selected
          </p>
          <div className="mt-3 space-y-1.5">
            {combo.constituents.map((c) => {
              const on = picked.includes(c.id);
              const full = picked.length >= (combo.chooseCount ?? 0);
              const disabled = !c.isAvailable || (full && !on);
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={!c.isAvailable}
                  onClick={() =>
                    setPicked((cur) =>
                      on ? cur.filter((x) => x !== c.id) : full ? cur : [...cur, c.id],
                    )
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition",
                    on ? "border-brand bg-brand-soft" : "border-ink/12",
                    disabled && "opacity-45",
                    !c.isAvailable && "line-through",
                  )}
                >
                  <span>{c.name}</span>
                  <span className="text-muted">{rupees(c.price)}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </>
  );
}
