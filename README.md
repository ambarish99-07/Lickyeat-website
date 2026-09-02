# Lickyeat Website

Full ordering web app for **lickyeat.com** — Next.js customer site + Express API + admin section,
in a pnpm / Turborepo monorepo. Three brands under one umbrella: **The Blenders Club**,
**The Alchemy Tails** (shakes & mocktails, cart checkout) and **GG Tiffin Service** (home-style
tiffin subscriptions + single meals).

See [AGENT.md](AGENT.md) for architecture, business rules, and the full feature map.

## Quick start

```bash
pnpm install
pnpm --filter @lickyeat/shared-types build
pnpm --filter @lickyeat/pricing build

# Terminal 1 — API on :4100 (in-memory Mongo, data not persisted)
pnpm --filter @lickyeat/api dev

# Terminal 2 — web on :3100
pnpm --filter @lickyeat/web dev
```

Open http://localhost:3100.

### Seeding & admin

Point `apps/api/.env` at a real `MONGODB_URI` (so the seed and the dev server share a DB), then:

```bash
pnpm seed                                        # brands, menu, combos, coupons
# sign up through the web app, then:
pnpm --filter @lickyeat/api promote-admin you@example.com
```

## Workspace

| Package | What |
|---|---|
| `packages/shared-types` | zod schemas — the single source of truth for every payload/document shape |
| `packages/pricing` | pure, I/O-free pricing engine (+ unit tests) |
| `apps/api` | Express 5 + Mongoose 8 REST API |
| `apps/web` | Next.js 15 (App Router) + Tailwind |

## Scripts (repo root)

- `pnpm dev` — everything via Turbo
- `pnpm -r typecheck`
- `pnpm -r test`
- `pnpm build`

## Branch

Active development happens on `develop` (the default branch).
