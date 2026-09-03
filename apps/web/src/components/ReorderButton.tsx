"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { ReorderResponse } from "@/lib/apiTypes";
import { useCart } from "@/state/cartStore";
import { toast } from "@/state/toastStore";

/**
 * Re-adds a past (delivered) order's items to the cart at today's prices and
 * sends the customer to /cart. Clears any existing cart first (one order = one
 * brand) after confirming if it isn't empty.
 */
export function ReorderButton({
  orderId,
  className = "btn-primary btn-sm",
  label = "Reorder",
}: {
  orderId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function reorder() {
    setBusy(true);
    try {
      const { reorder } = await api.get<ReorderResponse>(`/orders/${orderId}/reorder`);

      const cart = useCart.getState();
      if (cart.lines.length > 0) {
        const ok = window.confirm(
          "Reordering will replace what's in your cart. Continue?",
        );
        if (!ok) {
          setBusy(false);
          return;
        }
        cart.clear();
      }

      for (const line of reorder.lines) {
        cart.add({
          brandId: line.brandId,
          kind: line.kind,
          refId: line.refId,
          signatureName: line.signatureName,
          commonName: line.commonName,
          imageUrl: line.imageUrl,
          category: line.category,
          unitBasePrice: line.unitBasePrice,
          salePercent: line.salePercent,
          unitAddOnsPrice: line.unitAddOnsPrice,
          quantity: line.quantity,
          customization: line.customization,
        });
      }

      if (reorder.unavailable.length > 0) {
        toast(`Couldn't add: ${reorder.unavailable.join(", ")}`, { tone: "error" });
      } else if (reorder.priceChanged) {
        toast("Added to cart — some prices have changed since last time.", { tone: "default" });
      } else {
        toast("Added to cart", { tone: "success" });
      }
      router.push("/cart");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't reorder right now.", { tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className} onClick={reorder} disabled={busy}>
      {busy ? "Adding…" : label}
    </button>
  );
}
