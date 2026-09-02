"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RequireAuth } from "@/components/RequireAuth";
import { cn } from "@/components/ui/misc";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/catalog", label: "Menu & brands" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/store", label: "Store status" },
  { href: "/admin/tiffin", label: "GG Tiffin" },
  { href: "/admin/blog", label: "Blog" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireAuth admin>
      <div className="container-page grid gap-8 py-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto md:sticky md:top-24 md:h-fit md:flex-col md:overflow-visible">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                pathname === n.href ? "bg-ink text-cream" : "text-charcoal hover:bg-ink/5",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </RequireAuth>
  );
}
