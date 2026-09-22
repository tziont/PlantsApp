# CLAUDE.md
We're building the app described in @SPEC.MD. Read that file for general ardhitectural tasks or to double-check the exact database structure, tech stackor application architecture.

Keep yur replies extremely concise and focus on conveying the key information.  No long code snippets.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # dev server (Turbopack) on http://localhost:3000
npm run build        # production build
npm start            # serve the production build
npm run lint         # eslint (flat config); `next lint` was removed in Next 16
npx tsc --noEmit     # typecheck
npx next typegen     # regenerate PageProps/LayoutProps/RouteContext type helpers
```

No test runner is installed yet. If one is added, follow the local guides in
`node_modules/next/dist/docs/01-app/02-guides/testing/` (vitest, jest, playwright, cypress)
and record the single-test invocation here.

## Repository state

The code is still the `create-next-app` scaffold ([app/layout.tsx](app/layout.tsx),
[app/page.tsx](app/page.tsx)). [SPEC.md](SPEC.md) is the authoritative plan for the real
application — **Plant Watering Control**, a POC for monitoring plant moisture sensors —
and is where design decisions live. Read the relevant SPEC.md section before building a
feature; nothing in sections 4–31 of it exists in code yet.

## Stack facts that differ from older Next.js

Next.js 16.3.5 / React 19.2.4, App Router, TypeScript `strict`.

- Request APIs are async-only: `await cookies()`, `await headers()`, and `await props.params` /
  `await props.searchParams` in `page`/`layout`/`route`. Synchronous access was removed in 16.
- Middleware is now `proxy.ts` exporting `proxy()`; node runtime only, not configurable.
- Turbopack is the default for both dev and build.
- `./src/*` in [tsconfig.json](tsconfig.json) maps to the **repo root**, not `src/`. SPEC.md sketches a
  `src/` layout; adopting it means updating that alias.
- Styling is SCSS + CSS Modules, per SPEC.md section 2. Tailwind was removed.

Per AGENTS.md, consult `node_modules/next/dist/docs/` (notably
`01-app/02-guides/upgrading/version-16.md`) rather than recalling API shapes.

## Styling

SCSS + CSS Modules (`sass-embedded`, configured in [next.config.ts](next.config.ts)).
`sassOptions.loadPaths` includes `src/styles`, so any `.scss` file can `@use 'mixins' as *`
without relative paths.

- [src/styles/globals.scss](src/styles/globals.scss) — the only global stylesheet, imported once
  by the root layout. Holds the reset, base element styles, and **all design tokens** as CSS
  custom properties in two tiers: primitives (`--green-600`, `--sand-100`) and semantic aliases
  (`--color-brand`, `--color-text`, `--space-4`, `--radius-md`, `--shadow-sm`). Components use the
  semantic tier only; dark mode reassigns that tier in one block.
- [src/styles/_tokens.scss](src/styles/_tokens.scss) — build-time-only values (breakpoint map,
  z-layers). Anything a browser can read at runtime is a custom property instead.
- [src/styles/_mixins.scss](src/styles/_mixins.scss) — `mq()` (mobile-first, em breakpoints),
  `container`, `card`, `focus-ring`, `visually-hidden`, `motion-safe`.
- Everything else is a colocated `*.module.scss`. No global class names, no hard-coded colours,
  spacing or radii — always a token.
- Shared primitives live in [src/components/ui/](src/components/ui/) (`Button` + `buttonClass()`
  for link-as-button, `Panel`, `EmptyState`) and [src/components/layout/](src/components/layout/)
  (`SiteHeader`, `SiteFooter`, `PageShell`).
- Mobile-first: write the phone layout, then layer `@include mq('md')`. Prefer intrinsic layout
  (`auto-fit` grids, `clamp()` type) over breakpoints where it works.

## Intended architecture (from SPEC.md)

Layering, strictly one direction — UI → route handlers → services → models:

```
app/api/**/route.ts   thin: auth check, parse, delegate, map errors
services/             business logic; the only caller of sensor + AI layers
models/               Mongoose schemas for app-owned collections only
lib/db.ts             cached Mongoose connection (reused across requests)
```

Non-negotiable boundaries:

- **Browser never talks to MongoDB or the AI provider.** All data access goes through the server;
  `MONGODB_URI`, `AI_API_KEY`, and Better Auth secrets stay server-side.
- **Better Auth owns `user`, `session`, `account`, `verification`.** No `models/User.ts`, no writes
  to those collections, no re-implementing email/password rules. Read the current user via the
  Better Auth session API. Extra profile fields go through `user.additionalFields`.
- **Two clients, one pool.** The Better Auth MongoDB adapter needs a native driver `Db`; derive it
  from the Mongoose connection (`mongoose.connection.db` / `.getClient()`) instead of opening a
  second `MongoClient`.
- **Ownership scoping is server-side.** Query `Controller.findOne({ _id: id, ownerId: userId })`,
  never `findById(id)` — a user must not reach another user's controller by guessing an ID.
- **Hardware is behind an interface.** `MoistureSensor.getReading()` with `MockMoistureSensor` as
  the POC implementation; readings must drift realistically, not jump randomly. The mock is
  server-side and never touches MongoDB itself — services persist its readings.
- **AI is behind a service.** No OpenAI-specific code outside the AI provider module. Plant info is
  cached in MongoDB and only regenerated on a miss or when `plantName` changes.
- Refresh model is pull-only: visiting `/controllers` triggers a reading. No WebSockets/SSE/polling.
- API errors use a single envelope: `{ "error": { "code", "message" } }` with the code list in
  SPEC.md section 21.
