# AGENT.md — Lickyeat Website (lickyeat.com)

This is the **web** rebuild of Lickyeat — a Next.js customer ordering site + Express API + a
built-in admin section, in a pnpm/Turborepo monorepo. It follows the same architecture and business
rules as the Lickyeat / TBC mobile app (that project's `AGENT.md` is the canonical description of
the domain); this file covers what is specific to the website.

**If anything here conflicts with the code, the code wins.** Treat every claim as "true as of the
last edit," not guaranteed-current. When in doubt, grep.

---

## 1. What this is

A full ordering **web app** for lickyeat.com serving the same brands under one umbrella:

| Brand | brandId | Model | Menu |
|---|---|---|---|
| The Blenders Club | `tbc` | catalog | 12 signature thick shakes + 3 cold coffees (Choco Crush, Hazelnut Heaven, Coffee Chill …), ₹179–249 |
| The Alchemy Tails | `alchemy-tails` | catalog | 15 mocktails (Blue Lagoon, Mango Mojito, Rainbow Fizz …), ₹129–199 |
| GG Tiffin Service | `gg-tiffin` | tiffin (subscriptions + single-meal, **separate order universe**) | Bihari home food — real weekly rotation (Aloo Matar, Rajma, Dum Aloo, Chicken/Fish/Egg/Mutton Curry …), Regular/Mini/Premium tiers, 12 fixed plans |
| The Biryani Lane | `the-biryani-lane` | catalog | 10 dum biryanis (Chicken, Hyderabadi, Kolkata-style, Shahi, Sarson, Pocket, Veg, Paneer, Paneer Tikka …) each in a **500 g / 1 kg** `sizeVariant` — larger box carries double chicken/egg/aloo; no photos yet (typography cards), `hasSugarIceCustomization: false`, ₹139–459 |

**The catalog matches the real Lickyeat app** — item names, prices, combos, coupons
(`WELCOME50` + `FLAT50…FLAT400`), brand palettes and photography were brought over from the
reference project (`d:\TBC app`). Real photos live in `apps/api/public/{menu,tiffin}-images/`
(compressed from the originals — `scripts/optimizeImages.mjs`) and `apps/api/public/brands/`,
served at `/static/...` and proxied to the browser via `/api/static/...`.

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
- **Layout width**: `.container-page` is `max-w-[1600px]` with responsive gutters (used by every
  full-width section); `.container-narrow` (`max-w-3xl`) is for form/reading-width content.
- **App banner**: `components/AppBanner.tsx` — dismissible top strip (localStorage
  `lky_appbanner_dismissed`) linking to `/app`, the "Get the Lickyeat app" landing page. Hidden on
  `/admin` and `/app`. Also linked from the header nav and footer.
- **Signup prompt**: `components/SignupPrompt.tsx` — first-visit modal (localStorage
  `lky_signup_prompt_seen`, ~1.1s delay), compact name+email/phone+password signup with a
  "Browse the menu" escape. Suppressed when logged in and on `/login` `/signup` `/admin`
  `/checkout`.
- **Header**: brand mark image `apps/web/public/lickyeat-mark.png` (from the real logo art) +
  wordmark; account and cart are icon buttons (`components/ui/icons.tsx`). Favicon at
  `apps/web/src/app/icon.png`.
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
8. **A `MenuItem` has two names.** `signatureName` (the fun one, shown big — "Choco Crush") and
   `commonName` (plain — "Rich Chocolate Shake", shown small). Its `_id` is the slug (also the
   image slug and the id `pairsWith` / combos reference). `flavorBadges` + `isPopular` /
   `isNew` / `isStaffPick` drive the "Trending / New / Staff Pick" chips. `hasSugarIceCustomization`
   (one flag) gates the sugar+ice pickers; sugar/ice levels are `less` / `regular` / `extra`.
   Add-ons: `addOnNames` (into the shared `MenuAddOn` catalog) is resolved to an embedded
   `addOns: {name,price,isAvailable}[]` on every read — the client never fetches the catalog
   separately. Combos are `curated` (fixed 2-item duos) or `choose-n`, with an optional
   `discountPercent` override (default 15).
9. **GG Tiffin is Plan-based.** `TiffinPlan` rows (12: single / twice-daily / thrice-daily ×
   veg/non-veg × weekly/monthly, each a flat price + optional `salePercent`). Subscribe = pick a
   plan (+ a `mealType` for `single` plans). The real weekly rotation + single-meal tiers
   (regular/mini/premium), prices and add-ons live in
   `apps/api/src/modules/tiffin/tiffinDishData.ts` (one row per tier×diet×meal×weekday) —
   `shared-types` keeps a Regular-tier table only for the public weekly-menu display.

---

## 4. Pricing rules (authoritative worked examples: `packages/pricing/__tests__/`)

Precedence: **premium tier** (15+ completed orders or `premiumTierOverride`) → flat 25% off
non-combo subtotal + free delivery within self-reported radius. Else **quantity tier**
(2→10%, 3→15%, 4+→20% on non-combo subtotal). Then, registered users only, **milestone rewards**
every 10 orders (order #…6 → 50% off cheapest cold-coffee unit; #…10/20/… → cheapest drink free),
additive. Then **coupon** (`/coupons`), additive, clamped, before tax. Delivery: free at subtotal
≥ ₹499, or premium+radius, or an active **paid Premium Membership** (₹21 / 60 days, Razorpay-only),
else ₹39. Tax 5% on `subtotal − discount − reward − coupon`. Per-item `salePercent` stacks with all
of the above. Combos: 15% off constituents' current base prices (`computeComboPrice`, or a combo's
own `discountPercent`), and combo subtotal is excluded from the quantity-tier base.

**Coupons** (`Coupon.kind`): `percent` (`WELCOME50` = 50% off ≤₹100), `flat` (`FLAT50…FLAT400`),
`bogo` (`BOGO1` — cheapest eligible non-combo unit free, needs ≥2 units). `WELCOME50` and `BOGO1`
are `oncePerCustomer`, enforced in `resolveCouponForCart` via `ctx.userId` against a top-level
indexed `Order.couponCode` field (NOT the Mixed `pricing` blob — that isn't queryable). The bogo
maths is in `resolveCouponDiscount` (shared-types) — callers pass `pricingLines`. Public
`GET /coupons/available` powers the cart's "Offers for you" list (`components/OffersList.tsx`);
`couponSummary()` is the display-string helper.

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
| Order history + one-tap reorder | `app/account/` ("Order history" section) + `app/orders/` delivered rows, `components/ReorderButton` | `GET /orders/:id/reorder` — re-resolves a **delivered** order's lines against the current menu (prices/availability never trusted from the old snapshot), returns cart-ready lines + `unavailable[]` + `priceChanged` |
| My Tiffin in profile | `app/account/` ("My Tiffin" section), `components/account/MyTiffinSection` | `GET /tiffin/subscriptions`, `/tiffin/single-meal/orders/mine` — read-only summary (live plan + next meals + recent single meals); full management stays on `/tiffin/subscriptions` |
| Tiffin landing + weekly menu + veg-only + closure banner (SSR + client) | `app/tiffin/`, `components/tiffin/{TiffinLanding,TiffinShell}`, `state/tiffinPreferencesStore` | `GET /tiffin/weekly-menu`, `/tiffin/closures` |
| Tiffin subscribe / manage (pause, skip, cancel) | `app/tiffin/subscribe/`, `app/tiffin/subscriptions/` | `/tiffin/subscriptions*` |
| Tiffin single meal + tracking | `app/tiffin/single-meal/`, `app/tiffin/track/[token]/` | `/tiffin/single-meal/*` |
| Premium Membership | `app/premium/`, `app/account/` | `/premium-membership/{status,purchase,verify}` |
| Account (profile, addresses, loyalty) | `app/account/` | `/account/{profile,addresses,recommendations}` |
| Store status banners | `components/StoreClosedBanner` (accepts a server-fetched `status` prop) | `/brands/:brandId/status`, `/store-settings/*` |
| Admin (dashboard, orders, catalog, coupons, store, tiffin, blog, leads) | `app/admin/*` | `/admin/*`, `/orders/admin/*`, `/tiffin/admin/*`, `/blog/*`, `/leads/*` |
| Blog (daily posts, SSR + admin CRUD) | `app/blog/*`, `components/blog/*` | `GET /blog`, `/blog/:slug`, admin `/blog` CRUD |
| Franchise & Catering (SSR pitch + enquiry forms) | `app/franchise/`, `app/catering/`, `components/leads/{FranchiseEnquiryForm,CateringEnquiryForm,LeadSuccess,CallbackModal}` | `POST /leads` (public, honeypot + rate-limited), `GET /leads/contact` |
| Call-back button (floating, site-wide) | `components/CallbackButton` (root layout; hidden on admin/cart/checkout/auth) | `POST /leads` `kind:"callback"` |
| Lead pipeline + durable alert queue | `app/admin/leads/`, `components/admin/AlertBell` (in `AdminHeader`) | `GET/PATCH /leads`, `/leads/alerts/{list,count,read}` |

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
(auth / order flow / menu-availability / coupons / leads / reorder integration,
mongodb-memory-server). No web component tests.

If dev shows `SegmentViewNode` / `__webpack_modules__ is not a function` errors, delete
`apps/web/.next` and restart — that's stale build cache from alternating `next build` / `next dev`.

---

## 7. Deferred / not done

- No real geocoding, no real rider dispatch (fixed demo partner pool), refunds recorded but never
  pushed through Razorpay, WhatsApp fail-silent with placeholder messages.
- Franchise/catering leads: automated **outbound** WhatsApp (the enquirer's brief) needs Meta
  WhatsApp Business API creds + an approved template — the adapter (`modules/leads/notify.ts`) is
  written but dormant. Until then the web shows the brief on-screen + a `wa.me` deep link
  (`LICKYEAT_WHATSAPP_NUMBER`). Ops alerts fan out to email (Resend) / WhatsApp / webhook when
  configured; the durable `AdminAlert` queue (bell in admin header) always works. No telephony —
  "call back within 24h" is an SLA surfaced in `/admin/leads`, not an automated dialer.
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
