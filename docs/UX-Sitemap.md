# Template Genius Activation — Clickable Sitemap

This document maps the current, as‑is application routes to their implementation files and related components. Use it to navigate quickly between UX surfaces in the repo.

## Personas
- Client: experiences the activation journey via `G####` tokenized routes
- Admin: manages clients, content, payments, and analytics via dashboard

---

## Top-Level Redirect
- Route: `/`
- Behavior: Redirects to dashboard
- File: `app/page.tsx:6`

---

## Admin Dashboard
- Route: `/dashboard`
- Files:
  - Entry: `app/dashboard/page.tsx:1`
  - Server variant (older): `app/dashboard/page-server.tsx:1`
  - Components:
    - Client list: `app/dashboard/components/ClientList.tsx:1`
    - Content editor: `app/dashboard/components/ContentEditor.tsx:1`
    - Journey editor (per‑client): `app/dashboard/journey/[clientId]/page.tsx:1`
    - Journey navigation tabs: `app/dashboard/components/JourneyNavigationTabs.tsx:1`
    - Content history: `app/dashboard/components/ContentHistoryPanel.tsx:1`
    - Revenue analytics: `app/dashboard/components/RevenueTracker.tsx:1`

Sections (UI):
- Clients tab: manage and filter clients, copy links, retry failed payments
- Revenue Analytics tab: metrics on payments
- Content tab: global content editor (with hypothesis capture)

Server Actions and Payment Utilities:
- Create/update clients: `app/actions/client-actions.ts:1`
- Journey actions: `app/actions/journey-actions.ts:1`
- Payment actions (Stripe session + correlation): `app/actions/payment-actions.ts:1`
- Payment UI helpers: `components/ui/PaymentButton.tsx:1`, `components/ui/PaymentStatusColumn.tsx:1`, `components/ui/PaymentAlert.tsx:1`

---

## Client Journey (Primary)
- Entry Route: `/journey/[gToken]`
  - Layout: `app/journey/[gToken]/layout.tsx:1`
  - Page: `app/journey/[gToken]/page.tsx:1`
  - Logic: validates `G####`, fetches client and pages, redirects to active/pending page

- Page Route: `/journey/[gToken]/[pageType]` (pageType: `activation|agreement|confirmation|processing`)
  - Page shell: `app/journey/[gToken]/[pageType]/page.tsx:1`
  - Shell UI: `app/journey/[gToken]/components/ClientJourneyPageView.tsx:1`
  - Overview UI: `app/journey/[gToken]/components/ClientJourneyOverview.tsx:1`
  - Page content (per type): `app/journey/[gToken]/components/ClientPageContent.tsx:1`

Journey Data & Status:
- Types & models: `lib/supabase.ts:1`
- Server actions: `app/actions/journey-actions.ts:1`

Payment Flow inside Journey:
- Payment button (agreement stage): `components/ui/PaymentButton.tsx:1`
- Server action to create Stripe session: `app/actions/payment-actions.ts:1`
- Metadata collection: `lib/payment-metadata.ts:1`
- Content snapshots & A/B assignment: `lib/content-snapshots.ts:1`, `lib/ab-testing.ts:1`
- Stripe webhooks handler: `app/api/webhooks/stripe/route.ts:1`

---

## Legacy/Preview Activation (Alternate Client Path)
- Activation: `/activate/[token]`
  - `app/activate/[token]/page.tsx:1`
- Processing: `/processing`
  - `app/processing/page.tsx:1`
- Confirmation: `/confirmation`
  - `app/confirmation/page.tsx:1`
- Agreement (standalone doc): `/agreement`
  - `app/agreement/page.tsx:1`

Note: This path simulates payment and is used for previews. The Stripe‑integrated production flow is the `/journey` path.

---

## Files By Feature

Journey Pages (DB + server):
- Models and mocks: `lib/supabase.ts:1`
- CRUD and status transitions: `app/actions/journey-actions.ts:1`

Clients (DB + server):
- Server actions: `app/actions/client-actions.ts:1`
- Supabase service (client-side safe): `lib/supabase.ts:474`

Payments:
- Start session: `app/actions/payment-actions.ts:1`
- Webhooks: `app/api/webhooks/stripe/route.ts:1`
- Stripe utils: `lib/stripe.ts:1`
- Metadata: `lib/payment-metadata.ts:1`
- Snapshots: `lib/content-snapshots.ts:1`
- A/B testing: `lib/ab-testing.ts:1`

Analytics & Patterns (UI):
- Content analytics page: `app/dashboard/content-analytics/page.tsx:1`
- Pattern recognition page: `app/dashboard/pattern-recognition/page.tsx:1`

---

## Quick Links by Route
- `/` → `app/page.tsx:6`
- `/dashboard` → `app/dashboard/page.tsx:1`
- `/dashboard/journey/[clientId]` → `app/dashboard/journey/[clientId]/page.tsx:1`
- `/journey/[gToken]` → `app/journey/[gToken]/page.tsx:1`
- `/journey/[gToken]/activation` → `app/journey/[gToken]/[pageType]/page.tsx:1`
- `/journey/[gToken]/agreement` → `app/journey/[gToken]/[pageType]/page.tsx:1`
- `/journey/[gToken]/processing` → `app/journey/[gToken]/[pageType]/page.tsx:1`
- `/journey/[gToken]/confirmation` → `app/journey/[gToken]/[pageType]/page.tsx:1`
- `/activate/[token]` → `app/activate/[token]/page.tsx:1`
- `/processing` → `app/processing/page.tsx:1`
- `/confirmation` → `app/confirmation/page.tsx:1`
- `/agreement` → `app/agreement/page.tsx:1`
- `/api/webhooks/stripe` → `app/api/webhooks/stripe/route.ts:1`

