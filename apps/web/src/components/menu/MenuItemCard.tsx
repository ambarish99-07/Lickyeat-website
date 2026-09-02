"use client";

import { useState } from "react";
import type { MenuAddOnPrice, MenuItem } from "@lickyeat/shared-types";
import { Price, cn } from "@/components/ui/misc";
import { assetUrl } from "@/lib/format";
import { useCart } from "@/state/cartStore";
import { toast } from "@/state/toastStore";
import { CustomizeSheet } from "./CustomizeSheet";

export function MenuItemCard({
  item,
  addOnCatalog,
}: {
  item: MenuItem;
  addOnCatalog: MenuAddOnPrice[];
}) {
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);

  const customisable =
    item.supportsSugar ||
    item.supportsIce ||
    item.sizeVariants.length > 0 ||
    item.allowedAddOns.length > 0;
  const salePrice =
    item.salePercent > 0 ? Math.round(item.price * (1 - item.salePercent / 100)) : item.price;
  const img = assetUrl(item.imageUrl);
  const sold = !item.isAvailable;

  function quickAdd() {
    add({
      brandId: item.brandId,
      kind: "item",
      refId: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      unitBasePrice: item.price,
      salePercent: item.salePercent,
      unitAddOnsPrice: 0,
      customization: { addOns: [], comboItemIds: [] },
    });
    toast(`Added ${item.name}`, { tone: "success", href: "/cart", hrefLabel: "View cart" });
  }

  return (
    <>
      <article
        className={cn(
          "card flex gap-4 p-4 transition",
          sold ? "opacity-60" : "hover:shadow-lift",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className={cn("font-display font-bold leading-snug", sold && "line-through")}>
              {item.name}
            </h3>
            {item.tags.includes("bestseller") && !sold && (
              <span className="chip bg-amber-100 text-amber-800">★</span>
            )}
          </div>
          {item.portionSize && <p className="text-xs text-muted">{item.portionSize}</p>}
          <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>

          <div className="mt-3 flex items-center gap-3">
            <Price
              value={salePrice}
              original={item.salePercent > 0 ? item.price : undefined}
              className="text-[15px]"
            />
            {sold ? (
              <span className="ml-auto text-xs font-bold uppercase tracking-wide text-muted">
                Sold out
              </span>
            ) : customisable ? (
              <button className="btn-ghost btn-sm ml-auto" onClick={() => setOpen(true)}>
                Customise
              </button>
            ) : (
              <button className="btn-primary btn-sm ml-auto" onClick={quickAdd}>
                Add
              </button>
            )}
          </div>
        </div>

        {img && (
          <div className="hidden shrink-0 sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt=""
              className={cn("h-24 w-24 rounded-xl object-cover", sold && "grayscale")}
            />
          </div>
        )}
      </article>

      {customisable && !sold && (
        <CustomizeSheet
          item={item}
          addOnCatalog={addOnCatalog}
          open={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
