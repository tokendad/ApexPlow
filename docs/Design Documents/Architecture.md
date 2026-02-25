# ApexPlow / PlowDispatch — System Architecture Design

**Document version:** 1.1
**Date:** 2026-02-25
**Status:** Design Complete — All architectural decisions confirmed. Ready for implementation.

---

## Table of Contents

1. [Architectural Philosophy](#1-architectural-philosophy)
2. [Component Diagram](#2-component-diagram)
3. [Data Models](#3-data-models)
4. [Real-Time Strategy](#4-real-time-strategy)
5. [API Surface](#5-api-surface)
6. [Authentication Model](#6-authentication-model)
7. [Infrastructure](#7-infrastructure)
8. [Open Architectural Questions](#8-open-architectural-questions)

---

## 1. Architectural Philosophy

ApexPlow targets small and individual plow operators. The architecture must prioritize:

- **Low operational overhead** — The operator is not an engineering team. The system must run reliably with minimal human intervention.
- **Mobile reliability under adverse conditions** — Drivers operate in cold weather, with gloves, in areas with potentially spotty cell coverage. Driver-facing interactions must tolerate brief disconnections.
- **Right-sized scale** — This is not a ride-share platform. The architecture must be cost-efficient at 1–50 drivers without enterprise-level infrastructure costs.
- **Growth headroom** — The design should not require a rewrite to scale from one operator to a regional franchise.

The selected pattern is a **modular monolith deployed as a single service initially**, with clear internal domain boundaries that can be extracted into independent services if scale demands it. A shared PostgreSQL database with logical domain separation enforces isolation without the operational burden of polyglot persistence from day one.

---

## 2. Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                       │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │  Driver App     │  │  Customer Web   │  │  Admin Portal               │ │
│  │  (PWA / React)  │  │  (PWA / React)  │  │  (React SPA)                │ │
│  │  Mobile-first   │  │  Mobile-friendly│  │  Desktop-first              │ │
│  │  Service Worker │  │                 │  │                             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┬──────────────┘ │
└───────────┼────────────────────┼─────────────────────────┼────────────────┘
            │        HTTPS / WSS (TLS 1.3)                 │
┌───────────▼────────────────────▼──────────────────────────▼────────────────┐
│                          EDGE / GATEWAY LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CDN (Cloudflare) — static asset delivery, DDoS/WAF protection      │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│  ┌──────────────────────────────▼──────────────────────────────────────┐   │
│  │  API Gateway (Caddy v2)                                             │   │
│  │  - TLS termination                                                  │   │
│  │  - Route: /api/* → Application Server                              │   │
│  │  - Route: /ws/*  → WebSocket Server (same app, upgraded conn)      │   │
│  │  - Rate limiting per IP / per authenticated user                   │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────────┐
│                         APPLICATION LAYER                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  PlowDispatch API Server (Node.js / Fastify v5)                        │ │
│  │                                                                        │ │
│  │  Internal Domain Modules:                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │  Auth    │ │  Jobs    │ │  Drivers │ │ Customers│ │  Billing   │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐                                            │ │
│  │  │ Dispatch │ │  Notify  │                                            │ │
│  │  └──────────┘ └──────────┘                                            │ │
│  │                                                                        │ │
│  │  WebSocket Hub — driver location broadcast, job status fan-out        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Background Workers (same codebase, separate process)                  │ │
│  │  - Notification dispatch (SMS, email, push)                           │ │
│  │  - Invoice generation, charge processing                              │ │
│  │  - Batched GPS log writes, stale location cleanup                     │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────────────┐
│                          DATA / SERVICES LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │  PostgreSQL 17   │  │  Redis (Upstash) │  │  Object Storage (R2/S3)   │  │
│  │  + PostGIS       │  │  - WS pub/sub    │  │  - Completion photos      │  │
│  │  - All relational│  │  - Driver loc.   │  │  - Invoice PDFs           │  │
│  │    data          │  │    cache (TTL)   │  │  - Driver documents       │  │
│  │  - Geo queries   │  │  - Rate limiting │  │                           │  │
│  └──────────────────┘  └──────────────────┘  └───────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────┐                                 │
│  │  Job Queue       │  │  External APIs   │                                 │
│  │  (pg-boss MVP    │  │  Stripe, Twilio, │                                 │
│  │   → BullMQ)      │  │  Resend, FCM,    │                                 │
│  │                  │  │  Weather (future)│                                 │
│  └──────────────────┘  └──────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Decisions

- **Modular monolith, not microservices.** One deployable unit initially. Clean internal boundaries allow future extraction if needed without premature complexity.
- **Redis as the real-time coordination layer.** When the app scales to more than one instance, Redis Pub/Sub ensures WebSocket events produced on instance A reach clients connected to instance B.
- **PostGIS on PostgreSQL** eliminates a separate geospatial service. Proximity queries (`ST_DWithin`), route snapping, and service area polygons are handled in SQL.

---

## 3. Data Models

### 3.1 users (base identity)

```sql
id                UUID          PRIMARY KEY  DEFAULT gen_random_uuid()
email             TEXT          UNIQUE NOT NULL
phone             TEXT          UNIQUE
password_hash     TEXT          NOT NULL
role              TEXT          NOT NULL     -- 'driver' | 'customer' | 'admin'
full_name         TEXT          NOT NULL
is_active         BOOLEAN       DEFAULT true
email_verified_at TIMESTAMPTZ
phone_verified_at TIMESTAMPTZ
created_at        TIMESTAMPTZ   DEFAULT now()
updated_at        TIMESTAMPTZ   DEFAULT now()
last_login_at     TIMESTAMPTZ

Indexes: idx_users_email, idx_users_role
```

### 3.2 driver_profiles

```sql
id                UUID          PRIMARY KEY
user_id           UUID          REFERENCES users(id)
status            TEXT          DEFAULT 'offline'
                                -- 'offline' | 'available' | 'en_route' | 'on_job' | 'break'
vehicle_type      TEXT
vehicle_make      TEXT
vehicle_model     TEXT
vehicle_year      INT
license_plate     TEXT
service_radius_km NUMERIC(6,2)  DEFAULT 25.0
current_location  GEOGRAPHY(POINT, 4326)   -- updated live, hot path
location_updated_at TIMESTAMPTZ
paypal_link       TEXT          -- e.g. https://paypal.me/username (static, set at onboarding)
venmo_link        TEXT          -- e.g. https://venmo.com/username (static, set at onboarding)
qr_image_url      TEXT          -- optional uploaded QR image stored in R2
rating_avg        NUMERIC(3,2)
rating_count      INT           DEFAULT 0
notes             TEXT
created_at        TIMESTAMPTZ   DEFAULT now()
updated_at        TIMESTAMPTZ   DEFAULT now()

-- Static payment links configured once during onboarding Step 3.
-- Displayed on driver completion screen. Customer manually enters amount.

Indexes: idx_driver_profiles_user_id
         idx_driver_profiles_location  (GIST on current_location)
         idx_driver_profiles_status
```

### 3.3 customer_profiles

```sql
id                UUID          PRIMARY KEY
user_id           UUID          REFERENCES users(id)
preferred_contact TEXT          DEFAULT 'email'
billing_address   TEXT
stripe_customer_id TEXT
subscription_tier TEXT          DEFAULT 'standard'  -- 'standard' | 'priority' (Phase 3)
created_at        TIMESTAMPTZ   DEFAULT now()
updated_at        TIMESTAMPTZ   DEFAULT now()
```

### 3.4 service_locations

```sql
id                UUID          PRIMARY KEY
customer_id       UUID          REFERENCES customer_profiles(id)
label             TEXT          -- 'Home', 'Business', etc.
address_line1     TEXT          NOT NULL
address_line2     TEXT
city              TEXT          NOT NULL
state_province    TEXT          NOT NULL
postal_code       TEXT          NOT NULL
country           TEXT          DEFAULT 'US'
coordinates       GEOGRAPHY(POINT, 4326)  NOT NULL
is_default        BOOLEAN       DEFAULT false
created_at        TIMESTAMPTZ   DEFAULT now()

Indexes: idx_service_locations_customer_id
         idx_service_locations_coordinates  (GIST)
```

### 3.5 jobs (central entity)

```sql
id                UUID          PRIMARY KEY
customer_id       UUID          REFERENCES customer_profiles(id)
driver_id         UUID          REFERENCES driver_profiles(id)   -- null until assigned
location_id       UUID          REFERENCES service_locations(id)

-- Denormalized snapshot at time of creation (address may change later)
job_address       TEXT          NOT NULL
job_coordinates   GEOGRAPHY(POINT, 4326)  NOT NULL

status            TEXT          NOT NULL  DEFAULT 'pending'
                  -- 'pending' | 'assigned' | 'en_route' | 'arrived'
                  -- | 'in_progress' | 'completed' | 'cancelled' | 'disputed'

source            TEXT          DEFAULT 'customer'
                  -- 'customer' (self-served) | 'admin' (manual entry)

service_type      TEXT          DEFAULT 'residential'
                  -- 'residential' (Phase 1 active) | 'commercial' (Phase 2 stub)

driveway_tier_id  INT           REFERENCES pricing_config(id)
                  -- which pricing tier the customer selected (1-car through 6-car)

special_instructions TEXT

-- Pricing
quoted_price_cents    INT
final_price_cents     INT
pricing_model         TEXT          DEFAULT 'flat'
discount_cents        INT           DEFAULT 0

-- Timing
requested_at      TIMESTAMPTZ   DEFAULT now()
scheduled_for     TIMESTAMPTZ   -- null means ASAP
assigned_at       TIMESTAMPTZ
arrived_at        TIMESTAMPTZ
started_at        TIMESTAMPTZ
completed_at      TIMESTAMPTZ
cancelled_at      TIMESTAMPTZ
cancellation_reason TEXT

-- Completion
completion_photo_url  TEXT
completion_notes      TEXT

stripe_payment_intent_id TEXT
created_at        TIMESTAMPTZ   DEFAULT now()
updated_at        TIMESTAMPTZ   DEFAULT now()

Indexes: idx_jobs_customer_id, idx_jobs_driver_id
         idx_jobs_status, idx_jobs_scheduled_for
         idx_jobs_job_coordinates  (GIST)
```

### 3.6 job_status_events (append-only audit trail)

```sql
id                UUID          PRIMARY KEY
job_id            UUID          REFERENCES jobs(id)
previous_status   TEXT
new_status        TEXT          NOT NULL
changed_by_user_id UUID         REFERENCES users(id)   -- null for system events
coordinates       GEOGRAPHY(POINT, 4326)               -- driver GPS at time of change
notes             TEXT
created_at        TIMESTAMPTZ   DEFAULT now()

Index: idx_job_status_events_job_id
```

### 3.7 driver_location_log (time-series GPS pings)

```sql
id                BIGSERIAL     PRIMARY KEY
driver_id         UUID          REFERENCES driver_profiles(id)
coordinates       GEOGRAPHY(POINT, 4326)  NOT NULL
accuracy_m        NUMERIC(8,2)
recorded_at       TIMESTAMPTZ   NOT NULL  DEFAULT now()

Index: idx_location_log_driver_id_recorded_at  (driver_id, recorded_at DESC)

Notes:
  - Partitioned by month (PostgreSQL declarative partitioning) from day one.
  - Retention policy: 90 days online, archive or drop older partitions.
  - Deliberately separate from driver_profiles.current_location (hot path).
```

### 3.8 invoices

```sql
id                UUID          PRIMARY KEY
job_id            UUID          REFERENCES jobs(id)
customer_id       UUID          REFERENCES customer_profiles(id)
status            TEXT          DEFAULT 'draft'
                  -- 'draft' | 'sent' | 'paid' | 'void' | 'refunded'
subtotal_cents    INT           NOT NULL
tax_cents         INT           DEFAULT 0
total_cents       INT           NOT NULL
stripe_invoice_id TEXT
stripe_charge_id  TEXT
pdf_url           TEXT
issued_at         TIMESTAMPTZ
due_at            TIMESTAMPTZ
paid_at           TIMESTAMPTZ
created_at        TIMESTAMPTZ   DEFAULT now()
updated_at        TIMESTAMPTZ   DEFAULT now()
```

### 3.9 pricing_config (Phase 1 — 6 active tiers)

```sql
id                SERIAL        PRIMARY KEY
tier_label        TEXT          NOT NULL    -- '1-Car Driveway', '2-Car Driveway', etc.
price_cents       INT           NOT NULL    -- stored as cents; display as dollars
sort_order        INT           NOT NULL    -- determines picker order
is_active         BOOLEAN       DEFAULT true
created_at        TIMESTAMPTZ   DEFAULT now()
updated_at        TIMESTAMPTZ   DEFAULT now()

-- Phase 1 seed data (2026 New England reference rates, pre-populated in onboarding wizard):
-- (1, '1-Car Driveway',  6500, 1, true)   -- $65
-- (2, '2-Car Driveway',  8500, 2, true)   -- $85
-- (3, '3-Car Driveway', 10500, 3, true)   -- $105
-- (4, '4-Car Driveway', 12500, 4, true)   -- $125
-- (5, '5-Car Driveway', 14500, 5, true)   -- $145
-- (6, '6-Car Driveway', 16500, 6, true)   -- $165 (3×3 pattern, 48ft × 27ft max)
-- Admin edits these values during onboarding before saving. Labels are also editable.
```

### 3.10 service_area_config (home base + radius)

```sql
id                UUID          PRIMARY KEY DEFAULT gen_random_uuid()
home_base_address TEXT          NOT NULL    -- human-readable address entered by admin
center_lat        NUMERIC(10,7) NOT NULL    -- geocoded from home_base_address
center_lng        NUMERIC(10,7) NOT NULL
radius_miles      NUMERIC(5,2)  NOT NULL    -- admin sets via slider (1–50 mi)
is_active         BOOLEAN       DEFAULT true
created_at        TIMESTAMPTZ   DEFAULT now()
updated_at        TIMESTAMPTZ   DEFAULT now()

-- Notes:
-- One active row per operator in Phase 1.
-- center_lat/center_lng derived by geocoding home_base_address via Google Maps Geocoding API.
-- Radius check on job submission: Haversine distance(job_coordinates, center) <= radius_miles.
-- PostGIS ST_DWithin can be used alternatively if PostGIS is enabled.
```

### 3.11 job_price_changes (price override audit log)

```sql
id                UUID          PRIMARY KEY DEFAULT gen_random_uuid()
job_id            UUID          NOT NULL REFERENCES jobs(id)
changed_by_user_id UUID         NOT NULL REFERENCES users(id)
old_price_cents   INT           NOT NULL
new_price_cents   INT           NOT NULL
changed_at        TIMESTAMPTZ   DEFAULT now()

-- Notes:
-- No reason/note field in Phase 1. Phase 2 will add a reason TEXT column.
-- Append-only — records are never updated or deleted.
-- Every on-the-fly price change by driver or admin creates one row.

Index: idx_job_price_changes_job_id (job_id)
```

### 3.12 waitlist

```sql
id                UUID          PRIMARY KEY DEFAULT gen_random_uuid()
customer_id       UUID          NOT NULL REFERENCES customer_profiles(id)
location_id       UUID          REFERENCES service_locations(id)
job_address       TEXT          NOT NULL
job_coordinates   GEOGRAPHY(POINT, 4326) NOT NULL
driveway_tier_id  INT           REFERENCES pricing_config(id)
notes             TEXT
preferred_contact TEXT          -- 'sms' | 'email' | 'both' | 'none'
contact_phone     TEXT
contact_email     TEXT
status            TEXT          DEFAULT 'waiting'
                  -- 'waiting' | 'promoted' | 'expired' | 'cancelled'
promoted_job_id   UUID          REFERENCES jobs(id)   -- set when admin promotes to PENDING
promoted_at       TIMESTAMPTZ
created_at        TIMESTAMPTZ   DEFAULT now()

-- Notes:
-- Waitlisted entries are visible to both the driver (job queue — separate section)
--   and the admin (dispatch portal — separate waitlist panel).
-- Driver can voluntarily accept a waitlist entry (promotes it to an assigned job).
-- Admin can assign it to the driver (same effect).
-- On promotion: customer is notified via preferred_contact channel (SMS/email).
-- No system-calculated ETA is provided at notification time (Phase 2).

Index: idx_waitlist_customer_id (customer_id)
       idx_waitlist_status (status)
```

### 3.13 Entity Relationships

```
users ──< driver_profiles
users ──< customer_profiles
customer_profiles ──< service_locations
customer_profiles ──< jobs
driver_profiles ──< jobs
jobs ──< job_status_events
jobs ──< job_price_changes
jobs ──< invoices
jobs ──< waitlist (via promoted_job_id)
driver_profiles ──< driver_location_log
users ──< notification_log
pricing_config ──< waitlist (via driveway_tier_id)
```

---

## 4. Real-Time Strategy

Three data flows, each with different characteristics:

| Flow | Producer | Consumer(s) | Frequency | Latency Target |
|---|---|---|---|---|
| Driver GPS location | Driver app | Customer app, Admin portal | Every 5–10 sec while on job | < 2 sec |
| Job status changes | Driver / Admin / System | Customer, Driver, Admin | On event | < 1 sec |
| Dispatcher notifications | System / Admin | Admin portal | On event | < 2 sec |

### Transport: WebSocket over WSS

WebSockets are chosen over SSE (cannot carry bidirectional data) and long-polling (wastes resources). The driver app sends location pings up the same WebSocket it uses to receive job assignments.

### Connection Topics

```
driver:{driver_id}     — driver's private channel
                         receives: job_assigned, job_cancelled
                         sends: location_ping, status_change

job:{job_id}           — per-job room
                         receives: driver_location, status_change
                         subscribers: job's customer, all admin users

admin:dispatch         — admin broadcast channel
                         receives: new_job_request, driver_status_change
```

### GPS Location Update Flow

```
1. Driver app acquires GPS fix
2. Sends WebSocket message: { type: 'location_ping', payload: { lat, lng, accuracy } }
3. Server:
   a. Validates driver identity from WS session
   b. Writes to Redis: driver:loc:{id}  TTL: 60s
      (key expires on disconnect → no ghost driver entries)
   c. Publishes to Redis Pub/Sub: loc_updates
   d. Updates driver_profiles.current_location via batched upsert every 15s
      (not on every ping — reduces DB write load)
   e. Inserts driver_location_log row via background job (async)
4. All API server instances fan out to job:{job_id} subscribers
5. Customer map updates without page reload
```

### Job Status Change Flow

```
1. Driver taps "I've Arrived"
2. Sends: { type: 'status_change', payload: { job_id, new_status: 'arrived' } }
3. Server:
   a. Validates state machine transition is legal
   b. Updates jobs table + inserts job_status_events row (single transaction)
   c. Publishes to Redis Pub/Sub: job_events
   d. Enqueues background SMS via Twilio
4. Fan-out to: job:{job_id} subscribers + admin:dispatch
5. Background worker sends: "Your driver has arrived at your property."
```

### Offline Resilience (Driver App)

The driver app is a PWA with a Service Worker. Status changes and GPS batches made offline are queued in IndexedDB and replayed in order when connectivity is restored. GPS pings use device-side timestamps so out-of-order delivery is handled correctly server-side.

---

## 5. API Surface

All HTTP endpoints: `/api/v1/`. WebSocket endpoint: `/ws`.
Auth: Bearer JWT in `Authorization` header. Role guards noted as `[driver]`, `[customer]`, `[admin]`.

### Auth

```
POST  /api/v1/auth/register          [public]
POST  /api/v1/auth/login             [public]
POST  /api/v1/auth/refresh           [public]
POST  /api/v1/auth/logout            [any]
POST  /api/v1/auth/request-password-reset  [public]
POST  /api/v1/auth/reset-password    [public]
POST  /api/v1/auth/verify-email      [any]
POST  /api/v1/auth/verify-phone      [any]
```

### Driver

```
GET   /api/v1/drivers/me             [driver]
PATCH /api/v1/drivers/me             [driver]
PATCH /api/v1/drivers/me/status      [driver]    — toggle availability
GET   /api/v1/drivers/me/jobs        [driver]
GET   /api/v1/drivers/me/jobs/:id    [driver]
PATCH /api/v1/drivers/me/jobs/:id/status  [driver]  — triggers state machine + fan-out
GET   /api/v1/drivers               [admin]     — filter by status, proximity (PostGIS)
```

### Customer

```
GET   /api/v1/customers/me           [customer]
PATCH /api/v1/customers/me           [customer]
GET/POST/PATCH/DELETE /api/v1/customers/me/locations/:id   [customer]
GET   /api/v1/customers/me/jobs      [customer]
GET   /api/v1/customers/me/jobs/:id  [customer]
GET   /api/v1/customers/me/jobs/:id/driver-location  [customer]  — polling fallback
```

### Jobs

```
POST  /api/v1/jobs                   [customer|admin]
GET   /api/v1/jobs/:id               [customer (own)|driver (assigned)|admin]
PATCH /api/v1/jobs/:id               [admin]
DELETE /api/v1/jobs/:id              [customer|admin]  — cancellation
GET   /api/v1/jobs/:id/status-history  [all roles, own jobs]
POST  /api/v1/jobs/:id/assign        [admin]           — manual driver assignment
GET   /api/v1/jobs                   [admin]           — dispatch board
```

### Pricing, Billing, Admin, Uploads

```
POST  /api/v1/pricing/estimate       [customer|admin]  — stateless quote
GET   /api/v1/invoices               [admin]
GET   /api/v1/invoices/:id           [customer (own)|admin]
POST  /api/v1/invoices/:id/void      [admin]
POST  /api/v1/invoices/:id/refund    [admin]
POST  /api/v1/billing/setup-intent   [customer]        — Stripe card save
POST  /api/v1/billing/charge         [admin]
POST  /api/v1/webhooks/stripe        [public, sig-verified]
GET   /api/v1/admin/dashboard        [admin]
GET   /api/v1/admin/reports/jobs     [admin]
GET   /api/v1/admin/reports/revenue  [admin]
POST  /api/v1/uploads/presign        [any]             — R2 direct upload URL
```

### WebSocket Protocol

```
Endpoint: wss://api.apexplow.com/ws
Auth: ?token=<access_token> on upgrade handshake

Client → Server:
  { type: 'subscribe',     payload: { topic: 'job:abc123' } }
  { type: 'location_ping', payload: { lat, lng, accuracy, heading, speed } }
  { type: 'status_change', payload: { job_id, new_status, notes } }
  { type: 'ping' }

Server → Client:
  { type: 'driver_location', payload: { job_id, driver_id, lat, lng, ts } }
  { type: 'job_assigned',    payload: { job_id, customer_name, address, ... } }
  { type: 'job_status',      payload: { job_id, new_status, ts } }
  { type: 'job_cancelled',   payload: { job_id, reason } }
  { type: 'new_job_request', payload: { job_id, address, service_type, ... } }
  { type: 'error',           payload: { code, message } }
  { type: 'pong' }
```

---

## 6. Authentication Model

### JWT + Refresh Token Rotation

Access tokens: 15-minute expiry (stateless — no DB hit per API request).
Refresh tokens: 30-day expiry, stored server-side (hashed) for revocation.
Every refresh rotates both tokens — a stolen refresh token can only be used once.

```sql
Table: refresh_tokens
id            UUID      PRIMARY KEY
user_id       UUID      REFERENCES users(id)
token_hash    TEXT      UNIQUE    -- SHA-256 of raw token
device_info   TEXT
created_at    TIMESTAMPTZ
expires_at    TIMESTAMPTZ  NOT NULL
revoked_at    TIMESTAMPTZ  -- null = still valid
```

**WebSocket auth:** `?token=<access_token>` on WS upgrade (browsers cannot send custom headers on WebSocket connections). Session invalidates when JWT expires; client reconnects with a fresh token.

### RBAC

Three roles encoded in the JWT payload. Server middleware validates on every request. No permission table needed at this scale.

```json
{
  "sub": "uuid-of-user",
  "role": "driver",
  "name": "John Doe",
  "iat": 1740384000,
  "exp": 1740384900,
  "jti": "unique-token-id"
}
```

### Admin Security Hardening

- **TOTP-based 2FA** (via `otplib`) — required for all admin accounts
- **Optional IP allowlisting** — restrict admin API routes to known office IPs
- **Audit logging** — all admin actions logged with user ID and timestamp

### Password Policy

- Minimum 10 characters, no forced complexity (NIST 800-63b)
- Hashed with **Argon2id** (do not use bcrypt for new systems)
- HaveIBeenPwned k-Anonymity API check on registration and password change

### Customer UX

- Email verification required before first job
- Phone verification (Twilio Verify OTP) required for SMS notifications
- **Magic link (passwordless)** login available as an alternative — reduces friction on mobile

---

## 7. Infrastructure

### Hosting Progression

| Stage | Setup | Monthly Cost |
|---|---|---|
| MVP / Launch | Fly.io (2x shared CPU machines) | $25–60 |
| Growth (10–30 drivers) | App + DB separated, managed Redis | $80–150 |
| Regional Scale (30+ drivers) | Fly.io / Render, Neon or Supabase | $200–500 |
| Enterprise | ECS/EKS on AWS, RDS Aurora, ElastiCache | $1,000+ |

**Primary recommendation: Fly.io** — Docker containers at edge regions, native WebSocket support, managed Postgres, scales from one machine without Kubernetes overhead.

**Database:** PostgreSQL 17 + PostGIS 3.5. Managed via Neon (serverless, DB branching for dev/staging) or Fly Postgres.

**Cache + Pub/Sub:** Redis 8 via Upstash — serverless, per-request pricing, globally distributed.

### File Storage (Cloudflare R2)

R2 is S3-compatible with zero egress fees. Completion photos and invoice PDFs upload directly from the client via pre-signed URLs — the API server never proxies file bytes.

```
1. Client: POST /api/v1/uploads/presign
           Body: { content_type: 'image/jpeg', purpose: 'job_completion' }
           Returns: { upload_url, public_url, expires_in: 300 }
2. Client: PUT directly to R2 using upload_url
3. Client: PATCH /api/v1/drivers/me/jobs/:id/status
           Body: { status: 'completed', completion_photo_url: '...' }
```

### Background Jobs (pg-boss)

PostgreSQL-backed job queue at MVP — transactional enqueuing means a job is atomically committed with the DB transaction that creates it. No Redis dependency for the queue at launch. Migrate to BullMQ if throughput demands it.

Job types:
```
NotifyCustomerJobAssigned      — on job assignment
NotifyJobStatusChange          — on status transitions
PersistDriverLocationBatch     — batched GPS writes every 15 sec
GenerateInvoicePDF             — on job completion
ChargeCustomer                 — after invoice approval
CleanupStaleDriverLocations    — scheduled every 5 min
DailyRevenueReport             — scheduled 6 AM daily
```

### Caching Strategy

| Data | Cache | TTL | Invalidation |
|---|---|---|---|
| Driver current location | Redis `driver:loc:{id}` | 60 sec | On each GPS ping |
| Active job count | Redis `dashboard:counts` | 30 sec | On job status change |
| Pricing estimates | Redis `price:{hash}` | 5 min | Stateless, not needed |
| Static assets | Cloudflare CDN | Immutable | Content-addressed filenames |

### Security Infrastructure

- TLS 1.3 enforced at Cloudflare edge and origin
- Secrets injected via Fly.io secrets (never in git)
- Dependabot / Renovate for dependency updates; `npm audit` on every PR
- Rate limiting: 60 req/min per IP (unauthenticated), 300 req/min per user (authenticated)
- CORS: restrictive allow-list (only the three known frontend origins)
- Content Security Policy headers on all HTML responses

### Deployment Pipeline

```
Git push to main
  → GitHub Actions CI:
    1. Lint + typecheck
    2. Test suite (unit + integration)
    3. Build Docker image
    4. Push to GitHub Container Registry
    5. Deploy to staging
    6. Smoke tests against staging
  → Manual approval (or auto-deploy if tests pass)
  → fly deploy to production
  → DB migrations run as short-lived container before app starts
```

---

## 8. Architectural Decisions — Confirmed

All architectural questions are resolved as of 2026-02-25. See `Q&A.md` (v1.2) for the full decision log.

| Question | Decision |
|---|---|
| Multi-tenant SaaS or single-operator? | Single operator (1 driver/1 admin) for Phase 1. `organization_id` nullable column on all tables as zero-cost Phase 2 stub. |
| Auto-dispatch or manual-only? | Manual only in Phase 1. Driver receives notification, accepts or rejects. Auto-dispatch in Phase 2. |
| Pricing model? | Hybrid driveway-size tiers. Admin-configurable, 6 tiers max (1-car–6-car). Pre-populated NE defaults. On-the-fly override logged (no reason field Phase 1). |
| Payment capture? | No Stripe in Phase 1. Cash/card/PayPal/Venmo collected by driver in person. Static QR on driver completion screen. Stripe deferred to Phase 2. |
| Backend language? | Node.js 22 LTS + TypeScript + Fastify v5. |
| Driver app platform? | Android-first PWA (React 19 + Vite 6). iOS deferred. Test device: Samsung Galaxy S25, Android 16, Chrome 145. All modern PWA APIs available — no polyfills needed. |
| Customer app SSR? | No. Vite + React SPA. No SEO requirement. |
| Data retention / jurisdiction? | No GPS log retention in Phase 1. US-only — no GDPR. Phase 2 will add 90-day retention with monthly partition drop. |
| Max driveway tier count? | 6 tiers (1-car through 6-car). 6-car = 48ft × 27ft (3×3 pattern). |
| Service area center point? | Admin enters home base / depot address at onboarding. System geocodes to lat/lng as radius center. |
| Waitlist notification? | Drivers can pick up waitlisted jobs voluntarily, or admin assigns. Customer notified via SMS/email when job is picked up. No system-calculated ETA (Phase 2). |
| Price change audit logging? | Log: who changed, when, old price, new price. No reason/note field in Phase 1 (Phase 2 enhancement). |
| Android PWA baseline? | Android 16 / Chrome 145 (physical: Samsung Galaxy S25). Screen Wake Lock, Vibration API, Web Push, IndexedDB — all available. |
| Static vs. dynamic payment QR? | Static link configured once by driver at setup. Customer enters amount manually. No dynamic QR generation needed. |
| Pre-populate default pricing? | Yes. Admin onboarding wizard pre-fills NE 2026 rates. Admin edits before saving. |

---

## Appendix: Technology Reference

| Category | Recommended | Alternative |
|---|---|---|
| Backend language | Node.js 22 LTS + TypeScript | Go 1.24 |
| Backend framework | Fastify v5 | Fiber v3 |
| Frontend | React 19 + Vite 6 | Next.js 15 |
| Monorepo | Turborepo 2.x | Nx |
| Real-time | WebSocket (ws v8) + Redis Pub/Sub | SSE (customer-only fallback) |
| Database | PostgreSQL 17 + PostGIS 3.5 | — |
| Managed Postgres | Neon or Fly Postgres | Supabase |
| Cache / Pub-Sub | Redis 8 via Upstash | Valkey |
| Job queue | pg-boss (MVP) → BullMQ (growth) | — |
| Payments | Stripe (Payment Intents + Connect) | — |
| SMS | Twilio | Vonage |
| Email | Resend | SendGrid |
| Push notifications | Firebase Cloud Messaging + APNS | — |
| Maps | Google Maps Platform (confirmed — existing API plan) | MapLibre GL JS v4 (future consideration) |
| File storage | Cloudflare R2 | AWS S3 |
| CDN | Cloudflare | AWS CloudFront |
| Hosting | Fly.io | Render.com |
| CI/CD | GitHub Actions | — |
| Password hashing | Argon2id | — |
| 2FA | TOTP via otplib | — |
| Error tracking | Sentry | — |
