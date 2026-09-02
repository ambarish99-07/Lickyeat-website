import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Get the Lickyeat app",
  description:
    "The Lickyeat app — live order tracking, one-tap reorders, saved addresses, Premium management and app-only rewards across every Lickyeat kitchen.",
};

const BENEFITS: Array<[string, string]> = [
  ["Live order tracking", "Watch your order move through the kitchen and see your rider on the map."],
  ["Reorder in one tap", "Your last order, a favourite shake, tonight's tiffin — reordered from your history instantly."],
  ["App-only rewards", "Extra coupons, early access to new drinks, and milestone perks that only land in the app."],
  ["Saved addresses & payments", "Check out in seconds. Home, office, a friend's place — all one tap away."],
  ["Manage your tiffin", "Pause the plan, skip a day, or swap a meal — all from your pocket."],
  ["Premium, managed", "See your membership status, renew before it lapses, keep free delivery running."],
];

export default function AppPage() {
  return (
    <div>
      <section className="border-b border-line bg-ink text-cream">
        <div className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow text-cream/50">The Lickyeat app</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Download the app to enjoy all the benefits.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-cream/75">
              Everything you can do here, plus live tracking, one-tap reorders and rewards that only
              exist in the app — for The Blenders Club, The Alchemy Tails and GG Tiffin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <StoreBadge store="App Store" />
              <StoreBadge store="Google Play" />
            </div>
            <p className="mt-3 text-xs text-cream/40">
              Store listings launching soon — meanwhile, everything works right here on the web.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[280px]">
            <PhoneMock />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Why the app</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(([title, body]) => (
            <div key={title} className="card p-5">
              <h3 className="font-display text-lg font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-3xl bg-sand/60 px-7 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-xl font-extrabold">Not ready to install?</p>
            <p className="mt-1 text-sm text-muted">Order on the web now — same menu, same prices.</p>
          </div>
          <Link href="/#brands" className="btn-primary btn-lg shrink-0">
            Order on the web
          </Link>
        </div>
      </section>
    </div>
  );
}

function StoreBadge({ store }: { store: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-xl border border-cream/20 bg-white/5 px-4 py-2.5">
      <span aria-hidden className="text-lg">
        {store === "App Store" ? "" : "▶"}
      </span>
      <span className="leading-tight">
        <span className="block text-[10px] uppercase tracking-wide text-cream/50">
          {store === "App Store" ? "Download on the" : "Get it on"}
        </span>
        <span className="block text-sm font-bold">{store}</span>
      </span>
      <span className="ml-1 rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-bold text-cream/60">
        soon
      </span>
    </span>
  );
}

function PhoneMock() {
  return (
    <div className="rounded-[2.2rem] border-[10px] border-ink/80 bg-cream p-3 shadow-lift">
      <div className="overflow-hidden rounded-[1.4rem] bg-white">
        <div className="bg-brand px-4 py-3 text-brand-ink">
          <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">Order LKY-8F3A</p>
          <p className="font-display text-base font-extrabold">Out for delivery</p>
        </div>
        <div className="space-y-3 p-4 text-xs">
          {["Order received", "Being prepared", "Out for delivery"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span
                className={`grid h-4 w-4 place-items-center rounded-full text-[9px] ${
                  i < 3 ? "bg-brand text-brand-ink" : "border border-ink/20"
                }`}
              >
                ✓
              </span>
              <span className={i < 3 ? "font-semibold" : "text-muted"}>{s}</span>
            </div>
          ))}
          <div className="mt-3 rounded-lg bg-sand/70 p-3">
            <p className="font-semibold">Ravi Kumar</p>
            <p className="text-muted">Honda Activa · 6 min away</p>
          </div>
          <button className="w-full rounded-full bg-ink py-2 text-center text-[11px] font-bold text-cream">
            Reorder
          </button>
        </div>
      </div>
    </div>
  );
}
