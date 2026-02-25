# Milestone 1.2 — Admin Portal: Progress Document

**Status:** Complete
**Date:** 2026-02-25
**Phase:** Phase 1 MVP
**Depends on:** Milestone 1.1 (Foundation) — complete

---

## Summary

Milestone 1.2 delivered the full admin-facing backend and frontend for the PlowDispatch platform. It covers two distinct functional areas: the **onboarding wizard** (first-run configuration of service area, pricing tiers, and payment links) and the **dispatch portal** (day-to-day job management, driver monitoring, waitlist handling, and payment recording).

On completion of this milestone an admin can log in, complete setup, and run a full dispatch day entirely through the portal.

---

## What Was Built

### Backend — Admin Routes

**New file:** `apps/api/src/routes/admin/index.ts`
**Registered in:** `apps/api/src/app.ts`

All routes require the `requireRole('admin')` preHandler guard. No admin endpoint is reachable without a valid JWT carrying `role: "admin"`.

#### Onboarding Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/onboarding-status` | Returns `{ isComplete: boolean }` — true when service area, pricing, and driver profile are all configured. Used by the login page to route first-time admins to the wizard. |
| `GET` | `/api/v1/admin/service-area` | Returns the current active service area row. |
| `PUT` | `/api/v1/admin/service-area` | Upsert: deactivates the previous active row, inserts a new one. Accepts home base address + radius in miles. |
| `GET` | `/api/v1/admin/pricing` | Returns all active pricing tiers ordered by `sort_order`. |
| `PUT` | `/api/v1/admin/pricing` | Updates pricing tiers. The `isActive: true` filter is enforced on the query so historical (inactive) rows are never overwritten. |
| `GET` | `/api/v1/admin/payment-links` | Returns the current static payment link/QR configuration. |
| `PUT` | `/api/v1/admin/payment-links` | Upserts the payment links record. |

#### Dispatch Portal Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/dashboard` | Joined query returning: active jobs with customer name/phone/email, tier label, and price; waitlisted jobs; current driver status; today's summary (job count + total revenue in cents). |
| `GET` | `/api/v1/admin/driver-status` | Current driver availability state. |
| `POST` | `/api/v1/admin/jobs` | Manual job creation. Looks up customer by phone or email. Creates a soft account if no match is found — phone-only customers get a placeholder email (`noemail+{phone}@placeholder.invalid`). |
| `PATCH` | `/api/v1/admin/jobs/:id/price` | Price override. Enforces a terminal status guard (rejects with 409 if job is `cancelled`, `rejected`, or `completed`). Writes audit log row and updates `final_price_cents` in a single transaction. |
| `POST` | `/api/v1/admin/jobs/:id/payment` | Records payment method and amount. Enforces a payable status guard — only jobs in `in_progress` or `completed` state can receive a payment record. |
| `PATCH` | `/api/v1/admin/jobs/:id/status` | Admin-initiated status transition. Delegates to the shared state machine from `@plowdispatch/utils`. |
| `GET` | `/api/v1/admin/waitlist` | Returns all entries in `waiting` status. |
| `POST` | `/api/v1/admin/waitlist/:id/promote` | Atomic promotion: re-reads the waitlist entry status inside the transaction before proceeding, inserts a new job row, marks the entry as `promoted`, and sets `promoted_job_id`. Prevents double-promotion under concurrent requests. |
| `DELETE` | `/api/v1/admin/waitlist/:id` | Removes a waitlist entry. |

---

### Frontend — Admin App

**Location:** `apps/admin/src/` — 29 source files (new app, previously an empty shell from Milestone 1.1)

#### Design System

| File | Contents |
|------|----------|
| `styles/tokens.css` | CSS custom properties: brand orange `--color-apex: #F57C20`, slate palette, shadow scale, Inter body font, Space Grotesk heading font |
| `styles/admin.css` | Portal layout (flex sidebar + main), `.card`, `.btn`, `.btn-primary`, `.input`, `.modal-backdrop`, `.status-badge`, `.form-group` |

#### Core Infrastructure

| File | Purpose |
|------|---------|
| `api/client.ts` | `apiFetch<T>()` — reads Bearer token from `localStorage`, prepends `BASE_URL`, throws typed errors on non-2xx responses |
| `hooks/useAuth.ts` | User state held in React state (initialized from `localStorage`). `login()` stores token and user object; `logout()` clears both. `isAuthenticated` is derived as `user !== null` — reactive, no direct `localStorage` reads during renders. |
| `hooks/useDashboard.ts` | 15-second polling hook. Returns `{ activeJobs, waitlistedJobs, driverStatus, todaySummary }`. Typed with the `DashboardJob` interface including `paymentAmountCents: number | null`. |

#### Pages

| File | Purpose |
|------|---------|
| `LoginPage.tsx` | Email/password form. On success, fetches `/api/v1/admin/onboarding-status` and routes to `/onboarding` or `/portal`. |
| `OnboardingPage.tsx` | Three-step wizard: service area configuration → pricing tier editing → payment link setup. Step state managed locally; each step calls its respective PUT endpoint on advance. |
| `PortalPage.tsx` | Main dispatch dashboard. Renders job board, waitlist section, driver status badge, and today's summary. Drives the 15-second poll via `useDashboard`. |
| `SettingsPage.tsx` | Post-onboarding access to service area, pricing, and payment link settings. Reuses the same three step components in edit mode. |

#### Onboarding Step Components

| File | Purpose |
|------|---------|
| `StepServiceArea.tsx` | Address text input, radius slider (1–50 mi), and a Google Maps preview panel. Map loading uses `@googlemaps/js-api-loader` v2 (`setOptions` / `importLibrary` API). Map is progressive enhancement — renders correctly without `VITE_GOOGLE_MAPS_API_KEY` set. |
| `StepPricing.tsx` | Editable pricing tier table. Pre-populated with NE 2026 defaults (1-car $65 through 6-car $165). Admin edits prices before saving. |
| `StepPaymentLinks.tsx` | Form fields for PayPal link, Venmo link, and optional QR image URL. |

#### Portal Components

| File | Purpose |
|------|---------|
| `JobBoard.tsx` | Groups jobs by status and renders them as a sorted list of `JobCard` items. |
| `JobCard.tsx` | Expandable card showing job details, customer info, and contextual action buttons. Button set changes per status: pending → Assign, assigned → En Route, arrived → Start Job, in_progress → Record Payment, completed → shows payment amount or "No payment recorded". Filters `@placeholder.invalid` addresses from customer email display. |
| `WaitlistSection.tsx` | Lists `waiting` waitlist entries. Each entry has Promote and Remove actions. |
| `NewJobModal.tsx` | Manual job creation form. Collects customer phone/email, address, driveway tier, and optional instructions. |
| `PaymentModal.tsx` | Records payment method (cash, card, PayPal, Venmo) and amount in cents. |
| `PriceOverrideModal.tsx` | Price override form with current price displayed and a confirmation step before submitting. |
| `DriverStatusBadge.tsx` | Colored indicator of current driver availability state (offline / available / en_route / on_job). |
| `TodaySummary.tsx` | Displays completed job count and total revenue for the current day. |
| `Sidebar.tsx` | Navigation sidebar with links to portal, settings, and logout action. |

#### Shared Components

`Button.tsx`, `Input.tsx`, `Modal.tsx`, `Spinner.tsx`, `StatusBadge.tsx`

---

## File Structure Added

```
apps/api/src/routes/admin/
  index.ts                     — all admin endpoints (new)

apps/admin/src/
  api/
    client.ts
  hooks/
    useAuth.ts
    useDashboard.ts
  pages/
    LoginPage.tsx
    OnboardingPage.tsx
    PortalPage.tsx
    SettingsPage.tsx
  components/
    onboarding/
      StepServiceArea.tsx
      StepPricing.tsx
      StepPaymentLinks.tsx
    portal/
      JobBoard.tsx
      JobCard.tsx
      WaitlistSection.tsx
      NewJobModal.tsx
      PaymentModal.tsx
      PriceOverrideModal.tsx
      DriverStatusBadge.tsx
      TodaySummary.tsx
      Sidebar.tsx
    shared/
      Button.tsx
      Input.tsx
      Modal.tsx
      Spinner.tsx
      StatusBadge.tsx
  styles/
    tokens.css
    admin.css
```

---

## Code Review Findings and Fixes

A code review of the initial implementation identified 10 issues across two severity levels. All were resolved before the milestone was marked complete.

### Critical Fixes (5)

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | Pricing PUT query targeted all rows including inactive (historical) ones — could corrupt pricing history | Added `isActive: true` filter to the update query |
| 2 | Waitlist promote had a race condition — two concurrent requests could double-promote the same entry | Wrapped in a database transaction; re-reads entry status inside the transaction before proceeding |
| 3 | Price override wrote the audit log and the job update as separate statements — could leave them inconsistent on crash | Moved audit log insert and price update into a single transaction; added terminal status guard returning 409 for `cancelled`, `rejected`, or `completed` jobs |
| 4 | Payment recording had no status guard — a payment could be recorded against a pending or cancelled job | Added payable status check: only `in_progress` or `completed` jobs accepted |
| 5 | Frontend was fetching `/api/v1/admin/onboarding/status` — path did not match the registered route | Corrected to `/api/v1/admin/onboarding-status` |

### Warning-Level Fixes (5)

| # | Issue | Fix Applied |
|---|-------|-------------|
| 6 | `useAuth.isAuthenticated` read directly from `localStorage` — not reactive, could miss updates | Changed to derive from React state: `isAuthenticated: user !== null` |
| 7 | `JobCard` completed state showed quoted price when no payment had been recorded, implying collection had occurred | Added check on `paymentAmountCents` — shows amount if present, "No payment recorded" if null |
| 8 | `JobCard` was missing the `arrived → in_progress` transition button | Added "Start Job" action button for the `arrived` status |
| 9 | `JobCard` displayed raw placeholder emails (`noemail+...@placeholder.invalid`) in the admin UI | Added filter: email is hidden if it contains `@placeholder.invalid` |
| 10 | `DashboardJob` TypeScript type was missing `paymentAmountCents` field — caused type errors after fix #7 | Added `paymentAmountCents: number \| null` to the interface |

---

## Verification Checklist

- [x] `pnpm turbo run typecheck` — 0 errors across all 16 workspaces
- [x] `pnpm turbo run build` — 16/16 tasks pass; admin app builds clean to `dist/`
- [x] `pnpm turbo run test` — 20/20 tests pass
- [x] All admin API endpoints registered in `apps/api/src/app.ts` and reachable
- [x] `GET /api/v1/admin/onboarding-status` returns `{ isComplete: false }` before setup
- [x] Onboarding wizard completes: service area saved, pricing tiers saved, payment links saved
- [x] `GET /api/v1/admin/onboarding-status` returns `{ isComplete: true }` after setup
- [x] Dashboard returns joined job data with customer name, tier label, and price
- [x] Manual job creation with phone-only customer creates soft account with placeholder email
- [x] Price override rejected with 409 for terminal-status jobs
- [x] Payment record rejected for jobs not in `in_progress` or `completed`
- [x] Waitlist promote is atomic (transaction with re-read guard)
- [x] Frontend admin app: login → onboarding → portal flow navigates correctly
- [x] Placeholder emails filtered from `JobCard` customer display
- [x] Google Maps panel in `StepServiceArea` loads when API key is present; degrades gracefully when absent

---

## Known Limitations and Phase 2 Deferrals

The following items were explicitly deferred and are not bugs or omissions in this milestone.

| Item | Notes |
|------|-------|
| Real-time dashboard updates | Portal polls every 15 seconds. WebSocket-based push updates (instant job board refresh) are a Phase 2 enhancement once the WebSocket hub is built in Milestone 1.3. |
| Stripe / formal payment processing | Cash, card, PayPal, and Venmo collected in person. App records method and amount only. Stripe integration is Phase 2. |
| Dynamic QR code generation | Payment QR codes are static links configured at onboarding. Customer enters amount manually. Dynamic QR per job is Phase 2. |
| Admin 2FA (TOTP) | Architecture document specifies TOTP via `otplib` for all admin accounts. Not implemented in Phase 1. |
| Price change reason field | Audit log records who, when, old price, and new price. No free-text reason field. Phase 2 will add a `reason TEXT` column to `job_price_changes`. |
| ETA calculation | No system-calculated ETAs. Admin notifies customers manually or via the notification system. Phase 2 item. |
| Driver earnings screen | Not part of Phase 1 admin portal. Phase 2. |
| Reporting endpoints | Architecture document includes `/api/v1/admin/reports/jobs` and `/api/v1/admin/reports/revenue`. Not implemented in Phase 1. |
| IP allowlisting for admin routes | Security hardening noted in architecture. Not enforced in Phase 1. |

---

## Development Setup

### Prerequisites

- Docker containers `apexplow-postgres-1` (port 5433) and `apexplow-redis-1` (port 6380) must be running and healthy
- Run `docker compose up -d` from the project root if they are not already running
- Milestone 1.1 migrations must have been applied (`pnpm db:migrate`)

### Optional: Google Maps

Set `VITE_GOOGLE_MAPS_API_KEY` in `apps/admin/.env` to enable the interactive map preview in the service area step. The onboarding wizard works without this key — the map panel is omitted via progressive enhancement.

```
# apps/admin/.env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### Starting the Dev Servers

Open two terminals from the project root:

```bash
# Terminal 1 — API server (port 3000)
pnpm --filter api dev

# Terminal 2 — Admin portal (port 5173)
pnpm --filter admin dev
```

Open http://localhost:5173 in a browser.

### First-Run Flow

1. Log in with the admin account created during Milestone 1.1 setup
2. The login page checks `/api/v1/admin/onboarding-status` and redirects to `/onboarding`
3. Complete all three steps:
   - Step 1: Enter home base address and set service radius
   - Step 2: Review and adjust pricing tier defaults (pre-populated with NE 2026 rates)
   - Step 3: Enter PayPal and/or Venmo static payment links
4. On completion, the portal opens at `/portal`

Subsequent logins skip the wizard and go directly to `/portal`.

---

## Dependencies on This Milestone

The following milestones require Milestone 1.2 to be complete:

- **Milestone 1.3** — Driver Interface: reads job queue and updates job status via the same state machine and API routes
- **Milestone 1.4** — Customer Interface: relies on the job creation logic and soft account creation patterns established here
- **Milestone 1.5** — Integration Testing: requires admin portal to drive end-to-end job lifecycle tests
