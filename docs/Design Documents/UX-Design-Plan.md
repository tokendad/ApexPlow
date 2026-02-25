# ApexPlow / PlowDispatch — UX Design Plan
**Document Version:** 1.2
**Date:** 2026-02-25
**Prepared by:** UI/UX Design Team
**Status:** Active Design — Open Decisions Listed in Section 5

---

## Table of Contents

1. [Design Principles by Interface](#1-design-principles-by-interface)
2. [Visual Design Direction](#2-visual-design-direction)
3. [User Flow Diagrams](#3-user-flow-diagrams)
4. [Accessibility Considerations](#4-accessibility-considerations)
5. [Open UX Questions for Product Owner](#5-open-ux-questions-for-product-owner)
6. [Design System Summary](#6-design-system-summary)

---

## Phase 1 Scope — What Is Explicitly Out of Scope

The following features are confirmed as Phase 2 or later. They must not appear in any Phase 1 screen, flow, or component design. Designs that reference these items should be flagged and revised.

| Feature | Status | Notes |
|---|---|---|
| ETA display / countdown | Phase 2 | Phase 1 shows status text only: "Your driver is on the way." |
| Tip prompt for customers | Phase 2 | No tip capture in Phase 1; payment is handled directly between driver and customer |
| Driver earnings screen | Phase 2 | Drivers do not see an earnings summary in Phase 1 |
| Photo completion confirmation | Phase 2 | Driver completion flow does not include a photo capture step in Phase 1 |
| Commercial service types | Phase 2 | Phase 1 covers residential driveway clearing only |
| iOS-specific PWA workarounds | Phase 2 | Driver interface is Android-first; iOS PWA edge cases deferred |
| In-app payment processing | Phase 2 | All customer payments in Phase 1 go directly to the driver (cash, card, PayPal, Venmo) |
| Driver unavailability reason selection | Future | Reason picker (gas, food, equipment, etc.) noted for a future release |

This callout is the authority for descoping disputes. If a stakeholder requests a Phase 2 feature in a Phase 1 design review, redirect to this table.

---

## 1. Design Principles by Interface

### 1.1 Driver Interface — "Eyes on the Road"

The driver interface carries the highest safety burden of the three surfaces. A driver in a plow truck is operating heavy machinery, often in whiteout conditions, on icy roads, with gloves on. Every design decision must begin with this reality.

**Principle 1: Glove-First Touch Targets**
All interactive elements must be operable with thick winter work gloves. The minimum tap target is 72px x 72px, which exceeds the WCAG 2.5.5 AAA target size recommendation of 44px. Primary action buttons should be no smaller than 88px tall. Spacing between adjacent targets must be at least 16px to eliminate mis-taps.

**Principle 2: Peripheral Legibility**
Text must be readable in a glance without sustained eye contact. This means large type at distance-appropriate sizes, high-contrast color pairs, and zero decorative flourishes that reduce signal-to-noise. No fine print. No tooltips. No hover states.

**Principle 3: One Action Per Screen**
Each screen presents exactly one primary decision or action. The driver should never need to parse competing options. Accept or Reject. Start or Stop. Navigate or Complete. Cognitive load in motion is dangerous.

**Principle 4: Persistent Status Awareness**
The driver's current status (Available, Offline) and their active job summary are always visible without scrolling. This is a persistent header element that cannot be obscured.

**Principle 5: Voice-Compatible Architecture**
The screen layout and action labeling must be designed with future voice command integration in mind. Button labels double as voice commands: "Accept Job," "Start Navigation," "Complete Job." No ambiguous icons without labels.

**Principle 6: Night Mode by Default**
The driver operates primarily at night and in pre-dawn hours. Dark mode is the default and only mode — it is not a user-selectable option. It reduces glare on the windshield and preserves night vision. This is confirmed for Phase 1 on Android.

---

### 1.2 Customer Interface — "Get Help Fast"

The customer is stressed. A snowstorm has arrived, a driveway is blocked, and they need help quickly. Many customers will be elderly or less technically comfortable. The interface must feel immediately reassuring and impossibly simple.

**Principle 1: Zero Learning Curve**
A first-time user who has never heard of PlowDispatch must be able to successfully submit a service request in under three minutes with no instruction. If an interaction pattern requires explanation, it must be redesigned. No login is required to place a first order.

**Principle 2: Transparent Confidence**
Customers are handing over their home address to a service during an emergency. The design must project trustworthiness. Clear pricing before commitment, named and photo-verified drivers, real-time status updates, and explicit confirmation messages all serve this principle.

**Principle 3: Progressive Disclosure**
Show only what is needed at each step. Do not overwhelm the customer with all options upfront. The request flow is a guided funnel: Location first, then driveway size (which determines price), then pricing confirmation, then notification preferences. No step bleeds into another.

**Principle 4: Passive Waiting is Designed**
After placing a request, the customer enters a waiting state. This state must be actively designed — not a blank screen or a spinner. The driver's last known location is shown on a map. Status text is calm and reassuring. There is no ETA counter in Phase 1.

**Principle 5: Notification Reduces Abandonment**
SMS and email updates are functional design elements. A customer who receives "Your driver is on the way" does not need to refresh the tracking page obsessively. Notification preference design is as important as screen design.

**Principle 6: Mobile Web First, Enhancement Second**
No app download. The experience must be excellent on a 6-year-old Android or iPhone browser. Progressive enhancement layers in map functionality and push notifications where supported. Core functionality — request submission and status checking — requires only a browser.

---

### 1.3 Admin Portal — "Owner Setup and Job Visibility"

In Phase 1, the "admin" is the driver/owner themselves. This is not a live dispatch command center — it is primarily a configuration tool and job status viewer. The design must reflect this reality: the primary use case is one-time or infrequent setup, plus the ability to view all jobs and create manual orders for phone-in customers.

**Principle 1: Setup First**
The portal's most important task in Phase 1 is helping the owner configure service area, pricing tiers, and payment links correctly. This setup flow must be the first experience a new admin sees. It should feel guided and reassuring, not intimidating.

**Principle 2: Error Prevention Over Error Recovery**
A pricing misconfiguration or incorrect service area will cause real-world operational problems. The UI must make errors difficult: show coverage area visually before confirming, preview prices before saving, and require explicit confirmation of destructive changes.

**Principle 3: Manual Order Entry is a Power Feature**
For phone-in customers, the admin needs to create orders quickly. This flow should be fast and require minimal clicks.

**Principle 4: Notification Without Distraction**
New inbound orders surface as a browser tab popup/badge. The notification must be unmissable without being disruptive to whatever the admin is doing at their desk.

**Principle 5: Audit Trail Visibility**
Every action taken in the portal has a timestamp. The admin must be able to answer "When did this order come in and what happened to it?" by scanning the job list.

---

## 2. Visual Design Direction

### 2.1 Brand Positioning

PlowDispatch occupies a space between a rugged utility app and a professional service platform. The visual identity must feel dependable and capable — not cheap or overdesigned. The reference aesthetic is "working professional in harsh conditions": functional gear, clear signage, confident structure. Think highway signage clarity meets modern SaaS interface craftsmanship.

The brand avoids:
- Playful or cartoonish illustration styles
- Overly corporate or cold blue-grey enterprise palettes
- Consumer-app neons or gradient overuse

---

### 2.2 Color Palette

The palette is built around a functional core with a single high-energy accent for action states.

**Primary Colors**

| Token Name           | Hex Value | Usage |
|----------------------|-----------|-------|
| `--color-night`      | `#0D1117` | Driver interface background; darkest surface |
| `--color-slate-900`  | `#1A2233` | Admin portal sidebar; dark panel backgrounds |
| `--color-slate-700`  | `#2D3F5C` | Card backgrounds; secondary surfaces |
| `--color-slate-400`  | `#6B7E99` | Secondary text; disabled states; borders |
| `--color-slate-100`  | `#EDF1F7` | Customer interface background; light surfaces |
| `--color-white`      | `#FFFFFF` | Primary text on dark; card backgrounds on light |

**Accent — Action Orange**

| Token Name           | Hex Value | Usage |
|----------------------|-----------|-------|
| `--color-apex`       | `#F57C20` | Primary CTAs; driver Accept button; active states |
| `--color-apex-light` | `#FDEBD0` | Hover/pressed states on light surfaces |
| `--color-apex-dark`  | `#C45F08` | Hover/pressed states on dark surfaces |

Design rationale: Orange was selected because it reads as action and urgency without being red (which carries error/danger semantics). It provides exceptional contrast against dark backgrounds (contrast ratio: 4.8:1 on `--color-night`; meets WCAG AA for large text). It is also a common color in winter-service branding (road signs, safety equipment), reinforcing environmental familiarity.

**Status Colors**

| Token Name              | Hex Value | Usage |
|-------------------------|-----------|-------|
| `--color-status-active` | `#2ECC71` | Driver Available; job In Progress |
| `--color-status-warn`   | `#F5C842` | Job Pending assignment |
| `--color-status-idle`   | `#6B7E99` | Driver Offline; job Completed |
| `--color-status-error`  | `#E74C3C` | Failed actions; system errors; rejected jobs |

**Map Overlay Colors**

| Token Name               | Hex Value | Usage |
|--------------------------|-----------|-------|
| `--color-map-driver`     | `#F57C20` | Driver pin and route line |
| `--color-map-customer`   | `#3B82F6` | Customer location pin |
| `--color-map-job-active` | `#2ECC71` | Active job zone highlight |

---

### 2.3 Typography

The type system uses two families with a deliberate distinction in role.

**Primary Typeface — Interface: Inter**
- Role: All UI labels, body copy, navigation, form fields, data tables
- Reasoning: Inter was designed specifically for screen legibility at small sizes. Its wide apertures and generous x-height make it readable at the sizes drivers need in motion. It is open-source and has excellent variable font support.
- Weights used: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

**Secondary Typeface — Display/Brand: Space Grotesk**
- Role: Page headings, hero labels, marketing-facing text, the PlowDispatch wordmark context
- Reasoning: Space Grotesk has a geometric confidence with subtle quirks that differentiate the brand without sacrificing legibility. It pairs cleanly with Inter without competing.
- Weights used: 500 (Medium), 700 (Bold)

**Type Scale (Base 16px / 1rem)**

| Scale Token        | Size      | Line Height | Weight | Usage |
|--------------------|-----------|-------------|--------|-------|
| `--text-xs`        | 12px      | 1.4         | 500    | Timestamps; metadata |
| `--text-sm`        | 14px      | 1.5         | 400    | Secondary labels; captions |
| `--text-base`      | 16px      | 1.6         | 400    | Body copy; form inputs |
| `--text-lg`        | 18px      | 1.5         | 500    | Card titles; section labels |
| `--text-xl`        | 24px      | 1.3         | 600    | Page headings |
| `--text-2xl`       | 32px      | 1.2         | 700    | Driver interface primary labels |
| `--text-3xl`       | 48px      | 1.1         | 700    | Driver status display |

**Driver Interface Override:** All text sizes are increased by 1.5x from the standard scale. A label that would be 14px on the customer interface is 21px on the driver interface. The driver type scale minimum is 24px for anything the driver reads while in motion.

---

### 2.4 Component Style Direction

**Shape Language**
- Corner radius: 12px for cards and containers; 8px for buttons and inputs; 4px for tags and badges
- The rounding is generous enough to feel modern and approachable, but not so rounded it loses structural confidence
- Driver interface uses 16px radius on primary action buttons to make them feel like physical buttons

**Elevation and Shadow**
- Light surface (customer): Subtle drop shadows for card elevation. `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Dark surface (driver, admin): Elevation is communicated through background color layering, not shadows. Shadows on dark surfaces create muddy effects. Use `--color-slate-700` for elevated cards over `--color-slate-900` backgrounds.

**Button Hierarchy**

| Variant     | Style | Usage |
|-------------|-------|-------|
| Primary     | `--color-apex` fill, white label, bold | Single most important action per screen |
| Secondary   | Transparent fill, `--color-apex` border and label | Secondary action alongside primary |
| Destructive | `--color-status-error` fill, white label | Reject job, Cancel order, Delete |
| Ghost       | No fill, no border, `--color-slate-400` label | Tertiary; navigation; "Back" |

**Iconography**
- Library: Phosphor Icons (open source; strong coverage; consistent weight options)
- Driver interface: Bold weight icons only, minimum 32px display size
- Customer interface: Regular weight icons, 20-24px display size
- Admin portal: Regular and bold weights, 16-20px display size
- All icons paired with text labels in the driver interface. Icons alone are never used for primary actions.

**Map Style**
- Base map style: Mapbox "Navigation Night" for driver view; Mapbox "Light" for customer and admin views
- Driver pins: Large 48px circular badge in `--color-apex` with truck icon
- Customer pins: 36px circular badge in `--color-map-customer` with home icon
- Route lines: 6px stroke width on driver view; 3px on customer/admin view

---

### 2.5 Interface-Specific Visual Themes

**Driver Interface**
- Background: `--color-night` (#0D1117)
- Primary text: `--color-white`
- Dark mode only — this is not a preference, it is the sole mode (confirmed Android-first PWA)
- Maximum of 3 interactive elements visible at one time
- Full-bleed buttons on mobile viewport (width: 100%)

**Customer Interface**
- Background: `--color-slate-100`
- System-driven dark mode support (respects `prefers-color-scheme`)
- Clean, card-based layout with generous whitespace
- Map component is always visible during the tracking phase (takes 60% of viewport height)

**Admin Portal**
- Dark sidebar (`--color-slate-900`) with light main canvas (`--color-slate-100` or white)
- Dense data table support with zebra-stripe row alternation
- Split-panel layout: live map on the right, job queue on the left
- Sticky headers for all scrollable lists

---

## 3. User Flow Diagrams

The following flows use a structured text notation:
- `[ Screen ]` indicates a distinct screen or view state
- `( Action )` indicates a user action
- `{ Decision }` indicates a system or user decision point
- `> Text` indicates transition or system response
- `|` separates parallel paths

---

### 3.1 Customer Flow: Request to Complete

```
[ Landing / Home ]
  |
  (Tap "Request Plow Service")
  |
  > System checks for returning user session
  |
  { Returning user with session? }
  |-- YES --> [ Authenticated — skip to location step ]
  |
  |-- NO  --> [ Soft Account Creation ]
  |             Prompt: "Enter your name, phone number, and email to get started"
  |             Fields: Name (required), Phone (required), Email (optional)
  |             Note: No password required at this step.
  |                   A soft account is created automatically.
  |                   Customer can set a password later from their account page.
  |             (Agree to terms and continue)
  |             > Soft account created, session started
  |             |
  |             [ Notification Preference Step ]
  |             Prompt: "How should we keep you updated?"
  |             Options (radio selection):
  |             - SMS only
  |             - Email only
  |             - Both SMS and email
  |             - No notifications
  |             (Continue)
  |
  [ Location Step ]
  |   Prompt: "Where do you need us?"
  |   Option A: (Allow location access) > Map auto-centers on user
  |   Option B: (Type address manually) > Geocode and pin on map
  |   Option C: (Tap "Use saved address" for returning users)
  |
  (Confirm pin placement on map)
  |   User can drag pin to adjust exact spot
  |
  [ Driveway Size Step ]
  |   Prompt: "How big is your driveway?"
  |   Options displayed as large tappable cards — 6 tiers total:
  |   - 1-Car Driveway  ($65)
  |   - 2-Car Driveway  ($85)
  |   - 3-Car Driveway  ($105)
  |   - 4-Car Driveway  ($125)
  |   - 5-Car Driveway  ($145)
  |   - 6-Car Driveway  ($165)
  |
  |   Visual Tier Picker Design:
  |   Each card contains three elements stacked vertically:
  |   1. A driveway illustration (sourced from docs/Images/):
  |      - 1-car card:  "1 car drieway.png"
  |      - 2-car card:  "2 car driveway.png"
  |      - 3–6-car cards: scaled variants derived from "6 cars drivway.png"
  |      Images are rendered at approximately 80px height within the card,
  |      constrained to the card width, with object-fit: contain.
  |   2. The tier label ("2-Car Driveway") in --text-lg, SemiBold
  |   3. The price ("$85") in --text-xl, Bold, --color-apex
  |   Selected state: card border switches to 2px solid --color-apex;
  |                   background shifts to --color-apex-light
  |   Unselected state: 1px solid --color-slate-400 border on white card
  |   Cards are displayed in a scrollable vertical list on mobile (not a grid),
  |   so each illustration is clearly visible without zooming.
  |
  |   Design note: The tier card is the primary pricing mechanism.
  |                There is no square footage input or measurement tool.
  |                Prices shown are drawn from admin configuration — the
  |                values above are the pre-populated defaults.
  |
  (Select driveway tier)
  |
  [ Special Instructions Step ]
  |   Optional free-text field: "Gate code, obstacles, notes"
  |   (Continue / Skip)
  |
  [ Pricing Confirmation Step ]
  |   Display:
  |   - Selected driveway size tier and corresponding price
  |   - Service address
  |   - Cancellation policy clearly stated:
  |       Scheduled jobs: "Cancel by [time] to avoid fees"
  |       ASAP jobs: "Cancel free before driver accepts; 25% fee after"
  |   - Driver name and photo (if pre-assigned) OR "Next available driver"
  |   Payment note: "Your driver will collect payment directly at completion
  |                  via cash, card, PayPal, or Venmo."
  |
  { Acceptable? }
  |-- NO  --> (Back) > Return to driveway size step
  |
  |-- YES --> (Confirm Request)
  |
  > Order created in system
  > Admin notified (browser tab popup)
  > Customer receives confirmation via their chosen notification channel
  |
  { Drivers available? }
  |
  |-- NO  --> [ No Drivers Available Screen ]
  |             Display: "Sorry, no drivers are available right now."
  |             Primary option: (Put me on the waitlist)
  |               > Customer added to waitlist
  |               > Waitlist Confirmation message shown:
  |                 "You're on our waitlist. We'll notify you if a
  |                  driver becomes available."
  |               > No ETA is displayed or implied.
  |               > Notification will arrive via the customer's chosen
  |                 channel (SMS or email) when a driver accepts the job.
  |             Secondary option: (Cancel Request)
  |             > Request rejected — no job record created
  |
  |-- YES --> [ Job Confirmed — Waiting State ]
  |             Display:
  |             - Confirmation number
  |             - Status: "Finding your driver..."
  |             - Animated status indicator (pulsing map pin — not a generic spinner)
  |             - Option to cancel (free cancellation before driver accepts)
  |
  > Driver accepts job
  > Customer notification sent: "Your driver is on the way."
  |                              (No ETA shown in Phase 1)
  |
  [ Live Tracking State ]
  |   Display (60% map, 40% info panel):
  |   - Driver's last known location pinned on map (not live-moving — last GPS update)
  |   - Status text: "Your driver is on the way."
  |   - Driver name and truck photo
  |   - No ETA counter (Phase 2 feature)
  |
  > Driver arrives and begins work
  > Status updates to: "Your driver is here — plowing in progress"
  |
  [ Job In Progress State ]
  |   Display:
  |   - Status banner: "Work in progress"
  |   - Driver location pinned at job site
  |
  > Driver marks job complete
  |
  [ Job Complete State ]
  |   Display:
  |   - "Your driveway has been cleared!"
  |   - Reminder: "Please pay your driver directly — cash, card, PayPal, or Venmo"
  |   - Amount due shown prominently
  |   - 5-star rating prompt for driver
  |
  (Submit rating)
  |
  [ End State — Home / Dashboard ]
  |   Past job visible in order history
```

**Cancellation Flow Detail**

```
  (Customer initiates cancel)
  |
  { Job status? }
  |
  |-- Scheduled job, before cancellation deadline -->
  |     [ Cancel Confirmation Screen ]
  |     Display: "Cancel this job? No fee applies."
  |     [Keep My Order] [Confirm Cancellation — Free]
  |
  |-- ASAP job, before driver accepts -->
  |     [ Cancel Confirmation Screen ]
  |     Display: "Cancel this job? No fee applies."
  |     [Keep My Order] [Confirm Cancellation — Free]
  |
  |-- ASAP job, after driver accepted or en route -->
  |     [ Cancel Confirmation Screen ]
  |     Display: "Cancel this job? A 25% cancellation fee of $[amount] applies."
  |     Fee amount is calculated and shown before the customer confirms.
  |     [Keep My Order] [Confirm Cancellation — $X fee]
```

---

### 3.2 Driver Flow: Login to Job Complete

```
[ Login Screen ]
  |   PlowDispatch logo, driver name greeting on return
  |   (Enter phone or email + PIN)
  |   OR (Biometric auth — Fingerprint on supported Android devices)
  |
  > Authenticated
  |
  [ Home / Status Screen ]  <- THIS IS THE PERSISTENT DRIVER HOME
  |
  |   HEADER (always visible):
  |   - Driver name and profile photo thumbnail
  |   - Current status toggle: [ AVAILABLE ] / [ OFFLINE ]
  |     Note: Driver self-manages availability. No dispatcher override.
  |   - Jobs completed today counter
  |
  |   BODY (status-dependent):
  |
  { Status = OFFLINE }
  |   Display: "You're offline. Toggle to go available."
  |   Large centered toggle button (72px height minimum)
  |
  { Status = AVAILABLE }
  |   Display: "You're available. Waiting for a job."
  |   Ambient animation: pulsing green indicator
  |
  |   JOB QUEUE (two-section layout):
  |   Section 1 — "Your Jobs":
  |   - Current active/assigned job displayed prominently at top
  |   - Upcoming queued (assigned) jobs listed below in order
  |   Section 2 — "Available Jobs" (waitlisted, unclaimed):
  |   - Waitlisted jobs the driver has not yet been assigned to
  |   - Each card shows: address, driveway size tier, price
  |   - Driver can tap any Available Job card to accept it
  |   - Accepting a waitlisted job triggers customer notification
  |     via their preferred channel (SMS or email)
  |
  > Incoming job notification fires (SMS + in-app popup alert)
  |
  [ Incoming Job Alert Screen ]
  |   FULL SCREEN TAKEOVER:
  |   - Job address (large text, 32px minimum)
  |   - Estimated drive time to customer
  |   - Service type: driveway size tier
  |   - Customer name (first name only for privacy)
  |   - Job price
  |   - Accept / Reject countdown timer (displayed visually — 30 seconds default)
  |
  { Decision — 30 second window }
  |
  |-- (Reject / Timer expires) -->
  |     > Job returned to queue
  |     > Driver status remains Available
  |     > Screen returns to Home / Status
  |
  |-- (Accept) -->
  |     > Job locked to this driver
  |     > Customer notified: "Your driver is on the way."
  |     > Driver status changes to BUSY
  |
  [ Active Job Screen ]
  |   HEADER:
  |   - "ACTIVE JOB" label in --color-apex
  |   - Customer name and address
  |   - Timer: time elapsed since acceptance
  |
  |   BODY:
  |   - Map with route to customer (full-width)
  |   - Large "START NAVIGATION" button (opens Google Maps / Waze via deep link)
  |   - Job details: driveway size tier, special instructions
  |   - Job price (for driver reference)
  |
  (Start Navigation)
  |   > External navigation app opens with address pre-loaded
  |   > Driver can return to PlowDispatch app at any time
  |
  [ En Route State ]
  |   Simplified view while driver is navigating:
  |   - Customer name and address
  |   - Status: "En Route"
  |   - Large "I'VE ARRIVED" button (88px height, full width)
  |   - Small "Emergency / Issue" ghost button
  |
  (I've Arrived)
  |   > System updates customer: "Your driver has arrived"
  |   > Job timer starts (tracks service duration)
  |
  [ On Site / Working State ]
  |   HEADER: Customer address, job timer running
  |
  |   BODY:
  |   - Driveway size tier and job price
  |   - Special instructions (visible, not buried)
  |   - Price adjustment control: driver can modify the job price before completing
  |       Tap price to edit → numeric-only input field → confirmation dialog
  |       Confirmation dialog: "Change price from $[original] to $[new]?" + [Confirm] button
  |       No reason field, no note field, no dropdown in Phase 1.
  |       Price change is logged automatically (who/when/old/new amount).
  |       Reason field is a Phase 2 enhancement.
  |       Same price override UI and confirmation pattern applies to admin
  |       manual orders in the admin portal.
  |   - Large "COMPLETE JOB" button (--color-apex, 88px)
  |   - "Issue / Cannot Complete" ghost button
  |
  (Complete Job)
  |
  [ Payment Collection Screen ]
  |   Display:
  |   - "Job Complete — Collect Payment"
  |   - Final job total in large display type (reflecting any price adjustment)
  |   - Static QR code (full-width, scannable — pre-generated from driver's
  |     PayPal.me or Venmo URL entered during admin setup)
  |   - "Or tap to open" button linking directly to the stored payment URL
  |   - Customer manually enters the payment amount in PayPal/Venmo
  |     after scanning — the QR does not pre-fill the amount
  |   - Cash/card reminder text
  |
  |   QR implementation note: The QR code is stored as a pre-generated image
  |   produced during admin setup, OR generated client-side at render time
  |   from the stored payment URL using a client-side QR library. No dynamic
  |   per-job QR generation is required. The QR is always static.
  |
  |   Record payment method:
  |   - [ Cash ] [ Card ] [ PayPal ] [ Venmo ]
  |   (Tap the method used)
  |
  (Confirm Payment Recorded)
  |
  [ Job Complete Confirmation ]
  |   Display:
  |   - Checkmark / success state (full screen, large)
  |   - "Great work! Job complete."
  |   Note: No earnings summary shown in Phase 1
  |
  (Continue)
  |   > Driver status returns to AVAILABLE
  |   > Screen returns to Home / Status Screen
  |
  [ Home / Status Screen ]
  |   Jobs completed counter incremented
  |   Waiting for next job
```

---

### 3.3 Admin Flow: Initial Setup (One-Time, First-Run)

This flow runs once when the owner first accesses the admin portal. It is a guided wizard, not a recurring operational task. The owner cannot access the operational dashboard until setup is complete (or explicitly skipped with a warning).

```
[ Admin Login — First Access ]
  |   Email + password (set during account provisioning)
  |
  > System detects setup incomplete
  |
  [ Setup Wizard — Welcome Screen ]
  |   "Welcome to PlowDispatch. Let's set up your operation."
  |   "This takes about 5 minutes. You can change everything later."
  |   (Begin Setup)
  |
  =====================================================
  SETUP STEP 1: Service Area
  =====================================================
  |
  [ Service Area Configuration ]
  |   Section label: "Your Home Base / Depot Address"
  |
  |   Sub-step A — Address Entry:
  |   Prompt: "Enter your home or depot address. This will be the center
  |            of your service area."
  |   - Street address field with Google Places Autocomplete
  |   - Admin selects from autocomplete suggestions
  |   > System geocodes the selected address
  |   > Map renders and places a center pin at the geocoded coordinates
  |   > The pin is labeled "Home Base"
  |
  |   Sub-step B — Radius Selection (shown after address is confirmed):
  |   - Coverage radius slider below the map: drag to expand or shrink
  |   - Map updates in real-time: center pin remains fixed; radius circle
  |     overlay expands/contracts around it
  |   - Radius label: "You'll serve jobs within X miles of [entered address]"
  |   - Admin cannot drag the map pin to reposition the center — the center
  |     is always the geocoded home base address. To change it, the admin
  |     edits the address field.
  |
  (Confirm Coverage Area)
  |   > Service area saved (center coordinates + radius stored)
  |
  =====================================================
  SETUP STEP 2: Pricing Tiers
  =====================================================
  |
  [ Pricing Configuration ]
  |   Prompt: "Set your price per driveway size."
  |   Helper text (shown below the prompt, above the tier rows):
  |   "These are suggested 2026 New England rates. Adjust to match your market."
  |
  |   Pre-populated tier rows (6 rows, all editable):
  |   - 1-Car Driveway:  $65   (label editable, price editable)
  |   - 2-Car Driveway:  $85   (label editable, price editable)
  |   - 3-Car Driveway:  $105  (label editable, price editable)
  |   - 4-Car Driveway:  $125  (label editable, price editable)
  |   - 5-Car Driveway:  $145  (label editable, price editable)
  |   - 6-Car Driveway:  $165  (label editable, price editable)
  |
  |   Each row contains:
  |   - A text input for the tier label (e.g., "2-Car Driveway")
  |   - A currency input for the price (e.g., "$85")
  |   - A remove button (trash icon) on the right
  |
  |   Below the tier rows:
  |   - [+ Add Tier] button — appends a new blank row
  |   Admin can add tiers beyond 6 or remove tiers down to 1.
  |   No hard minimum or maximum enforced in the UI, but a validation
  |   warning shows if the admin attempts to save with zero tiers.
  |
  (Save Pricing)
  |   > Prices saved; will be shown to customers during booking
  |
  =====================================================
  SETUP STEP 3: Payment Links
  =====================================================
  |
  [ Payment Setup ]
  |   Prompt: "How will customers pay you at job completion?"
  |   - PayPal.me link or username field (e.g., paypal.me/yourname)
  |   - Venmo username or link field (e.g., venmo.com/yourname)
  |   Note: At least one is recommended. Both can be entered.
  |
  |   QR behavior: Static QR codes only. The system generates a QR code
  |   from the entered payment URL client-side. The QR is stored and
  |   displayed as-is on the driver's completion screen. It does not
  |   pre-fill the payment amount — the customer enters the amount
  |   manually in PayPal or Venmo after scanning.
  |
  > QR preview renders live as the admin types:
  |   - "Here is how your payment screen will look on your phone"
  |   - PayPal QR preview shown (updates in real-time from input)
  |   - Venmo QR preview shown (updates in real-time from input)
  |
  (Confirm and Save)
  |   > Payment URLs and pre-generated QR images saved to driver
  |     completion screen
  |
  =====================================================
  SETUP COMPLETE
  =====================================================
  |
  [ Setup Complete Screen ]
  |   "You're all set. Here's a summary of your configuration:"
  |   - Home Base: [entered address], [X] mile radius
  |   - Pricing: 1-car $65 / 2-car $85 / 3-car $105 / 4-car $125 /
  |              5-car $145 / 6-car $165 (reflects any admin edits)
  |   - Payment: PayPal [configured / not set] / Venmo [configured / not set]
  |   [Go to Dashboard]
  |
  > Admin proceeds to operational dashboard
```

---

### 3.4 Admin Flow: Operational Dashboard (Job Management)

```
[ Admin Login — Returning User ]
  |   Email + password
  |   (Login)
  |
  [ Dashboard — Main View ]
  |
  |   LAYOUT: Desktop layout
  |   LEFT PANEL (320px fixed): Job Queue
  |   CENTER PANEL (flexible): Live Map (optional — shows driver location if GPS available)
  |   RIGHT PANEL (340px fixed): Driver Status Board
  |
  |   HEADER: Browser tab badge / popup notification fires when new order arrives
  |
  |   LEFT PANEL — Job Queue:
  |   - Tabs: [ All ] [ Pending ] [ Active ] [ Waitlist ] [ Completed ]
  |   - Each job card shows: Customer name, address, driveway size, status badge, time in queue
  |   - Job cards sorted by urgency (time in queue)
  |   - "New Order" button pinned to top of panel
  |
  |   WAITLIST TAB:
  |   - Shows all jobs in waitlist state (no driver assigned yet)
  |   - Each waitlist card shows: Customer name, address, driveway size,
  |     time on waitlist, customer notification channel (SMS/email)
  |   - Each card includes an "Assign to Driver" button
  |   - Clicking "Assign to Driver" opens the driver selection dropdown
  |     (same as manual assignment in New Order flow)
  |   - When assigned: job moves from Waitlist tab to Active tab;
  |     customer receives notification via their preferred channel
  |
  |   RIGHT PANEL — Driver Board:
  |   - List of all drivers: name, status, current job, jobs completed today
  |   - Status color indicator (green = available, grey = offline)
  |
  =====================================================
  FLOW A: Manual Order Entry (Phone-in Customer)
  =====================================================
  |
  (Click "New Order")
  |
  [ New Order Modal / Slide-out Panel ]
  |   Step 1 — Customer Information:
  |   - Name (required)
  |   - Phone number (required)
  |   - Email (optional)
  |   - Returning customer search: type name/phone to autofill
  |
  |   Step 2 — Location:
  |   - Address field with autocomplete (geocoding)
  |   - Map preview confirms pin placement
  |   - Admin can drag pin to adjust
  |
  |   Step 3 — Service Details:
  |   - Driveway size tier selector (matches customer-facing tier options)
  |   - Special instructions text area
  |   - Price auto-populated from tier; admin can adjust
  |
  |   Step 4 — Assignment:
  |   - "Auto-assign next available driver" toggle (default ON)
  |   - OR: Manual driver selection dropdown (shows available drivers only)
  |
  (Create Order)
  |   > Order created, appears in Job Queue as "Pending"
  |   > If driver selected: job pushed to driver immediately
  |   > If auto-assign: system holds until driver accepts
  |   > Customer receives confirmation via their preferred notification channel (if set)
  |
  =====================================================
  FLOW B: Monitor and View Active Jobs
  =====================================================
  |
  [ Dashboard — Active Tab selected in queue ]
  |
  |   Live updates (no manual refresh required):
  |   - Job card timestamps update (time elapsed)
  |   - Status transitions reflected in real-time:
  |       Pending -> Assigned -> En Route -> On Site -> Complete
  |
  |   Admin actions available at any state:
  |   - Contact customer (tap-to-call from job card)
  |   - Add dispatcher note to job record
  |   - View job detail (click any card)
  |
  =====================================================
  FLOW C: View Completed Jobs
  =====================================================
  |
  > Driver marks job complete (triggers from Driver Interface)
  > Job card moves to "Completed" tab
  > Status badge turns grey/checkmark
  |
  (Click on completed job card)
  |
  [ Job Detail — Completed State ]
  |   - Full service summary
  |   - Driveway size tier and final price (including any driver-applied adjustment)
  |   - Payment method recorded by driver (cash/card/PayPal/Venmo)
  |   - Completion timestamp
  |   - Duration of service
  |   - Customer rating (if submitted)
```

---

## 4. Accessibility Considerations

### 4.1 Driver Interface — Critical Accessibility Requirements

The driver interface carries the highest accessibility stakes of the three surfaces, extending beyond disability accessibility into safety-critical usability.

**Vision in Low-Visibility Conditions**

Contrast requirements exceed WCAG AA (4.5:1) for all text. Target WCAG AAA (7:1) for primary labels and action text on the driver interface. The rationale is that viewing a screen through a truck windshield with precipitation, condensation, and potential light glare introduces ambient contrast challenges that standard WCAG ratios do not account for.

Key contrast pairs:
- White text (#FFFFFF) on Night background (#0D1117): 19.1:1 — exceeds AAA
- Apex Orange (#F57C20) on Night background (#0D1117): 4.8:1 — meets AA for large text
- White text on Apex Orange button (#F57C20): 3.1:1 — acceptable for bold display text at 32px+

Status indicators must never rely on color alone. The driver's availability status uses color + shape + label simultaneously: a green circle + the word "AVAILABLE" + a pulsing animation.

**Motor Accessibility — Gloved Operation**

Minimum touch target: 72px x 72px. Primary action buttons: 88px height, full viewport width. Touch targets for adjacent interactive elements must be separated by at least 16px. Swipe gestures are never the sole mechanism for a primary action — a tap alternative always exists.

**Cognitive Load During Operation**

- Screen reading order must match visual order (no CSS-based reordering that diverges from DOM order)
- No time-limited UI elements except the job acceptance timer, which has an explicit countdown display
- The 30-second job acceptance window must be communicated visually and, on supporting Android devices, with haptic feedback at 10 seconds remaining
- Error messages are specific and action-oriented: "Could not load navigation — tap to retry" not "Error 503"

**Night Vision Preservation**

The driver interface uses no white or very-light backgrounds. Even the map component uses a dark basemap ("Navigation Night"). Bright flashes during screen transitions are eliminated — all transitions use a 200ms fade, not a snap cut.

**Notification and Alerting**

Incoming job alerts must be:
- Audible (a distinct, unmistakable chime — not a generic ping)
- Haptic (strong vibration pattern on Android, not a subtle buzz)
- Visual (full-screen takeover that cannot be missed)
All three channels fire simultaneously. The driver must not miss a job because they were focused on the road.

---

### 4.2 Customer Interface — Standard Accessibility Requirements

**WCAG 2.1 AA Compliance is the floor, not the ceiling.**

**Screen Reader Support**
- All map interactions have text-based alternatives. A customer using VoiceOver or TalkBack can submit a request by typing their address; the map pin visualization is supplemental, not required.
- Live regions (`aria-live="polite"`) are used on the tracking screen so that status updates ("Your driver is on the way") are announced automatically by screen readers without requiring the user to navigate to that element.
- All icons used decoratively carry `aria-hidden="true"`. Icons that convey meaning (status indicators) carry descriptive `aria-label` attributes.

**Form Accessibility**
- Every form field has an associated `<label>` element (no placeholder-only labels, which disappear on input)
- Error messages are associated with their fields via `aria-describedby`
- Required fields are indicated both visually and programmatically (`aria-required="true"`)
- Autocomplete attributes are applied to address, name, email, and phone fields to support autofill and reduce typing burden

**Keyboard Navigation**
- Complete keyboard operability throughout the request flow
- Focus states are highly visible: 3px solid focus ring in `--color-apex`
- Focus is managed programmatically when modals open (focus moves to modal) and close (focus returns to trigger)

**Text Sizing and Zoom**
- All text sizes defined in `rem` units, not `px`, so they scale with user's system font size preference
- The interface remains fully functional at 200% browser zoom with no horizontal scrolling

**Color and Contrast**
- All informational content uses color + an additional indicator (icon, label, or pattern)
- Minimum contrast 4.5:1 for all body text; 3:1 for large text and UI components
- Customer-facing status badges use color + label text + distinct shape per status

---

### 4.3 Admin Portal — Desktop Accessibility Requirements

**Keyboard Power-User Access**
- Full keyboard navigation for all primary workflows
- Keyboard shortcuts for frequent actions: `N` for New Order, `Esc` to close modals, arrow keys to navigate job queue
- All shortcuts are discoverable via a keyboard shortcut overlay (triggered by `?`)
- No reliance on hover-only states for critical information — tooltips with useful content are also accessible via keyboard focus

**Data Table Accessibility**
- All data tables use proper `<table>`, `<thead>`, `<th scope>` markup
- Sortable columns announce their sort state (`aria-sort="ascending"`)
- Filterable tables announce result count changes via `aria-live`

**Map Accessibility**
- The live map provides a text-based list view as an alternative (a list of all active jobs with statuses, sortable by any column)
- Admins can perform all functions without the map

**Motion and Animation**
- All animations respect `prefers-reduced-motion`. Transitions become instantaneous; live update indicators use a static indicator rather than a pulse animation.

**Session and Timing**
- The portal does not time out during active use (activity detection resets inactivity timer)
- If a session is about to expire, a warning appears at least 60 seconds in advance with an option to extend

---

### 4.4 Universal Accessibility Principles Across All Surfaces

**Language and Literacy**
- All copy is written at a Grade 8 reading level or below (Flesch-Kincaid target: 65-75)
- Jargon is avoided. "Plow job" not "service dispatch event." "Driver on the way" not "operator in transit."
- Error messages are written in plain language with clear resolution steps

**Internationalization Readiness**
- All UI strings are externalized for future localization (no hardcoded English strings in component logic)
- Date, time, and currency formats use locale-aware formatting
- Layout is designed to accommodate 30-40% text expansion for future French/Spanish support (Canada and US market consideration)

**Low-Bandwidth Consideration**
- Core functionality works on 3G connections (a rural reality for drivers and customers)
- Map tiles are cached aggressively
- No autoplay video; no large unoptimized images
- Graceful degradation: if the map fails to load, address text is displayed as the fallback

---

## 5. Open UX Questions for Product Owner

Questions resolved by the product owner are marked **[RESOLVED]** with the confirmed decision noted inline. As of 2026-02-25, Q29–Q35 are resolved. The remaining open questions are marked **[OPEN]** and must be finalized before Phase 1 UX is fully locked.

---

### 5.1 Business Model and Pricing

**Q1: Is pricing fixed per service type, or does it vary by driveway size, distance, or season?**
**[RESOLVED]** Pricing is fixed per driveway size tier (1-car, 2-car, 3-car, etc.). The tier is selected by the customer during booking. Admin sets prices per tier in the setup wizard, with suggested New England 2026 defaults pre-populated (~$65 / $85 / $105).

**Q2: Is there a surge pricing or emergency premium model?**
**[OPEN]** Not addressed in Phase 1 decisions. Treated as out of scope for now, pending confirmation.

**Q3: Will customers be charged upfront, on completion, or via invoice?**
**[RESOLVED]** Customers pay the driver directly at completion — cash, card, PayPal, or Venmo. There is no in-app payment form in Phase 1. No pre-authorization, no invoice flow.

**Q4: Are tips supported?**
**[RESOLVED]** No tip prompt in Phase 1. Tips are Phase 2 scope.

**Q5: Is there a flat rate for cancellation, or is cancellation free within a window?**
**[RESOLVED]** Cancellation policy confirmed:
- Scheduled jobs: cancellation is free before a defined deadline, shown to the customer at booking ("Cancel by [time] to avoid fees").
- ASAP jobs: free cancellation before driver accepts/starts en route; 25% fee applies after that point.
- The cancellation confirmation screen must display the exact fee amount before the customer confirms.

---

### 5.2 Driver Operations

**Q6: Do drivers set their own availability, or does the dispatcher control it?**
**[RESOLVED]** Drivers self-manage availability via an Available/Offline toggle. No dispatcher override in Phase 1.

**Q7: Are drivers employees or independent contractors?**
**[OPEN]** Not addressed in Phase 1 decisions. Treated as out of scope for UX in Phase 1 (no payroll or tax UI needed), pending confirmation.

**Q8: Can a driver have multiple jobs queued?**
**[RESOLVED]** Yes. The driver interface has a job queue, with the current active job always displayed prominently at the top.

**Q9: What navigation app do drivers use?**
**[RESOLVED] (implied)** Android-first. Deep links target Google Maps and Waze. Apple Maps deep link is a Phase 2 consideration if iOS is added.

**Q10: Is photo confirmation of completed work required?**
**[RESOLVED]** No photo confirmation in Phase 1. Photo capture step is Phase 2 scope.

**Q11: What happens if a driver cannot complete a job?**
Covered by the "Issue / Cannot Complete" ghost button in the driver flow. Full exception flow design is deferred pending operational details.

---

### 5.3 Customer Experience

**Q12: Is customer account creation required?**
**[RESOLVED]** No. A soft account is auto-created on first order from phone/email. No password is required to place a first order. The customer can set a password later from their account page.

**Q13: Can customers schedule in advance, or is service always on-demand?**
**[OPEN]** Not fully resolved. Both scheduled and ASAP modes are referenced in the cancellation policy, implying scheduled jobs exist. Scheduling calendar UI design remains open pending confirmation of full scheduling feature scope.

**Q14: What is the customer notification strategy?**
**[RESOLVED]** Customer chooses during soft account creation: SMS only, email only, both, or none.

**Q15: Is there a customer-facing driver rating system?**
A 5-star rating prompt appears on the job complete screen. Whether ratings are used operationally by the admin is not confirmed for Phase 1 — the prompt is included but the admin-facing ratings view is deferred.

**Q16: Will customers see a specific driver's name and photo before accepting?**
**[OPEN]** Not fully resolved for Phase 1. The flow shows driver name and photo if pre-assigned, or "Next available driver" if not. Design supports both states.

---

### 5.4 Admin and Dispatch Operations

**Q17: How many concurrent drivers will the system support initially?**
**[OPEN]** Not resolved. Design assumes a small fleet (2–5 drivers) for Phase 1. Driver board scales up with additional rows.

**Q18: Is dispatch primarily auto-assignment or human-driven?**
**[RESOLVED] (implied)** Phase 1 admin is the owner/driver. Auto-assignment is the likely default; manual order creation for phone-in customers is the primary human-driven use case.

**Q19: Does the admin portal need multi-user support?**
**[OPEN]** Not addressed for Phase 1. Single-user admin assumed.

**Q20: What financial reporting is needed?**
**[OPEN]** Not addressed for Phase 1. The admin job list (with payment method recorded per job) serves as the basic record. Finance dashboard is Phase 2 scope.

**Q21: Are there multiple operators using one PlowDispatch instance?**
**[OPEN]** Not addressed for Phase 1. Single-operator assumed.

---

### 5.5 Technical and Platform Constraints

**Q22: What is the target device and OS version floor for the driver interface?**
**[RESOLVED]** Physical test device: Samsung Galaxy S25, Android 16, Chrome 145. This is the baseline for all Phase 1 driver interface design and API decisions.

**Q23: Will the driver interface be a PWA, native app, or mobile web?**
**[RESOLVED]** Progressive Web App (PWA), Android-first. No iOS-specific workarounds required for Phase 1.

**Q24: What mapping/geocoding provider is selected?**
**[OPEN]** Not confirmed. Mapbox referenced in design system as the assumed provider pending confirmation.

**Q25: Is there an existing SMS/notification provider in the tech stack?**
**[OPEN]** Not confirmed. Design assumes SMS capability exists (e.g., Twilio) but the specific provider is not locked.

---

### 5.6 Questions Resolved in v1.2 (Previously Blocking)

All questions in this section were open in v1.1. All are resolved as of 2026-02-25.

| ID | Question | Resolution |
|----|----------|------------|
| Q29 | What is the maximum driveway size tier? | 6-car maximum. Tiers run 1-Car ($65) through 6-Car ($165). Admin can add or remove tiers. Customer picker shows all configured tiers as visual cards with driveway illustrations. |
| Q30 | How is the service area center point defined? | Always the admin's home base address. Admin enters a street address via Google Places Autocomplete in Setup Step 1. System geocodes it and places the fixed center pin. Admin cannot drag the pin — only edit the address field to reposition. |
| Q31 | What is the waitlist notification flow? | Customer confirmation: "You're on our waitlist. We'll notify you if a driver becomes available." No ETA. Notification via customer's preferred channel (SMS/email) when a driver accepts. Driver app shows "Available Jobs" section for unclaimed waitlisted jobs. Admin portal shows a Waitlist tab with "Assign to Driver" per job. |
| Q32 | What fields are required for the price change UI? | Numeric-only price input field. Confirmation dialog: "Change price from $X to $Y?" with a Confirm button. No reason field, no note field, no dropdown in Phase 1. Reason field is a Phase 2 enhancement. |
| Q33 | What is the minimum Android version target for the driver PWA? | Samsung Galaxy S25, Android 16, Chrome 145. Screen Wake Lock API, Vibration API, and Web Push are all available at this baseline and are Phase 1 requirements. |
| Q34 | Static or dynamic QR codes on the driver payment screen? | Static. Driver configures their PayPal.me/Venmo URL once during setup. Completion screen shows: final price (large), static QR (full-width), "Or tap to open" button. Customer enters amount manually. No per-job dynamic QR. |
| Q35 | Should admin pricing pre-populate with defaults? | Yes. Six pre-filled rows: 1-Car $65, 2-Car $85, 3-Car $105, 4-Car $125, 5-Car $145, 6-Car $165. Helper text: "These are suggested 2026 New England rates. Adjust to match your market." Admin can edit, add, or remove rows. |

---

## 6. Design System Summary

### 6.1 Platform Notes — Android-First Driver Interface

The driver interface is a Progressive Web App targeting Android as the primary platform. The following design system considerations apply:

**Physical Test Device Baseline (confirmed):**
- Device: Samsung Galaxy S25
- OS: Android 16
- Browser: Chrome 145

This baseline defines the minimum platform we design and test against. All Phase 1 Web APIs listed below are confirmed available on Chrome 145 / Android 16. Older Android versions are not a Phase 1 concern.

- **Dark mode:** Implemented as the sole mode for the driver interface. No light mode toggle. No `prefers-color-scheme` media query needed for the driver surface — dark is always applied.
- **Touch targets:** Android Material Design guidelines recommend 48dp minimum; our 72px minimum exceeds this comfortably. Density-independent pixels (dp) and CSS pixels are treated as equivalent at the standard display density baseline.
- **Haptics (Vibration API):** Available on Chrome 145 / Android 16. Use it for incoming job alerts (strong vibration pattern) and for confirm actions (single short pulse). iOS PWA does not support the Vibration API — this is acceptable since Phase 1 does not target iOS.
- **Screen Wake Lock API:** Available on Chrome 145 / Android 16. The driver app must activate the Screen Wake Lock when the driver enters an active job state (En Route or On Site) to prevent the screen from sleeping. The lock must be released when the driver returns to the Home / Status screen or goes Offline. This is a Phase 1 requirement, not a Phase 2 enhancement.
- **Web Push notifications:** Available on Chrome 145 / Android 16 for installed PWAs. This is the mechanism for incoming job push alerts when the browser is not in the foreground.
- **PWA install prompt:** Android Chrome surfaces the "Add to Home Screen" prompt automatically for compliant PWAs. Design the install prompt intercept screen to appear after the driver's first successful login. Do not prompt on the login screen itself.
- **iOS deferred:** No iOS-specific PWA workarounds (Safari Web Push limitations, lack of Vibration API, install prompt differences) need to be designed or documented for Phase 1.

---

### 6.2 Token Summary

```
COLORS
  --color-night:           #0D1117
  --color-slate-900:       #1A2233
  --color-slate-700:       #2D3F5C
  --color-slate-400:       #6B7E99
  --color-slate-100:       #EDF1F7
  --color-white:           #FFFFFF
  --color-apex:            #F57C20
  --color-apex-light:      #FDEBD0
  --color-apex-dark:       #C45F08
  --color-status-active:   #2ECC71
  --color-status-warn:     #F5C842
  --color-status-idle:     #6B7E99
  --color-status-error:    #E74C3C
  --color-map-driver:      #F57C20
  --color-map-customer:    #3B82F6
  --color-map-job-active:  #2ECC71

TYPOGRAPHY
  --font-ui:               "Inter", system-ui, sans-serif
  --font-display:          "Space Grotesk", sans-serif
  --text-xs:               0.75rem  (12px)
  --text-sm:               0.875rem (14px)
  --text-base:             1rem     (16px)
  --text-lg:               1.125rem (18px)
  --text-xl:               1.5rem   (24px)
  --text-2xl:              2rem     (32px)
  --text-3xl:              3rem     (48px)

SPACING (4px base unit)
  --space-1:               4px
  --space-2:               8px
  --space-3:               12px
  --space-4:               16px
  --space-6:               24px
  --space-8:               32px
  --space-12:              48px
  --space-16:              64px

RADII
  --radius-sm:             4px    (tags, badges)
  --radius-md:             8px    (buttons, inputs)
  --radius-lg:             12px   (cards, panels)
  --radius-xl:             16px   (driver primary buttons)
  --radius-full:           9999px (status pills, avatars)

TOUCH TARGETS
  --target-minimum:        44px   (WCAG 2.5.5 AA)
  --target-driver:         72px   (glove-friendly minimum)
  --target-driver-primary: 88px   (driver primary action)

ELEVATION (light surfaces)
  --shadow-sm:             0 1px 3px rgba(0,0,0,0.06)
  --shadow-md:             0 2px 8px rgba(0,0,0,0.08)
  --shadow-lg:             0 8px 24px rgba(0,0,0,0.12)
```

### 6.3 Component Inventory (Phase 1 Scope)

**Shared Components (used across 2+ interfaces)**
- Button (Primary, Secondary, Destructive, Ghost variants)
- Status Badge (Available, Offline, Pending, Active, Complete, Error)
- Avatar (driver photo with status ring)
- Map Container (with driver pin, customer pin, route line)
- Toast / Notification (success, warning, error)
- Modal / Dialog (confirm actions)
- Loading / Skeleton states

**Customer Interface Components**
- Address Input with Map Preview
- Driveway Size Tier Picker (visual/icon-based, 6 tiers; each card shows driveway illustration, label, and price; sourced from docs/Images/)
- Notification Preference Picker (SMS / Email / Both / None)
- Pricing Confirmation Panel (includes cancellation policy display)
- Driver En Route Card (name, photo, status — no ETA in Phase 1)
- Job Tracking Status Banner
- "No Drivers Available" screen with Waitlist CTA
- Waitlist Confirmation Screen ("You're on our waitlist. We'll notify you if a driver becomes available." — no ETA shown)
- Cancellation Confirmation Screen (with fee display)
- Job Complete Screen (payment reminder + rating prompt)
- Rating Input (5-star)

**Driver Interface Components**
- Status Toggle (Available / Offline) — oversized, Android-optimized
- Incoming Job Alert (full-screen takeover)
- Accept / Reject Button Pair (large, high contrast)
- Job Countdown Timer
- Active Job Header (persistent)
- Job Queue List — two-section layout: "Your Jobs" (assigned) + "Available Jobs" (waitlisted, driver-claimable)
- Navigation Launch Button (Google Maps / Waze deep link)
- Arrival / Completion Button
- Price Adjustment Control (numeric-only input + confirmation dialog "Change price from $X to $Y?" — no reason field in Phase 1)
- Payment Collection Screen (static QR code full-width + "Or tap to open" button + payment method selector)
- Screen Wake Lock trigger (activates on En Route / On Site state entry; releases on return to home screen)

**Admin Portal Components**
- Setup Wizard (3-step: service area / pricing / payment links)
- Service Area Map (address-first: Places Autocomplete input geocodes to center pin; radius slider adjusts circle overlay; pin is fixed to home base address)
- Pricing Tier Editor (6 pre-populated editable rows with 2026 NE defaults; add/remove row controls)
- Payment Link Entry + Static QR Preview (live client-side QR generation from entered URL)
- Waitlist Job Panel (separate tab in job queue; "Assign to Driver" button per waitlisted job)
- Job Queue Card (with status, tier, timer)
- Job Detail Slide-out Panel
- Driver Board Row (with availability indicator)
- New Order Wizard (multi-step form)
- Browser Tab Notification Badge

### 6.4 Next Design Phase Milestones

All core flows are defined, but open decisions in Section 5 still require closure to fully lock Phase 1 UX. Wireframing can proceed, but any screens that depend on **[OPEN]** items should be flagged for revision once those decisions are finalized.

| Milestone | Deliverable | Status |
|-----------|-------------|--------|
| M1: Wireframes — Customer Flow | Low-fidelity wireframes, all customer screens (incl. 6-tier picker, waitlist confirmation) | Unblocked |
| M1: Wireframes — Driver Flow | Low-fidelity wireframes, all driver screens (incl. static QR payment screen, two-section job queue) | Unblocked |
| M1: Wireframes — Admin Setup | Low-fidelity wireframes, setup wizard (incl. address-first service area, 6-row pricing editor) | Unblocked |
| M1: Wireframes — Admin Dashboard | Low-fidelity wireframes, job management views (incl. waitlist tab) | Unblocked |
| M2: Visual Design | High-fidelity mockups, all screens, all states | Depends on M1 |
| M3: Prototype | Clickable prototype in Figma for user testing | Depends on M2 |
| M4: Design Tokens | Exported token file for developer handoff | Depends on M2 |
| M5: Component Spec | Annotated spec for each component (states, sizing, behavior) | Depends on M2 |
| M6: Accessibility Audit | WCAG audit of all mockups, remediation complete | Depends on M3 |
| M7: Developer Handoff | Figma handoff with all specs, assets, tokens | Depends on M5, M6 |

---

*End of UX Design Plan — Version 1.2*
*Document maintained in: /data/ApexPlow/docs/Design Documents/UX-Design-Plan.md*
*Last updated: 2026-02-25 — All Q29–Q35 product decisions incorporated; all design areas unblocked*
