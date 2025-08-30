# BMAD Orchestration Quick Reference

## 🚀 One-Command Epic Execution

Transform your development from manual agent coordination to automated orchestration.

### Traditional BMAD (Manual)
```bash
/sm *draft 1.1       # Draft story 1.1
/dev *implement 1.1  # Implement story 1.1  
/qa *review 1.1      # Review story 1.1
/sm *draft 1.2       # Draft story 1.2 (no context from 1.1!)
/dev *implement 1.2  # Implement story 1.2
/qa *review 1.2      # Review story 1.2
# Repeat for EVERY story... 😓
```

### Serena-Orchestrated BMAD (Automated + Iterative Learning)
```bash
/bmad-execute-epic 1  # Complete entire epic with iterative learning! 🎉
```

**What happens automatically:**
- ✅ SM creates story 1 from epic requirements
- ✅ Dev implements with Serena MCP tools  
- ✅ QA reviews with quality gates
- ✅ **SM creates story 2 building on story 1 learnings** 🧠
- ✅ Dev implements story 2 reusing story 1 patterns
- ✅ QA includes regression tests for story 1
- ✅ Process continues with each story building on previous...

---

## ⚡ Quick Start

### 1. Planning Phase (Still Manual - Strategic Decisions)
```bash
/pm
*create-prd           # Create requirements

/architect
*create-full-stack-architecture  # Design system

/po
*shard-prd           # Break into epics/stories
```

### 2. Execution Phase (Fully Automated!)
```bash
/bmad-execute-epic 1  # Serena handles everything
```

That's it! Serena orchestrates SM → Dev → QA for every story.

---

## 📊 What Happens During Orchestration

```
Epic 2: Dashboard Features
━━━━━━━━━━━━━━━━━━━━━━━━
📝 Story 2.1: Client List
  ✓ SM: Drafted
  ✓ Dev: Implemented (42 files)
  ✓ QA: PASS

📝 Story 2.2: Search
  ✓ SM: Drafted
  ⚡ Dev: Fixing QA concerns...
  ✓ QA: PASS

⏳ Story 2.3: Export
  ⏳ SM: Drafting...

Progress: ████░░░ 67%
```

---

## 🎮 Command Options

### Basic Commands
```bash
/bmad-execute-epic          # Show epic list
/bmad-execute-epic 1        # Execute epic 1
/bmad-execute-epic 1 --dry-run  # Preview only
```

### Advanced Options
```bash
# Parallel execution (when stories are independent)
/bmad-execute-epic 2 --mode parallel

# Execute specific stories only
/bmad-execute-epic 2 --stories 2.1,2.3

# Resume from failure
/bmad-execute-epic 2 --resume-from 2.3

# Skip quality gates (dangerous!)
/bmad-execute-epic 2 --qa-strict false
```

---

## 🔧 Configuration

### Quick Config (`~/.bmad-core/epic-orchestration.yaml`)

```yaml
orchestration:
  execution_mode: sequential  # or parallel
  
  quality:
    minimum_gate: PASS  # or CONCERNS
    require_tests: true
    coverage_threshold: 80
  
  human_approval:
    pre_epic: true    # Confirm start
    on_failure: true  # Human fixes failures
    post_epic: true   # Approve completion
```

---

## 🚦 Quality Gates

Each story goes through automatic quality checks:

| Gate | Meaning | Action |
|------|---------|---------|
| ✅ PASS | All good | Continue |
| ⚠️ CONCERNS | Minor issues | Auto-fix attempted |
| ❌ FAIL | Major issues | Re-implementation |
| 🔄 WAIVED | Accepted risk | Continue with note |

---

## 🛠️ Serena's Superpowers in BMAD

During orchestration, Serena uses:

- **mcp__serena__find_symbol**: Navigate code intelligently
- **mcp__serena__multi_edit**: Edit multiple files efficiently  
- **mcp__playwright__browser_***: Test UI automatically
- **Git automation**: Commit with story references
- **Memory system**: Learn from each execution

---

## 📈 Benefits at a Glance

| Metric | Manual BMAD | Orchestrated |
|--------|-------------|--------------|
| Commands per epic | 30-50 | 1 |
| Time per epic | 2-4 hours | 20-40 mins |
| Quality consistency | Variable | Guaranteed |
| Human errors | Common | Eliminated |
| Context switching | Constant | None |

---

## 🔍 Monitoring Progress

### Real-time Updates
Serena provides continuous feedback:
- Story status (Drafting/Implementing/Reviewing)
- Files modified count
- Test results
- Quality scores
- Time estimates

### Completion Report
```yaml
Epic 1 Complete!
Stories: 5/5 ✓
Duration: 47 minutes
Coverage: 87%
Quality: All PASS
Files: 67 modified
Tests: 142 added
```

---

## 🚨 Troubleshooting

### Epic won't start?
```bash
# Check prerequisites
cat docs/prd.md  # PRD exists?
ls docs/stories/  # Stories exist?
git status       # Clean tree?
```

### Story failed?
```bash
# Resume from failure
/bmad-execute-epic 1 --resume-from 1.3

# Or check the story file for details
cat docs/stories/story-1.3.md
```

### Need to stop?
```bash
# Ctrl+C to interrupt
# Progress is saved in checkpoints
# Resume with --resume-from
```

---

## 💡 Pro Tips

1. **Start Small**: Test with a simple epic first
2. **Monitor First Run**: Watch the first execution closely
3. **Review Checkpoints**: Saved after each story
4. **Trust the Process**: Let automation complete
5. **Learn from Reports**: Each run improves the next

---

## 🎯 Example: Authentication Epic

### Manual Way (Old)
```bash
/sm *draft 1.1     # Basic login
/dev *implement 1.1
/qa *review 1.1
/sm *draft 1.2     # Password reset
/dev *implement 1.2
/qa *review 1.2
# ... 10 more stories
# Total: ~40 commands, 3 hours
```

### Orchestrated Way (New)
```bash
/bmad-execute-epic 1
# Total: 1 command, 35 minutes
# Coffee break while Serena works! ☕
```

---

## 🌟 The Magic Formula

```
Planning (Human Strategy) + Orchestration (Serena Execution) = 🚀
```

**You focus on WHAT to build.**
**Serena handles HOW to build it.**

---

*Welcome to effortless epic execution with Serena-orchestrated BMAD!*