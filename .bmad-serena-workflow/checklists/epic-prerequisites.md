# Epic Prerequisites Checklist

Use this checklist before executing any epic to ensure all prerequisites are met.

## Documentation Requirements

- [ ] **PRD exists and is complete**
  - Location: `docs/prd.md` or `docs/prd/index.md`
  - Contains business requirements and success criteria
  - User stories and acceptance criteria defined

- [ ] **PRD is sharded into epics**
  - Epic files exist: `docs/prd/epic-1.md`, `docs/prd/epic-2.md`, etc.
  - Each epic has clear scope and deliverables
  - Epic dependencies are documented

- [ ] **Architecture document exists**
  - Location: `docs/architecture.md` or `docs/architecture/index.md`
  - Technical approach is defined
  - Component architecture documented
  - Integration patterns specified

- [ ] **Architecture is detailed enough**
  - Data models defined
  - API contracts specified
  - Security considerations documented
  - Performance requirements noted

## BMAD System Requirements

- [ ] **Core BMAD agents available**
  - SM agent: `.bmad-core/agents/sm.md`
  - Dev agent: `.bmad-core/agents/dev.md`
  - QA agent: `.bmad-core/agents/qa.md`

- [ ] **BMAD core config exists**
  - File: `.bmad-core/core-config.yaml`
  - Project settings configured
  - Agent team definitions present

- [ ] **Expansion pack properly installed**
  - Epic orchestrator: `.bmad-serena-workflow/agents/epic-orchestrator.md`
  - Orchestration config: `.bmad-serena-workflow/epic-orchestration.yaml`
  - Required tasks and templates present

## Project Environment

- [ ] **Git repository initialized**
  - Clean working tree (no uncommitted changes)
  - Main/develop branch established
  - Branch protection rules configured (if applicable)

- [ ] **Development environment ready**
  - Dependencies installed (`pnpm install`)
  - Build system functional (`pnpm build`)
  - Test suite operational (`pnpm test`)
  - Linting configured (`pnpm lint`)

- [ ] **Serena MCP server active**
  - Serena MCP server running
  - Project onboarding completed
  - Memory system functional
  - Symbol navigation working

## Story Infrastructure

- [ ] **Stories directory exists**
  - Location: `docs/stories/`
  - Write permissions available
  - Consistent naming convention planned

- [ ] **Story templates available**
  - Template: `.bmad-core/templates/story-tmpl.yaml`
  - SM agent can access template
  - Template matches project needs

## Quality Gates Setup

- [ ] **QA infrastructure ready**
  - Test framework configured
  - Code coverage reporting functional
  - Quality standards documented
  - Gate criteria defined in orchestration config

- [ ] **CI/CD pipeline operational**
  - Automated tests run on commits
  - Build validation working
  - Deployment process documented (if applicable)

## Epic-Specific Validation

- [ ] **Target epic is well-defined**
  - Epic file exists: `docs/prd/epic-{number}.md`
  - Requirements are testable
  - Acceptance criteria are clear
  - Dependencies are resolved

- [ ] **Estimated story count reasonable**
  - Epic scope appropriate for automation
  - Stories can be created iteratively
  - Each story delivers value independently

- [ ] **Risk assessment completed**
  - Technical risks identified
  - Mitigation strategies planned
  - Rollback procedures defined

## Pre-Execution Checklist

- [ ] **User confirms readiness**
  - All prerequisites reviewed
  - Epic scope understood
  - Time commitment acknowledged
  - Quality expectations set

- [ ] **Backup and recovery**
  - Git repository backed up
  - Recovery procedures documented
  - Checkpoint strategy understood

## Success Criteria

All checkboxes must be marked [x] before epic execution can begin.

## Notes

Use this checklist by running:
```
*validate-prerequisites
```

The Epic Orchestrator will automatically verify these requirements and report any missing elements.