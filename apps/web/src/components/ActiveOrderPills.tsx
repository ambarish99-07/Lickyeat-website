"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Order, TiffinSingleMealOrder } from "@lickyeat/shared-types";
import { useAuth } from "@/state/authStore";
import { api } from "@/lib/api";

const ACTIVE = ["received", "preparing", "out-for-delivery"];

/**
 * Floating chip stack showing in-flight orders, mounted once at the root. Hidden
 * on the tracking screens themselves.
 */
export function ActiveOrderPills() {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const [orders, setOrders] = useState<Array<{ token: string; label: string; kind: string }>>([]);

  useEffect(() => {
    if (!ready || !user) {
      setOrders([]);
      return;
    }
    Promise.all([
      api.get<{ orders: Order[] }>("/orders/mine").catch(() => ({ orders: [] })),
      api
        .get<{ orders: TiffinSingleMealOrder[] }>("/tiffin/single-meal/orders/mine")
        .catch(() => ({ orders: [] })),
    ]).then(([reg, tif]) => {
      const list = [
        ...reg.orders
          .filter((o) => ACTIVE.includes(o.status))
          .map((o) => ({ token: o.accessToken, label: o.code, kind: "order" })),
        ...tif.orders
          .filter((o) => ACTIVE.includes(o.status))
          .map((o) => ({ token: o.accessToken, label: o.code, kind: "tiffin" })),
      ];
      setOrders(list);
    });
  }, [ready, user, pathname]);

  if (orders.length === 0) return null;
  const hideOn = ["/order/", "/tiffin/track/", "/cart", "/checkout", "/admin"];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 flex flex-col items-start gap-2">
      {orders.map((o) => (
        <Link
          key={o.token}
          href={o.kind === "tiffin" ? `/tiffin/track/${o.token}` : `/order/${o.token}`}
          className="rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream shadow-lift transition hover:bg-charcoal"
        >
          Track {o.label} →
        </Link>
      ))}
    </div>
  );
}
