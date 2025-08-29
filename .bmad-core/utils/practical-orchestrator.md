# Practical BMAD Orchestrator Implementation

This is the actual working implementation of the bmad-execute-epic command using available Claude Code and MCP tools.

## Command: /bmad-execute-epic [epic-number]

When this command is invoked, execute the following workflow:

### Step 1: Load Epic and Validate Prerequisites

```markdown
1. Check if Serena MCP is ready:
   - mcp__serena__check_onboarding_performed
   
2. Load epic from PRD:
   - Read docs/prd/epic-and-story-breakdown.md
   - Parse Epic [epic-number] section
   
3. Validate required files exist:
   - docs/architecture.md
   - .bmad-core/core-config.yaml
   - .bmad-core/epic-orchestration.yaml
```

### Step 2: SM Agent Iterative Story Cycle

**CRITICAL: SM creates ONE story at a time, building on previous learnings**

For each story in sequence:

```markdown
Task({
  subagent_type: 'general-purpose',
  description: 'BMAD SM Agent - Single Story Creation',
  prompt: `You are Bob, the BMAD Scrum Master.

Your task: Create the NEXT story for Epic [X], building on previous story learnings.

EPIC CONTEXT:
[Load epic details from docs/prd/epic-and-story-breakdown.md]

PREVIOUS STORY NOTES (if any):
[Load from docs/stories/story-[epic]-[previous-number].md - Dev Agent Record and QA findings]
[Include: implementation challenges, architectural decisions, patterns established]

ARCHITECTURE CONTEXT:
[Load from docs/architecture/coding-standards-and-conventions.md]
[Load from docs/architecture/component-architecture.md]

ITERATIVE PROCESS:
1. Review ONLY the current epic requirements
2. Analyze previous story outcomes (implementation notes, QA findings)
3. Identify what was learned that affects the next story
4. Create ONE story that builds logically on previous work
5. Incorporate lessons learned into dev notes

STORY CREATION:
- Clear user story format: "As a [user], I want [goal] so that [benefit]"
- Detailed acceptance criteria (3-5 criteria minimum)
- Dev notes that reference previous story patterns/components
- Build incrementally on established architecture
- Testing requirements that include regression testing

TEMPLATE for story file:
# Story [epic].[number]: [Title]

## User Story
As a [user type], I want [functionality] so that [business value].

## Acceptance Criteria
- [ ] Criterion 1 with specific details
- [ ] Criterion 2 with measurable outcomes
- [ ] Criterion 3 with user validation

## Build On Previous Work
- Previous story components to leverage: [list]
- Patterns to follow: [from previous implementations]
- Architecture decisions to maintain: [consistency items]

## Dev Implementation Notes
- Files to create/modify: [specific paths, building on previous]
- Components to build: [names and purposes, referencing existing]
- Reuse patterns from: [previous story components]
- TypeScript interfaces: [extend existing types when possible]

## Testing Requirements
- Unit tests: [specific test cases]
- Integration tests: [user flow tests]
- Regression tests: [ensure previous stories still work]

## Status
APPROVED - Ready for implementation

Create ONLY the next story (story-[epic]-[next-number].md).`
});
```

### Step 3: Execute Dev Agent with Serena Integration

For each story created, run:

```markdown
Task({
  subagent_type: 'general-purpose',
  description: 'BMAD Dev Agent - Implementation',
  prompt: `You are a BMAD Development Agent implementing Story [story-id].

STORY REQUIREMENTS:
[Load from docs/stories/story-[epic]-[number].md]

SERENA MCP CAPABILITIES:
You have access to these tools for precise code operations:
- mcp__serena__get_symbols_overview: Understand file structure
- mcp__serena__find_symbol: Find specific functions/classes
- mcp__serena__replace_symbol_body: Replace entire functions/classes
- mcp__serena__insert_after_symbol: Add new code after symbols
- mcp__playwright__browser_navigate: Test implementation
- mcp__playwright__browser_take_screenshot: Verify UI changes

IMPLEMENTATION WORKFLOW:
1. Understanding Phase:
   - Use mcp__serena__list_dir to explore project structure
   - Use mcp__serena__get_symbols_overview on target files
   - Use mcp__serena__find_symbol to understand existing patterns

2. Implementation Phase:
   - Create/modify components following Template Genius patterns
   - Use TypeScript strict types and interfaces
   - Follow Next.js 15 App Router conventions
   - Implement server actions for data operations

3. Testing Phase:
   - Run mcp__ide__getDiagnostics to check TypeScript errors
   - Use mcp__playwright__browser_navigate to test functionality
   - Take screenshots to verify UI implementation
   - Run validation commands: pnpm lint, pnpm typecheck

4. Documentation:
   - Update story file with implementation details
   - Document any architectural decisions
   - Note any deviations from original plan

COMMIT FORMAT:
feat(story-[story-id]): [story title] [BMAD-[story-id]]

Execute this implementation completely and report results.`
});
```

### Step 4: Execute QA Agent

```markdown
Task({
  subagent_type: 'general-purpose', 
  description: 'BMAD QA Agent - Quality Review',
  prompt: `You are a BMAD Quality Assurance Agent reviewing Story [story-id].

STORY REQUIREMENTS:
[Load from docs/stories/story-[story-id].md]

QA REVIEW PROCESS:
1. Acceptance Criteria Validation:
   - Check each criterion against implementation
   - Use mcp__playwright__browser_navigate for functional testing
   - Verify user flows work as specified

2. Code Quality Assessment:
   - Use mcp__ide__getDiagnostics to check for errors
   - Review TypeScript compliance
   - Check Template Genius coding standards

3. Test Coverage Review:
   - Verify test files exist and cover functionality
   - Check Playwright test scenarios
   - Validate error handling

4. Performance & Security:
   - Check for console.log statements (security)
   - Validate proper error boundaries
   - Review data handling security

QUALITY GATE DECISION:
Based on review, assign one of:
- PASS: All criteria met, production ready
- CONCERNS: Minor issues noted, acceptable for delivery
- FAIL: Critical issues must be addressed
- WAIVED: Known issues accepted by team

OUTPUT FORMAT:
# QA Review: Story [story-id]

## Quality Gate: [PASS/CONCERNS/FAIL/WAIVED]

## Acceptance Criteria Review
- [✓] Criterion 1: [validation details]
- [✓] Criterion 2: [validation details]
- [!] Criterion 3: [issues found]

## Code Quality Score: [1-10]

## Issues Found:
### Critical (must fix):
- Issue description and location

### Minor (should fix):
- Issue description and suggestion

## Test Coverage: [percentage]%

## Recommendations:
- Improvement suggestions

Execute this review and provide final quality gate decision.`
});
```

### Step 5: Epic Completion

```markdown
After all stories are processed:

1. Generate Epic Completion Report:
   - Count completed/failed stories
   - Summarize quality gates
   - Calculate total duration
   - List any remaining issues

2. Update Serena Memory:
   - Use mcp__serena__write_memory to capture learnings
   - Document patterns discovered
   - Note optimization opportunities

3. Create Pull Request (if all pass):
   - Commit all changes with epic summary
   - Create PR with comprehensive description
   - Include test results and quality metrics

4. Display Results:
   - Show success/failure summary
   - List next actions if needed
   - Provide checkpoint for resume if failed
```

## Practical Usage Examples

### Example 1: Execute Epic 1
```bash
/bmad-execute-epic 1
```

This will:
1. Load Epic 1: Connected Journey Infrastructure
2. Create 3-4 stories for client management functionality  
3. Implement each story using Serena MCP tools
4. Run QA validation with Playwright testing
5. Generate completion report

### Example 2: Resume Failed Epic
```bash  
/bmad-execute-epic 2 --resume-from story-2-2
```

This will:
1. Load checkpoint state
2. Resume from specified story
3. Continue execution from that point

## Integration Points

### With Serena MCP:
- **mcp__serena__list_dir**: Explore project structure
- **mcp__serena__get_symbols_overview**: Understand existing code
- **mcp__serena__find_symbol**: Locate specific functions/classes
- **mcp__serena__replace_symbol_body**: Modify existing code
- **mcp__serena__insert_after_symbol**: Add new functionality
- **mcp__serena__write_memory**: Capture learning and patterns

### With Playwright MCP:
- **mcp__playwright__browser_navigate**: Test functionality
- **mcp__playwright__browser_take_screenshot**: Verify UI
- **mcp__playwright__browser_snapshot**: Accessibility testing
- **mcp__playwright__browser_console_messages**: Debug issues

### With IDE MCP:
- **mcp__ide__getDiagnostics**: TypeScript validation
- **mcp__ide__executeCode**: Run test scenarios

This implementation provides a complete, working BMAD orchestration system that leverages all available MCP capabilities for automated epic execution.