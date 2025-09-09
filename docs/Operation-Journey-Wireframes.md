# Operation Journey Wireframes (ASCII)

This doc captures the key admin/operational pages for managing client journeys, content experimentation, and revenue intelligence. It reflects the admin dashboard at `/dashboard` and related operational workflows.

Legend:
- [C] Clickable element  
- (i) Informational text
- {state} dynamic content based on data
- [A] Admin-only action
- [H] Hypothesis required

---

## 0) Admin Dashboard — `/dashboard`
File refs: `app/dashboard/page.tsx`, `app/dashboard/layout.tsx`

Behavior: Main operational hub with client overview, revenue metrics, and journey analytics.

+-------------------------------------------------------------+
| Header: Template Genius Admin Dashboard                    |
|         Revenue Intelligence Engine                         |
+-------------------------------------------------------------+
| [Quick Stats]                                              |
|  Active Clients: {activeCount}  Revenue: ${monthlyRev}     |
|  Conversion Rate: {conversionRate}%  Avg Value: ${avgVal}  |
|                                                             |
| [Recent Activity]                                          |
|  - Client G1234 completed activation                       |
|  - Payment received from G5678                             |
|  - Journey hypothesis test completed                       |
|                                                             |
| [Action Center]                                            |
|  [C View All Clients]  [C Journey Editor]                  |
|  [C Revenue Analytics] [C Pattern Recognition]             |
|  [C Content Experiments] [C System Settings]               |
+-------------------------------------------------------------+

---

## 1) Client Management — `/dashboard/clients`
File refs: `app/dashboard/clients/page.tsx`, `components/ClientTable.tsx`

+--------------------------------------------------------------------------------+
| Client Management                                    [C Add Client] [C Export] |
|--------------------------------------------------------------------------------|
| Search: [___________] Filter: [All▼] Status: [All▼] Date: [Range▼]           |
|--------------------------------------------------------------------------------|
| Token    | Company      | Contact    | Status     | Revenue | Actions          |
|----------|--------------|------------|------------|---------|------------------|
| G1234    | Acme Corp    | John Doe   | Active     | $500    | [C View] [C Edit]|
| G5678    | Tech Inc     | Jane Smith | Pending    | $0      | [C View] [C Edit]|
| G9012    | StartupXYZ   | Bob Wilson | Completed  | $500    | [C View] [C Edit]|
|                                                                                |
| Pagination: ‹ 1 2 3 › Showing 1-25 of 247                                   |
+--------------------------------------------------------------------------------+

Actions per row:
- View: Opens client journey overview
- Edit: Client details and journey customization
- Payment retry available for failed payments

---

## 2) Client Journey Overview — `/dashboard/clients/G####`
File refs: `app/dashboard/clients/[gToken]/page.tsx`

+-------------------------------------------------------------+
| Client: {client.company} ({client.contact})                |
| Token: G#### | Created: {date} | Status: {status}          |
+-------------------------------------------------------------+
| [Client Details]                                           |
|  Company: {company}    Position: {position}                |
|  Email: {email}        Salary: {salary}                    |
|  Phone: {phone}        Industry: {industry}                |
|                                                             |
| [Journey Progress]                                          |
|  ●━━━○━━━○━━━○  (2/4 completed)                             |
|  1. Activation ✓   2. Agreement ⟳   3. Processing ○   4. Confirmation ○  |
|                                                             |
| [Payment Status]                                           |
|  Status: {Pending/Paid/Failed}                             |
|  Amount: $500  Method: Stripe  Date: {paymentDate}         |
|  [A Retry Payment] [A Refund] [A Manual Override]          |
|                                                             |
| [Journey Analytics]                                        |
|  Time on activation: 3m 24s                               |
|  Agreement interactions: 7 clicks                          |
|  Conversion events: {events}                               |
|                                                             |
| [Actions]                                                  |
|  [C Edit Journey Content] [C View Session Recording]       |
|  [C Send Reminder] [C Clone for A/B Test]                  |
+-------------------------------------------------------------+

---

## 3) Journey Content Editor — `/dashboard/editor/G####`
File refs: `app/dashboard/editor/[gToken]/page.tsx`

+--------------------------------------------------------------------------------+
| Journey Editor: {client.company}                    [C Save Draft] [A Publish] |
|--------------------------------------------------------------------------------|
| Page: [Activation ▼]  Version: {current}  Status: {draft/live}               |
|--------------------------------------------------------------------------------|
| [Hypothesis Input] - REQUIRED BEFORE SAVE                                     |
| What change are you making and why?                                           |
| [________________________________________________]                             |
| Expected outcome:                                                              |
| [________________________________________________]                             |
|                                                                                |
| [Content Sections]                                                             |
| ┌─ Title ─────────────────────────────────────────────┐                     |
| │ Activate Priority Access                             │                     |
| │ [C Edit Inline] [C A/B Test Variant]                 │                     |
| └──────────────────────────────────────────────────────┘                     |
|                                                                                |
| ┌─ Benefits Section ───────────────────────────────────┐                     |
| │ • Priority Access (icon)                             │                     |
| │ • Accelerated Timeline (icon)                        │                     |
| │ [C Add Benefit] [C Reorder] [C Edit Icons]           │                     |
| └──────────────────────────────────────────────────────┘                     |
|                                                                                |
| [H Save Changes] - Requires hypothesis above                                  |
+--------------------------------------------------------------------------------+

Key Features:
- Inline editing with live preview
- Mandatory hypothesis before save
- Version history with outcomes
- A/B test variant creation

---

## 4) Content Version History — `/dashboard/editor/G####/history`

+-------------------------------------------------------------+
| Content History: {client.company} - Activation Page        |
+-------------------------------------------------------------+
| Version | Date       | Hypothesis              | Outcome    |
|---------|------------|-------------------------|------------|
| v3.2    | 2024-01-15 | Add urgency language    | +12% conv  |
| v3.1    | 2024-01-10 | Emphasize guarantee     | +5% conv   |
| v3.0    | 2024-01-05 | Restructure benefits    | -2% conv   |
| v2.9    | 2024-01-01 | Test pricing clarity    | No change  |
|                                                             |
| [Selected: v3.2] [C View Details] [C Revert to This]       |
|                                                             |
| [Version Details - v3.2]                                   |
| Hypothesis: "Adding urgency language ('limited spots')     |
|            will increase conversion by creating FOMO"      |
|                                                             |
| Changes Made:                                               |
| - Added "Only 12 spots remaining this month"               |
| - Changed CTA from "Continue" to "Secure My Spot"          |
|                                                             |
| Results (14-day test):                                      |
| - Conversion Rate: 23.4% (+12.1% vs control)               |
| - Revenue Impact: +$1,200                                  |
| - Statistical Significance: 95.2%                          |
+-------------------------------------------------------------+

---

## 5) Revenue Analytics Dashboard — `/dashboard/analytics`

+--------------------------------------------------------------------------------+
| Revenue Analytics                              Period: [Last 30 Days ▼]       |
|--------------------------------------------------------------------------------|
| [Key Metrics]                                                                  |
| Total Revenue: $45,600    Conversions: 91    Avg Deal: $501                  |
| Conversion Rate: 18.3%    Growth: +12.4%     Pipeline: $12,300               |
|                                                                                |
| [Revenue Chart]                                                                |
|     $2K ┤                                    ╭─╮                               |
|     $1K ┤                          ╭─╮      │ │     ╭─╮                       |
|      $0 ┼─────────────────────────────────────────────────                    |
|         Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct                     |
|                                                                                |
| [Conversion Funnel]                                                            |
|  Page Views      Activations    Agreements     Payments                       |
|     1,247    →      847     →      312     →      91                          |
|   (100%)         (67.9%)        (36.8%)       (29.2%)                        |
|                                                                                |
| [Top Performing Content]                                                       |
| 1. Activation v3.2 (urgency) - 23.4% conversion                              |
| 2. Agreement v2.1 (guarantee) - 35.2% payment rate                           |
| 3. Benefits v1.8 (icons) - 15.2% engagement                                  |
|                                                                                |
| [Export Options]                                                               |
| [C Export CSV] [C Generate Report] [C Schedule Email]                         |
+--------------------------------------------------------------------------------+

---

## 6) Pattern Recognition Engine — `/dashboard/patterns`

+-------------------------------------------------------------+
| Pattern Recognition & Learning Insights                    |
+-------------------------------------------------------------+
| [Success Patterns Identified]                              |
|                                                             |
| 🎯 High-Converting Content Patterns:                        |
| • Urgency language increases conversion by avg 8.3%        |
| • Guarantee mentions boost payment rate 12.1%             |
| • Personal testimonials add 6.7% to engagement            |
| • Industry-specific language improves relevance           |
|                                                             |
| 📊 Client Segment Insights:                                |
| • Tech companies: Respond to "accelerated timeline"        |
| • Finance sector: Values "guaranteed outcomes"             |
| • Startups: Convert best with "priority access"            |
| • Enterprise: Needs "dedicated support" messaging         |
|                                                             |
| 🔄 Failed Experiment Learnings:                            |
| • Price anchoring ($1000 → $500) decreased conversion      |
| • Multiple CTA buttons created decision paralysis          |
| • Long-form content reduced mobile conversions             |
|                                                             |
| [Recommendations]                                          |
| 1. Apply urgency pattern to 3 underperforming clients     |
| 2. Test guarantee language in agreement pages              |
| 3. Segment messaging by industry for new clients          |
|                                                             |
| [C Apply Recommendations] [C Export Patterns]              |
+-------------------------------------------------------------+

---

## 7) A/B Test Management — `/dashboard/experiments`

+--------------------------------------------------------------------------------+
| Active Experiments                              [C Create New Test]            |
|--------------------------------------------------------------------------------|
| Test Name           | Status    | Traffic | Conversion | Significance | Action|
|--------------------|-----------|---------|------------|--------------|-------|
| Activation Urgency | Running   | 50/50   | 23% vs 19% | 89%         | [View]|
| Payment CTA Color  | Completed | 50/50   | 31% vs 28% | 95%         | [Apply|
| Benefits Order     | Draft     | -       | -          | -           | [Start|
|                                                                                |
| [Test Details: Activation Urgency]                                            |
| Hypothesis: Urgency language will increase activation conversion               |
| Start Date: 2024-01-15    Duration: 14 days    Sample Size: 200              |
|                                                                                |
| Variant A (Control): "Continue to Agreement"                                  |
| Variant B (Test): "Secure Your Priority Spot (12 remaining)"                 |
|                                                                                |
| Results:                                                                       |
| Control:  19.2% conversion (47/245 visitors)                                  |
| Test:     23.1% conversion (56/242 visitors)                                  |
| Uplift:   +20.3% relative increase                                            |
| Confidence: 89% (needs 95% to auto-apply)                                     |
|                                                                                |
| [A Force Apply] [C Extend Test] [C End Test]                                  |
+--------------------------------------------------------------------------------+

---

## 8) System Configuration — `/dashboard/settings`

+-------------------------------------------------------------+
| System Settings                                             |
+-------------------------------------------------------------+
| [Journey Configuration]                                     |
|  Default Pages: ☑ Activation ☑ Agreement ☑ Processing     |
|              ☑ Confirmation                               |
|  Page Order: [Drag to reorder]                             |
|  Auto-advance: ☑ After payment ☑ After completion          |
|                                                             |
| [Payment Settings]                                          |
|  Stripe Integration: ✓ Connected                           |
|  Price: $500  Currency: USD                                |
|  Payment Retry: ☑ Auto (3 attempts)                        |
|                                                             |
| [Learning Engine]                                           |
|  Hypothesis Required: ☑ All content changes               |
|  Pattern Detection: ☑ Enabled  Min Sample: 50             |
|  Auto-apply Winning Tests: ☑ At 95% confidence            |
|                                                             |
| [Notifications]                                            |
|  Email Alerts: ☑ Payment failures ☑ High-value patterns   |
|  Slack Integration: [Configure Webhook]                    |
|                                                             |
| [A Save Settings]                                          |
+-------------------------------------------------------------+

---

## 9) Client Session Recording — `/dashboard/sessions/G####`

+-------------------------------------------------------------+
| Session Recording: {client.company}                        |
| G#### | {date} | Duration: 8m 32s                          |
+-------------------------------------------------------------+
| [Playback Controls]                                        |
| [◀◀] [▶] [▶▶] [⏸] Speed: 1x Timeline: ████████▓░░░░░     |
|                                                             |
| [Current Frame: Activation Page - 2m 15s]                  |
| Mouse hover: "Priority Access" benefit                     |
| Scroll depth: 85%                                          |
| Time on element: 12s                                       |
|                                                             |
| [Event Timeline]                                           |
| 0:00 - Page load                                           |
| 0:15 - Scrolled to benefits                               |
| 1:30 - Hovered over guarantee text (8s)                   |
| 2:15 - Currently viewing benefit details                   |
| 3:45 - Clicked "Continue" button                          |
|                                                             |
| [Interaction Heatmap]                                      |
| (Visual overlay showing click density, scroll patterns)    |
|                                                             |
| [Insights]                                                 |
| • High engagement with guarantee section                   |
| • Hesitation before CTA (common pattern)                  |
| • Mobile-optimized viewing                                 |
+-------------------------------------------------------------+

---

## Error & Edge States (Operations)
- Invalid client token → Show "Client Not Found" in dashboard
- Permission denied → Role-based access control alerts
- Failed payment webhook → Manual review queue
- Content save without hypothesis → Validation error with prompt
- A/B test reaching significance → Auto-notification to admin

---

## Workflow Integration Points
- **Git Integration**: Content changes auto-commit with hypothesis in message
- **Stripe Webhooks**: Payment status updates trigger journey advancement
- **Analytics Pipeline**: Every interaction feeds pattern recognition
- **Notification System**: Key events trigger alerts across channels

---

## Cross-References  
- Client models: `lib/supabase.ts:1`
- Dashboard actions: `app/actions/admin-actions.ts:1`
- Analytics engine: `lib/analytics.ts:1`
- Pattern recognition: `lib/pattern-engine.ts:1`
- A/B testing: `lib/ab-testing.ts:1`
- Content versioning: `lib/content-history.ts:1`