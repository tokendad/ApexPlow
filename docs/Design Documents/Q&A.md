# ApexPlow / PlowDispatch — Open Questions

**Document version:** 1.2
**Date:** 2026-02-25
**Status:** Complete — All 35 questions resolved. Ready for implementation.

This document consolidates all open questions raised during the initial planning phase across three specialist reviews: project roadmap (Plan), system architecture (Architecture), and UI/UX design (UX-Design-Plan). These questions must be answered before development begins. Questions are grouped by domain and annotated with the specific decisions they gate.

---

## How to Use This Document

For each question:
1. Discuss with the team / stakeholders
2. Write the answer in the **Answer** field
3. Note any follow-on decisions the answer creates
4. Mark as **Resolved** when the answer is confirmed

---

## Section 1 — Business Model

---

**Q1. Is PlowDispatch a single-operator internal tool or a multi-tenant SaaS platform?**

*Context:* This is the single most consequential technical decision. Multi-tenancy requires an `organizations` table and `organization_id` scoping on every database table from day one. Adding it after the data model is locked is an expensive migration.

*Gates:* Entire database schema design.

> **Answer:** _The initial intent of the program will be customer to Driver focused with no administrative/secretary   with future plans to allow for multiple drivers and dispatch  These eventual drivers will be either single company and/or "Gig" Style setup(1099 employee).   The "Uber Diver" of plow dispatch. But the initial design should be focused on 1 driver/1 admin for now.  The "Admin" for phase 1,  should be the driver/owner setting up the initial values needed(zones, pricing, payments...etc).
> **Resolved:** [!] Yes / [ ] No

---

**Q2. What is the service area model — single region or multi-region?**

*Context:* Does the system enforce geographic boundaries on customer requests, or is that handled administratively by the dispatcher rejecting out-of-area jobs? Automated enforcement requires either a radius check or a polygon boundary definition stored in the database.

*Gates:* Customer request form validation, admin portal configuration.

> **Answer:** Radius Should be locked automatically based on preset boundaries setup by admin
> **Resolved:** [!] Yes / [ ] No

---

**Q3. What is the pricing model?**

Options:
- **Flat rate by service type** — One price per tier (standard, priority, commercial). Simplest. Stored as a config table.
- **Dynamic pricing** — Price varies by distance, storm severity, or time of day. Significantly more complex.
- **Quote-based** — Customer requests, admin sends a quote, customer accepts. No upfront algorithm needed.
- **Hybrid** — Flat rate shown as estimate; final price set by admin after job completion.

*Gates:* Customer checkout flow UI, pricing config schema, Billing module quote-acceptance state.

> **Answer:** Hybrid- Flat rate set by size of driveway inputted by customer or admin at initial request. preset pricing should be able to be set by admin.  Example 1 Car =$25,  2 car = 35, 3 car = $45..etc. But modifiable by driver or admin as needed,  On the fly change.   Long Term Future Feature option: use Google earth/maps to capture driveway size and auto estimate rate.    See Research on Pricing and Cost models.md for more information on what may affect pricing models. Examples of the current 2026 NewEngland Pricing included can be used as test data for now. The initial program should be a simple model,  but take into account future development for more complex pricing models.
> **Resolved:** [!] Yes / [ ] No

---

**Q4. Is surge pricing a requirement at any phase?**

*Context:* Surge pricing during storm events (higher prices when demand exceeds driver capacity) is a significant feature used by ride-share apps. If this is planned, the pricing module must be designed to accept external signals (weather API, job queue depth) from day one even if the logic is not active.

*Gates:* Pricing module design, Phase 3 weather API integration.

> **Answer:** Surge pricing would be a good Long term future feature option.  
> **Resolved:** [!] Yes / [ ] No

---

**Q5. Are there different service tiers (standard driveway vs. commercial lot vs. salting)?**

*Context:* Each tier likely has a different price, estimated duration, and driver instruction set. This affects the Job data model and the customer request form.

*Gates:* `service_type` enum values in the jobs table, pricing config schema.

> **Answer:**  yes,  Residential should be the initial focus,  With commercial in future features. Salting, Sanding, Snow blowing or hand shoveling as "Add-On" package options For future development.  see Research on Pricing and Cost models.md  for additional "Add-On" options with possible pricing models.
> **Resolved:** [!] Yes / [ ] No

---

**Q6. What is the cancellation policy?**

*Context:* A customer cancels after a driver is already en route. Who absorbs the cost? A partial charge? A cancellation fee? The system must enforce whatever policy is set. This must be defined before building the cancellation flow.

*Gates:* Job cancellation API, Stripe charge reversal logic, customer UI cancellation flow.

> **Answer:** For "Preset orders/Returning customers" Cancel ≥ 12–24 hours before foretasted start: No charge.  Cancel within 6–12 hours: 25% of plow rate. Cancel after dispatch / truck rolling / plow on route: 50% charge. For "Come plow ASAP",  if cancel is before truck is en-route no change,  if truck is on-Route - 25%.  Commercial fees to be determined later, so development of database should be accounted for even if they are not used.  
> **Resolved:** [!] Yes / [ ] No

---

**Q7. Are there contract/commercial customers that receive recurring service?**

*Context:* Some plow businesses pre-schedule recurring jobs for commercial accounts (parking lots, HOAs). This is a fundamentally different job model from reactive on-demand requests. If this is needed in Phase 1, the job schema requires a `recurring_schedule` concept.

*Gates:* Job data model, admin bulk job creation.

> **Answer:** Commercial operations should be accounted for,  but not as part of the initial development.  Database can be setup to account for it to mitigate future database issues.
> **Resolved:** [!] Yes / [ ] No

---

## Section 2 — Payments and Finance

---

**Q8. When should the customer's card be charged?**

Options:
- **Option A: Authorize on job creation, capture on completion** — Card is pre-authorized for the estimated amount at booking. Actual charge happens when the job is marked complete. Standard model for on-demand services. Requires Stripe Payment Intents.
- **Option B: Invoice after completion, pay on receipt** — Admin generates an invoice after the job. Customer receives email with a payment link. Simpler but creates accounts receivable risk.
- **Option C: Subscription/retainer** — Customer pays a monthly or seasonal fee. Phase 3.

*Recommendation:* Option A for self-serve jobs. Option B for commercial accounts managed by admin.

*Gates:* Stripe integration pattern, billing workflow UI.

> **Answer:** Cash or Card will be the focus on initial development.  No PreAuth needed for card payments. Payment at completion. Invoicing  and Retainer for commercial users can be accounted for in future development.   Card payment for now can be processed via Paypal, Venmo or other similar processor, and option to display their QR or URL codes on the drivers dash.   Stripe or commercial payment processor setup can be save for the future.
> **Resolved:** [!] Yes / [ ] No

---

**Q9. Is online payment processing required for Phase 1, or can it be deferred?**

*Context:* If the operator collects cash or card in person for Phase 1, Stripe can be deferred to Phase 2, significantly reducing Phase 1 complexity. If online payment at booking is required, Stripe must be integrated immediately.

*Gates:* Phase 1 scope and timeline.

> **Answer:** Stripe can be deferred to Phase 2(Commercial)
> **Resolved:** [!] Yes / [ ] No

---

**Q10. How are driver payouts handled?**

Options:
- **Manual/off-platform** — The operator pays drivers directly via cash, check, or Venmo. The system just tracks what each driver completed.
- **Stripe Connect** — The platform manages payouts directly to driver bank accounts. Requires Stripe Connect onboarding for each driver.

*Gates:* Driver payout tracking UI in admin portal, Stripe Connect integration (Phase 2).

> **Answer:**  See Q8 answers
> **Resolved:** [!] Yes / [ ] No

---

## Section 3 — Dispatch Operations

---

**Q11. Manual dispatch only, or auto-dispatch with manual override?**

*Context:* The current design implies a dispatcher manually assigns drivers. Auto-dispatch (system automatically assigns the nearest available driver) would reduce dispatcher workload but requires a matching algorithm and a conflict resolution strategy.

*Gates:* Jobs module state machine, Dispatch module design, driver accept/reject flow.

> **Answer:** Phase 1 should account for only 1 driver.  Customer enters order Or dispatch takes call and enters order,  Driver receives notification about order and can either reject or accept it.  
> **Resolved:** [!] Yes / [ ] No

---

**Q12. Can a driver have multiple active jobs simultaneously, or only one at a time?**

*Context:* This changes the entire driver home screen architecture. A single active job means a simple "current job" view. A job queue means a list UI with prioritization and routing between jobs.

*Gates:* Driver interface information architecture, job assignment logic.

> **Answer:** A job queue,  with a focus on the current job.
> **Resolved:** [!] Yes / [ ] No

---

**Q13. What happens when no drivers are available?**

Options:
- Queue the request and auto-assign when a driver frees up (with estimated wait time)
- Reject the request with a message ("No drivers currently available")
- Allow the request to submit; dispatcher handles it manually

*Gates:* Customer-facing "no availability" UX, dispatcher notification design.

> **Answer:** Reject the request with message, with the option to place it in a "If we have time later we'll get to you"  option.
> **Resolved:** [!] Yes / [ ] No

---

**Q14. How does the dispatcher get notified of a new customer request?**

Options:
- Audible alert in the browser tab on the admin portal
- SMS to the dispatcher's phone (Twilio)
- Email notification
- All of the above (configurable)

*Gates:* Admin notification pipeline, dispatcher alert UX.

> **Answer:** Popup on the Browser tab, , with SMS/Popup to the driver
> **Resolved:** [!] Yes / [ ] No

---

**Q15. Is driver availability self-managed (driver toggles Available/Offline) or dispatcher-controlled?**

*Context:* If the dispatcher can force a driver's status (e.g., mark them offline at end of shift), that requires an admin override endpoint and additional UI. If drivers fully self-manage their availability, the dispatcher works with whatever status drivers report.

*Gates:* Driver status toggle design, admin portal driver management panel.

> **Answer:** Driver should be selfmanaged availability. No Dispatcher override.    future Feature -Unavailability reasons: Getting gas,  Getting Food, Personal Break(bathroom), Equipment failure, Getting Salt, getting Sand,  End of Shift
> **Resolved:** [!] Yes / [ ] No

---

## Section 4 — Customer Experience

---

**Q16. Is guest checkout supported, or is account creation required to place an order?**

Options:
- **Guest checkout** — Customer submits a request with just a name, phone, and address. No account. Lower friction, harder to track repeat customers.
- **Required account** — Customer must create an account before placing a first order. Higher friction, enables saved addresses and job history.
- **Soft account** — Account is created automatically on first order using the customer's phone number or email; they can set a password later.

*Recommendation:* Soft account (automatic creation) balances friction and data quality.

*Gates:* Customer onboarding flow, auth design for customer-facing app.

> **Answer:** Soft Account
> **Resolved:** [!] Yes / [ ] No

---

**Q17. Should the system show an estimated arrival time (ETA) to the customer?**

*Context:* ETA calculation requires knowing the driver's current GPS location and using a routing API (Google Directions, Mapbox Directions) to estimate drive time. This adds cost (routing API calls) and complexity. A simpler alternative is a status indicator with no time estimate ("Driver is on the way").

*Gates:* Customer tracking screen design, routing API integration cost.

> **Answer:** No ETA for phase 1,  Good Future phase feature.
> **Resolved:** [!] Yes / [ ] No

---

**Q18. What are the customer notification channels and can they be customized?**

*Context:* The design specifies SMS and email notifications. Should customers be able to choose their preference (SMS only, email only, both)? Does the system support browser push notifications as a third channel?

*Gates:* Notification module design, customer preference UI.

> **Answer:** SMS and/or Email or none.   Browser push is an option that may need more research on implementation.
> **Resolved:** [!] Yes / [ ] No

---

**Q19. Is a tip feature required?**

*Context:* An optional tip at job completion is common in on-demand service apps. It adds complexity to the payment flow (tip is collected separately from the base charge) but increases driver earnings and satisfaction.

*Gates:* Payment capture flow, Stripe charge logic, driver earnings UI.

> **Answer:** No Tip processing for now,  but could be accounted for in future phases.
> **Resolved:** [!] Yes / [ ] No

---

## Section 5 — Driver Experience

---

**Q20. What type of device do drivers primarily use — iOS or Android?**

*Context:* This is critical for the PWA vs. native app decision. iOS Safari has meaningful restrictions on background geolocation and push notifications for PWAs. If any drivers use iPhones, a PWA-only driver app will produce operational problems. Android is more permissive.

*Gates:* Driver interface platform decision (PWA vs. React Native / Expo).

> **Answer:** This is a BIG question that may be hard to answer.  Future phase options dictate a phone app VS web based may be the correct answer(GPS, Tracking, SMS...etc),  but currently as the developer I only have access to Android/Google options.  An Iphone app may be more difficult to develop.   I think..if possible to get this program off the ground,  webbased focused on Android might be the best way to start,  but with a back end that can be integrated with a mobile app in the future.
> **Resolved:** [] Yes / [!] No

---

**Q21. Is continuous background GPS tracking required, or is foreground-only acceptable for Phase 1?**

*Context:* Continuous background GPS (location updates when the screen is off) requires a native app or significant PWA workarounds on iOS. Foreground-only GPS (driver keeps the app open on their phone) is a reasonable Phase 1 constraint if drivers are willing to keep the screen on during their shift.

*Gates:* Driver app platform decision, GPS tracking architecture.

> **Answer:** forground for phase 1
> **Resolved:** [!] Yes / [ ] No

---

**Q22. What constitutes job completion — driver tap, photo upload required, or customer confirmation?**

Options:
- **Driver tap only** — Simplest. Phase 1 recommendation.
- **Photo required** — Driver must upload a completion photo before marking complete. Phase 3 feature per the design document.
- **Customer confirmation** — Customer must confirm the job is complete. Adds a feedback loop but also adds friction and potential disputes.

*Gates:* Job completion flow, photo upload feature scope.

> **Answer:** Driver Tap for phase 1,  Photo requirement for future commercial jobs
> **Resolved:** [!] Yes / [ ] No

---

**Q23. Should drivers be able to see their earnings within the app?**

*Context:* A driver earnings summary (jobs completed today, total payout this pay period) increases driver satisfaction and reduces questions to the dispatcher. It requires the billing module to expose per-driver aggregates.

*Gates:* Driver interface earnings screen, billing module driver reporting.

> **Answer:** Not required for phase 1,  Save for future phase
> **Resolved:** [!] Yes / [ ] No

---

## Section 6 — Technical and Infrastructure

---

**Q24. What is the team's primary programming language for backend development?**

Options:
- **Node.js + TypeScript** — Fastest ramp-up, shared types with React frontends, strong ecosystem.
- **Go** — Better concurrency for WebSocket handling, lower memory footprint, faster at runtime. Longer initial development time.

*Gates:* Backend technology selection, toolchain setup.

> **Answer:** **Node.js + TypeScript
> **Resolved:** [!] Yes / [ ] No

---

**Q25. Does the customer-facing app require SEO (search engine indexing)?**

*Context:* If the customer app serves as both the marketing landing page and the service request form, SEO matters and server-side rendering (Next.js 15) is recommended. If the landing page / marketing site is separate, a plain Vite + React SPA is simpler.

*Gates:* Frontend framework selection for the customer app.

> **Answer:** No search indexing is required.
> **Resolved:** [!] Yes / [ ] No

---

**Q26. Which mapping provider will be used?**

Options:
- **MapLibre GL JS v4** — Open-source, zero per-request cost. Requires hosting your own tile server or using a third-party tile provider (Maptiler, Stadia Maps).
- **Mapbox GL JS v3** — Managed tile service. Generous free tier (50k map loads/month). Proprietary license.
- **Google Maps Platform** — Most familiar to users. Best-in-class Places autocomplete. Pricing is per API call and can become significant at scale.

*Gates:* All map components across all three interfaces. Must be standardized — do not mix providers.

> **Answer:** I currently have a Google API plan.  But will look into maplibre-gl-js,  I do have the ability to host my own server.
> **Resolved:** [!] Yes / [ ] No

---

**Q27. What data retention periods are required for driver location logs?**

*Context:* Driver GPS history is sensitive personal data. The database schema uses monthly table partitioning specifically to make retention enforcement easy — old partitions can be dropped with a single command. The default assumption is 90 days online. If a shorter period is preferred for privacy reasons, or a longer period for operational audit purposes, the schema needs no changes but the scheduled cleanup job does.

*Gates:* Retention policy configuration, privacy policy language, potential GDPR/CCPA compliance requirements.

> **Answer:** No retention logs needed for phase 1,  future commercial phases yes.
> **Resolved:** [!] Yes / [ ] No

---

**Q28. Are any customers or drivers located in the European Union?**

*Context:* If yes, GDPR applies. This requires: a Privacy Policy and Terms of Service, Data Processing Agreements with Stripe, Twilio, and all other third-party processors, a data subject rights mechanism (access, deletion), and explicit consent for data processing at account creation. This is a legal and compliance requirement, not just a technical one.

*Gates:* Pre-launch legal review.

> **Answer:** NO
> **Resolved:** [!] Yes / [ ] No

---

## Section 7 — Follow-Up Questions (Added v1.1)

These questions arose from analyzing the answers to the original 28 questions. All seven follow-up questions (Q29–Q35) were resolved by the product owner on 2026-02-25. The full question set is now complete.

---

**Q29. What is the maximum driveway size tier to support in Phase 1?**

*Context:* The pricing model uses car-count tiers (1-car = $25, 2-car = $35, 3-car = $45). What is the upper limit? 5-car? 10-car? Is there an "oversized" tier with a custom price? And what is the label for each tier in the customer-facing UI — "1-car garage," "2-car garage," etc.?

*Gates:* Pricing config table design, customer request form driveway size picker.

> **Answer:** Upper limit will be 6 car,  thats a 3x3 pattern,  Images in the docs/Images folder.  That puts the uppder limit of driveway size to 48 feet long,  by 27 feet wide. There is a document in the /docs/Reference material  folder called "SafeEfficientDrivewayDesign.md"  that contains more information on standard dimension and includes some commerical information also .
> **Resolved:** [!] Yes / [ ] No

---

**Q30. For the service area radius — what is it measured from?**

*Context:* The service area is enforced as a radius (Q2). Is that radius centered on a configurable home base or depot address that the admin sets up? Or does the admin define a center lat/lng independently from their home address? This determines what the admin sets up during initial configuration.

*Gates:* Service area config table, admin setup flow ("home base" onboarding step).

> **Answer:** Service area should be based on a "configurable home base"  set by the owner at onboarding.
> **Resolved:** [!] Yes / [ ] No

---

**Q31. For the "if we have time later" waitlist option (Q13) — how does the customer get notified when a spot opens?**

*Context:* When a driver becomes available and picks up a waitlist job, the customer needs to be notified. Does the system automatically notify them and auto-assign, or does it alert the driver/admin that there is a waitlist job available and let them choose? And does the customer see an estimated wait time, or just a "you're on the waitlist" confirmation?

*Gates:* Waitlist/backlog queue data model, notification flow for waitlisted customers.

> **Answer:** The customer should be placed on the waitlist, with no ETA.  Drivers should have access to the waitlist to pickup as they seem fit or assigned by the admin.  If the job is picked up,  the customer can be notified by their selected method of communications (SMS, Email or Phone call from the driver)  ETA can then be calculated based on the drivers current work load and GPS.
> **Resolved:** [!] Yes / [ ] No

---

**Q32. Should price modifications (on-the-fly changes by driver or admin) be logged with a reason?**

*Context:* The pricing model allows the driver or admin to modify the quoted price on the fly. For customer transparency and dispute resolution, should the system log who changed the price, when, and optionally why (e.g., "extra-long driveway," "heavy wet snow," "customer discount")? Even if the log is internal-only, it protects the operator.

*Gates:* Job price change audit trail, billing module design.

> **Answer:** for the initial phase 1,  no reason is needed,  this would be a good addition in future phases.
> **Resolved:** [!] Yes / [ ] No

---

**Q33. What is the minimum Android version / browser target for the driver PWA?**

*Context:* The driver app is Android-first (Q20). Knowing the minimum Android version and Chrome version helps determine which PWA APIs are available — specifically the Geolocation API reliability, Web Push support, and IndexedDB for offline queueing. Most modern Android devices (Android 8+, Chrome 80+) support all needed APIs, but it's worth confirming if older devices might be in use.

*Gates:* PWA capability baseline, offline queueing implementation, browser compatibility polyfills needed.

> **Answer:** Current available physical phone for testing is a Galaxy s25 with  Android 16.  with Chrome version 145.0.7632.109.  Access to Android Studio for virtual phones is also available.
> **Resolved:** [!] Yes / [ ] No

---

**Q34. For the PayPal/Venmo QR code on the driver's completion screen — is this a static QR/link the driver configures once, or does it need to pre-fill the amount?**

*Context:* PayPal and Venmo both support deep links that can pre-fill a payment amount (e.g., `https://venmo.com/?txn=pay&amount=65&note=PlowService`). If the QR dynamically includes the job's final price, the customer taps it and sees the exact amount pre-filled. This is more convenient but requires generating a dynamic QR at job completion. A static QR (just the driver's payment profile) is simpler but requires the customer to manually enter the amount.

*Gates:* Driver completion screen design, payment display implementation.

> **Answer:** Static link,  customer can fill amount.
> **Resolved:** [!] Yes / [ ] No

---

**Q35. Should the pricing research data (from "Research on Pricing and Cost models.md") be used to pre-populate the admin setup with suggested default rates?**

*Context:* The pricing research shows 2026 New England rates of approximately $60–$130 per residential visit. For Phase 1, when the admin first sets up the system, should the app suggest these as default starting prices (e.g., 1-car = $65, 2-car = $85, 3-car = $105) that the admin can then adjust? This reduces friction during onboarding.

*Gates:* Admin onboarding/setup flow, pricing config seed data.

> **Answer:** Prefilled is Good
> **Resolved:** [!] Yes / [ ] No

---

## Summary — Decision Priority

| Priority | Question | Blocks |
|---|---|---|
| **Critical** | Q1 — Single-operator vs. SaaS | Entire database schema |
| **Critical** | Q3 — Pricing model | Customer checkout, billing schema |
| **Critical** | Q11 — Manual vs. auto-dispatch | Jobs state machine, matching algorithm |
| **Critical** | Q20 — iOS or Android drivers | Driver app platform (PWA vs. native) |
| **High** | Q8 — Payment capture timing | Stripe integration pattern |
| **High** | Q9 — Payments in Phase 1? | Phase 1 scope and timeline |
| **High** | Q12 — Single job or queue? | Driver home screen architecture |
| **High** | Q16 — Guest checkout? | Customer onboarding flow |
| **High** | Q21 — Background GPS? | Driver app platform decision |
| **Medium** | Q2 — Service area enforcement | Customer request validation |
| **Medium** | Q5 — Service tiers | Jobs schema, pricing config |
| **Medium** | Q6 — Cancellation policy | Cancellation flow, Stripe reversal |
| **Medium** | Q13 — No drivers available | Customer UX, dispatcher notification |
| **Medium** | Q17 — Show ETA? | Routing API cost, tracking screen |
| **Medium** | Q22 — Job completion criteria | Completion flow scope |
| **Medium** | Q24 — Backend language | Technology selection |
| **Medium** | Q25 — SEO for customer app? | Frontend framework selection |
| **Medium** | Q26 — Map provider | All map components |
| **Lower** | Q4, Q7, Q10, Q14, Q15, Q18, Q19, Q23, Q27, Q28 | See individual entries |
| Resolved | Q29 — Max driveway tier (6-car) | Pricing config, customer tier picker |
| Resolved | Q30 — Service area center point (home base address) | Admin onboarding setup |
| Resolved | Q31 — Waitlist driver pickup flow | Waitlist queue, notification pipeline |
| Resolved | Q32 — Price change audit (no reason field Phase 1) | job_price_changes table |
| Resolved | Q33 — Android 16 / Chrome 145 target | PWA compatibility baseline |
| Resolved | Q34 — Static PayPal/Venmo QR | Driver completion screen |
| Resolved | Q35 — Pre-populate default pricing | Admin onboarding seed data |
