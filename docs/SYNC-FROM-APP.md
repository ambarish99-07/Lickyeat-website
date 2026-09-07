# Syncing changes from the mobile app

The website was modelled on the `d:\TBC app` React Native project. When that app
changes, port the parts that apply here.

## Workflow

1. The app repo carries a git tag **`web-synced`** at the last commit reviewed for
   the website.
2. To sync: `git -C "d:\TBC app" diff web-synced..HEAD` — read every change, port
   what applies (skip RN-only UI, Expo/native-module stuff), then
   `git -C "d:\TBC app" tag -f web-synced HEAD`.
3. Record anything deliberately **not** ported in the backlog below, with why.

`web-synced` is currently at `9461192` (2026-09-07,
*"feat(tiffin): enhance filtering and sorting of tiffin plans"*).

## Ported so far (app commits `dcc869e..9461192`)

- **`MenuItem.dietType`** + `DietDot` FSSAI mark + "Veg only" toggle on the brand
  menu — `ff5e0fe`.
- **Real Razorpay client checkout** across all four paid flows — `ca9d54a`
  (the app's `963c000`).
- **Offers/coupons page** — the app's `AllCouponsScreen` (`b42a061`) as `/offers`;
  the website endpoint was already brand-agnostic — `ff5e0fe`.
- **Tiffin subscriptions Razorpay-only** (COD removed) — `ff5e0fe`
  (the app's `TiffinCheckoutScreen` change).
- **`Brand.heroImageUrlDark`** field + CSS theme-swap in `BrandHero` — `ff5e0fe`.
- Light/dark mode + glossy sky palette — done earlier (`451c044`), matching the
  app's dark-mode work (`762e7e5` etc.).
- **Veg / Non-veg menu tabs** (`8041be6`) — the app's per-brand veg switch, as a
  Full menu / Veg / Non-veg tab strip.
- **Single-meal ordering cutoffs** realigned to `mealOrderingWindow.ts`
  (`8041be6`): lunch 1pm IST, dinner 9pm IST, breakfast next-day-only.
- **Tiffin plan prices** realigned to the app's catalog (`8041be6`, `03f4087`).
- **Tiffin dish menu resync + per-dish pricing** (`8788d1d`) — the rotation and
  every dish's own price now match the app's `TiffinDish` seed; single-meal
  orders charge the per-dish price. Per-dish FSSAI diet dots on the menu.
- **Tiered subscription plans** (`03f4087`) — `TiffinPlan.tier` /
  `TiffinSubscription.tier`, a 36-plan Regular/Mini/Premium catalog,
  lunch-only/dinner-only styles, Mini-no-breakfast validation, subscription
  meals resolved against the plan's tier.
- **Cross-brand browse** (`8fef14e`) — `GET /menu/browse[/:id]` + `/browse` grid +
  `/browse/[id]` items-by-kitchen. "Pure Veg" / "Non-veg" match by `dietType`.
- **Moving-rider delivery strip** (`8fef14e`) — `components/DeliveryProgress` in
  `OrderTracker` while out-for-delivery (time estimate, not GPS).

### Catalog audit (2026-09-07)
TBC + Alchemy Tails menu items and prices are **identical** between the app's
`seed.ts` and the website's `seedData.ts` — nothing to port. Biryani Lane is
website-only (the app has no biryani menu items). Only the **tiffin plan
catalog** diverged.

## Backlog — reviewed, not yet ported

### `Brand.displayOrder`
The app renamed/added an explicit brand ordering field. The website already has
`Brand.sortOrder` doing exactly this — nothing to port.

### Account screen visual refresh (`57d399c`)
RN styling + a premium-status card. The website's `/account` already shows
loyalty progress, order history, My Tiffin, and links Premium + Offers. Re-check
against the app screenshot if the layout should change; no functional gap.

### Razorpay webhook + refunds API + idempotency
Called out as deferred in **both** repos' AGENT.md. Same three items:
a payment webhook, wiring cancellations to the Razorpay refunds API, and an
idempotency pass on the verify side effects before a webhook can safely reuse
them.
