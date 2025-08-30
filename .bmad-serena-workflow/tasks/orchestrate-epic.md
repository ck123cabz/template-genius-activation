# orchestrate-epic

Execute a complete epic by orchestrating iterative SM→Dev→QA cycles with learning extraction between stories.

## Prerequisites
- PRD exists and is sharded into epics (docs/prd/epic-*.md)
- Architecture document exists (docs/architecture/*.md)
- Core BMAD agents are available (SM, Dev, QA)
- Git repository is initialized

## Task Workflow

### Phase 1: Epic Analysis & Planning
1. **Load Epic Context**
   - Read epic file from `docs/prd/epic-{number}.md`
   - Identify story count and requirements
   - Load relevant architecture sections
   - Create execution plan with estimated timeline

2. **Validate Prerequisites**
   - Confirm all required documents exist
   - Check git branch status
   - Verify Serena MCP is active
   - Display plan to user for approval

### Phase 2: Iterative Story Execution

FOR EACH STORY IN SEQUENCE (1, 2, 3...):

#### Step A: SM Agent - Create Next Story
```
Context to provide:
- Epic requirements from PRD
- Architecture guidelines
- Previous story learnings (if not first story)
- Existing components/patterns to reuse

Invoke SM agent to:
- Create single story file
- Include regression test requirements
- Reference existing components
- Output: docs/stories/story-epic-{epic}-{number}.md
```

#### Step B: Dev Agent - Implement Story
```
Context to provide:
- Story file path created by SM
- Architecture patterns to follow
- Previous implementation notes

Invoke Dev agent to:
- Read story requirements
- Implement using standard BMAD dev workflow
- Update Dev Agent Record in story file
- Run validations (lint, typecheck, tests)
- Commit with BMAD story reference
- Output: Updated story file with implementation details
```

#### Step C: QA Agent - Review Implementation
```
Context to provide:
- Story file with Dev implementation
- Test results from Dev phase
- Risk profile for story type

Invoke QA agent to:
- Review implementation against requirements
- Assess code quality and test coverage
- Create quality gate decision
- Update QA Results in story file
- Output: Quality gate (PASS/CONCERNS/FAIL)
```

#### Step D: Learning Extraction
```
Extract from completed story:
- Components created or modified
- Patterns established
- Architecture decisions made
- Issues encountered and solutions
- Testing approaches used

Format learnings for next story:
- Maximum 2000 characters
- Focus on reusable elements
- Include regression requirements
```

#### Step E: Progress Update
```
Display to user:
- Story {n}/{total} complete
- Quality gate result
- Key learnings extracted
- Next story preview
- Estimated time remaining
```

### Phase 3: Epic Completion

1. **Generate Completion Report**
   ```yaml
   epic_completion:
     epic_id: {number}
     title: {epic_title}
     stories_completed: {count}
     quality_gates: {pass_count/total}
     test_coverage: {percentage}
     duration: {minutes}
     files_modified: {count}
     key_patterns: [...]
     learnings: [...]
   ```

2. **Update Project Memory**
   - Write learnings to `.serena/memories/epic-{n}-learnings.md`
   - Update project overview with new capabilities
   - Document reusable patterns discovered

3. **Final Git Operations**
   - Ensure all changes committed
   - Create PR if configured
   - Update branch protection

## Agent Invocation Pattern

```typescript
// Example sub-agent invocation structure
const smAgent = await Task({
  subagent_type: 'general-purpose',
  description: 'BMAD SM: Create story {n} for epic {epic}',
  prompt: `
    CRITICAL: Load and activate the BMAD Scrum Master agent:
    
    1. Read file: .bmad-core/agents/sm.md
    2. Follow ALL activation-instructions in that file exactly
    3. Adopt the Bob persona defined in the agent file
    4. Load .bmad-core/core-config.yaml as specified
    
    CONTEXT FOR STORY CREATION:
    - Epic: {epic_requirements}
    - Previous learnings: {learnings}
    - Story number: {n}
    
    After proper activation, execute: *draft
    Save to: docs/stories/story-epic-{epic}-{n}.md
  `
});

// Dev Agent Invocation
const devAgent = await Task({
  subagent_type: 'general-purpose',
  description: 'BMAD Dev: Implement story {story_id}',
  prompt: `
    CRITICAL: Load and activate the BMAD Developer agent:
    
    1. Read file: .bmad-core/agents/dev.md
    2. Follow ALL activation-instructions in that file exactly
    3. Adopt the James persona defined in the agent file
    4. Load .bmad-core/core-config.yaml as specified
    
    STORY TO IMPLEMENT:
    - Story file: {story_path}
    - Architecture context: {architecture}
    
    After proper activation, execute: *develop-story {story_file}
  `
});

// QA Agent Invocation
const qaAgent = await Task({
  subagent_type: 'general-purpose',
  description: 'BMAD QA: Review story {story_id}',
  prompt: `
    CRITICAL: Load and activate the BMAD QA agent:
    
    1. Read file: .bmad-core/agents/qa.md
    2. Follow ALL activation-instructions in that file exactly
    3. Adopt the Quinn persona defined in the agent file
    4. Load .bmad-core/core-config.yaml as specified
    
    STORY TO REVIEW:
    - Story file: {story_path}
    - Implementation details: {implementation}
    
    After proper activation, execute: *review {story_file}
  `
});
```

## Error Handling

### Story Creation Failure
- Retry with additional context
- Provide more specific architecture guidance
- Escalate to user if repeated failure

### Implementation Failure
- Preserve partial implementation
- Create detailed error log
- Attempt targeted fix with QA feedback
- Rollback if critical failure

### QA Gate Failure
- For CONCERNS: Attempt auto-fix of minor issues
- For FAIL: Re-invoke Dev with QA feedback
- Maximum 2 retry attempts
- Escalate to user for manual intervention

## Checkpoints & Recovery

Create checkpoint after each story:
```yaml
checkpoint:
  epic: {number}
  completed_stories: [...]
  current_story: {number}
  git_branch: {branch}
  last_commit: {sha}
  timestamp: {iso_date}
```

Allow resume from checkpoint with:
- `*resume-epic`
- Restore context from checkpoint
- Continue from next story

## Success Criteria
- All stories implemented and reviewed
- All quality gates PASS or CONCERNS
- Test coverage meets threshold (80%+)
- No regression failures
- PR created with complete implementation

## Important Notes
- NEVER skip the iterative learning extraction
- ALWAYS enforce quality gates
- MAINTAIN story sequence (no parallel execution in v1)
- PRESERVE markdown formatting in handoffs
- UPDATE progress after each story