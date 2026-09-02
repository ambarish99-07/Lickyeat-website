"use client";

import { useState } from "react";
import type { MenuAddOnPrice, MenuItem } from "@lickyeat/shared-types";
import { rupees } from "@/lib/format";
import { useCart } from "@/state/cartStore";
import { CustomizeModal } from "./CustomizeModal";

export function MenuItemCard({
  item,
  addOnCatalog,
}: {
  item: MenuItem;
  addOnCatalog: MenuAddOnPrice[];
}) {
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);
  const needsCustomization =
    item.supportsSugar ||
    item.supportsIce ||
    item.sizeVariants.length > 0 ||
    item.allowedAddOns.length > 0;

  const salePrice =
    item.salePercent > 0 ? Math.round(item.price * (1 - item.salePercent / 100)) : item.price;

  function quickAdd() {
    add({
      brandId: item.brandId,
      kind: "item",
      refId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      estUnitPrice: salePrice,
      customization: { addOns: [], comboItemIds: [] },
    });
  }

  return (
    <>
      <div className={`card flex flex-col p-4 ${!item.isAvailable ? "opacity-50" : ""}`}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={`font-semibold ${!item.isAvailable ? "line-through" : ""}`}>{item.name}</h3>
          <div className="shrink-0 text-right">
            {item.salePercent > 0 && (
              <span className="mr-1 text-xs text-black/40 line-through">{rupees(item.price)}</span>
            )}
            <span className="font-semibold">{rupees(salePrice)}</span>
          </div>
        </div>
        {item.portionSize && <p className="text-xs text-black/40">{item.portionSize}</p>}
        <p className="mt-1 flex-1 text-sm text-black/55">{item.description}</p>
        <div className="mt-3 flex items-center gap-2">
          {item.tags.includes("bestseller") && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
              Bestseller
            </span>
          )}
          <div className="ml-auto">
            {!item.isAvailable ? (
              <span className="text-xs font-semibold text-black/40">Out of stock</span>
            ) : needsCustomization ? (
              <button className="btn-ghost !py-1.5" onClick={() => setOpen(true)}>
                Customize
              </button>
            ) : (
              <button className="btn-primary !py-1.5" onClick={quickAdd}>
                Add
              </button>
            )}
          </div>
        </div>
      </div>
      {open && (
        <CustomizeModal item={item} addOnCatalog={addOnCatalog} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
