# Tech Stack Alignment

## Existing Technology Stack

| Category | Current Technology | Version | Usage in Enhancement | Notes |
|----------|-------------------|---------|---------------------|-------|
| **Core Framework** | Next.js | 15.2.4 | App Router patterns maintained | No changes to routing structure |
| | React | 19 | Component architecture preserved | Leverage concurrent features |
| | TypeScript | 5.7 | Strict mode compliance | Enhanced with data layer interfaces |
| | Node.js | 22+ | Runtime maintained | Alpine Docker compatibility |
| **UI & Styling** | Tailwind CSS | 4.1.9 | Consistent styling patterns | No new utility classes needed |
| | Shadcn/ui | 40+ components | Reuse Button, Card, Dialog, Tabs, Toast | No new component additions |
| | Radix UI | 20+ primitives | Accessibility patterns maintained | Form, Select for client type picker |
| | CVA | 0.7.1 | Component variants for client types | Test/Live/Demo visual distinction |
| | Geist Fonts | Latest | Typography consistency | No changes |
| | Lucide React | 0.454.0 | Icons for client type indicators | Database, Test, User icons |
| **Data & Forms** | React Hook Form | 7.60.0 | Enhanced ContentEditor forms | Same validation patterns |
| | Zod | 3.25.67 | Client type validation schemas | Enhanced with test/live validation |
| | Supabase | 2.56.0 | Clean data layer implementation | Enhanced client configuration |
| **Development Tools** | pnpm | Latest | Package management maintained | No changes to existing workflow |
| | Docker | Latest | Containerized development preserved | No changes to Dockerfile |
| | BMAD + Serena | Current | AI-orchestrated development | Enhanced with clean architecture |
| | Playwright MCP | Current | Browser testing automation | Test client vs live client testing |

## Required New Dependencies

Essential dependencies for core business functionality:

| Technology | Version | Purpose | Rationale | Integration Method |
|------------|---------|---------|-----------|-------------------|
| **@stripe/stripe-js** | ^2.4.0 | Client-side payment processing | Required for $500 activation fee collection (core PRD requirement) | React components for checkout flow |
| **stripe** | ^14.21.0 | Server-side payment processing | Required for webhook handling and payment confirmation | Next.js API routes integration |
| **@types/stripe** | ^8.0.0 | TypeScript support for Stripe | Type safety for payment processing | Development dependency |
| **@supabase/postgres-js** | ^2.1.0 | Enhanced database connection pooling | Free tier connection optimization | Enhanced database client |

## Enhanced Environment Configuration

```typescript
interface EnvConfig {
  // Existing (preserved)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Required new for payment processing
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;  
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
}
```

## Technology Integration Strategy

**Version-Based Data Layer Implementation:**
```typescript
// Enhanced TypeScript interfaces for version-based architecture
interface Client {
  id: UUID;
  company: string;
  contact: string;
  email: string;
  activationToken: string;        // G[4-digit] format
  currentVersionId?: UUID;        // Links to active content version
  status: 'pending' | 'active' | 'paid' | 'failed';
  createdAt: Date;
}

// Content version model with learning capture
interface ContentVersion {
  id: UUID;
  clientId: UUID;
  pageType: 'activation' | 'agreement' | 'confirmation' | 'processing';
  content: JSONB;
  iterationNotes: string;         // "Why this change?" - PRD requirement
  hypothesis: string;             // Expected outcome - PRD requirement
  outcome: 'success' | 'failure' | 'pending'; // Result tracking - PRD requirement
  isCurrent: boolean;            // Active version flag
  versionNumber: number;         // Sequential versioning
  createdBy: string;
  createdAt: Date;
}

// Learning data for content updates
interface LearningData {
  iterationNotes: string;        // Rationale for content change
  hypothesis: string;           // Expected outcome
}

// Version-based data layer operations
interface VersionDataLayer {
  // Client operations
  createClientWithFirstVersion(data: ClientData): Promise<{ client: Client; contentVersion: ContentVersion }>;
  getClientContentHistory(clientId: string): Promise<ContentVersion[]>;
  
  // Content version operations
  updateClientContent(clientId: string, pageType: string, content: any, learning: LearningData): Promise<ContentVersion>;
  markContentOutcome(versionId: string, outcome: 'success' | 'failure', notes?: string): Promise<ContentVersion>;
  
  // Client activation
  getClientActivationContent(activationToken: string): Promise<{ client: Client; content: any; versionId: string }>;
  
  // Analytics operations
  getConversionAnalytics(): Promise<ConversionAnalytics>;
  getSuccessPatterns(): Promise<ContentPattern[]>;
}
```

This technology alignment preserves the existing sophisticated development ecosystem (BMAD orchestration, Serena memory, Playwright testing, 40+ component library) while adding only essential dependencies required for core business functionality.

---
