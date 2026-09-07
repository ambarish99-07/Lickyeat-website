"use client";

import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is still visible to type */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand/50 bg-brand-soft px-2.5 py-1 font-mono text-sm font-bold text-brand transition hover:bg-brand/15"
      aria-label={`Copy code ${code}`}
    >
      {code}
      <span className="text-[11px] font-semibold text-muted">{copied ? "copied" : "copy"}</span>
    </button>
  );
}
