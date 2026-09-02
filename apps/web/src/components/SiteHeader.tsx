"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/state/authStore";
import { useCart } from "@/state/cartStore";
import { cn } from "@/components/ui/misc";
import { BagIcon, UserIcon } from "@/components/ui/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  const { user, ready, logout } = useAuth();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return <AdminHeader />;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lickyeat-mark.png" alt="" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-extrabold tracking-tight">Lickyeat</span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <NavLink href="/#brands" label="Brands" />
          <NavLink href="/tiffin" label="GG Tiffin" />
          <NavLink href="/blog" label="Blog" />
          <NavLink href="/premium" label="Premium" />
          <NavLink href="/app" label="Get the app" />
          {user && <NavLink href="/orders" label="My orders" />}
          {user?.role === "admin" && <NavLink href="/admin" label="Admin" />}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {ready && user ? (
            <>
              {/* logged in → account is an icon */}
              <Link
                href="/account"
                aria-label={`Account — ${user.name}`}
                title={user.name}
                className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 bg-surface/70 text-ink transition hover:border-ink/30 hover:bg-surface"
              >
                <UserIcon className="h-4 w-4" />
              </Link>
              <button
                onClick={logout}
                className="hidden rounded-full px-2.5 py-1.5 text-sm font-medium text-muted hover:text-ink sm:inline"
              >
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-ghost btn-sm">
              Log in
            </Link>
          )}

          {/* cart is always an icon */}
          <Link
            href="/cart"
            aria-label={count > 0 ? `Cart, ${count} item${count > 1 ? "s" : ""}` : "Cart"}
            className="relative grid h-9 w-9 place-items-center rounded-full bg-ink text-cream transition hover:bg-charcoal"
          >
            <BagIcon className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-ink">
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
      className={cn("rounded-full px-3 py-1.5 transition hover:bg-ink/5", active && "text-brand")}
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
        <Link href="/admin" className="flex items-center gap-2 font-display font-extrabold">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lickyeat-mark.png" alt="" className="h-6 w-6 object-contain" />
          Lickyeat <span className="text-cream/50">Admin</span>
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <ThemeToggle className="grid h-8 w-8 place-items-center rounded-full border border-cream/20 text-cream/80 hover:text-cream" />
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
