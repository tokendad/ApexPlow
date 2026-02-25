# ApexPlow / PlowDispatch — Project Roadmap

**Document version:** 3.0
**Date:** 2026-02-25
**Status:** Planning Complete — All decisions confirmed. Ready for implementation.

---

## Summary of Scope Decisions (v3.0)

The following scope decisions were confirmed by the product owner and are reflected throughout this document:

- Phase 1 targets **1 driver + 1 admin (same person — the driver/owner)**.
- **No Stripe / online payment processing in Phase 1.** Payment is collected in person at job completion (cash, card, PayPal, Venmo). The system records method + amount only. Driver's static PayPal/Venmo link is displayed on the job completion screen; customer enters the amount manually.
- **No ETA calculation in Phase 1.** Status indicator only ("Driver is on the way").
- **No driver earnings screen in Phase 1.**
- **No tip processing in Phase 1.**
- **No GPS data retention / location logging in Phase 1.**
- **No commercial account features in Phase 1** (schema will accommodate future expansion).
- **Foreground GPS only** in Phase 1. Background GPS requires a native app (Phase 2).
- **Android-first PWA.** Developer has Android/Google tooling. iOS support deferred. Physical test device: Samsung Galaxy S25, Android 16, Chrome 145.0.7632.109. All required PWA APIs are natively supported — no polyfills needed.
- **Soft accounts** for customers — auto-created on first order; password can be set later.
- **Job queue with current-job focus** on the driver screen.
- **Service area = automated radius enforcement** — admin configures a home base address during onboarding; the system geocodes it to a center lat/lng and applies the admin-set radius. Requests outside the radius are rejected at submission.
- **Pricing = hybrid driveway-size tiers.** Admin sets per-tier prices for 6 tiers (1-car through 6-car). Default rates pre-populated from 2026 New England research. Customer picks tier at request time. Driver or admin can modify price on the fly before job completion (logged with actor and timestamp; no reason field in Phase 1). Default rates: 1-car $65 / 2-car $85 / 3-car $105 / 4-car $125 / 5-car $145 / 6-car $165.
- **Cancellation tiers** enforced by the system (see Milestone 1.4).
- **"No drivers available" response:** Reject with message + option to join a low-priority waitlist. Waitlisted jobs appear in a separate section of the driver's queue — driver can voluntarily pick up a waitlist job, or admin can assign it from the portal. Customer is notified via their selected channel when the job is picked up.
- **Maps:** Google Maps Platform (existing API plan).
- **No GDPR** — US-only operations confirmed.

---

## Critical Path

The platform decision that previously blocked everything — **PWA vs. native app** — is now resolved:

> **Phase 1 Driver Interface = Android-first PWA (React + Vite). No React Native in Phase 1.**

With that resolved, the critical path for Phase 1 is:

```
[1] Data model + schema design
          ↓
[2] Authentication + role system (driver/admin shared, customer soft-account)
          ↓
[3] Job lifecycle state machine (API layer)
          ↓
[4] Real-time event bus (WebSocket + Redis Pub/Sub)
          ↓
    ┌─────┴──────┐
    ↓            ↓
[5] Admin    [5] Customer
    Portal       Interface
    (first)
          ↓
[6] Driver Interface
          ↓
[7] Payment Collection Recording
      (cash/card/PayPal/Venmo — no processor integration)
```

**GPS tracking, Stripe, routing APIs, and background location are NOT on the Phase 1 critical path.**

**The Admin Portal is still the first complete interface to ship.** It does not require GPS, push notifications, or payment processing. It allows the business to operate manually while the Driver and Customer interfaces are completed.

---

## Phase 1 — MVP (Target: 8–12 weeks)

**Goal:** A system that allows the driver/owner to operate the business end-to-end, even if some steps require manual intervention. One driver, one admin, same person.

**Definition of Done:** A customer can request a plow via the website; the driver/admin can see and accept the job; the driver can navigate to the job and mark it complete; the customer receives a notification; payment method and amount are recorded.

---

### Milestone 1.1 — Foundation (Weeks 1–3)

**Database schema — core tables:**

- `users` — base identity with role (`driver_admin`, `customer`)
- `driver_profiles` — availability_status, paypal_link, venmo_link
- `customer_profiles` — preferred_contact, soft_account flag
- `service_locations` — lat/lng, street, city, state, zip, customer_id, geocoded flag
- `jobs` — customer_id, location_id, service_tier, driveway_size, quoted_price, final_price, price_modified_by, price_modified_at, status, job_type (asap | scheduled), payment_method, payment_amount, waitlisted, notes, scheduled_for, created_at
- `job_status_history` — job_id, from_status, to_status, changed_by, changed_at
- `job_price_changes` — job_id, changed_by, changed_at, old_price_cents, new_price_cents. No reason/note field in Phase 1; reason is a Phase 2 enhancement.
- `pricing_config` — tier_label ("1-car" through "6-car"), price_cents, active, sort_order. Phase 1 ships with 6 active tiers seeded at defaults ($65/$85/$105/$125/$145/$165). Upper tier limit is 6-car (3×3 pattern — 48 ft long × 27 ft wide). Admin can edit prices but the tier count is fixed for Phase 1.
- `service_area_config` — center_lat, center_lng, center_address, center_address_label, radius_miles, active. Center is derived by geocoding the admin's home base address entered during onboarding.
- `cancellation_rules` — job_type, hours_before_threshold, charge_percent (config-driven, no hardcoded values)

**Schema design notes:**
- Include `organization_id` as a nullable column on all major tables (defaults null for Phase 1). This is zero-cost insurance against a future multi-tenant migration — no multi-tenancy logic is implemented in Phase 1.
- Include `service_type` enum with values `residential` (active) and `commercial` (present but not exposed in Phase 1 UI) to avoid a future schema migration.
- Include `recurring_schedule` as a nullable JSONB column on `jobs` for future seasonal/commercial use.
- Include `tip_amount_cents` as a nullable column on `jobs` for future tip support — no UI in Phase 1.

**Backend:**
- API scaffolded with full CRUD for core entities (Fastify v5 + TypeScript)
- Authentication: two active roles for Phase 1 — `driver_admin` (combined role for the owner) and `customer`. JWT + refresh token rotation. Role system is internally three-role (`customer`, `driver`, `admin`); Phase 1 assigns the owner both `driver` and `admin` claims.
- Job state machine implemented and enforced at the API layer
- Service area radius validation on job creation endpoint — requests outside radius rejected with a structured error response
- Cancellation rule engine — reads `cancellation_rules` table to compute charge amounts; no hardcoded percentages

**Job state machine (Phase 1):**

```
PENDING → ACCEPTED → EN_ROUTE → IN_PROGRESS → COMPLETED
        ↓          ↓           ↓
     REJECTED   CANCELLED   CANCELLED (charge % computed by cancellation engine)

WAITLISTED → PENDING (driver voluntarily picks up from waitlist section, OR admin promotes via portal)
```

When a WAITLISTED job transitions to PENDING via driver pickup or admin promotion, the customer is notified through their selected channel (SMS / email). No ETA is provided. Driver may contact customer directly.

**Monorepo scaffold:**
```
/apps/api          — Backend API + WebSocket (Node.js 22 LTS / TypeScript / Fastify v5)
/apps/admin        — Admin portal (React 19 + Vite 6, desktop-first)
/apps/customer     — Customer interface (React 19 + Vite 6 PWA, mobile-first)
/apps/driver       — Driver interface (React 19 + Vite 6 PWA, Android-first)
/apps/worker       — Background job processor (notification dispatch, cancellation engine)

/packages/types    — Shared TypeScript interfaces (Job, Driver, Customer, PricingTier, etc.)
/packages/ui       — Shared React component library
/packages/utils    — Shared utilities (cancellation math, radius check, status labels)
```

**Infrastructure:**
- Local development: Docker Compose with PostgreSQL 17 + PostGIS 3.5 and Redis 8
- CI pipeline: lint, typecheck, test on every PR (GitHub Actions)

---

### Milestone 1.2 — Admin Onboarding + Dispatch Portal (Weeks 3–6)

This is the first interface delivered because it unblocks the business immediately. Because the admin is the driver/owner, this milestone also delivers a one-time setup wizard that must be completed before the system is usable.

#### 1.2a — Admin Onboarding Wizard (First-Run Setup)

When the admin logs in for the first time, a required setup wizard walks through three steps before the dispatch portal is accessible. All values can be changed later in Settings.

**Step 1 — Service Area**
- Admin enters their home base or depot address using a Google Maps Places autocomplete field
- System geocodes the address to a lat/lng, which becomes the center of the service area radius
- The address string is stored as a human-readable label in `service_area_config.center_address_label`
- Radius slider: 1–50 miles, displayed as a shaded circle overlay on the map
- Map view (Google Maps) shows the geocoded center pin and radius overlay — the pin is not draggable; the address field drives the center
- Save writes to `service_area_config` (center_lat, center_lng, center_address, center_address_label, radius_miles)

**Step 2 — Pricing Tiers**
- Pre-populated with 2026 New England reference rates as starting defaults (6 active tiers):
  - 1-car driveway: $65
  - 2-car driveway: $85
  - 3-car driveway: $105
  - 4-car driveway: $125
  - 5-car driveway: $145
  - 6-car driveway: $165
- Admin can edit any price; tier labels are editable (customer sees these on the request form)
- 6-car is the maximum supported tier for Phase 1 (3×3 pattern — 48 ft long × 27 ft wide)
- Save writes to `pricing_config`

**Step 3 — Payment Collection Setup**
- PayPal.me link field (e.g., `https://paypal.me/yourusername`)
- Venmo username or deep-link field
- Note displayed: "These static links will be shown to the customer on the job completion screen so they can pay you directly. The customer will manually enter the job amount."
- Save writes to `driver_profiles` (paypal_link, venmo_link)
- No QR image upload needed — static links are displayed as tap-to-open links and rendered as QR codes by the app at display time (no dynamic amount pre-fill)

After all three steps complete, the wizard marks onboarding done and the full portal unlocks. Each step is also accessible later from Settings.

#### 1.2b — Admin Dispatch Portal

- Dispatcher login
- **Job board:** live-updating list of all active jobs, sortable by status and scheduled time; waitlisted jobs shown in a separate section below the active job list
- **Manual job creation form** (phone-in orders): customer lookup or quick-add (name + phone/email), address input with Google Maps autocomplete + pin, driveway size picker (pulls from `pricing_config`), job type toggle (ASAP | Scheduled), date/time picker, notes field
- **Inline price override:** admin can edit the final price on any open job; change logged to `job_price_changes` with actor and timestamp. No reason field in Phase 1.
- **Driver status indicator:** shows single driver's current status (Available / Busy / Offline) at top of dashboard
- **Waitlist management:** admin can promote a waitlisted job to PENDING (notifies driver and triggers customer notification), or remove it from the waitlist. Driver can also pick up a waitlist job directly from the driver interface.
- **Payment recording:** on job completion, record payment method (cash / card / PayPal / Venmo) and amount collected
- **Basic financial summary:** jobs completed today, total amount collected today
- **Settings menu:** links back to all three onboarding wizard sections for updates

---

### Milestone 1.3 — Driver Interface (Weeks 5–8, overlaps Admin)

- Driver login on Android mobile browser (PWA, installed to home screen)
- **PWA compatibility baseline:** Android 16 / Chrome 145.0.7632.109 (Samsung Galaxy S25). All required PWA APIs supported natively: Geolocation, Web Push (Phase 2), IndexedDB, Screen Wake Lock, Vibration API. No polyfills or fallbacks needed for Phase 1.
- **Job queue:** list of assigned jobs sorted by priority; current active job pinned at top; waitlisted jobs shown in a separate section below active queue — driver can voluntarily pick up a waitlist job from this section
- **Current job card:** customer name, address, driveway size, quoted price, notes
- **Navigate button:** opens address in Google Maps (native app) for turn-by-turn directions
- **Status toggles (large buttons):** Accept Job → Mark En Route → Mark Complete
- **On-the-fly price edit:** driver can adjust the final price before tapping Mark Complete; change is logged to `job_price_changes` with actor and timestamp. No reason field in Phase 1.
- **Job completion screen:** displays final price prominently; shows static PayPal and/or Venmo link rendered as a QR code and a tap-to-open button. Customer opens the link and enters the amount manually.
- **Driver availability toggle:** Available / Offline (self-managed; no admin override)
- Foreground GPS used only for the map link — no continuous tracking in Phase 1
- High-contrast, large-button UI optimized for gloved hands and low-light conditions

---

### Milestone 1.4 — Customer Interface (Weeks 7–10, overlaps Driver)

- Public-facing service request form — no login required to start
- **Service area validation:** address geocoded on input; outside-radius requests rejected immediately with a friendly message
- **Address input:** Google Maps Places autocomplete + draggable map pin
- **Driveway size picker:** labeled tiers from `pricing_config` with prices displayed (e.g., "2-car driveway — $85"). Tiers run from 1-car ($65) through 6-car ($165).
- **Job type selection:** ASAP or Scheduled (date/time picker)
- **Soft account creation:** on first submission, system creates an account from customer's phone or email; confirmation sent so customer can optionally set a password later
- **Cancellation policy enforcement:**
  - Scheduled jobs:
    - Cancel ≥ 24 hours before: no charge
    - Cancel 12–24 hours before: no charge (grace window)
    - Cancel 6–12 hours before: 25% of quoted price
    - Cancel after dispatch (driver accepted or en route): 50% of quoted price
  - ASAP jobs:
    - Cancel before driver is en route: no charge
    - Cancel after driver is en route: 25% of quoted price
  - Charge amounts calculated by the cancellation engine (reads `cancellation_rules`). In Phase 1, collection is manual (admin notified, records the charge off-platform). Fee is stored on the job record for audit.
- **"No drivers available" handling:** if driver is Offline/Busy and job type is ASAP, customer sees a rejection message with a "Put me on the waitlist" option. Waitlisted jobs are visible to admin and driver from their respective interfaces. No ETA provided. If the job is picked up, customer is notified via their selected channel.
- **Status page** (shareable link, no login): shows current job status (Pending / Accepted / En Route / Complete). Status indicator only — no ETA in Phase 1.
- **Notifications:** SMS and/or email at: job confirmed, driver accepted, driver en route, job complete, waitlist job picked up. Customer selects preferred channel (SMS / email / both / none) at request submission.
- **Payment:** customer pays driver directly at completion (cash, card, PayPal, Venmo via static link). No payment form in Phase 1. Cancellation fees also collected off-platform in Phase 1.

---

### Milestone 1.5 — Integration and Stabilization (Weeks 10–12)

- End-to-end flow tests:
  - Customer request (ASAP) → driver accepts → driver completes → payment recorded → customer notified
  - Admin manual entry → driver accepts → driver completes
  - Customer cancels scheduled job within 6–12 hour window → 25% fee recorded on job
  - Customer requests outside service radius → rejected at form submission with message
  - Customer joins waitlist → driver picks up from waitlist section OR admin promotes to PENDING → customer notified via selected channel
  - Driver modifies price before completion → change logged to `job_price_changes` with actor + timestamp (no reason field)
- Error handling: driver goes offline mid-job, address outside radius, price modified pre-completion
- Basic logging and monitoring: Sentry, structured JSON logs
- Production deployment (Fly.io)
- Admin onboarding wizard tested on a fresh account (verifies 6-tier pricing seed data and home base address geocoding)

---

## Phase 2 — Operational Efficiency (10–14 weeks after Phase 1 launch)

**Goal:** Online payments, multiple drivers, auto-dispatch, ETA, and features that make the product competitive with consumer apps.

### Payment Processing (Stripe)
- Stripe integration: online payment at job completion (Payment Intents)
- Customer saved payment methods (card on file)
- Automatic receipt generation
- Tip prompt after job completion
- Driver payout tracking per pay period (Stripe Connect for gig-style 1099 drivers)
- Commercial invoicing (Stripe Invoice API)

### Multi-Driver + Gig Dispatch
- Multiple driver accounts with individual profiles
- Gig-style driver onboarding (1099 / independent contractor model)
- Auto-dispatch algorithm: system offers job to nearest available driver; configurable accept/reject window before offering to next driver
- Manual dispatch override remains available for admin
- Driver location on admin map view (requires continuous GPS reporting from driver app)
- Driver earnings summary screen (jobs completed, payout this period)

### ETA Calculation
- Google Directions API (or Mapbox) integration
- Real-time ETA displayed on customer status page
- ETA updates as driver status changes

### Background GPS Tracking
- Evaluate PWA background geolocation feasibility on Android (Chrome + service worker)
- If PWA limitation is reached: scope React Native (Expo) driver app for Phase 2
- Continuous location updates stored to `driver_locations` table (partitioned by month)
- 90-day retention policy with automated partition-drop background job

### Customer Accounts Upgrade
- Full login and account management
- Saved addresses (home, rental property, etc.)
- Job history view with payment records
- Preferred driver option

### Admin Portal Upgrades
- Drag-and-drop job board for manual reordering
- Bulk job creation for recurring accounts
- CSV export for accounting
- Admin alert when job sits unassigned for more than N minutes (configurable)

### Audit Log Enhancements
- Add reason/note field to `job_price_changes` for driver and admin price overrides
- Reason captured via a short free-text or predefined-option input at time of change

### Notifications Upgrade
- Customer notification preferences persisted to account
- Browser push notifications for driver (PWA push API)

---

## Phase 3 — Scale and Intelligence (12–18 months post-launch)

### Weather API Integration
- Connect to Tomorrow.io or Weather.gov
- Proactive dispatch mode: flag upcoming storms, alert dispatcher to pre-stage drivers
- Storm severity scoring for automatic pricing tier suggestions

### Photo Confirmation
- Required for commercial jobs; optional for residential
- Photo stored to Cloudflare R2, attached to job record, visible to customer and admin

### Subscription and Seasonal Contracts
- Seasonal pass: customer pays upfront for all storm visits
- Priority queue for subscription customers
- Automatic job creation when storm detected for subscribed addresses
- Recurring billing via Stripe Billing

### Optimization and Automation
- Surge / dynamic pricing suggestions based on demand vs. capacity
- Route optimization for multi-job shifts
- Automated assignment refinement using proximity, queue depth, and historical data

### Commercial Account Features
- Square-footage-based pricing for commercial lots
- Per-visit and hourly billing models
- Photo documentation required on commercial jobs
- Formal contracts and invoicing workflow

---

## Confirmed Technology Stack

| Category | Confirmed | Notes |
|---|---|---|
| Backend | Node.js 22 LTS + TypeScript + Fastify v5 | Confirmed Q24 |
| Frontend | React 19 + Vite 6 (PWA) | No Next.js — SSR not needed (Q25) |
| Monorepo | Turborepo 2.x | — |
| Database | PostgreSQL 17 + PostGIS 3.5 | PostGIS for radius enforcement (Q2) |
| Managed Postgres | Neon or Fly Postgres | — |
| Cache / Pub-Sub | Redis 8 via Upstash | — |
| Real-time | WebSocket (ws v8) + Redis Pub/Sub | — |
| Job Queue | pg-boss (Phase 1) → BullMQ (Phase 2) | — |
| Maps | Google Maps Platform | Confirmed Q26 — existing API plan |
| Payments | None Phase 1 → Stripe Phase 2 | Q8, Q9 confirmed |
| SMS | Twilio | — |
| Email | Resend | — |
| Push | Firebase Cloud Messaging (Phase 2+) | Phase 1: browser alert only |
| File Storage | Cloudflare R2 | Phase 3 (photo confirmation) |
| Hosting | Fly.io | — |
| CI/CD | GitHub Actions | — |
| Error Tracking | Sentry | — |
| Driver PWA Baseline | Android 16 / Chrome 145.0.7632.109 | Samsung Galaxy S25 (Q33). All PWA APIs supported natively (Geolocation, Web Push, IndexedDB, Screen Wake Lock, Vibration). No polyfills needed. Android Studio available for virtual device testing. |

---

## Implementation Sequence Dependencies

| Step | Depends On | Unblocks |
|---|---|---|
| Database schema | Nothing | Everything |
| Auth / role system | Schema | All interfaces |
| Service area config + validation | Schema | Customer request form, job creation API |
| Pricing config | Schema | Customer request form, admin onboarding |
| Cancellation rule engine | Schema + Pricing config | Customer cancellation flow, charge recording |
| Job state machine | Auth | Admin portal, Driver interface |
| Real-time event bus | Job state machine | Customer interface, Admin live board |
| Admin onboarding wizard | Pricing config, Service area config | Admin portal unlock |
| Admin dispatch portal | State machine + onboarding | Business operations (Phase 1 go-live) |
| Driver interface | Real-time | Customer live status |
| Customer interface | Real-time + cancellation engine | Self-serve requests |
| Payment collection recording | Job completion flow | Revenue tracking (Phase 1) |
| Stripe payment processing | Customer interface | Online payment (Phase 2) |
| GPS tracking (continuous) | Native app evaluation (Phase 2) | Admin map view, route optimization |
| Photo confirmation | File storage + GPS | Dispute resolution (Phase 3) |
| Weather integration | Phase 3 baseline | Proactive dispatch (Phase 3) |
| Subscriptions | Stripe (Phase 2) | Priority customers (Phase 3) |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation | Status |
|---|---|---|---|---|
| iOS Safari PWA blocks driver GPS | High | Low (P1) / High (P2) | Phase 1 is Android-only foreground GPS — no iOS exposure. Phase 2 must re-evaluate; may require React Native. | Mitigated for Phase 1 |
| Multi-tenancy not in from day one | Low | High | `organization_id` nullable column on all major tables from schema v1. No logic in Phase 1 but migration cost near zero. | Mitigated |
| Pricing model changes mid-dev | Low | Medium | Pricing fully config-driven via `pricing_config` table — never hardcoded. Admin UI allows live changes. | Mitigated |
| Stripe complexity delays payments | Eliminated | — | Stripe deferred entirely to Phase 2. Phase 1 uses manual payment recording only. | Eliminated |
| GPS battery drain causes abandonment | Low (P1) | Low (P1) | Foreground-only GPS in Phase 1 — no background drain. Re-evaluate in Phase 2. | Mitigated for Phase 1 |
| Address geocoding costs spike | Low | Low | Geocoded results cached in `service_locations` table. Same address never re-geocoded. | Mitigated |
| Admin onboarding not completed before first order | Medium | High | System enforces wizard completion before dispatch portal unlocks. Service area and pricing must be set before any job can be created. | Mitigated by design |
| Cancellation fee collection manual in Phase 1 | Medium | Low | Charges calculated and recorded by system. Admin notified. Collection is off-platform. Acceptable for single-operator Phase 1. | Accepted for Phase 1 |
| PayPal/Venmo QR not usable at job site (gloves, dirty screen) | Low | Low | Large QR on completion screen; driver can also read out the URL verbally. Resolved: Static QR confirmed. Customer enters amount manually. No dynamic QR generation needed. | Resolved — Q34 |
| Service area radius rejects valid near-border address | Low | Medium | Admin can manually enter the job in the portal, which bypasses radius enforcement (admin-only endpoint). | Mitigated |
