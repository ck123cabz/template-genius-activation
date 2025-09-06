# Client Journey Wireframes (ASCII)

This doc captures the key client-facing pages in the current system with ASCII wireframes and state notes. It reflects the per‑client journey under `/journey/G####` (Stripe‑integrated) and highlights differences versus the legacy `/activate/:token` path.

Legend:
- [C] Clickable element
- (i) Informational text
- {state} dynamic content based on data

---

## 0) Journey Entry — `/journey/G####`
File refs: `app/journey/[gToken]/page.tsx`, `app/journey/[gToken]/layout.tsx`

Behavior: validates token, fetches client + pages; redirects to active or first pending page; otherwise shows overview.

+-------------------------------------------------------------+
|  Header: Welcome, {client.contact}                          |
|          {client.company} - Your Personalized Journey       |
+-------------------------------------------------------------+
| If no active/pending page → Overview (else redirect)        |
|                                                             |
| [Your Information]                                          |
|  - Company: {client.company}                                |
|  - Email:   {client.email}                                  |
|  - Position: {client.position}  Salary: {client.salary}     |
|                                                             |
| [Your Journey Progress]                                     |
|  Progress bar: {completed}/{total} ({percent}%)             |
|                                                             |
| [Steps]                                                     |
|  1. Activation  [status chip] [C View]                      |
|  2. Agreement   [status chip] [C View]                      |
|  3. Processing  [status chip] [C View]                      |
|  4. Confirmation[status chip] [C View]                      |
|                                                             |
| {If available} [C Continue to next available step]          |
+-------------------------------------------------------------+

States:
- status chip: pending | active | completed | skipped
- auto-redirect to active/pending page

---

## 1) Journey Page Shell — `/journey/G####/[pageType]`
File refs: `app/journey/[gToken]/[pageType]/page.tsx`,
`app/journey/[gToken]/components/ClientJourneyPageView.tsx`,
`app/journey/[gToken]/components/ClientJourneyOverview.tsx`

+--------------------------------------------------------------------------------+
| Sidebar (steps)                   | Page Content                               |
|----------------------------------+---------------------------------------------|
| 1. Activation  {status} [C]      | Title: {currentPage.title}                  |
| 2. Agreement   {status} [C]      | (i) Page {order} of {total}                 |
| 3. Processing  {status} [C]      |---------------------------------------------|
| 4. Confirmation{status} [C]      | {Alerts} (pending/blocked, errors)          |
|                                  |                                             |
|                                  | {ClientPageContent for current page}        |
|                                  |                                             |
|                                  | [Prev]                [Continue / Complete] |
+--------------------------------------------------------------------------------+

Controls:
- Prev/Continue navigate across ordered steps; Continue may Complete current page
- Pending pages show an alert until prior steps complete

---

## 2) Activation Page (journey) — `/journey/G####/activation`
Renders activation marketing content for the client journey.

+-------------------------------------------------------------+
| Title: Activate Priority Access                             |
| Subtitle: Get first access...                                |
|                                                             |
| [Benefits]                                                  |
|  - Priority Access (icon)                                   |
|  - Accelerated Timeline (icon)                              |
|  - Dedicated Support (icon)                                 |
|  - Committed Search (icon)                                  |
|                                                             |
| [Client Context]                                            |
|  Company: {client.company}  Contact: {client.contact}       |
|  Position: {client.position}  Salary: {client.salary}       |
|                                                             |
| [Investment Details]                                        |
|  - Activation Fee: $500 (credited...)                       |
|  - Search Period: 14-day priority access                    |
|  - Guarantee: 6-month replacement coverage                  |
|                                                             |
| [C Continue to Agreement]                                   |
+-------------------------------------------------------------+

State Notes:
- Content is personalized per client via `journey_pages` content JSON.

---

## 3) Agreement Page (journey) — `/journey/G####/agreement`
Includes the payment call‑to‑action via Stripe Checkout (real payment path).

+-------------------------------------------------------------+
| Title: Agreement / Terms Summary                            |
| (i) Key clauses / bullets                                   |
|                                                             |
| [Payment Section]                                           |
|  If not paid:                                               |
|   - Why pay $500? (value bullets)                           |
|   - [C Activate & Pay $500]  (PaymentButton)                |
|     → creates Stripe session with journey metadata          |
|                                                             |
|  If paid:                                                   |
|   - Payment Confirmed (✓)                                   |
|   - Amount, timestamp                                       |
|                                                             |
| [C Continue to Processing]                                  |
+-------------------------------------------------------------+

Payment Behaviors:
- Success/Failure determined by webhook updating client record
- Button captures: content version, hypothesis, page sequence, attribution

---

## 4) Processing Page (journey) — `/journey/G####/processing`
Interim progress UI while transitions and confirmations complete.

+-------------------------------------------------------------+
| Finalizing Your Activation                                  |
| (loader animation, progress bar)                            |
| (i) Syncing details... usually a few seconds                |
|                                                             |
| [C Continue] (auto-advance to Confirmation when ready)      |
+-------------------------------------------------------------+

State Notes:
- Auto-redirect after a short delay or after status is confirmed

---

## 5) Confirmation Page (journey) — `/journey/G####/confirmation`
Wrap-up with next steps and summary.

+-------------------------------------------------------------+
| Title: Confirmation                                         |
| (i) Thank you / next steps                                  |
| - Contact confirmation                                      |
| - Timeline expectations                                     |
| - Guarantee reminder                                        |
|                                                             |
| [C Finish / Return to Overview]                             |
+-------------------------------------------------------------+

State Notes:
- Content derived from `journey_pages` per client; may mirror global templates

---

## 6) Legacy Activation (Preview) — `/activate/:token`
File: `app/activate/[token]/page.tsx`

+-------------------------------------------------------------+
| Logo + Title + Subtitle                                     |
|                                                             |
| [Client Context Card]                                       |
|  Company / Contact                                          |
|                                                             |
| [Choose Your Investment]                                    |
|  ( ) Option A: Traditional Placement     $500               |
|      details... + additional info                           |
|  ( ) Option B: Monthly Retainer         $500  [Popular]     |
|      details... + additional info                           |
|                                                             |
| [Your Priority Search Details]                              |
|  - Position / Salary / Search Period                        |
|                                                             |
| [What You Get] (benefits list with icons)                   |
|                                                             |
| Full Name: [___________]                                    |
| [ ] I agree to terms                                        |
|                                                             |
| [C Activate & Pay $500] → Simulated → /processing → /confirmation |
+-------------------------------------------------------------+

State Notes:
- Uses mock content from Supabase service or defaults
- Payment here is simulated (for preview), not Stripe‑backed

---

## Error & Edge States (Journey)
- Invalid G‑token → 404 via `notFound()`
- Pending page before prior completion → Alert blocking action
- Already paid: Agreement shows “Payment Confirmed” state
- Payment failed: handled primarily in admin dashboard; client continues to see unpaid state

---

## Admin Touchpoints (for context)
- Retry payment (creates new session): dashboard client row → PaymentStatus column
- Edit per‑client page content: dashboard journey editor (hypothesis required on save)
- View content history & hypotheses: ContentHistoryPanel in journey editor

---

## Cross-References
- Models & services: `lib/supabase.ts:1`
- Journey actions: `app/actions/journey-actions.ts:1`
- Payment actions: `app/actions/payment-actions.ts:1`
- Webhook: `app/api/webhooks/stripe/route.ts:1`
- Payment metadata: `lib/payment-metadata.ts:1`
- Snapshots, A/B: `lib/content-snapshots.ts:1`, `lib/ab-testing.ts:1`

