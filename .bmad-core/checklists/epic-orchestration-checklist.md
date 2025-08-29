# Epic Orchestration Pre-Flight Checklist

This checklist ensures all prerequisites are met before executing `/bmad-execute-epic`.

## Prerequisites Validation

### Planning Phase Completion
- [ ] PRD has been created (`/pm *create-prd`)
- [ ] PRD exists at `docs/prd.md`
- [ ] Architecture has been created (`/architect *create-full-stack-architecture`)
- [ ] Architecture exists at `docs/architecture.md`
- [ ] Stories have been sharded (`/po *shard-prd`)
- [ ] Story files exist in `docs/stories/`

### Epic Structure Validation
- [ ] Epic definition exists in `docs/prd/epic-{n}.md`
- [ ] All stories for epic are defined
- [ ] Story dependencies are clear
- [ ] Risk levels identified per story
- [ ] Acceptance criteria defined

### Development Environment
- [ ] Git repository initialized
- [ ] Clean working tree (no uncommitted changes)
- [ ] Dependencies installed (`pnpm install`)
- [ ] Development server can start (`pnpm dev`)
- [ ] Test suite passes (`pnpm test`)

### Serena MCP Integration
- [ ] Serena MCP is active
- [ ] Project memories are loaded
- [ ] Symbol navigation working
- [ ] File operations permitted
- [ ] Playwright available (if UI testing needed)

### Configuration Files
- [ ] `.bmad-core/core-config.yaml` exists
- [ ] `.bmad-core/epic-orchestration.yaml` configured
- [ ] Story templates available
- [ ] Agent personas accessible

## Execution Readiness

### Quality Gates Configuration
- [ ] Minimum quality gate defined (PASS/CONCERNS)
- [ ] Test coverage threshold set
- [ ] Validation commands specified
- [ ] Error handling strategy defined

### Git Workflow
- [ ] Branch naming convention set
- [ ] Commit message template defined
- [ ] PR template configured
- [ ] Remote repository accessible

### Human Approval Points
- [ ] Pre-epic approval process defined
- [ ] Failure escalation path clear
- [ ] Post-epic approval process defined
- [ ] Contact person identified for escalations

## Risk Assessment

### Technical Risks
- [ ] External dependencies identified
- [ ] API integrations documented
- [ ] Database migrations planned
- [ ] Performance implications assessed

### Process Risks
- [ ] Time estimates reasonable
- [ ] Resource availability confirmed
- [ ] Rollback procedures defined
- [ ] Monitoring strategy in place

## Final Validation

### Epic Specific
- [ ] Epic goals clearly defined
- [ ] Success criteria measurable
- [ ] Dependencies between stories mapped
- [ ] Integration points identified

### Orchestration Settings
- [ ] Execution mode appropriate (sequential/parallel)
- [ ] Timeout values reasonable
- [ ] Retry logic configured
- [ ] Checkpoint frequency set

## Launch Criteria

**ALL CHECKS MUST PASS** before executing `/bmad-execute-epic`

### Ready to Launch When:
- ✅ All planning documents exist and are complete
- ✅ Development environment is stable
- ✅ Serena MCP integration verified
- ✅ Configuration files properly set
- ✅ Risk assessment completed
- ✅ Human approval obtained

### Command Execution

Once all checks pass, execute:

```bash
# Execute specific epic
/bmad-execute-epic 1

# Or with interactive selection
/bmad-execute-epic

# Dry run to preview execution plan
/bmad-execute-epic 1 --dry-run

# Resume from checkpoint if needed
/bmad-execute-epic 1 --resume-from 1.3
```

## Post-Execution Review

After epic completion:

- [ ] All stories implemented
- [ ] Tests passing
- [ ] Quality gates met
- [ ] Documentation updated
- [ ] PR created and reviewed
- [ ] Deployment ready

## Troubleshooting

### Common Issues

**Issue**: Sub-agent timeout
- Increase timeout in `epic-orchestration.yaml`
- Check for infinite loops in implementation
- Verify external service availability

**Issue**: Quality gate failures
- Review QA feedback in story files
- Check test coverage reports
- Verify acceptance criteria alignment

**Issue**: Git conflicts
- Ensure clean working tree before start
- Check branch naming conflicts
- Verify remote repository access

**Issue**: Memory/context exhaustion
- Reduce parallel execution
- Increase checkpoint frequency
- Split large epics into smaller ones

---

*This checklist ensures smooth orchestration of BMAD epics through Serena's automated workflow.*