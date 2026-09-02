"use client";

import Link from "next/link";
import { useToasts } from "@/state/toastStore";
import { cn } from "@/components/ui/misc";

export function ToastHost() {
  const { toasts, dismiss } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex animate-fade-up items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lift",
            t.tone === "error" ? "bg-rose-600 text-white" : "bg-ink text-cream",
          )}
        >
          <span>{t.message}</span>
          {t.href && (
            <Link href={t.href} onClick={() => dismiss(t.id)} className="underline underline-offset-2">
              {t.hrefLabel ?? "View"}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
