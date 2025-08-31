# Epic 2, Story 2.1: Hypothesis Capture for Content Changes

## Story Overview
**Story ID:** 2.1  
**Epic:** 2 (Learning Capture System)  
**Priority:** CRITICAL  
**Story Points:** 3  
**Dependencies:** Epic 1 (Complete ✅)

## User Story
**As an admin, I want to capture why I'm making each content change (hypothesis) so I can learn from outcomes**

## Business Context
The Template Genius Revenue Intelligence Engine succeeds when we systematically learn from every content change. Story 2.1 ensures no admin edits happen without capturing the learning hypothesis, building the foundation for Epic 2's pattern recognition capabilities.

## Current State Analysis
✅ **Foundation Already Exists**: Epic 1 established robust hypothesis capture infrastructure:
- `HypothesisModal` component with comprehensive capture fields
- `content_hypotheses` database table with full learning schema  
- `hypothesis-actions.ts` server actions for hypothesis operations
- `JourneyPageEditor` integration with hypothesis workflow

## Acceptance Criteria

### AC 2.1.1: Mandatory Hypothesis Before Content Changes ⚠️ ENHANCEMENT NEEDED
- **Given** an admin opens any journey page for editing
- **When** they attempt to modify title or content  
- **Then** hypothesis modal MUST appear before any edits are allowed
- **And** no content changes can be saved without hypothesis capture
- **And** existing content is preserved if hypothesis modal is cancelled

### AC 2.1.2: Comprehensive Hypothesis Data Collection ✅ COMPLETE
- **Given** hypothesis modal is triggered
- **When** admin fills out hypothesis information
- **Then** system captures:
  - ✅ Primary hypothesis (required, min 20 characters)
  - ✅ Change type (content/title/both/structure)  
  - ✅ Predicted outcome (optional)
  - ✅ Confidence level (1-10 slider)
  - ✅ Previous content snapshot
  - ✅ Admin identifier and timestamp

### AC 2.1.3: Enhanced UX for Hypothesis Workflow ⚠️ NEEDS REFINEMENT
- **Given** admin attempts to edit without hypothesis
- **When** hypothesis modal appears
- **Then** modal provides clear context about why hypothesis is needed
- **And** examples of good hypotheses are shown
- **And** modal cannot be bypassed or dismissed without completion or cancellation
- **And** cancelled edits return user to read-only state

### AC 2.1.4: Integration with Existing Journey Editor ✅ COMPLETE
- **Given** admin is editing journey page content
- **When** hypothesis is captured and approved
- **Then** editing mode is enabled seamlessly
- **And** all existing journey editor functionality works normally
- **And** changes are saved with hypothesis correlation

### AC 2.1.5: Hypothesis History and Context ⚠️ ENHANCEMENT NEEDED
- **Given** admin returns to previously edited page
- **When** viewing page in editor
- **Then** previous hypotheses for this page are visible in sidebar
- **And** hypothesis capture modal shows context from previous edits
- **And** admin can reference previous learning when creating new hypotheses

## Technical Implementation Plan

### Phase 1: Enhance Hypothesis Enforcement ⚠️ REQUIRED
**File:** `app/dashboard/components/JourneyPageEditor.tsx`

```typescript
// Strengthen hypothesis-first editing workflow
const handleFirstEditAttempt = () => {
  if (!editingMode && !hasChanges && !currentHypothesisId) {
    setShowHypothesisModal(true);
    return false; // Block edit until hypothesis captured
  }
  return true; // Allow edit
};

// Enhanced input handlers
const handleTitleChange = (value: string) => {
  if (!handleFirstEditAttempt()) return;
  setTitle(value);
  markAsChanged();
};
```

### Phase 2: Hypothesis History Sidebar ⚠️ NEW COMPONENT
**File:** `app/dashboard/components/HypothesisHistory.tsx` (NEW)

```typescript
// Display previous hypotheses for context
interface HypothesisHistoryProps {
  journeyPageId: number;
  currentHypothesis?: ContentHypothesis;
}

export function HypothesisHistory({ journeyPageId }: HypothesisHistoryProps) {
  // Load and display hypothesis history
  // Show outcomes when available
  // Provide context for new hypothesis creation
}
```

### Phase 3: Enhanced Modal UX ⚠️ ENHANCEMENT
**File:** `components/ui/HypothesisModal.tsx`

```typescript
// Add bypass prevention and better examples
const HypothesisModal = ({ isOpen, ...props }: HypothesisModalProps) => {
  // Prevent modal dismissal without completion
  // Add contextual examples
  // Show hypothesis history
  // Enhance validation and feedback
};
```

### Phase 4: Server Action Enhancements ✅ COMPLETE
**File:** `app/actions/hypothesis-actions.ts`
- ✅ All necessary server actions exist
- ✅ Full CRUD operations implemented
- ✅ Integration with journey page updates
- ✅ Comprehensive error handling

## Database Schema Status ✅ COMPLETE
The `content_hypotheses` table is fully implemented with all required fields:

```sql
-- Already exists from Epic 1
CREATE TABLE content_hypotheses (
  id SERIAL PRIMARY KEY,
  journey_page_id INTEGER REFERENCES journey_pages(id),
  hypothesis TEXT NOT NULL,
  change_type content_change_type NOT NULL,
  predicted_outcome TEXT,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
  previous_content TEXT,
  new_content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT,
  status content_hypothesis_status DEFAULT 'active',
  outcome_recorded_at TIMESTAMP,
  actual_outcome TEXT,
  conversion_impact JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);
```

## Component Enhancement Strategy

### 1. JourneyPageEditor Enhancements
- **Strengthen hypothesis-first workflow**
- **Add hypothesis history sidebar**
- **Improve editing state management**
- **Enhanced save workflow with hypothesis correlation**

### 2. HypothesisModal Improvements  
- **Better UX with examples and context**
- **Bypass prevention mechanisms**
- **History integration**
- **Improved validation feedback**

### 3. New HypothesisHistory Component
- **Sidebar component for hypothesis context**
- **Timeline of previous hypotheses**
- **Outcome tracking when available**
- **Learning pattern insights**

## Testing Strategy

### Unit Tests
- Hypothesis modal trigger mechanisms
- Content change blocking until hypothesis
- Server action validation
- Component state management

### Integration Tests  
- Complete hypothesis → edit → save workflow
- Modal bypass prevention
- History loading and display
- Cross-page hypothesis correlation

### E2E Testing with Playwright MCP
```typescript
// Test complete hypothesis capture workflow
test('Story 2.1: Admin cannot edit without hypothesis', async () => {
  await page.goto('/dashboard/client/1/journey/activation');
  await page.click('[data-testid="title-input"]');
  await expect(page.locator('[data-testid="hypothesis-modal"]')).toBeVisible();
  
  // Verify edit blocked until hypothesis
  await page.keyboard.type('New title');
  await expect(page.locator('[data-testid="title-input"]')).toHaveValue('Original Title');
  
  // Complete hypothesis and verify edit enabled
  await page.fill('[data-testid="hypothesis-text"]', 'Testing hypothesis capture workflow');
  await page.click('[data-testid="save-hypothesis"]');
  await expect(page.locator('[data-testid="hypothesis-modal"]')).toBeHidden();
  
  // Now editing should work
  await page.fill('[data-testid="title-input"]', 'New title');
  await expect(page.locator('[data-testid="title-input"]')).toHaveValue('New title');
});
```

## Implementation Effort Breakdown

### High Priority (Required for Story Completion)
1. **Hypothesis Enforcement** - 4 hours
   - Strengthen edit-blocking until hypothesis captured
   - Improve modal trigger mechanisms
   - Add bypass prevention

2. **Hypothesis History Component** - 6 hours
   - New sidebar component for previous hypotheses
   - Integration with journey page editor
   - Timeline and context display

### Medium Priority (Enhanced UX)
3. **Modal UX Improvements** - 3 hours
   - Better examples and guidance
   - Context from previous hypotheses
   - Enhanced validation

4. **Testing Implementation** - 4 hours
   - Unit tests for new workflows
   - E2E tests with Playwright MCP
   - Integration testing

**Total Estimated Effort:** 17 hours

## Definition of Done

### Functional Requirements ✅
- [ ] Admin cannot edit content without capturing hypothesis first
- [ ] Hypothesis modal provides comprehensive data collection
- [ ] Previous hypothesis history is visible for context
- [ ] All existing journey editor functionality preserved
- [ ] Hypothesis data correlates with content changes

### Technical Requirements ✅  
- [ ] Zero TypeScript compilation errors
- [ ] All server actions validate inputs properly
- [ ] Comprehensive error handling implemented
- [ ] Performance impact < 100ms for modal operations
- [ ] Mobile-responsive hypothesis interface

### Quality Assurance ✅
- [ ] Unit test coverage > 85% for new components
- [ ] E2E tests verify complete workflow
- [ ] Manual testing across all journey page types
- [ ] Code review approval from lead developer
- [ ] No breaking changes to existing Epic 1 functionality

## Success Metrics

### Learning Capture Effectiveness
- **100% hypothesis capture rate** before content changes
- **>90% completion rate** for hypothesis modal (not cancelled)  
- **Average hypothesis length >50 characters** (meaningful insights)
- **<5 second delay** from edit attempt to hypothesis modal

### Technical Performance
- **<200ms modal load time**
- **<500ms hypothesis save operation**
- **Zero failed hypothesis submissions** in production
- **100% correlation** between hypotheses and content changes

## Risk Mitigation

### User Experience Risk
- **Risk:** Hypothesis requirement may slow down admin workflow
- **Mitigation:** Streamlined modal with smart defaults and examples

### Data Quality Risk  
- **Risk:** Admins may provide low-quality hypotheses to bypass system
- **Mitigation:** Minimum character requirements, examples, and validation

### Technical Risk
- **Risk:** Hypothesis system may interfere with existing editor functionality
- **Mitigation:** Extensive testing and gradual rollout approach

## Integration with Epic 2 Learning System

Story 2.1 establishes the critical hypothesis capture foundation that enables:

- **Story 2.2:** Outcome recording after client interactions
- **Story 2.3:** Pattern recognition across hypothesis/outcome pairs  
- **Story 2.4:** Success/failure prediction based on historical patterns
- **Story 2.5:** Automated A/B testing recommendations

## Post-Implementation Analytics

### Hypothesis Quality Tracking
- Hypothesis length distribution
- Change type frequency analysis
- Confidence level correlation with outcomes
- Admin engagement with history features

### Learning Velocity Metrics
- Time from hypothesis to outcome recording
- Pattern recognition accuracy improvements
- Admin learning curve measurements
- Content change effectiveness trends

---

**Story Status:** Ready for Implementation  
**BMAD Orchestration:** Recommended for structured delivery  
**Estimated Delivery:** 1-2 days with automated workflow