/**
 * Pure "recommended for you" ranking from a customer's past order history.
 * Zero I/O — callers pass in plain arrays.
 */
export interface PurchaseHistoryEntry {
  itemId: string;
  name: string;
  brandId: string;
  quantity: number;
  lastOrderedAt: number; // epoch ms
}

export interface CatalogEntry {
  itemId: string;
  name: string;
  brandId: string;
  category: string;
}

/**
 * Rank by a blend of frequency and recency, then fill remaining slots with
 * popular catalog items the customer has not tried.
 */
export function recommendItems(
  history: PurchaseHistoryEntry[],
  catalog: CatalogEntry[],
  opts: { limit?: number; now?: number } = {},
): CatalogEntry[] {
  const limit = opts.limit ?? 8;
  const now = opts.now ?? Date.now();
  const DAY = 86_400_000;

  const scored = history
    .map((h) => {
      const ageDays = Math.max(0, (now - h.lastOrderedAt) / DAY);
      const recency = 1 / (1 + ageDays / 14);
      return { h, score: h.quantity * 0.6 + recency * 4 };
    })
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const { h } of scored) {
    if (seen.has(h.itemId)) continue;
    const c = catalog.find((x) => x.itemId === h.itemId);
    if (!c) continue;
    seen.add(h.itemId);
    out.push(c);
    if (out.length >= limit) return out;
  }

  for (const c of catalog) {
    if (out.length >= limit) break;
    if (seen.has(c.itemId)) continue;
    seen.add(c.itemId);
    out.push(c);
  }
  return out;
}
