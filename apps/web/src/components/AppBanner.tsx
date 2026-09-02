"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const KEY = "lky_appbanner_dismissed";

export function AppBanner() {
  const pathname = usePathname();
  // Render by default (SSR + first paint); hide only if the visitor dismissed it before.
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (dismissed || pathname.startsWith("/admin") || pathname === "/app") return null;

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  return (
    <div className="bg-ink text-cream">
      <div className="container-page flex items-center justify-between gap-3 py-2 text-[13px]">
        <Link
          href="/app"
          className="group flex min-w-0 items-center gap-2 font-medium hover:text-white"
        >
          <span aria-hidden>📱</span>
          <span className="truncate">
            Download the Lickyeat app to enjoy all the benefits — live tracking, one-tap reorders
            &amp; app-only rewards
          </span>
          <span
            aria-hidden
            className="hidden shrink-0 font-bold underline underline-offset-2 transition group-hover:translate-x-0.5 sm:inline"
          >
            Get the app →
          </span>
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full px-1.5 text-cream/50 hover:text-cream"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
