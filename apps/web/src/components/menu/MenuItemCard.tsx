"use client";

import { useState } from "react";
import type { MenuItem } from "@lickyeat/shared-types";
import { Price, cn } from "@/components/ui/misc";
import { assetUrl } from "@/lib/format";
import { useCart } from "@/state/cartStore";
import { toast } from "@/state/toastStore";
import { CustomizeSheet } from "./CustomizeSheet";

export function MenuItemCard({ item }: { item: MenuItem }) {
  const add = useCart((s) => s.add);
  const [open, setOpen] = useState(false);

  const customisable =
    (item.hasSugarIceCustomization ?? true) ||
    item.sizeVariants.length > 0 ||
    (item.addOns?.length ?? 0) > 0;
  const salePrice = item.salePercent ? Math.round(item.price * (1 - item.salePercent / 100)) : item.price;
  const img = assetUrl(item.imageUrl);
  const sold = !item.isAvailable;

  function quickAdd() {
    add({
      brandId: item.brandId,
      kind: "item",
      refId: item.id,
      signatureName: item.signatureName,
      commonName: item.commonName,
      imageUrl: item.imageUrl,
      category: item.category,
      unitBasePrice: item.price,
      salePercent: item.salePercent ?? 0,
      unitAddOnsPrice: 0,
      customization: { addOns: [], comboItemIds: [] },
    });
    toast(`Added ${item.signatureName}`, { tone: "success", href: "/cart", hrefLabel: "View cart" });
  }

  const badges = [
    item.isStaffPick && "Staff Pick",
    item.isPopular && "Trending",
    item.isNew && "New",
  ].filter(Boolean) as string[];

  return (
    <>
      <article
        className={cn(
          "card flex overflow-hidden transition",
          sold ? "opacity-70" : "hover:shadow-lift",
        )}
      >
        <div className="relative h-auto w-28 shrink-0 bg-sand sm:w-32">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className={cn("h-full w-full object-cover", sold && "grayscale")}
            />
          ) : (
            <div className="grid h-full w-full place-items-center font-display text-2xl text-muted">
              {item.signatureName[0]}
            </div>
          )}
          {!sold && item.salePercent && (
            <span className="absolute bottom-1 left-1 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {item.salePercent}% OFF
            </span>
          )}
          {sold && (
            <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-1 text-center text-[10px] font-bold tracking-wide text-white">
              OUT OF STOCK
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-4">
          <h3 className={cn("font-display font-bold leading-tight", sold && "text-muted line-through")}>
            {item.signatureName}
          </h3>
          <p className="text-xs text-muted">{item.commonName}</p>
          {badges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span key={b} className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">
                  {b}
                </span>
              ))}
            </div>
          )}
          <p className="mt-1.5 line-clamp-2 text-[13px] text-muted">{item.description}</p>

          <div className="mt-auto flex items-center gap-3 pt-3">
            <Price value={salePrice} original={item.salePercent ? item.price : undefined} className="text-[15px]" />
            {sold ? (
              <span className="ml-auto text-xs font-bold uppercase tracking-wide text-muted">Sold out</span>
            ) : customisable ? (
              <button className="btn-ghost btn-sm ml-auto" onClick={() => setOpen(true)}>
                Add
              </button>
            ) : (
              <button className="btn-primary btn-sm ml-auto" onClick={quickAdd}>
                Add
              </button>
            )}
          </div>
        </div>
      </article>

      {customisable && !sold && (
        <CustomizeSheet item={item} open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
