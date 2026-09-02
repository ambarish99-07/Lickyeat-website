"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/state/authStore";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/catalog", label: "Menu & brands" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/store", label: "Store status" },
  { href: "/admin/tiffin", label: "GG Tiffin" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();

  if (ready && (!user || user.role !== "admin")) {
    return (
      <p className="py-16 text-center text-black/60">
        Admin access required. <Link href="/login" className="font-semibold text-brand">Log in</Link>
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr]">
      <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === n.href ? "bg-ink text-white" : "hover:bg-black/5"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
