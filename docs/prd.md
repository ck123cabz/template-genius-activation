# Template Genius Activation - Revenue Intelligence Engine PRD

**Document Version:** 2.0  
**Date:** August 29, 2025  
**Project:** Template Genius Activation Platform  
**Enhancement Type:** Revenue Intelligence Engine with Connected Client Journey

---

## Intro Project Analysis and Context

### Existing Project Overview

**Analysis Source:** IDE-based analysis + comprehensive documentation review + architecture alignment

**Current Project State:**
The Template Genius Activation Platform is a Next.js 15-based client activation dashboard designed to transform Genius recruitment agency from a $0 activation to $500 activation fee model. Current implementation features:

- **Admin Dashboard:** Client creation, content management, statistics viewing  
- **Client Activation Flow:** Email-triggered activation pages with payment processing
- **Current Architecture:** Hybrid mock data + Supabase fallback system
- **Tech Stack:** Next.js 15.2.4, React 19, TypeScript 5.7, Tailwind CSS, 40+ Shadcn/ui components, Supabase
- **AI Infrastructure:** BMAD orchestration system, Serena MCP knowledge persistence, Playwright MCP testing

### Available Documentation Analysis

**Complete technical documentation available:**

✅ **Tech Stack Documentation** - Complete (architecture.md v2.0)  
✅ **Source Tree/Architecture** - Complete (BMAD-orchestrated architecture)  
✅ **Coding Standards** - Complete (established patterns)  
✅ **API Documentation** - Complete (Server actions + Stripe integration)  
✅ **External API Documentation** - Complete (Stripe webhooks)  
✅ **Technical Debt Documentation** - Complete (constraints analysis)  
✅ **AI Orchestration** - Complete (BMAD + Serena integration patterns)

### Enhancement Scope Definition

**Enhancement Type:** Revenue Intelligence Engine implementation with connected client journey learning

✅ **New Feature Addition** - Connected journey intelligence system  
✅ **Integration with New Systems** - Full Supabase + Stripe integration  
✅ **Learning Capture System** - Hypothesis and outcome tracking  

**Enhancement Description:**
Transform the platform into a Revenue Intelligence Engine that captures learning from every client interaction across all pages (activation → agreement → confirmation → processing), enabling data-driven optimization of conversion rates through hypothesis tracking, outcome recording, and pattern recognition.

**Impact Assessment:**
✅ **Minimal Code Impact** - Enhance existing components rather than replacing
✅ **High Business Impact** - Enables immediate revenue validation and learning
✅ **BMAD Acceleration** - 1-2 day implementation vs 3 weeks manual

---

## Executive Summary

### Problem Statement

**Core Business Problem:**
> "If we don't charge a fee up front, we're basically doing free consulting, hoping for a tip. This isn't a business, more like a charity." - CEO

**Current Reality:**
- **$73,250 in signed contracts → $0 invoiced** (clients ghost after free work)
- **4.5% conversion vs 15-25% industry standard**
- **90-day runway remaining** with urgent need for revenue validation

**Root Cause:**
No systematic way to understand what makes clients pay vs ghost, leading to repeated failures without learning.

### Solution: Revenue Intelligence Engine

**Core Philosophy:**
> "Each client teaches us something about what drives revenue across their entire journey. We capture that learning automatically and apply it to make the next client more likely to pay."

**Key Capabilities:**
1. **Connected Journey Management** - Control all 4 pages in client experience
2. **Learning Capture** - Hypothesis before changes, outcomes after interactions
3. **Pattern Recognition** - Identify what works vs what doesn't
4. **Rapid Iteration** - Apply learnings to next client immediately

### Business Goals & Success Metrics

**Phase I Success Metrics (Week 1):**
- **5+ complete client journeys** (activation → payment)
- **$2,500+ in activation fees** (revenue validation)
- **Journey-level learning captured** (hypothesis → outcome)
- **Drop-off point identification** (where clients hesitate)

**Phase II Success Metrics (Weeks 2-4):**
- **20+ client journeys analyzed**
- **3+ clear conversion patterns identified**
- **30%+ conversion rate improvement**
- **Automated pattern recognition operational**

**Phase III Success Metrics (Future):**
- **Template system based on winning patterns**
- **50%+ conversion rate achieved**
- **Systematic scaling of successful approaches**

---

## User Research & Insights

### Target User Personas

**Primary Persona: Christian (Solo Admin/Operator)**
- **Role:** Single operator managing all client interactions
- **Pain Points:** 
  - 60-hour weeks with no systematic learning from failures
  - Repeating same mistakes without understanding why
  - No data on what content drives conversion
- **Needs:**
  - Simple way to track what works vs what doesn't
  - Quick iteration on client content with learning
  - Clear patterns from successful conversions

**Secondary Persona: Burkhard (CEO/Strategic)**
- **Role:** Strategic oversight and business validation
- **Pain Points:**
  - No visibility into conversion drivers
  - Unable to validate business model systematically
  - Investing time without learning ROI
- **Needs:**
  - Data-driven insights on conversion patterns
  - Revenue validation metrics
  - Strategic intelligence for pivots

### User Journey Mapping

**Admin Learning Journey:**
```
Create Client → Set Hypothesis → Edit Content → Client Interaction → Track Outcome → Identify Pattern → Apply Learning
      ↓              ↓                ↓              ↓                  ↓               ↓              ↓
  "New lead"   "This will work"  "Customize"   "They respond"    "Paid/Ghost"   "I see why"    "Try again"
```

**Client Experience Journey:**
```
Email Link → Activation Page → Agreement Review → Payment Decision → Confirmation → Next Steps
     ↓            ↓                 ↓                  ↓                 ↓             ↓
"Interested"  "Value prop"     "Terms fair?"      "Worth $500?"      "I'm in"     "What now?"
```

---

## Functional Requirements

### Core Functional Requirements (Phase I - Revenue Validation)

**FR1: Connected Journey Management**
- **FR1.1:** System shall manage content for all 4 client pages (activation, agreement, confirmation, processing)
- **FR1.2:** Each client shall have isolated content versions preventing cross-contamination
- **FR1.3:** Admin shall be able to edit any page for any specific client
- **FR1.4:** Changes to one client shall not affect any other client's experience

**FR2: Learning Capture System**
- **FR2.1:** System shall require hypothesis capture before content changes ("Why will this work?")
- **FR2.2:** System shall track outcomes after client interactions (paid/ghosted/responded)
- **FR2.3:** Admin shall be able to add outcome notes explaining what happened
- **FR2.4:** System shall link payments to specific content versions for correlation

**FR3: Payment Processing**
- **FR3.1:** System shall integrate with Stripe for $500 activation fee collection
- **FR3.2:** Payment status shall be visible in admin dashboard
- **FR3.3:** System shall track which content version was active at payment time
- **FR3.4:** Failed payments shall be retryable with clear status indicators

**FR4: Pattern Recognition**
- **FR4.1:** System shall identify successful content patterns (3+ similar successes)
- **FR4.2:** System shall highlight failure patterns to avoid
- **FR4.3:** Admin shall see recommendations based on past successes
- **FR4.4:** Learning data shall persist via Serena memory system

### Phase II Functional Requirements (Weeks 2-4)

**FR5: Advanced Analytics**
- **FR5.1:** Side-by-side comparison of successful vs failed journeys
- **FR5.2:** Journey flow visualization showing drop-off points
- **FR5.3:** Conversion rate tracking by hypothesis type
- **FR5.4:** Time-to-payment metrics by content variation

**FR6: Batch Operations**
- **FR6.1:** Apply successful patterns to multiple clients
- **FR6.2:** A/B test creation for hypothesis validation
- **FR6.3:** Bulk outcome marking for efficiency
- **FR6.4:** Export learning data for external analysis

### Non-Functional Requirements

**Performance Requirements:**
- **NFR1:** Client pages shall load in <3 seconds (affects conversion)
- **NFR2:** Admin saves shall complete in <2 seconds
- **NFR3:** Pattern recognition shall update within 5 seconds

**Scalability Requirements:**
- **NFR4:** Support 100+ client journeys in free tier
- **NFR5:** Handle 5+ concurrent admin operations
- **NFR6:** Store 500+ learning iterations

**Security Requirements:**
- **NFR7:** Stripe PCI compliance via hosted checkout
- **NFR8:** Client data isolation via unique tokens
- **NFR9:** Environment variables for all secrets

**Usability Requirements:**
- **NFR10:** Learning capture in <30 seconds per client
- **NFR11:** Pattern identification without technical knowledge
- **NFR12:** Mobile-responsive admin interface

---

## Technical Requirements

### Technical Stack (Preserved)

**Core Framework:**
- Next.js 15.2.4 (App Router)
- React 19 (Latest features)
- TypeScript 5.7 (Strict mode)
- Node.js 22+ (Runtime)

**UI/Styling:**
- Tailwind CSS 4.1.9
- 40+ Shadcn/ui components (reuse all)
- Radix UI primitives
- CVA for variants

**Data & Forms:**
- React Hook Form 7.60.0
- Zod 3.25.67 (validation)
- Supabase 2.56.0

**AI Infrastructure:**
- BMAD orchestration system
- Serena MCP (memory persistence)
- Playwright MCP (testing)

**New Dependencies (Minimal):**
- @stripe/stripe-js ^2.4.0
- stripe ^14.21.0

### Database Schema

```sql
-- Connected journey intelligence schema
CREATE TABLE client_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id),
  overall_hypothesis TEXT NOT NULL,
  current_page VARCHAR(50) DEFAULT 'activation',
  conversion_status VARCHAR(20) DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journey_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES client_journeys(id),
  page_type VARCHAR(50) NOT NULL,
  page_hypothesis TEXT NOT NULL,
  content JSONB NOT NULL,
  page_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journey_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES client_journeys(id),
  page_id UUID REFERENCES journey_pages(id),
  time_spent_seconds INTEGER,
  interactions JSONB,
  dropped_off BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES client_journeys(id),
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Architecture

**Server Actions (Not REST):**
```typescript
// Core learning operations
createClientWithJourney(data: ClientData, hypothesis: string): Promise<ClientJourney>
updateJourneyPage(journeyId: string, pageType: string, content: any, hypothesis: string): Promise<void>
recordJourneyOutcome(journeyId: string, outcome: 'paid' | 'ghosted', notes?: string): Promise<void>
getJourneyIntelligence(): Promise<JourneyIntelligence>
```

---

## User Experience Requirements

### Admin Dashboard Experience

**Connected Journey Dashboard:**
```
┌─────────────────────────────────────────────────┐
│ Revenue Intelligence Dashboard                   │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │   Clients   │ │   Journey   │ │  Patterns   ││
│ └─────────────┘ └─────────────┘ └─────────────┘│
├─────────────────────────────────────────────────┤
│ Client List with Journey Status:                │
│ ┌───────────────────────────────────────────┐   │
│ │ G1234 | TechCo | Hypothesis Set | Pending │   │
│ │ G1235 | StartUp | Testing | Page 2/4      │   │
│ │ G1236 | Enterprise | PAID ✓ | Complete    │   │
│ │ G1237 | SMB Corp | Ghosted ✗ | Failed     │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ Quick Actions:                                  │
│ [+ New Client with Hypothesis]                  │
│ [View Patterns] [Export Learnings]              │
└─────────────────────────────────────────────────┘
```

**Learning Capture Interface:**
```
┌─────────────────────────────────────────────────┐
│ Edit Journey for: TechCo (G1234)                │
├─────────────────────────────────────────────────┤
│ Overall Hypothesis:                             │
│ ┌───────────────────────────────────────────┐   │
│ │ "Direct technical approach will convert   │   │
│ │  this engineering-focused founder"        │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ Page: [Activation] [Agreement] [Confirm] [Next] │
│                                                  │
│ Page Hypothesis:                                │
│ ┌───────────────────────────────────────────┐   │
│ │ "Lead with API capabilities, not price"   │   │
│ └───────────────────────────────────────────┘   │
│                                                  │
│ Content: [Editor with existing content...]      │
│                                                  │
│ [Save with Learning] [Preview] [Cancel]         │
└─────────────────────────────────────────────────┘
```

### Client Experience Flow

**Connected Journey Pages:**
1. **Activation** → Personalized value proposition
2. **Agreement** → Terms matching their needs
3. **Payment** → Stripe checkout ($500)
4. **Confirmation** → Success messaging
5. **Processing** → Next steps engagement

Each page reflects the hypothesis-driven content for that specific client.

---

## Epic and Story Breakdown

### Phase I Epics - Revenue Intelligence Foundation (Week 1)

#### Epic 1: Connected Journey Infrastructure
**Business Value:** Enable complete control over client experience across all pages  
**BMAD Agent:** Dev Agent with Serena memory integration  
**Priority:** CRITICAL  
**Dependencies:** None - can start immediately  

**User Stories:**
1. **As an admin**, I want to create clients with an overall journey hypothesis so I can track my conversion strategy
2. **As an admin**, I want each client to have all 4 pages (activation, agreement, confirmation, processing) so I control the complete experience
3. **As an admin**, I want to navigate between pages while editing a client's journey so I can ensure consistency
4. **As a client**, I want to see consistent, personalized content across all pages in my journey

**Acceptance Criteria:**
- Client creation includes overall hypothesis field (required)
- All 4 pages created atomically with client
- Page navigation in editor preserves context
- Client token (G[4-digit]) provides access to complete journey

#### Epic 2: Learning Capture System
**Business Value:** Understand what drives conversion through systematic learning  
**BMAD Agent:** Dev Agent with learning workflow patterns  
**Priority:** CRITICAL  
**Dependencies:** Epic 1 (journey structure)  

**User Stories:**
1. **As an admin**, I want to capture why I'm making each content change (hypothesis) so I can learn from outcomes
2. **As an admin**, I want to mark journey outcomes (paid/ghosted) so I can identify patterns
3. **As an admin**, I want to add notes about what actually happened so I can understand beyond simple success/failure
4. **As an admin**, I want outcomes automatically linked to Stripe payments so I have accurate data
5. **As the system**, I want to update Serena memory with each learning so knowledge persists across sessions

**Acceptance Criteria:**
- Hypothesis field required before saving content changes
- Outcome marking available from dashboard (paid/ghosted/pending)
- Outcome notes field for detailed learning capture
- Stripe webhook updates outcome automatically
- Serena memory updated with each outcome

#### Epic 3: Payment Intelligence Integration
**Business Value:** Immediate revenue validation with learning correlation  
**BMAD Agent:** Dev Agent with Stripe expertise  
**Priority:** HIGHEST  
**Dependencies:** None - parallel with Epic 1  

**User Stories:**
1. **As an admin**, I want Stripe Checkout integration so clients can pay the $500 activation fee
2. **As an admin**, I want payments linked to the exact journey content that drove conversion
3. **As an admin**, I want to see payment status in the dashboard so I know who has paid
4. **As a client**, I want a professional, secure payment experience with clear confirmation
5. **As the system**, I want to track time-to-payment for each journey variation

**Acceptance Criteria:**
- Stripe Checkout session creation with journey metadata
- Payment status visible in dashboard (pending/succeeded/failed)
- Journey content frozen at payment time for correlation
- Success page shows confirmation with next steps
- Time-to-payment tracked automatically

#### Epic 4: Pattern Recognition Dashboard
**Business Value:** Transform individual learnings into actionable patterns  
**BMAD Agent:** Dev Agent with analytics experience  
**Priority:** HIGH  
**Dependencies:** Epics 1, 2, 3  

**User Stories:**
1. **As an admin**, I want to see which hypotheses lead to payment so I can repeat success
2. **As an admin**, I want to identify where clients drop off in the journey so I can improve those pages
3. **As an admin**, I want recommendations for new clients based on past successes
4. **As an admin**, I want to see my overall conversion rate improvement over time
5. **As an admin**, I want pattern insights updated in real-time as outcomes are recorded

**Acceptance Criteria:**
- Success patterns shown after 3+ similar outcomes
- Drop-off visualization by page in journey
- Recommendations generated from successful patterns
- Conversion rate displayed with trend line
- Real-time updates as new data arrives

### Phase II Epics - Intelligence Enhancement (Weeks 2-4)

#### Epic 5: Advanced Journey Analytics
**Business Value:** Deep understanding of conversion drivers  
**BMAD Agent:** Dev Agent with data visualization skills  
**Priority:** MEDIUM  
**Dependencies:** Phase I completion  

**User Stories:**
1. **As an admin**, I want side-by-side comparison of successful vs failed journeys
2. **As an admin**, I want to see journey flow with time spent on each page
3. **As an admin**, I want cohort analysis of clients by hypothesis type
4. **As an admin**, I want to export journey data for external analysis
5. **As an admin**, I want predictive scoring for new hypotheses based on historical data

#### Epic 6: Batch Intelligence Operations
**Business Value:** Scale successful patterns efficiently  
**BMAD Agent:** Dev Agent with batch processing patterns  
**Priority:** MEDIUM  
**Dependencies:** Epic 5  

**User Stories:**
1. **As an admin**, I want to apply successful journey templates to multiple new clients
2. **As an admin**, I want to create A/B tests with different hypotheses
3. **As an admin**, I want to bulk update outcomes for multiple clients
4. **As an admin**, I want to clone successful journeys with modifications
5. **As an admin**, I want to segment clients by pattern match

### Phase III Epics - Intelligent Automation (Future)

#### Epic 7: AI-Powered Recommendations
**Business Value:** Automated optimization based on learning  
**BMAD Agent:** AI Agent with pattern recognition  
**Priority:** LOW (Future)  
**Dependencies:** 100+ journeys completed  

**User Stories:**
1. **As an admin**, I want AI to suggest optimal content for new clients based on their profile
2. **As an admin**, I want automatic hypothesis generation based on client type
3. **As an admin**, I want the system to identify emerging patterns before they're obvious
4. **As an admin**, I want predictive alerts when a client might ghost
5. **As an admin**, I want automated journey optimization suggestions

---

## Definition of Done

### Story Level
- [ ] Code complete and tested with Playwright MCP
- [ ] Learning data captured and persisted
- [ ] Serena memory updated with relevant patterns
- [ ] Works with both mock and database modes
- [ ] No console errors or warnings
- [ ] User feedback via toast notifications

### Epic Level
- [ ] All stories complete and integrated
- [ ] End-to-end journey tested
- [ ] Pattern recognition operational
- [ ] Performance within targets (<3s load)
- [ ] BMAD agents validated implementation

### Phase Level
- [ ] Revenue flowing through Stripe
- [ ] Learning patterns identified
- [ ] Conversion rate improving
- [ ] Admin can operate without developer
- [ ] Ready for next phase

---

## Risk Assessment and Mitigation

### Critical Risks

**Risk 1: Learning Capture Overhead**
- **Probability:** Medium
- **Impact:** High (defeats purpose if too cumbersome)
- **Mitigation:** Keep hypothesis fields short, quick dropdown outcomes
- **Monitoring:** Track time-to-capture metrics

**Risk 2: Pattern Recognition Accuracy**
- **Probability:** Low (simple patterns initially)
- **Impact:** Medium (wrong recommendations)
- **Mitigation:** Require 3+ examples before pattern, manual review initially
- **Monitoring:** Track pattern success rate

**Risk 3: BMAD Implementation Variance**
- **Probability:** Low (architecture well-defined)
- **Impact:** Medium (rework required)
- **Mitigation:** Clear architecture document, Serena memory guidance
- **Monitoring:** Daily implementation review

---

## Success Metrics

### Phase I Success (Week 1)
- ✅ 5+ complete client journeys with payment
- ✅ $2,500+ in activation fees collected
- ✅ 100% learning capture (all journeys have hypotheses/outcomes)
- ✅ 3+ patterns identified
- ✅ BMAD implementation in 1-2 days

### Phase II Success (Weeks 2-4)
- ✅ 20+ client journeys analyzed
- ✅ 30%+ conversion rate achieved
- ✅ Clear success patterns documented
- ✅ 50% reduction in content creation time
- ✅ Automated recommendations operational

### Long-term Success (3 months)
- ✅ 50%+ conversion rate sustained
- ✅ $10K+ monthly revenue achieved
- ✅ 100+ successful patterns in library
- ✅ Full automation of common journeys
- ✅ Business model validated with data

---

## Acceptance Criteria

### Client Journey Creation
**Given** an admin creates a new client  
**When** they provide company details and overall hypothesis  
**Then** system creates client with 4 connected pages and unique token

### Learning Capture
**Given** an admin edits journey content  
**When** they save changes  
**Then** system requires hypothesis and stores with content version

### Payment Intelligence
**Given** a client completes payment  
**When** Stripe webhook fires  
**Then** system links payment to journey content and marks outcome as 'paid'

### Pattern Recognition
**Given** 3+ similar hypotheses have same outcome  
**When** admin views patterns dashboard  
**Then** system shows this as a recognized pattern with confidence score

---

## Out of Scope

### Explicitly Not in Phase I
- User authentication (admin access only)
- Email automation (manual sending)
- Complex analytics (basic patterns only)
- Template library (Phase III)
- Multi-admin support (single operator)

### Deferred to Phase II
- A/B testing framework
- Cohort analysis
- Advanced visualizations
- Batch operations
- Export functionality

### Future Considerations
- AI-powered content generation
- Predictive analytics
- Multi-language support
- White-label capability
- API for external integrations

---

## Appendices

### A. BMAD Orchestration Workflow

```bash
# Implementation sequence
/architect *review-architecture    # Validate technical approach
/po *shard-prd                    # Create implementable stories
/bmad-execute-epic 1,2,3,4        # Parallel implementation
```

### B. Serena Memory Structure

```typescript
interface RevenueIntelligenceMemory {
  journeyPatterns: JourneyPattern[];
  successfulHypotheses: Hypothesis[];
  failureWarnings: Warning[];
  conversionInsights: Insight[];
}
```

### C. Testing Strategy

- **Unit:** Playwright MCP for component testing
- **Integration:** Full journey flow testing
- **Payment:** Stripe test mode validation
- **Learning:** Pattern recognition accuracy
- **Performance:** Load time monitoring

---

**END OF PRD**

*This PRD focuses on rapid revenue validation through systematic learning, leveraging BMAD orchestration for 1-2 day implementation versus 3 week manual development.*