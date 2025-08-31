# Story 2.1: Pre-Edit Hypothesis Capture Interface

## Story Overview
**Story ID:** 2.1
**Epic:** Learning Capture System  
**Sprint:** 1
**Story Points:** 5
**Priority:** CRITICAL
**Assignee:** Dev Agent
**Status:** Ready for Implementation

## User Story
As an admin, I want to capture why I'm making each content change (hypothesis) so I can learn from outcomes.

## Acceptance Criteria
- [ ] Hypothesis capture modal appears before any content editing
- [ ] Modal includes hypothesis text field with validation (required, 10-500 chars)
- [ ] Modal includes change type selector (content, design, flow, messaging)
- [ ] Hypothesis saved to database with client_id, page_type, and timestamp
- [ ] Edit workflow continues normally after hypothesis capture
- [ ] Previous hypotheses viewable in editing interface
- [ ] Hypothesis required for all content changes, not just new edits

## Definition of Done
- [ ] All acceptance criteria met
- [ ] Code follows TypeScript + Next.js 15 patterns
- [ ] Integration with existing Epic 1 journey pages
- [ ] Playwright MCP tests covering hypothesis capture flow
- [ ] No regression in Epic 1 client creation/editing functionality
- [ ] Database migration tested and reversible

## Technical Requirements

### Database Schema Extension
```sql
CREATE TABLE content_hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  page_type VARCHAR(20) NOT NULL CHECK (page_type IN ('activation', 'agreement', 'confirmation', 'processing')),
  hypothesis_text TEXT NOT NULL CHECK (length(hypothesis_text) >= 10 AND length(hypothesis_text) <= 500),
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('content', 'design', 'flow', 'messaging')),
  content_snapshot JSONB, -- Optional: capture before-state
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_content_hypotheses_client_page ON content_hypotheses(client_id, page_type);
CREATE INDEX idx_content_hypotheses_created_at ON content_hypotheses(created_at DESC);
```

### Component Architecture
- **HypothesisModal**: New Shadcn/ui dialog component
- **JourneyPageEditor**: Enhanced with hypothesis trigger
- **EditButton**: Modified to trigger hypothesis capture first
- **HypothesisHistory**: Display component for previous hypotheses

### Server Actions
- **`saveHypothesis()`**: Create new hypothesis record
- **`getClientHypotheses()`**: Fetch hypothesis history
- **`validateHypothesisBeforeEdit()`**: Check if hypothesis required

## Dependencies
- Epic 1: Client journey infrastructure complete
- Existing JourneyPageEditor component patterns
- Shadcn/ui dialog and form components
- Server action patterns from Epic 1

## Dev Agent Notes

### Implementation Priority
1. **Database Migration**: Create content_hypotheses table
2. **Server Actions**: hypothesis-actions.ts following Epic 1 patterns
3. **HypothesisModal Component**: Modal with form validation
4. **Integration Points**: Enhance existing edit triggers
5. **Testing**: Playwright MCP coverage of full workflow

### Epic 1 Integration Points
- **JourneyPageEditor**: Add hypothesis check before editing
- **Route Handlers**: Extend existing /api/clients/[id]/pages patterns
- **UI Components**: Use established Shadcn/ui patterns
- **Database**: Extend existing client schema without disruption

### Code Quality Requirements
- TypeScript strict mode with proper interfaces
- Zod validation for hypothesis form data
- Error handling for network failures
- Responsive design for mobile editing
- Accessibility compliance (aria-labels, keyboard navigation)

## QA Considerations

### Regression Testing
- [ ] Epic 1 client creation still works without hypothesis
- [ ] Existing journey editing workflow preserved
- [ ] Page navigation maintains context
- [ ] Client token access unaffected

### Performance Requirements
- Modal load time ≤ 200ms
- Hypothesis save operation ≤ 2 seconds
- No impact on existing page load times
- Total workflow increase ≤ 30 seconds

### Edge Cases
- Network failure during hypothesis save
- Concurrent editing by multiple admins
- Very long hypothesis text handling
- Modal dismiss behavior (save draft or discard?)

### Test Coverage Areas
- Hypothesis modal appearance and validation
- Integration with all 4 page types
- History display and retrieval
- Error states and recovery
- Mobile responsive behavior

## Architecture Notes
This story extends Epic 1's foundation by adding intelligence gathering without disrupting the established client journey workflow. The hypothesis capture becomes a natural part of the content editing process, enabling systematic learning about what drives conversion success.

## Success Metrics
- 100% hypothesis capture rate for content changes
- ≤ 5% workflow abandonment rate due to hypothesis requirement
- Successful integration with existing Epic 1 patterns
- Zero regression issues in client creation/editing