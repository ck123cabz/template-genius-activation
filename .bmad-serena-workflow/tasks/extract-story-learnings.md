# extract-story-learnings

Extract key learnings from a completed story to inform the next story creation.

## Purpose
After each story is implemented and reviewed, extract patterns and learnings that should inform the creation of the next story in the epic.

## Input
- Completed story file with Dev Agent Record and QA Results sections filled
- Implementation commits and file changes
- Test results and coverage reports

## Process

### 1. Extract Implementation Details
From Dev Agent Record section:
- Components created or modified
- Architecture decisions made
- Patterns established (reusable across stories)
- Dependencies added or updated
- Testing approaches used

### 2. Extract Quality Insights
From QA Results section:
- Issues identified and resolved
- Code quality improvements made
- Test coverage gaps addressed
- Performance considerations noted

### 3. Extract Regression Requirements
- Breaking changes that affect other components
- New test requirements for future stories
- Integration points that need validation
- Compatibility concerns identified

### 4. Format Learnings for Next Story

**Maximum 2000 characters total**, focusing on:

```markdown
## Previous Story Learnings

### Established Components
- [Component name]: [Purpose and reuse guidance]
- [Pattern name]: [When to use and how]

### Architecture Decisions  
- [Decision]: [Rationale and implications]
- [Standard]: [To follow in subsequent work]

### Integration Points
- [System/API]: [How to integrate safely]
- [Dependency]: [Version constraints and usage]

### Regression Testing
- [Area]: [Must test when changing X]
- [Component]: [Known interaction effects]

### Implementation Notes
- [Pattern]: [Proven approach for similar work]
- [Gotcha]: [Common mistake to avoid]
```

## Output
Structured learnings object passed to SM agent for next story creation:

```yaml
story_learnings:
  components_available:
    - name: "UserService"
      purpose: "Client CRUD operations"
      location: "lib/services/user-service.ts"
      patterns: ["Repository pattern", "Error handling"]
  
  architecture_standards:
    - pattern: "Server Actions for mutations"
      rationale: "Type safety + validation"
      example: "createClient action in actions/client.ts"
  
  integration_requirements:
    - system: "Supabase client operations"
      auth_pattern: "Always check session before queries"
      error_handling: "Use try/catch with toast notifications"
  
  regression_focus:
    - area: "Client list updates"
      test_requirement: "Verify list refreshes after mutations"
      components_affected: ["ClientList", "ClientCard", "SearchFilter"]
  
  proven_patterns:
    - pattern: "Form validation with Zod + React Hook Form"
      implementation: "See client-creation-form.tsx"
      benefits: "Type safety + UX consistency"
  
  avoid_patterns:
    - antipattern: "Direct DOM manipulation"
      why: "Breaks React state management"
      better_approach: "Use React state + useEffect"
```

## Success Criteria
- Learnings are actionable for SM when creating next story
- Focus on reusability and regression prevention
- Capture both technical and process insights
- Stay within character limit while being comprehensive
- Format is easily parseable for next story context