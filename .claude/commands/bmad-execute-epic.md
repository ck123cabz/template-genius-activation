# /bmad-execute-epic Command (Enhanced)

When this command is used, orchestrate the complete BMAD development cycle for an epic using automated sub-agents with proper context management, git branching, and state recovery.

## COMMAND EXECUTION

When `/bmad-execute-epic` is invoked, execute this workflow:

### Step 1: Validate Prerequisites and Parse Arguments
```typescript
// Parse command arguments
const args = parseArgs(userInput); // e.g., "1", "--dry-run", etc.
const epicNumber = args.epicNumber;
const options = args.options;

// Validate prerequisites
await mcp__serena__check_onboarding_performed();
await validateBmadPrerequisites();
```

### Step 2: Load Epic and Create Execution Plan
```typescript
// Load epic from PRD
const epic = await loadEpicFromPRD(epicNumber);
const architecture = await loadArchitectureContext();
const executionPlan = await createIterativeExecutionPlan(epic);

console.log(`🎭 Executing Epic ${epic.number}: ${epic.title}`);
console.log(`📋 ${executionPlan.storyCount} stories to execute iteratively`);

// Human approval if configured
if (config.human_approval.pre_epic) {
  const proceed = await promptUser(`Execute Epic ${epic.number}? (y/n)`);
  if (!proceed) return { cancelled: true };
}
```

### Step 3: Execute Iterative Story Cycle
```typescript
for (let storyNumber = 1; storyNumber <= executionPlan.storyCount; storyNumber++) {
  console.log(`\n🔄 Story Cycle ${storyNumber}/${executionPlan.storyCount}`);
  
  // STEP 3A: SM Agent - Create Story with Previous Context
  const smResult = await Task({
    subagent_type: 'general-purpose',
    description: 'BMAD SM Agent: Iterative Story Creation',
    prompt: generateSMPrompt(epic, storyNumber, previousStoryLearnings)
  });
  
  // STEP 3B: Dev Agent - Implement with Serena MCP
  const devResult = await Task({
    subagent_type: 'general-purpose', 
    description: 'BMAD Dev Agent: Implementation',
    prompt: generateDevPrompt(smResult.story, architecture, serenaCapabilities)
  });
  
  // STEP 3C: QA Agent - Review and Gate
  const qaResult = await Task({
    subagent_type: 'general-purpose',
    description: 'BMAD QA Agent: Quality Review',
    prompt: generateQAPrompt(devResult.implementation, smResult.story)
  });
  
  // STEP 3D: Save Complete Story File
  await saveCompleteStoryFile(epic, storyNumber, {
    smResult, devResult, qaResult, previousStoryLearnings
  });
  console.log(`📁 Saved: docs/stories/story-epic-${epic.number}-${storyNumber}.md`);
  
  // STEP 3E: Extract Learnings for Next Story
  previousStoryLearnings = await extractLearningsFromStory(
    devResult, qaResult, storyNumber
  );
  
  // Update progress
  await updateEpicProgress(epic, storyNumber, qaResult);
}
```

### Step 4: Epic Completion and Reporting
```typescript
// Generate completion report
const report = await generateEpicCompletionReport(epic, results);

// Update Serena memories
await mcp__serena__write_memory({
  memory_name: `epic-${epic.number}-learnings`,
  content: report.learnings
});

// Display results
console.log(`\n🎉 Epic ${epic.number} Complete!`);
console.log(`✅ ${report.successfulStories}/${report.totalStories} stories completed`);
console.log(`⏱️  Duration: ${report.duration} minutes`);

return report;
```

### Helper Functions Used
```typescript
// Generate prompts for each agent type
function generateSMPrompt(epic, storyNumber, previousLearnings) {
  return `You are Bob, the BMAD Scrum Master creating Story ${storyNumber} for ${epic.title}.

EPIC CONTEXT: ${epic.requirements}
PREVIOUS STORY LEARNINGS: ${previousLearnings}

Create the next story building on previous work. Include:
- Components/patterns established in previous stories
- Architecture decisions to maintain
- Regression test requirements

Use create-next-story task and story template.`;
}

function generateDevPrompt(story, architecture, serenaCapabilities) {
  return `You are a BMAD Dev Agent implementing ${story.id}.

STORY REQUIREMENTS: ${story.requirements}
SERENA CAPABILITIES AVAILABLE:
- mcp__serena__find_symbol: Navigate existing code
- mcp__serena__replace_symbol_body: Modify code
- mcp__playwright__browser_navigate: Test implementation

WORKFLOW:
1. Use find_symbol to understand existing codebase
2. Implement following Template Genius patterns
3. Test with Playwright MCP
4. Commit with BMAD story reference
5. Update story Dev Agent Record`;
}

function generateQAPrompt(implementation, story) {
  return `You are a BMAD QA Agent reviewing ${story.id}.

IMPLEMENTATION: ${implementation.summary}
STORY REQUIREMENTS: ${story.requirements}

REVIEW PROCESS:
1. Validate all acceptance criteria
2. Check TypeScript compliance
3. Test functionality with Playwright
4. Assess regression impact
5. Provide quality gate: PASS/CONCERNS/FAIL

Include specific issues and recommendations.`;
}
```

## Command Overview

**Purpose**: Automate the SM → Dev → QA workflow cycle for a complete epic using Claude Code sub-agents with production-ready orchestration.

**Activation**: 
- `/bmad-execute-epic [epic-number]` - Execute specific epic
- `/bmad-execute-epic` - Interactive epic selection
- `/bmad-execute-epic [epic-number] --dry-run` - Preview execution plan
- `/bmad-execute-epic [epic-number] --resume-from [story-id]` - Resume from checkpoint

## Pre-requisites

Before executing this command, ensure:
- ✅ PRD has been created and sharded (`docs/prd.md` and `docs/prd/epic-*.md`)
- ✅ Architecture has been created and sharded (`docs/architecture.md` and `docs/architecture/*.md`)
- ✅ Stories exist for the epic (`docs/stories/story-*.md`)
- ✅ Core configuration exists (`.bmad-core/core-config.yaml`)
- ✅ Serena MCP is active and project memories are loaded

## Orchestration Workflow

### Phase 1: Epic Analysis & Planning
```yaml
epic_analysis:
  steps:
    1. Load epic from docs/prd/epic-{n}.md
    2. Identify all stories for the epic
    3. Load relevant architecture sections
    4. Create execution plan with story dependencies
    5. Identify risk levels and testing requirements
  output: Epic execution plan with story sequence
```

### Phase 2: Automated Story Cycle

For each story in the epic, orchestrate:

#### Step 1: SM Sub-Agent (Story Drafting)
```yaml
sm_subagent:
  role: Create detailed, actionable story from epic
  inputs:
    - Epic requirements
    - Previous story notes (if any)
    - Architecture context
  tasks:
    - Execute /sm *draft command
    - Validate with story-draft-checklist
    - Set story status to "Approved"
  output: Ready-to-implement story with complete dev notes
```

#### Step 2: Dev Sub-Agent (Implementation)
```yaml
dev_subagent:
  role: Implement story with Serena's capabilities
  inputs:
    - Approved story from SM
    - Architecture coding standards
    - Previous implementations
  tasks:
    - Read story requirements and dev notes
    - Implement using Serena MCP for code operations:
      * Symbol navigation for understanding
      * File editing for implementation
      * Playwright MCP for testing
    - Execute all validations
    - Update story file sections (Dev Agent Record)
    - Commit changes with BMAD story references
  output: Implemented code with tests, ready for review
```

#### Step 3: QA Sub-Agent (Quality Review)
```yaml
qa_subagent:
  role: Comprehensive quality assessment
  inputs:
    - Implemented story with code changes
    - Test results from Dev phase
    - Risk profile from epic analysis
  tasks:
    - Execute /qa *review command
    - Perform NFR assessment if high-risk
    - Create quality gate decision
    - Document findings in story file
  output: Quality gate (PASS/CONCERNS/FAIL) with detailed assessment
```

### Phase 3: Epic Completion & Handoff

#### Completion Validation
```yaml
epic_completion:
  validations:
    - All stories implemented and reviewed
    - All quality gates addressed
    - Integration tests passing
    - Documentation updated
  outputs:
    - Epic completion report
    - Merged feature branch
    - Updated project memories
    - Next epic recommendations
```

## Command Implementation

### Main Orchestrator Function
```typescript
async function executeBmadEpic(epicNumber?: string) {
  // Phase 1: Setup and Analysis
  const epic = await loadEpic(epicNumber);
  const stories = await identifyEpicStories(epic);
  const architecture = await loadRelevantArchitecture(epic);
  const executionPlan = await createExecutionPlan(stories, architecture);
  
  // Phase 2: Story Cycle Automation
  for (const story of executionPlan.stories) {
    console.log(`\n🔄 Processing ${story.id}: ${story.title}`);
    
    // SM Sub-agent
    const draftedStory = await executeSubAgent({
      type: 'sm',
      task: 'draft-story',
      inputs: { story, epic, architecture, previousStoryNotes }
    });
    
    // Dev Sub-agent with Serena Integration
    const implementation = await executeSubAgent({
      type: 'dev',
      task: 'implement-story',
      inputs: { 
        story: draftedStory,
        serenaContext: await loadSerenaContext(),
        architecture
      },
      serenaIntegration: {
        useSymbolNavigation: true,
        useFileEditing: true,
        usePlaywrightTesting: true,
        autoCommit: true
      }
    });
    
    // QA Sub-agent
    const qaResult = await executeSubAgent({
      type: 'qa',
      task: 'review-story',
      inputs: {
        story: implementation.story,
        changes: implementation.changes,
        testResults: implementation.tests
      }
    });
    
    // Handle QA feedback loop
    if (qaResult.gate !== 'PASS') {
      await handleQAFeedback(qaResult, implementation);
    }
    
    // Update progress
    await updateEpicProgress(epic, story, qaResult);
  }
  
  // Phase 3: Completion
  const report = await generateEpicCompletionReport(epic, stories);
  await updateProjectMemories(epic, report);
  
  return report;
}
```

### Sub-Agent Execution Pattern
```typescript
async function executeSubAgent(config: SubAgentConfig) {
  const agent = await Task({
    subagent_type: 'general-purpose',
    description: `BMAD ${config.type.toUpperCase()} Agent: ${config.task}`,
    prompt: generateAgentPrompt(config)
  });
  
  // For Dev agent, integrate Serena capabilities
  if (config.type === 'dev' && config.serenaIntegration) {
    agent.capabilities = {
      ...agent.capabilities,
      serena: {
        symbolNavigation: mcp__serena__find_symbol,
        fileEditing: mcp__serena__multi_edit,
        testing: mcp__playwright__browser_*,
        gitIntegration: automated_git_workflow
      }
    };
  }
  
  return await agent.execute();
}
```

## Usage Examples

### Example 1: Execute Specific Epic
```bash
/bmad-execute-epic 3
# Executes all stories for Epic 3 automatically
# Output: Complete implementation with quality gates
```

### Example 2: Interactive Epic Selection
```bash
/bmad-execute-epic
# System prompts:
# Available epics:
# 1. User Authentication & Authorization
# 2. Dashboard Core Features  
# 3. Payment Processing
# Select epic (1-3): 2
```

### Example 3: Partial Epic Execution
```bash
/bmad-execute-epic 2 --stories 2.1,2.3
# Executes only specific stories from Epic 2
```

## Integration Points

### With Serena MCP
- **Symbol Navigation**: Understanding existing code structure
- **File Operations**: Creating and modifying code files
- **Testing**: Playwright MCP for browser automation
- **Git Workflow**: Automated commits and PR creation
- **Memory System**: Context preservation and recovery

### With BMAD Agents
- **SM Agent**: Story drafting and validation
- **Dev Agent**: Implementation patterns and constraints
- **QA Agent**: Quality assessment and gate decisions
- **Architect**: Technical guidance and patterns
- **PM/PO**: Requirements and acceptance criteria

## Quality Controls

### Automated Checkpoints
1. **Story Draft Validation**: SM checklist before implementation
2. **Implementation Testing**: Dev validations and test coverage
3. **Quality Gates**: QA comprehensive review
4. **Integration Testing**: Cross-story compatibility
5. **Epic Completion**: All acceptance criteria met

### Human Override Points
- **Pre-execution Review**: Confirm epic ready for automation
- **Story Approval**: Optional manual review before implementation
- **QA Gate Override**: Handle FAIL gates manually if needed
- **Final Approval**: Epic completion sign-off

## Error Handling

### Failure Recovery
```yaml
error_handling:
  story_draft_failure:
    - Log detailed error context
    - Attempt with additional architecture context
    - Escalate to human if repeated failure
  
  implementation_failure:
    - Preserve partial implementation
    - Create detailed debug log
    - Attempt targeted fix with QA feedback
    - Rollback if critical failure
  
  qa_gate_failure:
    - Implement QA recommendations
    - Re-execute validation
    - Escalate if quality threshold not met
```

## Benefits

### Automation Benefits
- ✅ **Eliminates Manual Handoffs**: No need to manually invoke each agent
- ✅ **Consistent Quality**: Same process for every story
- ✅ **Faster Delivery**: Parallel story execution where possible
- ✅ **Complete Traceability**: Full audit trail of decisions
- ✅ **Learning System**: Each epic execution improves the next

### Developer Experience
- ✅ **Single Command**: One command executes entire epic
- ✅ **Progress Visibility**: Real-time status updates
- ✅ **Intervention Points**: Can pause and adjust as needed
- ✅ **Quality Assurance**: Built-in validation at every step

## Configuration

### Epic Execution Settings
```yaml
# .bmad-core/epic-execution.yaml
execution:
  parallel_stories: false  # Sequential by default
  auto_commit: true       # Automatic Git commits
  qa_threshold: PASS      # Minimum quality gate
  human_approval: 
    pre_execution: true   # Confirm before starting
    post_story: false     # Auto-proceed between stories
    post_epic: true       # Confirm epic completion
  
  serena_integration:
    use_memory_system: true
    use_symbol_navigation: true
    use_playwright_testing: true
    auto_pr_creation: true
```

## Summary

The `/bmad-execute-epic` command transforms Serena from an implementation tool into a **complete BMAD orchestrator**, automating the entire development cycle while maintaining quality gates and traceability. This creates a seamless flow from planning to deployed code with minimal human intervention, while preserving the option for oversight and intervention when needed.

**Serena becomes the conductor of the BMAD symphony**, coordinating all agents to deliver complete epics automatically! 🎭