import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-sand/60">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-extrabold">Lickyeat</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            The parent company behind The Blenders Club, The Alchemy Tails, GG Tiffin Service and
            The Biryani Lane. Based in Patna, Bihar.
          </p>
          <Link
            href="/app"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
          >
            📱 Download the Lickyeat app →
          </Link>
        </div>
        <nav className="text-sm">
          <p className="eyebrow mb-3">Order</p>
          <ul className="space-y-2 text-charcoal">
            <li><Link href="/b/tbc" className="hover:text-brand">The Blenders Club</Link></li>
            <li><Link href="/b/alchemy-tails" className="hover:text-brand">The Alchemy Tails</Link></li>
            <li><Link href="/tiffin" className="hover:text-brand">GG Tiffin Service</Link></li>
          </ul>
        </nav>
        <nav className="text-sm">
          <p className="eyebrow mb-3">Account</p>
          <ul className="space-y-2 text-charcoal">
            <li><Link href="/login" className="hover:text-brand">Log in</Link></li>
            <li><Link href="/orders" className="hover:text-brand">Track an order</Link></li>
            <li><Link href="/premium" className="hover:text-brand">Premium Membership</Link></li>
          </ul>
        </nav>
        <nav className="text-sm">
          <p className="eyebrow mb-3">Lickyeat</p>
          <ul className="space-y-2 text-charcoal">
            <li><Link href="/app" className="hover:text-brand">Get the app</Link></li>
            <li><Link href="/blog" className="hover:text-brand">Blog</Link></li>
            <li><Link href="/#brands" className="hover:text-brand">All kitchens</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container-page border-t border-line py-5 text-xs text-muted">
        © {new Date().getFullYear()} Lickyeat · Demo build · Delivery currently within Patna only
      </div>
    </footer>
  );
}
