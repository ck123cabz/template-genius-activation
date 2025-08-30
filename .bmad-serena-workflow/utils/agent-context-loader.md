# Agent Context Loading Strategy

## Purpose
Define exactly what context each BMAD agent needs to load for optimal performance without context bloat.

## Context Loading Patterns

### SM Agent (Scrum Master)
```yaml
sm_context:
  always_load:
    - current_epic: "docs/prd/epic-{n}.md"
    - epic_stories_list: "docs/stories/epic-{n}-*.md"
    - previous_story_notes: "last_completed_story.md"
    - story_template: ".bmad-core/templates/story-tmpl.yaml"
    - iterative_learning_context:
      - dev_agent_records: "previous_story_dev_section"
      - qa_findings: "previous_story_qa_section"
      - architectural_decisions: "previous_story_decisions"
  
  conditional_load:
    - if_brownfield:
      - "docs/architecture/existing-system.md"
      - ".serena/memories/legacy_patterns.md"
    - if_high_risk:
      - "docs/qa/assessments/*-risk-*.md"
      - "docs/architecture/security-guidelines.md"
  
  never_load:
    - implementation_details
    - test_files
    - node_modules
```

### Dev Agent (Developer)
```yaml
dev_context:
  always_load:
    - current_story: "docs/stories/story-{n}.md"
    - coding_standards: "docs/architecture/coding-standards-and-conventions.md"
    - tech_stack: "docs/architecture/tech-stack-alignment.md"
    - source_tree: "docs/architecture/source-tree-integration.md"
    - recent_implementations: ".bmad-core/context/recent-implementations.json"
  
  conditional_load:
    - if_frontend_story:
      - "components/shared/ui/*.tsx"  # UI component examples
      - "docs/architecture/ui-patterns.md"
    - if_backend_story:
      - "lib/services/*.ts"  # Service patterns
      - "docs/architecture/api-design.md"
    - if_database_story:
      - "prisma/schema.prisma"
      - "docs/architecture/data-model.md"
  
  serena_integration:
    - load_symbols_only: true  # Use find_symbol instead of full files
    - lazy_load_bodies: true   # Only load function bodies when needed
    - use_memory_system: true  # Leverage Serena memories
```

### QA Agent (Quality Architect)
```yaml
qa_context:
  always_load:
    - current_story: "docs/stories/story-{n}.md"
    - implementation_summary: ".bmad-core/context/dev-context.json"
    - test_results: "test-results.json"
    - quality_gates: ".bmad-core/templates/qa-gate-tmpl.yaml"
  
  conditional_load:
    - if_high_risk:
      - "docs/qa/assessments/*-risk-*.md"
      - "docs/architecture/security-requirements.md"
    - if_performance_critical:
      - "performance-baselines.json"
      - "docs/architecture/performance-targets.md"
    - if_integration_heavy:
      - "docs/architecture/integration-contracts.md"
      - "api-specifications/*.yaml"
  
  never_load:
    - full_source_files  # Use diffs instead
    - node_modules
    - build_artifacts
```

## Dynamic Context Loading Function

```typescript
async function loadAgentContext(agentType: string, storyContext: any) {
  const contextLoader = {
    sm: loadSMContext,
    dev: loadDevContext,
    qa: loadQAContext
  };
  
  // Base context for all agents
  const baseContext = {
    epic: await loadEpicSummary(),
    projectMemories: await loadRelevantMemories(agentType),
    gitStatus: await getGitStatus(),
    currentBranch: await getCurrentBranch()
  };
  
  // Agent-specific context
  const agentContext = await contextLoader[agentType](storyContext);
  
  // Merge and validate
  const fullContext = {
    ...baseContext,
    ...agentContext,
    contextSize: calculateTokenCount(agentContext),
    loadedAt: new Date().toISOString()
  };
  
  // Prevent context bloat
  if (fullContext.contextSize > MAX_CONTEXT_TOKENS[agentType]) {
    return await pruneContext(fullContext, agentType);
  }
  
  return fullContext;
}
```

## Context Pruning Strategy

```typescript
async function pruneContext(context: any, agentType: string) {
  const priorities = {
    sm: ['current_epic', 'story_template', 'previous_notes'],
    dev: ['current_story', 'coding_standards', 'recent_implementations'],
    qa: ['implementation_summary', 'test_results', 'quality_gates']
  };
  
  // Keep high-priority items
  const pruned = {};
  for (const key of priorities[agentType]) {
    if (context[key]) {
      pruned[key] = context[key];
    }
  }
  
  // Add as much optional context as fits
  const remaining = MAX_CONTEXT_TOKENS[agentType] - calculateTokenCount(pruned);
  // ... add optional items that fit
  
  return pruned;
}
```

## Serena-Specific Optimizations

```typescript
// Use Serena's symbol navigation instead of loading full files
async function loadCodeContext(storyType: string) {
  if (storyType === 'frontend') {
    // Don't load entire component files
    const symbols = await mcp__serena__find_symbol({
      name_path: 'Dashboard',
      depth: 1,  // Just method signatures
      include_body: false
    });
    return symbols;
  }
  
  // Similar for other story types...
}
```

## Context Caching

```yaml
caching_strategy:
  cache_location: ".bmad-core/cache/"
  cache_duration: 
    project_structure: 3600000  # 1 hour
    coding_standards: 86400000  # 24 hours
    recent_implementations: 600000  # 10 minutes
  
  invalidation_triggers:
    - file_modifications
    - branch_switch
    - epic_completion
    - manual_refresh
```