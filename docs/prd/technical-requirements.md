# Technical Requirements

## Technical Stack (Preserved)

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

## Database Schema

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

## API Architecture

**Server Actions (Not REST):**
```typescript
// Core learning operations
createClientWithJourney(data: ClientData, hypothesis: string): Promise<ClientJourney>
updateJourneyPage(journeyId: string, pageType: string, content: any, hypothesis: string): Promise<void>
recordJourneyOutcome(journeyId: string, outcome: 'paid' | 'ghosted', notes?: string): Promise<void>
getJourneyIntelligence(): Promise<JourneyIntelligence>
```

---
