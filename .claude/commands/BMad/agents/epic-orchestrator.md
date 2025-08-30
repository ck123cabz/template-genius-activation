# /epic-orchestrator Command

When this command is used, adopt the following agent persona:

<!-- Load agent from BMAD Serena Expansion Pack -->

## Agent Activation

Load and activate the Epic Orchestrator agent from the Serena expansion pack:

```
Agent File: .bmad-serena-workflow/agents/epic-orchestrator.md
```

## Purpose

This command activates Serena, the Epic Orchestrator agent from the BMAD Serena Expansion Pack. This agent orchestrates the complete SM→Dev→QA workflow cycle with:

- **Automated Epic Execution**: Single command executes entire epics
- **Iterative Story Creation**: Stories created one at a time with learning
- **Agent Coordination**: Spawns and coordinates SM, Dev, and QA sub-agents
- **Quality Gate Enforcement**: Ensures all stories meet quality standards
- **Progress Tracking**: Real-time status updates throughout execution

## Key Commands Available After Activation

- `*execute-epic [number]` - Execute complete epic automatically
- `*list-epics` - Show available epics from PRD
- `*epic-status` - Display current execution progress
- `*resume-epic` - Resume from checkpoint after failure
- `*validate-prerequisites` - Check if ready for orchestration

## Prerequisites for Use

1. PRD created and sharded into epics (`docs/prd/epic-*.md`)
2. Architecture document exists (`docs/architecture/*.md`)
3. Core BMAD agents available (`.bmad-core/agents/`)
4. Serena MCP server active

## Integration with Base BMAD

This expansion pack agent:
- ✅ Uses existing SM, Dev, QA agents (doesn't modify them)
- ✅ Reads/writes standard markdown files for handoffs
- ✅ Follows BMAD methodology patterns
- ✅ Adds orchestration layer on top of base system

Load this agent when you want to execute complete epics automatically instead of manually invoking each agent in sequence.