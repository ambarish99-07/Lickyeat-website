"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CallbackModal } from "@/components/leads/CallbackModal";
import { PhoneIcon } from "@/components/ui/icons";

/** Floating "call me back" affordance, mounted once at the root. */
export function CallbackButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (["/admin", "/cart", "/checkout", "/login", "/signup"].some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-cream shadow-lift transition hover:brightness-110"
      >
        <PhoneIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Request a call back</span>
        <span className="sm:hidden">Call back</span>
      </button>
      <CallbackModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
