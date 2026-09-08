# Go-live checklist

Everything that's in **placeholder / demo mode** and what to switch on before
`lickyeat.com` takes real orders and real money. The code already degrades
gracefully in every case below — nothing here is broken, it's just not *live*.

Grouped by "won't work / unsafe without it" → "works but simulated" → "polish".

---

## 1. Blockers — the site is broken or unsafe in production without these

| # | Item | Where | What to do |
|---|---|---|---|
| 1.1 | **Real database** | `apps/api/.env` → `MONGODB_URI` | Currently unset → in-memory Mongo, **data is wiped on every restart**. Point at a real MongoDB Atlas cluster. |
| 1.2 | **`SEED_ON_BOOT` off** | `apps/api/.env` → `SEED_ON_BOOT` | Must be **unset / `0`** in prod. With `=1` it reseeds (and the seed wipes plans/coupons/dishes) whenever the DB looks empty. |
| 1.3 | **JWT secret** | `apps/api/.env` → `JWT_SECRET` | Default is `dev-only-change-me`. Generate a long random secret; rotating it logs everyone out. |
| 1.4 | **Demo admin removed** | `apps/api/src/db/seedData.ts` `ensureDemoAdmin()` | `admin@lickyeat.com` / `Lickyeat@123` is seeded. Remove that call for prod (or run it once then change the password), and create real admin accounts via `pnpm --filter @lickyeat/api promote-admin <email>`. |
| 1.5 | **CORS origin** | `apps/api/.env` → `WEB_ORIGIN` | Set to the real site origin(s), comma-separated. |
| 1.6 | **API URL for the web app** | web env → `API_URL` (used by `next.config.mjs` rewrite) and `API_INTERNAL_URL` (SSR fetches, `lib/serverApi.ts`) | Point at the deployed API. |
| 1.7 | **`metadataBase`** | `apps/web/src/app/layout.tsx` | Hardcoded `http://localhost:3100` — set to the real domain or OG/Twitter image URLs break. |
| 1.8 | **HTTPS everywhere** | hosting | The rider page (`/rider/[token]`) uses `navigator.geolocation` — browsers **block it on non-HTTPS origins**. No HTTPS ⇒ no live rider tracking. |
| 1.9 | **Rate limiting review** | `apps/api/src/middleware/rateLimit.ts` | Limiter is `disabled = !env.isProd`, so it only runs when `NODE_ENV=production`. Confirm `NODE_ENV` is set and the limits (5 signups / 15 min, 20 logins / 15 min, 6 leads / hr) suit real traffic. |

---

## 2. Credentials — features that work simulated until keys are added

### 2.1 Razorpay — payments + refunds  *(user is holding these keys for now)*
- `apps/api/.env` → `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- Needs: a Razorpay account, KYC, a settlement bank account. Start with **test keys**, verify the full flow (`/checkout`, `/premium`, `/tiffin/single-meal`, `/tiffin/subscribe`), then swap to live keys.
- Once set: the real Checkout widget opens (`apps/web/src/lib/razorpay.ts`), signatures are HMAC-verified server-side, and **cancellations push a real refund** (`createRazorpayRefund`). No code change — `GET /payments/config` flips to `{razorpay:true}` and the UI copy follows.
- **Still to build (see §4.1):** the payment **webhook** for reconciliation.

### 2.2 WhatsApp — order updates + the franchise/catering auto-message
- `apps/api/.env` → `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` (Meta WhatsApp Business Cloud API)
- `LICKYEAT_WHATSAPP_NUMBER` — digits-only business number for the `wa.me` deep links shown after a franchise/catering enquiry.
- Meta **message templates** must be created and approved (order-received, out-for-delivery, delivered, cancelled/refund, franchise brief). Current names are placeholders.
- Until then: order-update messages are logged and dropped (`integrations/whatsapp.ts`); the franchise/catering pages show the brief on-screen + a `wa.me` link instead of sending.

### 2.3 Ops alerts — lead / call-back notifications when the admin panel is closed
- `apps/api/.env` → `OPS_NOTIFY_EMAIL` + `RESEND_API_KEY` (Resend HTTP API), **or** `OPS_NOTIFY_WEBHOOK_URL` (Zapier/Make/Slack), **or** `OPS_NOTIFY_WHATSAPP`.
- Without any of these, the durable in-panel `AdminAlert` queue still works (bell in the admin header) — you just won't get a push when nobody's looking at `/admin/leads`.

---

## 3. Data & content — demo data to replace

| # | Item | Where |
|---|---|---|
| 3.1 | **All menu prices are indicative** | `apps/api/src/db/seedData.ts` — TBC/Alchemy carried from the app; **Biryani Lane prices are my launch estimates**; confirm every one. |
| 3.2 | **Tiffin plan prices (36 plans)** | `seedData.ts` `buildTiffinPlans` — carried from the app's catalog, which were themselves "placeholder, editable in admin". |
| 3.3 | **Per-dish tiffin prices** | `apps/api/src/modules/tiffin/tiffinDishData.ts` — synced from the app; confirm. |
| 3.4 | **Coupons** | `seedData.ts` — `WELCOME50`, `FLAT50…FLAT400`, `BOGO1`. Confirm which run at launch. |
| 3.5 | **Kitchen location** | `apps/api/.env` → `SHOP_LAT`, `SHOP_LNG` (default ≈ Boring Road, Patna). Set the exact kitchen coordinates — drives delivery distance, ETA, the rider map, and the delivery-radius check. |
| 3.6 | **Prep time** | `apps/api/.env` → `PREP_MINUTES` (default 15) — real average kitchen prep time; added to drive time for the customer ETA. |
| 3.7 | **Delivery radius** | `DELIVERY_MAX_KM` in `packages/shared-types/src/geo.ts` (default 8 km) — confirm; currently a code constant, promote to env if it needs tuning without a deploy. |
| 3.8 | **Menu-item photos** | Biryani Lane items have **none** (typography-card fallback). Some tiffin dishes have none. Drop JPEGs into `apps/api/public/menu-images/<slug>.jpg` / `tiffin-images/`, run `node scripts/optimizeImages.mjs`, flip `hasImage: true` on the biryani seed rows. |
| 3.9 | **Dark-mode hero variants** | Optional. `Brand.heroImageUrlDark` is wired but no assets exist — the light hero is used in dark mode until set. |
| 3.10 | **Footer line** | `apps/web/src/components/SiteFooter.tsx` — still says "Demo build · Delivery currently within Patna only". |

---

## 4. Still to build (not started)

| # | Item | Notes |
|---|---|---|
| 4.1 | **Razorpay webhook** | Right now reconciliation relies on the client calling `…/verify-payment` right after Checkout resolves. If that call never fires (app killed, network drop) the order sits at `payment.status: "pending"` with no recovery. Needs an **idempotency pass** on each verify path's side-effects (loyalty counter, membership extension, WhatsApp) before a webhook can safely reuse them. |
| 4.2 | **Legal pages** | No `/terms`, `/privacy`, `/refund-policy`, `/shipping-policy` pages. Razorpay's onboarding **requires** publicly linked T&C, Privacy, Refund/Cancellation, Contact and Shipping pages. Footer also needs FSSAI licence no., GST no., registered business address. |
| 4.3 | **Error monitoring** | No Sentry / logging service wired. |
| 4.4 | **Deployment config** | No Render/Vercel/Fly config committed. Node ≥ 20, `pnpm build`, env-var management, the API and web as two services, the `/api/*` rewrite (or a reverse proxy). |
| 4.5 | **Payment-pending sweeper** | A cron that flags/cancels orders stuck `pending` > N minutes (until 4.1 lands). |

---

## 5. Third-party service limits (geocoding / maps)

The delivery geocoding, routing and the rider map use **free public endpoints**
with usage policies that a real order volume will exceed:

| Service | Used for | Free-tier limit | Production option |
|---|---|---|---|
| **Nominatim** (`nominatim.openstreetmap.org`) | geocode the delivery address on order create | ~1 req/sec, no heavy/bulk use, real UA required | Self-host Nominatim, or a paid geocoder (LocationIQ, Mapbox, Google). Cache results per address. |
| **OSRM demo** (`router.project-osrm.org`) | shop→door distance + drive time | "demo server, not for production" | Self-host OSRM, or a paid routing API. |
| **OSM tiles** (`tile.openstreetmap.org`) | the rider tracking map (`components/LiveMap`) | OSMF tile-usage policy — no heavy use | Mapbox / MapTiler / Stadia Maps tile URL (drop-in swap in `LiveMap.tsx`). |

All three **fall back cleanly** if unavailable (city/pincode delivery check, a
time-based progress strip instead of the live map), so this isn't a launch
blocker — but plan the swap before marketing spend drives volume.

---

## 6. Rider-tracking privacy

The rider page already carries a short disclaimer ("used only for this delivery,
stops when marked delivered") and the token is single-order and admin-only. For
a real rollout: a one-line consent the rider taps before sharing, and a mention
in the privacy policy (§4.2).

---

## 7. Pre-launch test pass

- [ ] Razorpay **test** keys → run every paid flow + a cancellation/refund; then live keys.
- [ ] WhatsApp templates submitted and approved.
- [ ] Seed a real menu + prices into the production DB; verify `/checkout` totals.
- [ ] Place a real order end-to-end on the deployed HTTPS site, advance it, share a rider location from a phone, confirm the customer map moves.
- [ ] `NODE_ENV=production`, `SEED_ON_BOOT` unset, rate limiter active.
- [ ] Lighthouse / mobile check on the key pages.
