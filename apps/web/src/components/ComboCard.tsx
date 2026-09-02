"use client";

import { useState } from "react";
import type { Combo, MenuItem } from "@lickyeat/shared-types";
import { rupees } from "@/lib/format";
import { useCart } from "@/state/cartStore";

type ComboWithLive = Combo & { livePrice: number; constituents: MenuItem[] };

export function ComboCard({ combo }: { combo: ComboWithLive }) {
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  function addCurated() {
    add({
      brandId: combo.brandId,
      kind: "combo",
      refId: combo.id,
      name: combo.name,
      imageUrl: combo.imageUrl,
      estUnitPrice: combo.livePrice,
      customization: { addOns: [], comboItemIds: [] },
    });
  }

  function addChoice() {
    if (picked.length !== combo.chooseCount) return;
    add({
      brandId: combo.brandId,
      kind: "combo",
      refId: combo.id,
      name: combo.name,
      imageUrl: combo.imageUrl,
      estUnitPrice: combo.livePrice,
      customization: { addOns: [], comboItemIds: picked },
    });
    setOpen(false);
    setPicked([]);
  }

  return (
    <>
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">{combo.name}</h3>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
            15% off
          </span>
        </div>
        <p className="mt-1 text-sm text-black/55">{combo.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold">~ {rupees(combo.livePrice)}</span>
          {combo.type === "curated" ? (
            <button className="btn-primary !py-1.5" onClick={addCurated}>
              Add
            </button>
          ) : (
            <button className="btn-ghost !py-1.5" onClick={() => setOpen(true)}>
              Pick {combo.chooseCount}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{combo.name}</h3>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <p className="mt-1 text-sm text-black/50">
              Choose {combo.chooseCount} ({picked.length} selected)
            </p>
            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {combo.constituents.map((c) => {
                const on = picked.includes(c.id);
                const full = picked.length >= (combo.chooseCount ?? 0);
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      setPicked((cur) =>
                        on ? cur.filter((x) => x !== c.id) : full ? cur : [...cur, c.id],
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                      on ? "border-brand bg-brand/10" : "border-black/10"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-black/40">{rupees(c.price)}</span>
                  </button>
                );
              })}
            </div>
            <button
              className="btn-primary mt-4 w-full"
              disabled={picked.length !== combo.chooseCount}
              onClick={addChoice}
            >
              Add combo · ~ {rupees(combo.livePrice)}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
