# Story 1.4: Client Journey Access & Experience

## Status
**Draft**

## Story
**As a** client,
**I want** to access my personalized journey through my unique token with consistent, professional experience across all pages,
**so that** I feel confident progressing through the activation process to payment.

## Acceptance Criteria
1. Client token (G[4-digit]) provides access to complete 4-page journey experience
2. Navigation between pages maintains context and personalization throughout journey
3. Each page reflects admin's hypothesis-driven content specific to that client  
4. Journey flow guides client naturally from activation through confirmation
5. Professional, consistent styling maintained across all pages using existing design system

**Integration Verification:**
- IV1: Existing client access URLs and token system function without modification
- IV2: Current page loading performance maintained across extended journey
- IV3: Mobile responsiveness preserved across all journey pages using existing Tailwind patterns

## Tasks / Subtasks

- [ ] **Task 1: Enhance Client Journey Access System** (AC: 1, 3)
  - [ ] Extend existing getClientActivationContent server action to support all 4 page types
  - [ ] Update client token validation to provide seamless access across activation, agreement, confirmation, processing pages
  - [ ] Ensure hypothesis-driven content (from Story 1.3) properly displays to clients on their personalized pages
  - [ ] Maintain existing G[4-digit] token format and validation patterns established in previous stories
  - [ ] Source: [architecture/api-design-and-integration.md#client-activation-support]

- [ ] **Task 2: Implement Multi-Page Journey Navigation** (AC: 2, 4)
  - [ ] Create client-facing navigation component enabling smooth transitions between journey pages
  - [ ] Implement journey progress indicator showing current page position in 4-page flow
  - [ ] Add contextual "Next Step" calls-to-action guiding clients naturally through activation → agreement → confirmation → processing
  - [ ] Preserve client context (company name, G-token display) across all pages for personalization
  - [ ] Source: Previous Story 1.2 established admin journey navigation patterns to adapt for client experience

- [ ] **Task 3: Create Client Journey Page Templates** (AC: 3, 5)
  - [ ] Develop responsive page layouts for activation, agreement, confirmation, and processing pages using existing Tailwind patterns
  - [ ] Integrate hypothesis-driven content display ensuring admin's customized content reaches clients appropriately
  - [ ] Implement consistent professional styling using established Shadcn UI components (Card, Button, Badge, etc.)
  - [ ] Add mobile-first responsive design ensuring optimal experience across devices
  - [ ] Source: [architecture/component-architecture.md#enhanced-contenteditor-component] content structure patterns

- [ ] **Task 4: Client Experience Flow Integration** (AC: 4, 5) 
  - [ ] Connect journey pages to existing payment processing flow from server actions
  - [ ] Implement seamless transitions from client content viewing to payment initiation
  - [ ] Add professional loading states and transitions between journey pages
  - [ ] Ensure consistent branding and messaging throughout complete client experience
  - [ ] Source: [architecture/api-design-and-integration.md#payment-processing-server-actions]

- [ ] **Task 5: Integration Testing & Performance Verification** (IV1, IV2, IV3)
  - [ ] Test existing client access URLs continue to work without modification 
  - [ ] Verify page loading performance maintained across extended 4-page journey experience
  - [ ] Confirm mobile responsiveness using existing Tailwind responsive patterns
  - [ ] Validate hypothesis-driven content properly renders on client-facing pages
  - [ ] Test complete client journey flow from token access through payment completion

## Dev Notes

### Previous Story Insights (Stories 1.1-1.3 Established Infrastructure)

**From Story 1.1 - Client Creation Foundation:**
- **Client Model Enhancement**: Complete G[4-digit] token system with `activationToken` field established
- **4-Page Journey Structure**: All 4 journey pages (activation, agreement, confirmation, processing) automatically created for each client
- **Mock Data System**: Robust fallback system enables full development without database dependency
- **Server Actions Foundation**: `createClientWithFirstVersion` provides atomic client creation with journey setup

**From Story 1.2 - Multi-Page Infrastructure:**
- **JourneyNavigationTabs Component**: Professional tabbed navigation at `app/dashboard/components/JourneyNavigationTabs.tsx`
- **Enhanced ContentEditor**: Multi-page support with pageType prop at `app/dashboard/components/ContentEditor.tsx`
- **Journey Editor Route**: Complete editing experience at `app/dashboard/journey/[clientId]/page.tsx`
- **Server Actions Pattern**: `updateClientJourneyPageByType` and `getClientJourneyPageByType` with version tracking

**From Story 1.3 - Hypothesis Capture System:**
- **Enhanced ContentEditor**: Full hypothesis capture with dropdown options and validation at `app/dashboard/components/ContentEditor.tsx`
- **ContentHistoryPanel**: Version history with hypothesis tracking at `app/dashboard/components/ContentHistoryPanel.tsx`
- **Hypothesis-Required Workflow**: Content changes require learning hypothesis for systematic Revenue Intelligence
- **Server Action Enhancement**: `updateClientJourneyPageByType` captures hypothesis metadata (edit_hypothesis, hypothesis_type, content_update_reason)

### Architecture Context

**Data Models** [Source: architecture/data-models-and-schema-changes.md#enhanced-client-model]
```typescript
// Client model with journey access
interface Client {
  id: UUID;
  company: string;
  contact: string;
  email: string;
  activationToken: string;        // G[4-digit] format - established in Story 1.1
  currentVersionId?: UUID;        // Links to active content version
  status: 'pending' | 'active' | 'paid' | 'failed';
  createdAt: Date;
}

// Content version model with hypothesis tracking
interface ContentVersion {
  id: UUID;
  clientId: UUID;
  pageType: 'activation' | 'agreement' | 'confirmation' | 'processing';
  content: JSONB;                 // Hypothesis-driven content from admin
  iterationNotes: string;         // Admin's rationale from Story 1.3
  hypothesis: string;             // Expected outcome from Story 1.3  
  outcome: 'success' | 'failure' | 'pending';
  isCurrent: boolean;
  versionNumber: number;
  createdBy: string;
  createdAt: Date;
}
```

**API Specifications** [Source: architecture/api-design-and-integration.md#client-activation-support]
```typescript
// Enhanced client activation for all page types
export async function getClientJourneyContent(
  activationToken: string, 
  pageType: 'activation' | 'agreement' | 'confirmation' | 'processing'
): Promise<ClientJourneyData> {
  
  const client = await db.clients.findUnique({
    where: { activationToken },
    include: { currentVersion: true }
  });
  
  if (!client) {
    throw new Error('Invalid activation token');
  }
  
  // Get hypothesis-driven content for requested page
  const contentVersion = await db.contentVersions.findFirst({
    where: { 
      clientId: client.id, 
      pageType,
      isCurrent: true 
    }
  });
  
  return {
    client,
    content: contentVersion?.content || getDefaultContentForPage(pageType),
    pageType,
    versionId: contentVersion?.id
  };
}
```

**Component Specifications** [Source: architecture/component-architecture.md#client-journey-experience]
**Client Journey Page Layout:**
- Location: `app/activate/[token]/[pageType]/page.tsx` (new dynamic route structure)
- Uses existing Shadcn UI components: Card, Button, Badge, Progress for consistent design
- Implements mobile-first responsive design with established Tailwind patterns
- Displays admin's hypothesis-driven content specific to each client

**Client Navigation Component:**
```typescript
interface ClientJourneyNavProps {
  client: Client;
  currentPage: 'activation' | 'agreement' | 'confirmation' | 'processing';
  onNavigate: (pageType: string) => void;
}

// Professional client-facing navigation
function ClientJourneyNav({ client, currentPage, onNavigate }) {
  const journeySteps = [
    { key: 'activation', label: 'Activation', status: 'completed' },
    { key: 'agreement', label: 'Agreement', status: currentPage === 'agreement' ? 'current' : 'pending' },
    { key: 'confirmation', label: 'Confirmation', status: 'pending' },
    { key: 'processing', label: 'Processing', status: 'pending' }
  ];
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{client.company} Activation</h1>
          <Badge variant="secondary">{client.activationToken}</Badge>
        </div>
        <Progress value={getProgressValue(currentPage)} className="w-32" />
      </div>
      
      <div className="flex space-x-2">
        {journeySteps.map((step) => (
          <Button
            key={step.key}
            variant={step.status === 'current' ? 'default' : 'outline'}
            onClick={() => onNavigate(step.key)}
            disabled={step.status === 'pending'}
            className="flex-1"
          >
            {step.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

### File Locations [Source: architecture/source-tree-integration.md#new-file-organization]

**New Client Journey Routes:**
- Client journey base: `app/activate/[token]/page.tsx` (redirect to activation page)
- Activation page: `app/activate/[token]/activation/page.tsx`
- Agreement page: `app/activate/[token]/agreement/page.tsx` 
- Confirmation page: `app/activate/[token]/confirmation/page.tsx`
- Processing page: `app/activate/[token]/processing/page.tsx`

**Enhanced Components:**
- Client navigation: `app/activate/components/ClientJourneyNav.tsx`
- Client layout wrapper: `app/activate/components/ClientJourneyLayout.tsx`

**Enhanced Server Actions:**
- Journey access: `app/actions/journey-actions.ts` (extend existing with multi-page support)

### Technical Constraints [Source: architecture/tech-stack-alignment.md#existing-technology-stack]
- **Next.js 15.2.4** - App Router dynamic routes for client journey pages
- **TypeScript 5.7** - Strict mode compliance for client journey interfaces
- **Shadcn UI Components** - Use existing Card, Button, Badge, Progress, Alert for consistent design
- **Tailwind CSS 4.1.9** - Mobile-first responsive patterns using existing utility classes
- **React 19** - Concurrent features for smooth page transitions

### Business Logic Requirements
- **Token-Based Access**: G[4-digit] tokens provide secure, personalized journey access
- **Hypothesis Content Display**: Admin's customized content (from Story 1.3) properly renders to clients
- **Progressive Journey Flow**: Natural progression from activation → agreement → confirmation → processing
- **Professional Experience**: Consistent branding and styling throughout complete client journey
- **Performance Standards**: Page loading and responsiveness maintained across extended journey

### Integration Dependencies
- **Story 1.1 Foundation**: Client creation with G-token system and 4-page structure established
- **Story 1.2 Infrastructure**: Journey navigation and content management patterns proven effective  
- **Story 1.3 Content System**: Hypothesis-driven content available for client display
- **Mock Data System**: Client journey must work without database dependency using established fallback patterns
- **Payment Integration**: Journey connects to existing Stripe payment processing (createPaymentSession)

## Testing

### Testing Standards [Source: architecture/testing-strategy.md#new-testing-requirements]
**Framework:** Playwright MCP for browser automation and client journey flow testing
**Test Organization:** Client journey tests in `__tests__/client-journey/` directory alongside new components
**Coverage Requirements:** 90% coverage for client-facing journey components, 80% for navigation integration

**Specific Testing Requirements:**
1. **Unit Tests:**
   - G[4-digit] token validation across all 4 journey pages
   - Client journey navigation component behavior and state management
   - Hypothesis-driven content display for client-facing pages
   - Professional styling consistency across journey pages

2. **Integration Tests:**
   - End-to-end client journey flow from token access through payment initiation
   - Multi-page navigation with context preservation across journey pages
   - Responsive design validation across different screen sizes and devices
   - Integration with existing payment processing from previous server actions

3. **Regression Testing:**
   - Existing admin dashboard journey editing remains unaffected (Stories 1.2-1.3)
   - Current client access patterns continue to work without modification
   - Page loading performance maintained across extended journey experience
   - Mock data fallback system operational for complete client journey

**Test Location:** `__tests__/client-journey/` directory
**Manual Testing:** Client journey user experience, payment flow integration, mobile responsiveness validation

## Previous Story Learnings

### Established Infrastructure from Stories 1.1-1.3
- **Complete G-Token System:** Robust G[4-digit] activation token system with validation and unique generation established in Story 1.1
- **4-Page Journey Foundation:** All journey pages (activation, agreement, confirmation, processing) automatically created for each client
- **Professional Navigation:** JourneyNavigationTabs component with unsaved changes protection proven effective for admin interface - patterns adaptable for client experience
- **Hypothesis-Driven Content:** Story 1.3 established systematic content customization with learning capture - content ready for client display
- **Server Actions Excellence:** Complete pattern established with updateClientJourneyPageByType, getClientJourneyPageByType with version tracking and mock data support
- **Mock Data Reliability:** Comprehensive fallback system ensures full functionality without database dependency

### Architecture Decisions That Inform Story 1.4
- **Component Enhancement Pattern:** Proven successful to extend existing components rather than create new - apply to client-facing journey components
- **Professional UX Standards:** Story 1.3 achieved 95/100 quality score through systematic approach to all acceptance criteria - maintain same standards for client experience
- **Token System Robustness:** G[4-digit] system proven reliable across complex admin workflows - ready for client-facing experience without modification
- **Performance-First Approach:** Existing journey pages maintain excellent performance and styling - client pages must achieve same standards
- **Responsive Design Excellence:** Existing Tailwind patterns provide professional mobile experience - extend same approach to client journey

### Implementation Patterns to Reuse
- **Dynamic Route Structure:** Use Next.js App Router patterns for /activate/[token]/[pageType] client journey routes
- **Server-Side Content Delivery:** Leverage existing getClientJourneyPageByType pattern for client content access
- **Professional Component Integration:** Use established Shadcn UI component patterns (Card, Button, Badge, Progress) for consistent design
- **Context Preservation:** Apply navigation state management patterns from admin interface to client journey experience
- **Form Integration:** Extend React Hook Form + Zod validation patterns for client interactions leading to payment

### Quality Gate Achievement Requirements
- **Professional Client Experience:** Must match or exceed admin interface quality standards (95/100 baseline)
- **Seamless Journey Flow:** Natural progression through 4-page experience with clear calls-to-action  
- **Performance Excellence:** Page loading and responsiveness maintained across extended client journey
- **Integration Success:** Connect smoothly to existing payment processing without disrupting established patterns
- **Testing Completeness:** Comprehensive validation of client journey using proven Playwright MCP testing approach

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-30 | 1.0 | Initial story creation with client journey access requirements | Bob (Scrum Master) |

## Dev Agent Record

*This section will be populated by the development agent during implementation.*

## QA Results

*This section will be populated by the QA agent after implementation review.*