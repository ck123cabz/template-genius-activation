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
```yaml
context_to_provide:
- epic_requirements: "docs/prd/epic-{number}.md"
- architecture_guidelines: "docs/architecture/*.md"
- previous_learnings: "from previous story extraction"
- existing_components: "patterns to reuse"

invoke_sm_agent:
  task: create_single_story
  output_file: "docs/stories/story-epic-{epic}-{number}.md"
  requirements:
    - include_regression_test_requirements
    - reference_existing_components
    - follow_story_template: ".bmad-core/templates/story-tmpl.yaml"
```

#### Step A1: Verify SM Agent Compliance (MANDATORY CHECKPOINT)
```yaml
execute_task: "mandatory-checkpoint-system.md"
checkpoint: "A1"
parameters:
  story_file_path: "docs/stories/story-epic-{epic}-{number}.md"
  agent_type: "sm"
  verification_stage: "post_sm"

CRITICAL_COMPLIANCE_CHECK:
  - status_change: "DRAFT -> APPROVED" (EXACT MATCH REQUIRED)
  - story_section_complete: "As a [role], I want [action] so that [benefit] format"
  - acceptance_criteria_numbered: "3+ testable criteria"
  - tasks_subtasks_hierarchical: "Detailed breakdown with AC references"
  - dev_notes_comprehensive: "Architecture context + testing requirements"
  - template_compliance: "100% adherence to story-tmpl.yaml"
  - no_placeholder_content: "No TODO, TBD, or incomplete sections"

HALT_ON_NON_COMPLIANT: true
MAX_RETRIES: 2
ESCALATION_ON_FAILURE: "Human intervention after 2 retry failures"

on_non_compliant:
  action: HALT_ORCHESTRATION_AND_HANDBACK
  specific_failures_provided: true
  remediation_instructions_detailed: true

on_compliant:
  action: proceed_to_dev_phase
```

#### Step B: Dev Agent - Implement Story
```yaml
context_to_provide:
- story_file_path: "docs/stories/story-epic-{epic}-{number}.md"
- architecture_patterns: "docs/architecture/*.md"
- previous_implementation_notes: "from learning extraction"

invoke_dev_agent:
  task: develop_story
  requirements:
    - read_story_requirements
    - implement_using_bmad_workflow
    - update_dev_agent_record_in_story_file
    - run_validations: [lint, typecheck, tests]
    - commit_with_bmad_story_reference
  output: "updated story file with implementation details"
```

#### Step B1: Verify Dev Agent Compliance (CRITICAL CHECKPOINT - PREVENTS STORY 2.3 FAILURE)
```yaml
execute_task: "mandatory-checkpoint-system.md"
checkpoint: "B1"
parameters:
  story_file_path: "docs/stories/story-epic-{epic}-{number}.md"
  agent_type: "dev"
  verification_stage: "post_dev"

CRITICAL_COMPLIANCE_CHECK:
  checkbox_verification: 
    scan_command: "grep -n '- \[ \]' story_file"
    expected_result: "ZERO unchecked boxes"
    failure_condition: "ANY [ ] found"
    CRITICAL_RULE: "ZERO tolerance for unchecked boxes if status READY FOR REVIEW"
    
  status_change: "APPROVED -> READY FOR REVIEW" (ONLY after all checkboxes [x])
  
  dev_agent_record_complete: 
    - agent_model_used: "Must specify model name/version"
    - debug_log_references: "Must document debug logs or state 'None'"
    - completion_notes: "Must document implementation approach"
    - file_list: "Must list ALL created/modified/deleted files"
    
  implementation_verification:
    - file_existence_check: "Verify File List files actually exist"
    - code_quality_check: "Zero TypeScript/lint errors"
    - test_completion_check: "Tests pass if specified"

HALT_ON_ANY_UNCHECKED_CHECKBOX: true
MAX_RETRIES: 2  
ESCALATION_ON_FAILURE: "Human intervention after 2 retry failures"

on_non_compliant:
  action: HALT_ORCHESTRATION_AND_HANDBACK_TO_DEV
  failure_message: |
    CRITICAL FAILURE - ORCHESTRATION HALTED
    
    Dev Agent compliance verification FAILED. Story 2.3 failure prevention activated.
    
    MISSING REQUIREMENTS:
    - All task/subtask checkboxes must be [x] before status READY FOR REVIEW
    - Dev Agent Record section must be 100% complete
    - File List must document all implementation files
    
    SPECIFICATION REFERENCE: .bmad-core/agents/dev.md lines 59-67
    
    Complete ALL task checkboxes and Dev Agent Record before proceeding.
    
on_compliant:
  action: proceed_to_qa_phase
  log: "Dev Agent checkpoint passed - all checkboxes verified [x]"
```

#### Step C: QA Agent - Review Implementation
```yaml
context_to_provide:
- story_file_with_dev_implementation: "docs/stories/story-epic-{epic}-{number}.md"
- test_results_from_dev_phase: "validation output"
- risk_profile: "based on story type"

invoke_qa_agent:
  task: review_story_implementation
  requirements:
    - review_implementation_against_requirements
    - assess_code_quality_and_test_coverage
    - create_quality_gate_decision
    - update_qa_results_in_story_file
    - create_qa_gate_file: "docs/qa/gates/{epic}.{story}-{slug}.yml"
  output: "quality gate decision (PASS/CONCERNS/FAIL/WAIVED)"
```

#### Step C1: Verify QA Agent Compliance (MANDATORY CHECKPOINT)
```yaml
execute_task: "mandatory-checkpoint-system.md"
checkpoint: "C1"
parameters:
  story_file_path: "docs/stories/story-epic-{epic}-{number}.md"
  agent_type: "qa"
  verification_stage: "post_qa"

CRITICAL_COMPLIANCE_CHECK:
  qa_results_section:
    comprehensive_review: "Must address ALL acceptance criteria individually"
    quality_score: "Must provide numerical score (1-10)"
    gate_decision: "Must provide PASS/CONCERNS/FAIL/WAIVED"
    evidence_documented: "Screenshots, test results, or validation proof"
    
  process_compliance_validation:
    dev_checkbox_verification: "QA must verify Dev completed all checkboxes [x]"  
    documentation_accuracy: "Story status must match actual implementation state"
    workflow_integrity: "Previous agents must have followed specifications"
    
  gate_file_creation:
    location: "docs/qa/gates/{epic}.{story}-{slug}.yml"
    yaml_valid: "Must be valid YAML with proper structure"
    decision_consistency: "Gate file must match QA Results decision"
    
  change_log_update:
    entry_required: "QA completion with timestamp and gate decision"
    format_compliance: "Standard change log format required"

HALT_ON_NON_COMPLIANT: true
MAX_RETRIES: 2
ESCALATION_ON_FAILURE: "Human intervention after 2 retry failures"

on_non_compliant:
  action: HALT_ORCHESTRATION_AND_HANDBACK_TO_QA
  failure_message: |
    CRITICAL FAILURE - ORCHESTRATION HALTED
    
    QA Agent compliance verification FAILED.
    
    MISSING REQUIREMENTS:
    - QA Results section must be comprehensive with ALL AC addressed
    - Quality gate decision must be clear (PASS/CONCERNS/FAIL/WAIVED)
    - Gate file must be created in docs/qa/gates/ directory
    - Must verify Dev Agent completed all checkboxes before review
    
    SPECIFICATION REFERENCE: .bmad-core/agents/qa.md lines 60-63
    
    Complete QA Results section and create gate file before proceeding.

on_concerns_or_fail:
  action: hand_back_to_dev_agent_with_qa_feedback
  execute: dev_agent_review_qa_fixes
  require_b1_re_verification: true  # Must re-pass Dev checkpoint after fixes

on_pass:
  action: proceed_to_learning_extraction
  log: "QA Agent checkpoint passed - comprehensive review completed"
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