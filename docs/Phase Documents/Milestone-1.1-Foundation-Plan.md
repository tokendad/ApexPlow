# Milestone 1.1 — Foundation: Implementation Plan

**Status:** Approved — Ready for Implementation
**Date:** 2026-02-25
**Phase:** Phase 1 MVP
**Estimated Duration:** Weeks 1–3

---

## Overview

Milestone 1.1 establishes the complete technical foundation for the PlowDispatch platform. The monorepo scaffold and initial packages now exist; this milestone confirms the baseline is complete, consistent, and verifiable. On completion, the database schema is deployed, the backend API is running with authentication, core business logic is tested, and all three frontend app shells are in place.

**Definition of Done:** `turbo run typecheck` passes, `turbo run build` succeeds, all database migrations apply, the health endpoint responds, auth flows (register/login/refresh/logout) work, and job radius rejection and state machine violations produce the correct error responses.

---

## Environment

| Item | Value |
|---|---|
| Node.js | v20 (installed); v22 is spec target — noted in README |
| Package manager | pnpm 9 (install before starting) |
| ORM / Migrations | Drizzle ORM + drizzle-kit |
| Docker | 28.3.3 + Compose v2.39.1 |
| Project root | `/data/ApexPlow` |

---

## Target Directory Structure

```
/data/ApexPlow/
├── apps/
│   ├── api/          — Fastify v5 + TypeScript backend
│   ├── admin/        — React 19 + Vite 6 (empty shell)
│   ├── customer/     — React 19 + Vite 6 PWA (empty shell)
│   ├── driver/       — React 19 + Vite 6 PWA (empty shell)
│   └── worker/       — pg-boss background jobs (empty shell)
├── packages/
│   ├── types/        — Shared TypeScript interfaces
│   ├── utils/        — Shared business logic
│   └── ui/           — Shared React component library (empty shell)
├── docs/             — (existing planning documents)
├── docker-compose.yml
├── package.json      — pnpm workspaces root
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.json     — base TypeScript config
├── .eslintrc.json
├── .prettierrc
└── .gitignore
```

---

## Implementation Steps

### Step 1 — Bootstrap (Sequential — must complete first)

1. Install pnpm 9: `curl -fsSL https://get.pnpm.io/install.sh | sh -`
2. Create root `package.json` with pnpm workspaces, engines, and devDependencies (turbo, typescript, prettier, eslint)
3. Create `pnpm-workspace.yaml` declaring `apps/*` and `packages/*`
4. Create `turbo.json` with task graph (build, dev, lint, typecheck, test, db:generate, db:migrate, db:studio)
5. Create root `tsconfig.json` (base: target ES2022, module NodeNext, strict, exactOptionalPropertyTypes)
6. Create `.prettierrc`, `.eslintrc.json`, `.gitignore`, `.nvmrc` (value: `22`)
7. Add README note: "Node.js v22 LTS is the spec target. v20 is currently in use for local dev."
8. Run `pnpm install`

### Step 2 — Shared Packages (Parallel, after Step 1)

Three packages created simultaneously. All follow the same pattern: `package.json`, `tsconfig.json`, `src/index.ts`.

**packages/types** — TypeScript interfaces only, zero runtime dependencies:

| File | Contents |
|---|---|
| `user.types.ts` | User, UserRole, JwtPayload |
| `job.types.ts` | Job, JobStatus, JobType, ServiceType, PaymentMethod, VALID_JOB_TRANSITIONS map |
| `driver.types.ts` | DriverProfile, DriverStatus |
| `pricing.types.ts` | PricingTier, CancellationRule, ServiceArea |
| `api.types.ts` | ApiResponse\<T\>, ApiError, PaginatedResponse\<T\> |
| `sse.types.ts` | SseServerMessage union type |

**packages/utils** — Business logic (depends on `@plowdispatch/types`):

| File | Contents |
|---|---|
| `haversine.ts` | `haversineDistanceMiles()`, `isWithinServiceArea()` |
| `cancellation.ts` | `computeCancellationCharge()` — reads CancellationRule[] from DB |
| `job-state-machine.ts` | `isValidTransition()`, `assertValidTransition()` |
| `*.test.ts` | Vitest unit tests for all three utilities |

**packages/ui** — Empty shell (builds cleanly; components added in Milestone 1.2+)

### Step 3 — Docker Compose (Parallel with Step 2)

File: `/data/ApexPlow/docker-compose.yml`

| Service | Image | Port | Notes |
|---|---|---|---|
| postgres | postgis/postgis:17-3.4-alpine | 5432 | PostGIS enabled, named volume, health check |
| redis | redis:8-alpine | 6379 | Named volume, health check |
| migrate | node:20-alpine | — | Runs `pnpm --filter api db:migrate`, exits; depends_on postgres healthy |

Also create:
- `apps/api/.env.example` — DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT
- `.env.example` at project root (mirrors api example)

### Step 4 — API Application (Parallel with Step 2)

Directory: `apps/api/`

**Drizzle schema** (`apps/api/src/db/schema/`):

All 12 tables. Every table includes `organization_id UUID nullable` as a Phase 2 multi-tenancy stub.

| Table | Key fields |
|---|---|
| `users` | id, email, phone, password_hash, role, full_name, is_active |
| `driver_profiles` | user_id, status, paypal_link, venmo_link, current_location (lat/lng) |
| `customer_profiles` | user_id, preferred_contact, is_soft_account |
| `service_locations` | customer_id, address fields, lat, lng |
| `jobs` | customer_id, driver_id, driveway_tier_id, status, job_type, service_type, quoted_price_cents, final_price_cents, payment_method |
| `job_status_history` | job_id, from_status, to_status, changed_by_user_id |
| `job_price_changes` | job_id, changed_by_user_id, old_price_cents, new_price_cents (**no reason field**) |
| `pricing_config` | tier_label, price_cents, sort_order — **seeded: 6 NE default tiers** |
| `service_area_config` | home_base_address, center_lat, center_lng, radius_miles |
| `cancellation_rules` | job_type, hours_before_threshold, charge_percent — **seeded: 6 rules** |
| `waitlist` | customer_id, location fields, status, promoted_job_id |
| `refresh_tokens` | user_id, token_hash, expires_at, revoked_at |

**Pricing config seed data:**

| Tier | Label | Default Price |
|---|---|---|
| 1 | 1-Car Driveway | $65 |
| 2 | 2-Car Driveway | $85 |
| 3 | 3-Car Driveway | $105 |
| 4 | 4-Car Driveway | $125 |
| 5 | 5-Car Driveway | $145 |
| 6 | 6-Car Driveway | $165 |

**Cancellation rules seed data:**

| Job Type | Hours Before | Charge % |
|---|---|---|
| scheduled | > 24 | 0% |
| scheduled | 12–24 | 0% |
| scheduled | 6–12 | 25% |
| scheduled | < 6 / en-route | 50% |
| asap | before en-route | 0% |
| asap | after en-route | 25% |

**Fastify application structure:**

```
src/
  app.ts               — Fastify instance creation, plugin registration
  server.ts            — entry point, listen, graceful shutdown
  plugins/
    db.ts              — Drizzle + postgres.js (decorated on fastify instance)
    redis.ts           — ioredis connection
    auth.ts            — @fastify/jwt + HttpOnly refresh cookie logic
    cors.ts            — @fastify/cors (allow-listed origins)
    helmet.ts          — @fastify/helmet (security headers)
    rate-limit.ts      — @fastify/rate-limit (60 req/min unauth, 300 auth)
  routes/
    auth/              — POST register, login, refresh, logout
    drivers/           — GET/PATCH me, status, jobs
    customers/         — GET/PATCH me, locations CRUD
    jobs/              — POST/GET/PATCH/DELETE, status transitions
    pricing/           — GET tiers, POST estimate
    admin/             — GET dashboard
    health/            — GET /api/v1/health (no auth required)
  services/
    auth.service.ts    — register, login, refresh, argon2id hashing
    job.service.ts     — createJob (radius check), updateJobStatus (state machine)
    pricing.service.ts — getTiers, estimatePrice
    cancellation.service.ts — computeCharge (wraps @plowdispatch/utils)
  middleware/
    require-role.ts    — preHandler role guard (driver | customer | admin)
```

**Authentication:**
- `@fastify/jwt` — access token, 15-minute expiry, HS256
- `@fastify/cookie` — HttpOnly refresh token, 30-day expiry, SHA-256 hashed in DB
- `argon2` — Argon2id password hashing (not bcrypt)

### Step 5 — Frontend Shells (Parallel with Step 4)

Each created with `pnpm create vite --template react-ts` and trimmed to minimum viable shell.

| App | Type | Default render |
|---|---|---|
| `apps/admin/` | React + Vite | "Admin Portal — Coming Soon" |
| `apps/customer/` | React + Vite PWA | "Customer Portal — Coming Soon" |
| `apps/driver/` | React + Vite PWA | "Driver App — Coming Soon" |
| `apps/worker/` | Node.js only | pg-boss connection stub, no UI |

PWA apps include `vite-plugin-pwa` with a minimal manifest (name, icons, theme color, display: standalone).

### Step 6 — Integration and Verification (Sequential — after all above)

1. `pnpm install` — full install across all workspaces
2. `turbo run typecheck` — 0 errors required
3. `turbo run build` — all packages and apps must succeed
4. `docker compose up -d` — postgres and redis must reach healthy state
5. `pnpm --filter api db:migrate` — all 12 tables created
6. `turbo run test` — utils unit tests pass
7. Start API: `pnpm --filter api dev`
8. Smoke tests (see Verification Checklist below)

---

## Agent Assignments

| Agent | Responsibility |
|---|---|
| docker-expert | Step 3 — `docker-compose.yml`, `.env.example` files, health checks |
| frontend-developer | Step 5 — three frontend PWA shells + worker shell |
| general-purpose (backend) | Step 4 — Fastify app, Drizzle schema, auth, services, routes |
| Main (coordinator) | Steps 1–2 (monorepo bootstrap + shared packages), Step 6 (verification + wiring) |

---

## Key Package Versions

| Package | Version |
|---|---|
| turbo | 2.x latest |
| typescript | 5.x |
| fastify | 5.x |
| @fastify/jwt | 9.x |
| @fastify/cors | 10.x |
| @fastify/helmet | 12.x |
| @fastify/cookie | 11.x |
| @fastify/rate-limit | 9.x |
| drizzle-orm | 0.38.x |
| drizzle-kit | 0.30.x |
| postgres (postgres.js) | 3.x |
| ioredis | 5.x |
| argon2 | 0.43.x |
| zod | 3.x |
| tsx | 4.x |
| vite | 6.x |
| react | 19.x |
| vitest | 3.x |

---

## Verification Checklist

- [ ] `turbo run typecheck` — 0 errors across all workspaces
- [ ] `turbo run build` — all builds succeed (api, admin, customer, driver, worker, types, utils, ui)
- [ ] `docker compose up -d` — postgres and redis containers reach healthy state
- [ ] `pnpm --filter api db:migrate` — all 12 tables created, seed data present
- [ ] `turbo run test` — haversine, cancellation engine, and state machine tests all pass
- [ ] `GET /api/v1/health` → 200 `{"status":"ok"}`
- [ ] Auth: register → login → access token → refresh → new tokens → logout
- [ ] `POST /api/v1/jobs` with out-of-area coordinates → 422 with `OUTSIDE_SERVICE_AREA` error code
- [ ] Invalid job status transition → 400 with `INVALID_STATUS_TRANSITION` error code

---

## Dependencies on This Milestone

Milestone 1.1 **must** be complete before any of the following can begin:

- **Milestone 1.2** — Admin Onboarding + Dispatch Portal (requires API + DB)
- **Milestone 1.3** — Driver Interface (requires real-time foundation)
- **Milestone 1.4** — Customer Interface (requires auth + job creation API)
- **Milestone 1.5** — Integration Testing (requires all of the above)
