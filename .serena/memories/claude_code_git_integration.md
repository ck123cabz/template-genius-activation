# Claude Code Git Integration - Proactive Workflow

## Automatic Git Integration Strategy

### 1. Task Completion Auto-Commit Pattern

**ALWAYS do this after completing any coding task:**

```bash
# After completing feature/fix
git status
git diff  # Review changes
git add .
git commit -m "$(cat <<'EOF'
feat(dashboard): add client export functionality

- Implement CSV export button in client list
- Add export utilities in lib/export-utils.ts
- Include proper error handling and loading states

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 2. Feature Branch Creation Automation

**Start every development session with:**

```bash
# Auto-create feature branch based on task
TASK_NAME="client-export-feature"
git checkout develop
git pull origin develop
git checkout -b feature/$TASK_NAME
echo "Created and switched to feature/$TASK_NAME"
```

### 3. Development Checkpoint Pattern

**After every significant change (every 30-60 minutes):**

```bash
# Quick checkpoint commit
git add .
git commit -m "wip: checkpoint - ${CHANGE_DESCRIPTION}"
git push origin $(git branch --show-current)
```

### 4. Pre-Push Quality Checks

**Always run before pushing:**

```bash
# Quality check sequence
pnpm lint
pnpm build
# Use Playwright MCP for testing if UI changes
git push origin $(git branch --show-current)
```

## Claude Code Specific Integration

### 1. Task-Based Branch Management

When Claude Code starts working on a task:

1. **Analyze Task**: Determine feature/bugfix/docs type
2. **Auto-Branch**: Create appropriate branch name
3. **Work**: Implement changes
4. **Auto-Commit**: Commit with conventional format + Claude signature
5. **Push**: Push to remote branch

### 2. Commit Message Templates

**Feature Commits:**
```
feat(scope): brief description

- Detailed change 1
- Detailed change 2
- Detailed change 3

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Bug Fix Commits:**
```
fix(scope): resolve specific issue

- Root cause analysis
- Solution implemented
- Edge cases handled

Fixes #123

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 3. Automated PR Creation

After completing feature work:

```bash
# Create PR with GitHub CLI
gh pr create \
  --title "feat(dashboard): add client export functionality" \
  --body "$(cat <<'EOF'
## Summary
Implements CSV export functionality for client data management.

## Changes Made
- Added export button to client dashboard
- Created CSV generation utilities
- Implemented download functionality
- Added proper error handling

## Testing
- Tested with Playwright MCP browser automation
- Manual testing completed across browsers
- Export functionality verified with sample data

## Type of Change
- [x] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Refactoring

## Screenshots
[Add if UI changes]

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" \
  --base develop
```

## Integration with Development Workflow

### 1. Start-of-Session Git Check

**Always begin with:**
```bash
git status
git fetch origin
git checkout develop
git pull origin develop
# Check for any pending work
git branch --list "feature/*"
```

### 2. During Development

**After each logical component:**
```bash
# Component completed
git add app/components/ExportButton.tsx
git commit -m "feat(components): add export button component

- Material design export icon
- Loading state management
- Accessible button implementation

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3. End-of-Session

**Always finish with:**
```bash
# Push current work
git push origin $(git branch --show-current)

# Status check
git status
echo "Session complete. Branch: $(git branch --show-current)"
echo "Next: Continue work or create PR"
```

### 4. Task Completion Sequence

**When task is fully complete:**
```bash
# Final quality checks
pnpm lint
pnpm build
mcp__playwright__browser_navigate --url "http://localhost:3000/dashboard"
mcp__playwright__browser_take_screenshot --filename "feature-complete.png"

# Final commit
git add .
git commit -m "feat(dashboard): complete client export feature

All functionality implemented and tested:
- Export button integrated in dashboard
- CSV generation working correctly
- Error handling for edge cases
- Playwright testing completed
- UI responsive across devices

Ready for review.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create PR
gh pr create --title "feat(dashboard): client export functionality" --base develop
```

## Automation Helpers

### 1. Git Status Helper

```bash
# Quick status with branch info
alias gst='echo "Branch: $(git branch --show-current)" && git status --short'
```

### 2. Smart Commit Helper

```bash
# Auto-generate commit based on changes
function smart_commit() {
    local scope="${1:-general}"
    local files_changed=$(git diff --name-only --cached | wc -l)
    echo "Committing $files_changed files in scope: $scope"
    
    git commit -m "feat($scope): auto-generated commit

Changes detected in $files_changed files.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
}
```

### 3. Feature Branch Creator

```bash
function create_feature() {
    local feature_name="$1"
    git checkout develop
    git pull origin develop
    git checkout -b "feature/$feature_name"
    echo "✅ Created feature branch: feature/$feature_name"
}
```

## Quality Gates Integration

### 1. Pre-Commit Checks

```bash
# Before any commit
git status
git diff --cached  # Review staged changes
pnpm lint
pnpm build  # Ensure builds successfully
```

### 2. Pre-Push Validation

```bash
# Before pushing
git log --oneline -5  # Review recent commits
mcp__ide__getDiagnostics  # Check for TypeScript/lint issues
# Playwright testing if UI changes made
git push origin $(git branch --show-current)
```

## Claude Code Workflow Integration

### When Claude Code Works:

1. **Task Analysis** → Determine Git strategy
2. **Branch Creation** → Auto-create appropriate branch
3. **Development** → Work with frequent commits
4. **Testing** → Playwright MCP integration
5. **Quality Check** → Lint, build, type-check
6. **Commit & Push** → Conventional commits with Claude signature
7. **PR Creation** → Automated PR with full context
8. **Documentation** → Update relevant docs/memories

### Git Commands Claude Code Should Use:

- `git status` - Check current state
- `git add .` - Stage all changes  
- `git commit -m "..."` - Commit with conventional format
- `git push` - Push to remote branch
- `gh pr create` - Create pull request
- `git checkout -b` - Create feature branches
- `git merge develop` - Keep branch updated

This ensures Git is seamlessly integrated into every development workflow, making version control automatic rather than an afterthought.