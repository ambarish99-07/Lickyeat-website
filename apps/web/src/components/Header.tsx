"use client";

import Link from "next/link";
import { useAuth } from "@/state/authStore";
import { useCart } from "@/state/cartStore";

export function Header() {
  const { user, ready, logout } = useAuth();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-brand">
          Lickyeat
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href="/tiffin" className="hidden rounded-full px-3 py-1.5 hover:bg-black/5 sm:block">
            GG Tiffin
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-black/5">
              Admin
            </Link>
          )}
          {ready && user ? (
            <>
              <Link href="/orders" className="rounded-full px-3 py-1.5 hover:bg-black/5">
                My orders
              </Link>
              <Link href="/account" className="rounded-full px-3 py-1.5 hover:bg-black/5">
                {user.name.split(" ")[0]}
              </Link>
              <button onClick={logout} className="rounded-full px-3 py-1.5 text-black/50 hover:bg-black/5">
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-black/5">
              Log in
            </Link>
          )}
          <Link href="/cart" className="btn-primary !px-4 !py-2">
            Cart{count > 0 ? ` · ${count}` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
