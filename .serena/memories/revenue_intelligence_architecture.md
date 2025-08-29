# Revenue Intelligence Engine - Technical Architecture

## Core Concept
Transform each client interaction into a learning opportunity that improves future conversions through systematic hypothesis tracking, outcome recording, and pattern recognition.

## Technical Philosophy
- **Component Enhancement** over replacement (preserve 40+ Shadcn/ui components)
- **Server Actions** over REST APIs (Next.js 15 best practices)
- **Learning Persistence** via Serena memory (knowledge compounds)
- **BMAD Orchestration** for rapid implementation (1-2 days)

## Data Architecture

### Connected Journey Model
```typescript
interface ClientJourney {
  id: UUID;
  client: Client;
  overallHypothesis: string;        // Strategy for this client
  pages: {
    activation: JourneyPage;
    agreement: JourneyPage;
    confirmation: JourneyPage;
    processing: JourneyPage;
  };
  conversionStatus: 'in_progress' | 'paid' | 'ghosted';
  learningOutcome?: string;         // What we learned
}

interface JourneyPage {
  pageType: string;
  pageHypothesis: string;           // Why this content will work
  content: JSONB;
  interactions: PageInteraction[];
  dropOffDetected: boolean;
}
```

### Learning Capture Flow
1. **Before Change**: Capture hypothesis ("Why will this work?")
2. **During Journey**: Track interactions and drop-offs
3. **After Outcome**: Record what happened (paid/ghosted)
4. **Pattern Recognition**: Identify what works across journeys

## Component Enhancement Strategy

### Enhanced Components
- `ClientList.tsx` → Revenue Intelligence Dashboard
- `ContentEditor.tsx` → Learning-Enabled Editor
- `Dashboard` → Journey Intelligence Tabs

### New Minimal Components
- `JourneyPatternsView` - Uses existing Card, Badge, Table
- `HypothesisCapture` - Uses existing Form, Textarea
- `OutcomeTracker` - Uses existing Select, Button

## Server Actions (Core Operations)
```typescript
createClientWithJourney(data, hypothesis): Promise<ClientJourney>
updateJourneyPage(journeyId, pageType, content, hypothesis): Promise<void>
recordJourneyOutcome(journeyId, outcome, notes): Promise<void>
getJourneyIntelligence(): Promise<JourneyIntelligence>
```

## Database Schema
- `client_journeys` - Overall journey tracking
- `journey_pages` - Individual page content and hypotheses
- `journey_interactions` - User behavior tracking
- `payment_intelligence` - Payment-to-content correlation

## Integration Points
- **Stripe**: Payment processing with journey context
- **Supabase**: Data persistence with learning capture
- **Serena MCP**: Memory updates for pattern persistence
- **Playwright MCP**: Automated journey testing

## Implementation Timeline
- **Day 1**: Database schema + component enhancements
- **Day 2**: Learning capture + pattern recognition
- **Testing**: Automated with Playwright MCP
- **Deployment**: Feature flags for safe rollout