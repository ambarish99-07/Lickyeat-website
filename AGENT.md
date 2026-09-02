# AGENT.md — Lickyeat Website (lickyeat.com)

This is the **web** rebuild of Lickyeat — a Next.js customer ordering site + Express API + a
built-in admin section, in a pnpm/Turborepo monorepo. It follows the same architecture and business
rules as the Lickyeat / TBC mobile app (that project's `AGENT.md` is the canonical description of
the domain); this file covers what is specific to the website.

**If anything here conflicts with the code, the code wins.** Treat every claim as "true as of the
last edit," not guaranteed-current. When in doubt, grep.

---

## 1. What this is

A full ordering **web app** for lickyeat.com serving the same three brands under one umbrella:

| Brand | brandId | Model |
|---|---|---|
| The Blenders Club | `tbc` | catalog (cart → checkout) |
| The Alchemy Tails | `alchemy-tails` | catalog |
| GG Tiffin Service | `gg-tiffin` | tiffin (subscriptions + single-meal, **separate order universe**) |

Plus `the-biryani-lane` seeded as a `coming-soon` brand (proof the "new brand" path works).

Business is Patna-only. Delivery zone is a hardcoded city+pincode check
(`apps/api/src/modules/orders/deliveryZone.ts`) — no geocoding.

---

## 2. Layout & stack

```
packages/
  shared-types/   zod schemas + inferred TS types — single source of truth for every
                  request/response/DB-document shape. Consumed as BUILT dist/ by api + web.
  pricing/        pure, I/O-free pricing engine (premium tier / quantity tier / milestone
                  rewards / coupons / delivery / tax), combo pricing, history recommendations.
apps/
  api/            Express 5 + Mongoose 8 + TS. In-memory Mongo for local dev; Atlas via MONGODB_URI.
  web/            Next.js 15 App Router + Tailwind + zustand + SWR. Customer site + /admin section.
```

- **Ports**: api `4100`, web `3100` (4000/3000/8081 may be taken by the mobile-app project).
  The web app proxies `/api/*` → `http://localhost:4100/*` via a Next rewrite
  (`apps/web/next.config.mjs`); all client calls go through `/api`.
- **Auth**: bcrypt + JWT, email or phone. Token in `localStorage` (`lky_token`), attached by
  `apps/web/src/lib/api.ts`. Signup rate-limited (5 / 15 min / IP; skipped when `NODE_ENV=test`).
- **Payments**: COD trusted immediately; Razorpay via HMAC-SHA256 signature verify
  (`apps/api/src/modules/payments/razorpay.ts`). With no Razorpay keys configured, `createRazorpayOrder`
  returns a local stub and `verifyRazorpaySignature` accepts the signature `"dev-ok"` on
  `order_local_*` ids — the web checkout uses this to simulate payment end-to-end.
- **Any schema change** → rebuild shared-types (`pnpm --filter @lickyeat/shared-types build`)
  before api's `tsx watch` / web sees it. `pnpm -r typecheck` rebuilds packages via Turbo.

### Web app architecture (`apps/web`)

- **Public pages are Server Components** with per-page `generateMetadata` + ISR (`revalidate`):
  `app/page.tsx` (home), `app/b/[brandId]/page.tsx`, `app/coming-soon/[brandId]/page.tsx`,
  `app/tiffin/page.tsx`. They fetch via `lib/serverApi.ts` (`serverGet` — absolute URL from
  `API_INTERNAL_URL`, default `http://localhost:4100`, wrapped in try/catch so an API-down build
  still renders a shell). Interactive bits are Client Components fed by props (e.g.
  `components/menu/BrandMenu.tsx`, `components/tiffin/TiffinLanding.tsx`).
- **Auth-gated + cart/checkout pages are Client Components** using SWR through the `/api` proxy
  (`lib/api.ts`, `swrFetcher` in `app/providers.tsx`). `components/RequireAuth.tsx` gates them
  (`admin` prop for the admin section).
- **Brand theming**: `components/BrandTheme.tsx` sets `--brand` / `--brand-accent` / `--brand-ink`
  (space-separated RGB channels) from a Brand record's `primaryColor` / `accentColor` via
  `lib/color.ts`. Tailwind maps `bg-brand`, `text-brand`, `brand-soft`, `text-brand-ink` etc. to
  those vars. **No brand colour, logo or id is hardcoded in component code.** `:root` in
  `globals.css` carries a warm fallback theme for non-brand pages.
- **Design system**: `globals.css` component classes (`.btn-*`, `.card`, `.field`, `.chip`,
  `.eyebrow`, `.container-page`) + `components/ui/*` (`Button`, `Modal`, `Field`, `Stepper`,
  `Badge`, `Price`, `Skeleton`, `EmptyState`). Fonts via `next/font` in `lib/fonts.ts` (Bricolage
  Grotesque display + Inter body). `.input`/`.label` are legacy aliases kept for the admin pages.
- **Client-side pricing**: `lib/clientPricing.ts#estimatePricing` runs the SAME `@lickyeat/pricing`
  `computePricing` for an instant cart estimate; the authoritative `/pricing/preview` response
  always supersedes it (it can't know the coupon amount / paid membership / delivery radius).
- **Assets**: brand logo SVGs are served by the API at `/static/brands/*.svg` and reached from the
  browser through the web's own `/api` proxy — `lib/format.ts#assetUrl` turns a stored
  `/static/...` path into `/api/static/...`.

---

## 3. Conventions carried over from the mobile app (don't reinvent per-feature)

1. **Never trust a client price.** `CreateOrderRequest` (and the tiffin single-meal request) carry
   no price fields. `apps/api/src/modules/pricing/priceResolver.ts` re-resolves every price from
   the DB, enforces availability (item / size variant / add-on, including inside combos), and only
   then calls `computePricing()`. The cart & checkout previews call the SAME `/pricing/preview`
   endpoint → same `computePricing()` → the live total can't structurally drift from the charge.
2. **`packages/pricing` stays pure.** Plain data in, `PricingResult` out. No DB, no brand
   hardcoding. Coupon discount is resolved by the caller (DB lookup) and passed in as
   `couponDiscountAmount`.
3. **Snapshot at order time.** Order docs copy dish names, add-on prices, `isPremiumMemberAtOrder`,
   the full `PricingResult`, etc. A later menu/price edit never changes a past order.
4. **`accessToken` is a capability.** `/orders/track/:token` and `.../cancel` have NO auth check —
   holding the token authorizes lookup + cancellation (guests have no account). Same for tiffin
   single-meal orders.
5. **Two order universes, never cross-called.** Regular (`Order` model,
   `apps/api/src/modules/orders/`) = tbc + alchemy-tails. Tiffin (`TiffinSubscription` /
   `TiffinSingleMealOrder`, `apps/api/src/modules/tiffin/`) = gg-tiffin. Separate delivery-partner
   pools (`deliveryPartner.ts`), separate cancellation policies, separate tracking pages.
6. **Cart lines carry their own `brandId`** (`apps/web/src/state/cartStore.ts`), fixed at add-time.
   Checkout derives the order brand from the lines (`cartBrandId()`), never from ambient UI state.
7. **Discount / reward reasons are declared in 3 places** that must stay in sync:
   `packages/shared-types/src/pricing.ts` (`DiscountReasonSchema` / `RewardReasonSchema`),
   `apps/api/src/db/models/Order.model.ts` (`DISCOUNT_REASONS` / `REWARD_REASONS` arrays), and
   `apps/web/src/components/PriceBreakdown.tsx` (`DISCOUNT_LABELS` / `REWARD_LABELS` — the
   exhaustive `Record<Reason, string>` there is the compile-time safety net).

---

## 4. Pricing rules (authoritative worked examples: `packages/pricing/__tests__/`)

Precedence: **premium tier** (15+ completed orders or `premiumTierOverride`) → flat 25% off
non-combo subtotal + free delivery within self-reported radius. Else **quantity tier**
(2→10%, 3→15%, 4+→20% on non-combo subtotal). Then, registered users only, **milestone rewards**
every 10 orders (order #…6 → 50% off cheapest cold-coffee unit; #…10/20/… → cheapest drink free),
additive. Then **coupon** (`/coupons`), additive, clamped, before tax. Delivery: free at subtotal
≥ ₹499, or premium+radius, or an active **paid Premium Membership** (₹21 / 60 days, Razorpay-only),
else ₹39. Tax 5% on `subtotal − discount − reward − coupon`. Per-item `salePercent` stacks with all
of the above. Combos: always 15% off constituents' current base prices (`computeComboPrice`), and
combo subtotal is excluded from the quantity-tier base.

---

## 5. Feature map (where things live)

| Feature | Web | API |
|---|---|---|
| Home — brand showcase (SSR) | `app/page.tsx`, `components/BrandShowcaseCard` | `GET /brands` |
| Coming-soon teaser (SSR) | `app/coming-soon/[brandId]/` | `GET /brands/:brandId` |
| Brand menu, combos, customize (SSR shell + client menu) | `app/b/[brandId]/`, `components/BrandHero`, `components/menu/{BrandMenu,MenuItemCard,CustomizeSheet,ComboCard}` | `GET /menu/:brandId/{items,combos,categories}`, `/menu/addons` — **all return out-of-stock rows too** |
| Cart + estimate/preview + coupon | `app/cart/`, `state/cartStore`, `lib/clientPricing` | `POST /pricing/preview` |
| Checkout (COD + simulated Razorpay) | `app/checkout/` | `POST /orders`, `/orders/verify-payment` |
| Order tracking (timeline, partner, map, price, cancel) | `app/order/[token]/`, `components/OrderTracker`, `lib/mapEmbed` | `GET /orders/track/:token`, `POST .../cancel` |
| Active-order pills | `components/ActiveOrderPills` (root layout; hidden on tracking/cart/checkout/admin) | `/orders/mine`, `/tiffin/single-meal/orders/mine` |
| Tiffin landing + weekly menu + veg-only + closure banner (SSR + client) | `app/tiffin/`, `components/tiffin/{TiffinLanding,TiffinShell}`, `state/tiffinPreferencesStore` | `GET /tiffin/weekly-menu`, `/tiffin/closures` |
| Tiffin subscribe / manage (pause, skip, cancel) | `app/tiffin/subscribe/`, `app/tiffin/subscriptions/` | `/tiffin/subscriptions*` |
| Tiffin single meal + tracking | `app/tiffin/single-meal/`, `app/tiffin/track/[token]/` | `/tiffin/single-meal/*` |
| Premium Membership | `app/premium/`, `app/account/` | `/premium-membership/{status,purchase,verify}` |
| Account (profile, addresses, loyalty) | `app/account/` | `/account/{profile,addresses,recommendations}` |
| Store status banners | `components/StoreClosedBanner` (accepts a server-fetched `status` prop) | `/brands/:brandId/status`, `/store-settings/*` |
| Admin (dashboard, orders, catalog, coupons, store, tiffin) | `app/admin/*` | `/admin/*`, `/orders/admin/*`, `/tiffin/admin/*` |

Advancing a regular order to `out-for-delivery` (admin only) is the **only** way to assign a
delivery partner and reach the tracking screen's delivery state.

---

## 6. Local dev

```bash
pnpm install
pnpm --filter @lickyeat/shared-types build && pnpm --filter @lickyeat/pricing build
pnpm --filter @lickyeat/api dev        # :4100, in-memory Mongo (data NOT persisted)
pnpm --filter @lickyeat/web dev        # :3100
```

For a persistent DB set `apps/api/.env` `MONGODB_URI` (Atlas). Seed with `pnpm seed`
(from repo root or `pnpm --filter @lickyeat/api seed`) — **wipes and reseeds** brands, add-on
catalog, menu items, combos, coupons, store settings. Seeding does not create an admin: sign up
via the web app, then `pnpm --filter @lickyeat/api promote-admin <email-or-phone>`.

Because the in-memory Mongo is per-process, `pnpm seed` and a separately-started `dev` server do
**not** share data. Set `SEED_ON_BOOT=1` in `apps/api/.env` (already in `.env.example`) and the API
seeds itself on boot when the DB is empty — the simplest local setup. Or point both at a real
`MONGODB_URI`.

Tests: `pnpm -r test` — `packages/pricing` (19 unit), `packages/shared-types` (8), `apps/api`
(auth / order flow / menu-availability integration, mongodb-memory-server). No web component tests.

If dev shows `SegmentViewNode` / `__webpack_modules__ is not a function` errors, delete
`apps/web/.next` and restart — that's stale build cache from alternating `next build` / `next dev`.

---

## 7. Deferred / not done

- No real geocoding, no real rider dispatch (fixed demo partner pool), refunds recorded but never
  pushed through Razorpay, WhatsApp fail-silent with placeholder messages.
- Menu-item / hero photography: `imageUrl` / `heroImageUrl` are supported and rendered when set,
  but the seed only ships brand **logo** SVGs (`/static/brands/*.svg`). Item cards and brand heroes
  fall back to typography + brand-colour compositions until real photos are supplied.
- No web E2E tests; no deployment (Render / Vercel unprovisioned).
- Admin is a lightweight in-app section, not the full mobile-app admin surface (no Analytics,
  Customers deep-dive, Reviews & Complaints, Bulk Orders, brand tab pages, size-variant editor).

---

## 8. Keep this file current

Finished a chunk of work → update the relevant section here rather than letting it drift. This
describes current state, not a changelog (git is the changelog).
