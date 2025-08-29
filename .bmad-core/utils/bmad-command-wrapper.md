# BMAD Epic Orchestrator - Command Integration

This file provides the integration between the `/bmad-execute-epic` command and the orchestration system.

## Command Handler

When the `/bmad-execute-epic` command is invoked, execute this workflow:

### Phase 1: Setup and Validation

```typescript
// 1. Load orchestration configuration
const config = await loadBmadConfiguration();

// 2. Validate prerequisites
await validatePrerequisites();

// 3. Parse command arguments
const { epicNumber, options } = parseCommandArgs();
```

### Phase 2: Epic Execution Orchestration

```typescript
// 4. Create orchestrator instance
const orchestrator = new BmadEpicOrchestrator(process.cwd());

// 5. Execute epic with proper error handling
try {
  const result = await orchestrator.executeBmadEpic(epicNumber, options);
  
  if (result.success) {
    console.log('🎉 Epic execution completed successfully!');
    await displaySuccessReport(result);
  } else {
    console.log('❌ Epic execution failed');
    await displayFailureReport(result);
  }
  
  return result;
} catch (error) {
  console.error('💥 Critical error:', error);
  await handleCriticalError(error);
  return { success: false, error: error.message };
}
```

### Phase 3: Sub-Agent Integration

For each sub-agent execution, use Claude Code's Task tool:

```typescript
// SM Agent Execution
const smResult = await Task({
  subagent_type: 'general-purpose',
  description: 'BMAD SM Agent: Story Drafting',
  prompt: generateSMAgentPrompt(story, epic, architecture)
});

// Dev Agent Execution with Serena Integration
const devResult = await Task({
  subagent_type: 'general-purpose', 
  description: 'BMAD Dev Agent: Implementation',
  prompt: generateDevAgentPrompt(story, architecture) + `

SERENA MCP CAPABILITIES AVAILABLE:
Use these tools for implementation:
- mcp__serena__find_symbol: Navigate existing code
- mcp__serena__replace_symbol_body: Modify code functions/classes
- mcp__serena__insert_after_symbol: Add new code
- mcp__playwright__browser_navigate: Test implementation
- mcp__playwright__browser_take_screenshot: Verify UI

WORKFLOW:
1. Use find_symbol to understand existing codebase
2. Implement required functionality using Serena editing tools
3. Test with Playwright MCP for validation
4. Commit changes with proper BMAD story references`
});

// QA Agent Execution
const qaResult = await Task({
  subagent_type: 'general-purpose',
  description: 'BMAD QA Agent: Quality Review', 
  prompt: generateQAAgentPrompt(story, implementation, testResults)
});
```

## Command Functions

### Load BMAD Configuration

```typescript
function loadBmadConfiguration() {
  const configPath = '.bmad-core/epic-orchestration.yaml';
  if (!existsSync(configPath)) {
    throw new Error('BMAD configuration not found. Run BMAD setup first.');
  }
  return yaml.load(readFileSync(configPath, 'utf8'));
}
```

### Validate Prerequisites

```typescript
async function validatePrerequisites() {
  const required = [
    'docs/prd.md',
    'docs/architecture.md', 
    '.bmad-core/core-config.yaml'
  ];
  
  for (const file of required) {
    if (!existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  
  // Check Serena MCP availability
  try {
    await mcp__serena__check_onboarding_performed();
  } catch (error) {
    throw new Error('Serena MCP not available. Check MCP server status.');
  }
}
```

### Generate Agent Prompts

```typescript
function generateSMAgentPrompt(story, epic, architecture) {
  return `You are Bob, the BMAD Scrum Master. Create a detailed, actionable story.

EPIC CONTEXT:
${JSON.stringify(epic, null, 2)}

STORY TO DEVELOP:
${JSON.stringify(story, null, 2)}

ARCHITECTURE CONTEXT:
${Object.keys(architecture).map(key => `${key}:\n${architecture[key]}`).join('\n\n')}

TASK:
1. Read the epic requirements and understand the business context
2. Create detailed user story following Template Genius patterns
3. Include comprehensive acceptance criteria
4. Add specific dev notes for AI implementation
5. Validate against BMAD story-draft-checklist
6. Mark story status as "Approved"

OUTPUT FORMAT:
Return a complete story markdown file that includes:
- Story ID and title
- User story format ("As a... I want... so that...")
- Detailed acceptance criteria
- Dev implementation notes
- Testing requirements
- Status: Approved`;
}

function generateDevAgentPrompt(story, architecture) {
  return `You are a BMAD Development Agent with Serena MCP capabilities.

STORY TO IMPLEMENT:
${JSON.stringify(story, null, 2)}

ARCHITECTURE GUIDELINES:
${Object.keys(architecture).map(key => `${key}:\n${architecture[key]}`).join('\n\n')}

IMPLEMENTATION TASK:
1. Use mcp__serena__find_symbol to understand existing codebase structure
2. Implement the story requirements following Next.js 15 and TypeScript patterns
3. Create components in app/components following existing patterns
4. Use mcp__serena__replace_symbol_body or insert_after_symbol for code changes
5. Test implementation using mcp__playwright__browser_* tools
6. Run validation: npm run lint && npm run typecheck
7. Commit changes with format: "feat(story-${story.id}): ${story.title} [BMAD-${story.id}]"

SERENA INTEGRATION:
- Navigate code with symbol search before implementing
- Edit files using Serena's precise editing tools
- Test UI changes with Playwright screenshots
- Follow Template Genius coding conventions

OUTPUT:
Provide implementation summary with:
- Files created/modified
- Test results and screenshots
- Validation command results
- Commit hash and message`;
}

function generateQAAgentPrompt(story, implementation, testResults) {
  return `You are a BMAD Quality Assurance Agent reviewing implementation.

STORY REQUIREMENTS:
${JSON.stringify(story, null, 2)}

IMPLEMENTATION DETAILS:
${JSON.stringify(implementation, null, 2)}

TEST RESULTS:
${JSON.stringify(testResults, null, 2)}

QUALITY REVIEW TASK:
1. Verify all acceptance criteria are met
2. Check code quality and TypeScript compliance
3. Validate test coverage and functionality
4. Review security and performance considerations
5. Check Template Genius coding standards compliance
6. Assess overall implementation quality

QUALITY GATE LEVELS:
- PASS: All criteria met, ready for production
- CONCERNS: Minor issues that should be addressed
- FAIL: Significant issues that must be fixed
- WAIVED: Issues noted but accepted for delivery

OUTPUT:
Provide quality gate decision with:
- Gate level: PASS/CONCERNS/FAIL/WAIVED
- Detailed assessment of each acceptance criteria
- Code quality score (1-10)
- Test coverage analysis
- Specific issues found (if any)
- Recommendations for improvement`;
}
```

## Error Handling

```typescript
async function handleCriticalError(error) {
  console.error('🚨 Critical BMAD Orchestrator Error:', error);
  
  // Save error context for debugging
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    context: process.cwd(),
    command: 'bmad-execute-epic'
  };
  
  writeFileSync('.bmad-core/error-log.json', JSON.stringify(errorLog, null, 2));
  
  console.log('💾 Error details saved to .bmad-core/error-log.json');
  console.log('🔧 Check configuration and try again');
}
```

## Success/Failure Reporting

```typescript
async function displaySuccessReport(result) {
  console.log('\n🎉 EPIC EXECUTION SUCCESS REPORT');
  console.log('================================');
  console.log(`Epic: ${result.epic_id}`);
  console.log(`Stories: ${result.successful_stories}/${result.total_stories} completed`);
  console.log(`Duration: ${Math.round(result.total_duration / 60000)} minutes`);
  console.log(`Quality Gates: ${result.quality_summary.pass_count} PASS, ${result.quality_summary.concerns_count} CONCERNS`);
  
  if (result.next_actions?.length > 0) {
    console.log('\n📋 Next Actions:');
    result.next_actions.forEach((action, i) => {
      console.log(`${i + 1}. ${action}`);
    });
  }
}

async function displayFailureReport(result) {
  console.log('\n❌ EPIC EXECUTION FAILURE REPORT');
  console.log('=================================');
  console.log(`Epic: ${result.epic_id || 'Unknown'}`);
  console.log(`Error: ${result.error || 'Unknown error'}`);
  
  if (result.checkpoint) {
    console.log(`📍 Checkpoint available for resume`);
    console.log(`🔄 Run: /bmad-execute-epic ${result.epic_id} --resume-from ${Object.keys(result.checkpoint).pop()}`);
  }
}
```

This wrapper integrates the orchestration system with Claude Code's capabilities while maintaining the BMAD workflow structure.