# Task Completion Workflow - Revenue Intelligence Engine

## Core Development Workflow

### 1. Task Planning with Learning Focus
Before starting any task:
- Consider how it supports the Revenue Intelligence Engine
- Identify learning capture opportunities
- Plan hypothesis tracking implementation

### 2. Component Enhancement Pattern
```typescript
// Enhance existing components with learning fields
interface EnhancedComponent {
  // Existing functionality preserved
  existingProps: ComponentProps;
  
  // Learning capture added
  hypothesis?: string;
  outcome?: 'pending' | 'paid' | 'ghosted';
  learningNotes?: string;
}
```

### 3. Development Steps
1. **Review PRD and Architecture**
   - `docs/prd.md` - Business requirements and epics
   - `docs/architecture.md` - Technical implementation

2. **Enhance Components**
   - Extend existing Shadcn/ui components
   - Add learning capture fields
   - Preserve existing patterns

3. **Implement Server Actions**
   ```typescript
   // Learning-focused operations
   createClientWithJourney()
   updateJourneyPage()
   recordJourneyOutcome()
   getJourneyIntelligence()
   ```

4. **Test with Playwright MCP**
   ```bash
   mcp__playwright__browser_navigate
   mcp__playwright__browser_click
   mcp__playwright__browser_take_screenshot
   ```

### 4. Git Integration
```bash
# Feature branch
git checkout -b feature/revenue-intelligence-enhancement

# Commit with learning context
git commit -m "feat(learning): add hypothesis capture to client creation

- Added hypothesis field to client form
- Integrated with journey creation
- Updated Serena memory with patterns

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5. Quality Checks
- Run `pnpm lint` for code quality
- Run `pnpm build` for production readiness
- Test journey flow end-to-end
- Verify learning capture works

### 6. Documentation Updates
- Update Serena memories with new patterns
- Keep PRD and Architecture aligned
- Update README if user-facing changes

## BMAD Orchestration Workflow

For AI-orchestrated development:

```bash
# Use PRD and Architecture as source
/po *shard-prd              # Create stories from PRD epics
/bmad-execute-epic 1,2,3,4  # Implement Phase I epics

# Automatic workflow includes:
# - Story drafting with learning context
# - Implementation with hypothesis tracking
# - Testing with Playwright MCP
# - Git commits with proper context
```

## Success Criteria
- ✅ Connected journey implemented (4 pages)
- ✅ Learning capture operational
- ✅ Pattern recognition working
- ✅ Stripe payments integrated
- ✅ Serena memory updated