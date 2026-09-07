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
- **Tiffin plan prices** realigned to the app's Regular-tier catalog (`8041be6`).
  The website keeps 12 Regular plans; the app's Mini/Premium *subscription*
  tiers + lunch-only/dinner-only styles are still backlog (below).

### Catalog audit (2026-09-07)
TBC + Alchemy Tails menu items and prices are **identical** between the app's
`seed.ts` and the website's `seedData.ts` — nothing to port. Biryani Lane is
website-only (the app has no biryani menu items). Only the **tiffin plan
catalog** diverged.

## Backlog — reviewed, not yet ported (needs a decision)

### Tiered tiffin subscription plans (`0d728db`, `9461192`) — BIG
The app made `TiffinPlan` carry a **tier** (Regular/Mini/Premium — same three as
single-meal) and added **`lunch-only`** / **`dinner-only`** plan styles, plus:
- Mini has no breakfast dish → `assertValidTierStyle` / `TIER_MEAL_TYPES` reject a
  tier/style/mealType combo that would need one, at both `createPlan` and
  `createSubscription`.
- Subscription meal resolution builds a **per-tier dish lookup**
  (`buildDishLookupForTier`), snapshotting `tier` onto the subscription.
- `TiffinDish.price` — a per-dish price override on top of the shared
  `TiffinMealPrice` slot price.
- Admin `TiffinPlansPage` / `TiffinMenuPage` reworked around tiers.

The website's tiffin is simpler on purpose (12 fixed plans, `tiffinDishData.ts`
already keyed by tier×diet×meal×weekday). Porting this is a real rework of the
seed + `tiffin.service` + subscribe flow + admin. **Do it only if you actually
want Mini/Premium subscription plans on the web** — the single-meal tiers already
cover "try before you commit".

### Cross-brand browse categories (`browseCategory.ts`, `AllCouponsScreen` nav)
The app added a fixed cross-brand taxonomy (Shakes, Biryani, Chicken, Paneer…)
with a `GET` returning `{id,label,image,itemCount}` per category, powering a
"browse all brands by category" screen. The website has no equivalent — it's
per-brand menus + home. A `/browse` page would be a genuine new discovery
surface; medium effort (new endpoint + page). Not started.

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
