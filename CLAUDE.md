# CLAUDE.md - Template Genius Revenue Intelligence Engine

**High-level orchestration file for Claude Code. Detailed knowledge stored in `.serena/memories/` system.**

## 🎯 Project Identity
**Template Genius Revenue Intelligence Engine** - Connected journey learning system that captures conversion intelligence from every client interaction. Each client teaches us what drives revenue through hypothesis tracking, outcome recording, and pattern recognition.

## ⚡ Essential Commands  
```bash
pnpm dev          # Development server (port 3000)
pnpm build        # Production build  
pnpm lint         # Code quality
docker-compose up # Docker development
```

## 🧠 Knowledge Recovery System
**For fresh context sessions, immediately use:**

```bash
# Auto-loads project memories
mcp__serena__check_onboarding_performed

# Quick references  
docs/QUICK-REFERENCE.md           # Instant orientation
docs/CONTEXT-RECOVERY-GUIDE.md    # Detailed recovery workflow
```

**Key Memory Files** (access via `mcp__serena__read_memory`):
- `project_overview.md` - Business context, goals, architecture
- `tech_stack.md` - Complete technology stack + MCP servers
- `code_style_conventions.md` - Development patterns, styling
- `task_completion_workflow.md` - Git integration, testing workflow
- `git_workflow_practices.md` - Branch strategy, commit conventions
- `claude_code_git_integration.md` - Automated Git workflow

## 🏗️ Revenue Intelligence Architecture
- **Connected Journey**: 4-page client experience (activation → agreement → confirmation → processing)
- **Learning Capture**: Hypothesis before changes, outcomes after interactions
- **Pattern Recognition**: Identify what converts vs what doesn't
- **Component Enhancement**: Extend existing components with learning fields
- **Server Actions**: Next.js 15 patterns for learning operations
- **Serena Memory**: Persistent learning across sessions

## 🔄 Proactive Git Integration
**Auto-workflow for every development task:**
1. **Branch**: Auto-create `feature/task-name` from `develop`
2. **Commit**: Component-level commits with conventional format + Claude signature
3. **Test**: Playwright MCP testing after each change
4. **Quality**: Automated lint/build checks
5. **PR**: Auto-create pull requests with full context
6. **Deploy**: GitHub Actions CI/CD pipeline

## 🎯 Development Workflows

### Standard Development Workflow
```bash
# Start session
git checkout develop && git pull origin develop
git checkout -b feature/task-name
pnpm dev

# During development  
# Component-level commits with:
git commit -m "feat(scope): description

Details of change

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Testing
mcp__playwright__browser_navigate --url "http://localhost:3000/dashboard"
mcp__playwright__browser_take_screenshot

# Completion
gh pr create --title "feat: description" --base develop
```

### 🚀 BMAD-Orchestrated Development (NEW)
**For structured feature development with automated workflow:**

```bash
# Phase 1: Planning (Manual - Strategic Decisions)
/pm *create-prd           # Define requirements
/architect *create-full-stack-architecture  # Design system
/po *shard-prd           # Create epics/stories

# Phase 2: Automated Epic Execution
/bmad-execute-epic 1      # Serena orchestrates entire epic!

# What happens automatically:
# ✓ SM agent drafts each story
# ✓ Dev agent implements with Serena capabilities  
# ✓ QA agent reviews and validates
# ✓ Git commits with story references
# ✓ Quality gates enforced
# ✓ Progress tracking throughout
```

**Benefits**: 90% reduction in manual commands, consistent quality, 5-10x faster delivery

## 🛡️ Quality Gates
- **Pre-commit**: `pnpm lint && pnpm build`
- **Testing**: Playwright MCP browser automation
- **Security**: No console.log in production, environment variables secured
- **Documentation**: Keep memories updated with significant changes

## 📋 Context Switching Protocol
1. **Clear Claude Code context** (recommended for clean state)
2. **Auto-recovery via Serena MCP** (loads all project knowledge)
3. **Quick orientation** via `docs/QUICK-REFERENCE.md`
4. **Specific knowledge** via memory system as needed
5. **Continue development** with full context restored

## 🎪 Available MCP Servers
- **Serena MCP** - Project memory, symbol navigation, code understanding
- **Playwright MCP** - Browser automation, testing, screenshots
- **IDE MCP** - Code diagnostics, TypeScript checking

---

**This file intentionally kept concise. Full knowledge available via memory system for zero-context-loss development.**