"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Brand, MenuItem, StoreStatus } from "@lickyeat/shared-types";
import { categoryLabel } from "@lickyeat/shared-types";
import type { ComboWithLive } from "@/lib/apiTypes";
import { MenuItemCard } from "./MenuItemCard";
import { ComboCard } from "./ComboCard";
import { StoreClosedBanner } from "@/components/StoreClosedBanner";
import { useCart } from "@/state/cartStore";
import { rupees } from "@/lib/format";
import { cn } from "@/components/ui/misc";

export function BrandMenu({
  brand,
  items,
  categories,
  combos,
  status,
}: {
  brand: Brand;
  items: MenuItem[];
  categories: string[];
  combos: ComboWithLive[];
  status: StoreStatus;
}) {
  const cartCount = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const cartTotal = useCart((s) =>
    s.lines.reduce((n, l) => {
      const sale = l.salePercent > 0 ? l.unitBasePrice * (1 - l.salePercent / 100) : l.unitBasePrice;
      return n + (Math.round(sale) + l.unitAddOnsPrice) * l.quantity;
    }, 0),
  );

  const sections = categories.filter((c) => items.some((i) => i.category === c));
  const [activeSlug, setActiveSlug] = useState(sections[0] ? slug(sections[0]) : "");
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSlug(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-140px 0px -70% 0px" },
    );
    Object.values(refs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [sections.length]);

  return (
    <div className="container-page py-8">
      {(!status.open || status.upcomingClosure) && (
        <div className="mb-6">
          <StoreClosedBanner brandId={brand.brandId} status={status} />
        </div>
      )}

      {/* sticky category nav */}
      {sections.length > 1 && (
        <nav className="sticky top-16 z-30 -mx-4 mb-6 overflow-x-auto border-b border-line bg-cream/90 px-4 py-2 backdrop-blur">
          <div className="flex gap-1">
            {sections.map((c) => (
              <a
                key={c}
                href={`#cat-${slug(c)}`}
                onClick={() => setActiveSlug(slug(c))}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
                  activeSlug === slug(c) ? "bg-brand text-brand-ink" : "text-charcoal hover:bg-ink/5",
                )}
              >
                {categoryLabel(c)}
              </a>
            ))}
          </div>
        </nav>
      )}

      {combos.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 font-display text-xl font-extrabold">Combos</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {combos.map((c) => (
              <ComboCard key={c.id} combo={c} />
            ))}
          </div>
        </section>
      )}

      {sections.map((cat) => (
        <section
          key={cat}
          id={`cat-${slug(cat)}`}
          ref={(el) => {
            refs.current[cat] = el;
          }}
          className="mb-10 scroll-mt-32"
        >
          <h2 className="mb-4 font-display text-xl font-extrabold">{categoryLabel(cat)}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items
              .filter((i) => i.category === cat)
              .map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
          </div>
        </section>
      ))}

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <Link
            href="/cart"
            className="flex w-full max-w-md items-center justify-between rounded-full bg-ink px-5 py-3 text-cream shadow-lift"
          >
            <span className="text-sm font-semibold">
              {cartCount} item{cartCount > 1 ? "s" : ""} · {rupees(cartTotal)}
            </span>
            <span className="text-sm font-bold">View cart →</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
