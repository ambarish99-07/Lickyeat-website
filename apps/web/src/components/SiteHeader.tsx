"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/state/authStore";
import { useCart } from "@/state/cartStore";
import { cn } from "@/components/ui/misc";

export function SiteHeader() {
  const { user, ready, logout } = useAuth();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return <AdminHeader />;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-ink text-cream font-display text-lg font-extrabold">
            L
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">Lickyeat</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium sm:flex">
          <NavLink href="/#brands" label="Brands" />
          <NavLink href="/tiffin" label="GG Tiffin" />
          <NavLink href="/premium" label="Premium" />
          {user && <NavLink href="/orders" label="My orders" />}
          {user?.role === "admin" && <NavLink href="/admin" label="Admin" />}
        </nav>

        <div className="flex items-center gap-2">
          {ready && user ? (
            <div className="hidden items-center gap-1 sm:flex">
              <Link href="/account" className="btn-quiet btn-sm">
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="btn-quiet btn-sm">
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-ghost btn-sm hidden sm:inline-flex">
              Log in
            </Link>
          )}
          <Link href="/cart" className="btn-dark btn-sm">
            Cart
            {count > 0 && (
              <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-cream px-1 text-[11px] font-bold text-ink">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = href !== "/" && pathname.startsWith(href.split("#")[0]!) && href !== "/#brands";
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 transition hover:bg-ink/5",
        active && "text-brand",
      )}
    >
      {label}
    </Link>
  );
}

function AdminHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink text-cream">
      <div className="container-page flex h-14 items-center justify-between">
        <Link href="/admin" className="font-display font-extrabold">
          Lickyeat <span className="text-cream/50">Admin</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/" className="text-cream/70 hover:text-cream">
            View site
          </Link>
          {user && (
            <button onClick={logout} className="text-cream/70 hover:text-cream">
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
