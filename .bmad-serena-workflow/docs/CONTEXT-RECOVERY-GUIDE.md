# Context Recovery Guide for Claude Code

## 🔄 Seamless Context Switching Workflow

### Starting Fresh Context (Recommended Pattern)

1. **Clear Context** - Start new Claude Code chat
2. **Auto-Recovery** - Serena MCP automatically loads project memories  
3. **Quick Orientation** - Reference `docs/QUICK-REFERENCE.md`
4. **Deep Dive** - Use memory tools for specific details

### Memory System Navigation

```bash
# List available memories
mcp__serena__list_memories

# Read specific knowledge areas
mcp__serena__read_memory --memory_file_name "project_overview.md"
mcp__serena__read_memory --memory_file_name "tech_stack.md"
mcp__serena__read_memory --memory_file_name "code_style_conventions.md"
```

### Context Recovery Commands (Run These First)

```bash
# 1. Project status
git status
git branch --show-current

# 2. Development environment  
pnpm dev  # Should start on port 3000

# 3. Quick navigation test
# Navigate to http://localhost:3000/dashboard
```

## 📚 Memory Categories

| Memory File | Purpose | When to Read |
|-------------|---------|--------------|
| `project_overview.md` | Business purpose, goals | Starting any work |
| `tech_stack.md` | Complete technology stack | Adding dependencies |
| `code_style_conventions.md` | Coding patterns, conventions | Before coding |
| `task_completion_workflow.md` | Git integration, testing | During development |
| `git_workflow_practices.md` | Branch strategy, commits | Git operations |
| `claude_code_git_integration.md` | Automated workflows | Understanding automation |

## ⚡ Quick Start Patterns

### For UI/Component Work
```bash
# Read these memories:
- code_style_conventions.md (styling patterns)
- tech_stack.md (component libraries)

# Check existing patterns:
ls components/ui/  # See available components
```

### For Dashboard/Features  
```bash
# Read these memories:
- project_overview.md (business context)
- task_completion_workflow.md (development process)

# Explore current implementation:
app/dashboard/page.tsx  # Main dashboard
```

### For Git/Deployment
```bash
# Read these memories:
- git_workflow_practices.md
- claude_code_git_integration.md

# Check current branch strategy:
git branch -a
```

## 🎯 Context-Specific Recovery

### New Feature Development
1. Read `project_overview.md` - understand business goals
2. Read `code_style_conventions.md` - follow patterns
3. Check `app/dashboard/` - see existing implementation
4. Use `task_completion_workflow.md` - automated Git workflow

### Bug Fixes
1. Understand current behavior via dashboard testing
2. Read `tech_stack.md` - understand architecture
3. Use Playwright MCP for testing
4. Follow Git workflow for fixes

### Documentation Updates
1. Read `project_overview.md` - current state
2. Update relevant memory files
3. Keep `QUICK-REFERENCE.md` current

## 🔧 Recovery Troubleshooting

### If Development Environment Issues:
```bash
pnpm install     # Reinstall dependencies
pnpm dev        # Should start on port 3000
docker-compose up  # Alternative environment
```

### If Git State Unclear:
```bash
git status
git fetch origin
git branch -a  # See all branches
git log --oneline -10  # Recent commits
```

### If Architecture Unclear:
```bash
# Use Serena MCP to explore
mcp__serena__get_symbols_overview --relative_path "app/dashboard/page.tsx"
mcp__serena__list_dir --relative_path "." --recursive false
```

## 💡 Pro Tips for Context Switching

1. **Always start with memories** - Don't guess project details
2. **Test environment first** - Ensure `pnpm dev` works
3. **Check Git status** - Know your current branch/changes
4. **Use Quick Reference** - Fast orientation without memory loading
5. **Leverage Playwright MCP** - Test changes immediately
6. **Commit frequently** - Never lose work between context switches

This system ensures **zero context loss** when switching between Claude Code sessions.