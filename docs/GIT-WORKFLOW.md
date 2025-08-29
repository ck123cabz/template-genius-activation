# Git Workflow & Feature Development Guide

## 🌳 Branch Strategy

This project follows **Git Flow** with the following branch structure:

```
main (production)
├── develop (staging/integration)
│   ├── feature/user-authentication
│   ├── feature/payment-integration
│   ├── bugfix/dashboard-layout
│   └── hotfix/critical-security-patch
```

### Branch Types

| Branch Type | Naming Convention | Purpose | Base Branch | Merges To |
|------------|------------------|---------|-------------|-----------|
| **main** | `main` | Production-ready code | - | - |
| **develop** | `develop` | Integration branch | main | main |
| **feature** | `feature/[task-name]` | New features | develop | develop |
| **bugfix** | `bugfix/[issue-name]` | Non-critical fixes | develop | develop |
| **hotfix** | `hotfix/[critical-issue]` | Critical production fixes | main | main & develop |
| **release** | `release/[version]` | Release preparation | develop | main & develop |

## 🚀 Feature Development Workflow

### 1. Starting a New Feature

```bash
# Ensure you're up to date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Example: Adding client export functionality
git checkout -b feature/client-export
```

### 2. Development Process

```bash
# Make your changes
pnpm dev  # Start development server

# Test with Playwright MCP
# Use mcp__playwright commands for browser testing

# Stage changes incrementally
git add app/dashboard/components/ExportButton.tsx
git commit -m "feat(dashboard): add export button component"

git add lib/export-utils.ts
git commit -m "feat(lib): add CSV export utilities"

# Push to remote
git push -u origin feature/your-feature-name
```

### 3. Commit Message Convention

Follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

#### Examples:

```bash
# Feature
git commit -m "feat(dashboard): add client filtering by status"

# Bug fix
git commit -m "fix(auth): resolve token expiration issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# With body
git commit -m "feat(payment): integrate Stripe payment gateway

- Add payment form component
- Implement webhook handlers
- Add payment status tracking

Closes #123"
```

### 4. Creating Pull Request

```bash
# Push your feature branch
git push origin feature/your-feature-name

# Create PR via GitHub CLI (if installed)
gh pr create \
  --title "feat(dashboard): add client export functionality" \
  --body "## Description
  Add CSV export for client data
  
  ## Changes
  - Export button in dashboard
  - CSV generation utilities
  - Download functionality
  
  ## Testing
  - Tested with Playwright MCP
  - Manual testing completed
  
  ## Screenshots
  [Add if UI changes]
  
  ## Checklist
  - [x] Code follows conventions
  - [x] Tests pass
  - [x] Documentation updated" \
  --base develop
```

### 5. Code Review Process

1. **Automated Checks** (via GitHub Actions):
   - Linting
   - Type checking
   - Build verification
   - Playwright tests (when available)

2. **Manual Review**:
   - Code quality
   - Business logic
   - Security considerations
   - Performance impact

### 6. Merging

```bash
# After PR approval
# GitHub will handle the merge, or locally:

git checkout develop
git pull origin develop
git merge --no-ff feature/your-feature-name
git push origin develop

# Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## 🔄 Daily Workflow

### Morning Sync
```bash
# Start your day
git checkout develop
git pull origin develop
git checkout feature/your-current-feature
git merge develop  # or rebase if preferred
```

### During Development
```bash
# Frequent commits
git add -p  # Stage changes interactively
git commit -m "feat: descriptive message"

# Keep feature branch updated
git fetch origin
git merge origin/develop  # Resolve conflicts if any
```

### End of Day
```bash
# Push your work
git push origin feature/your-current-feature
```

## 🚨 Hotfix Process

For critical production issues:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Make fixes
# ... edit files ...
git add .
git commit -m "hotfix: resolve critical security vulnerability"

# Test thoroughly
pnpm build
pnpm start

# Merge to main
git checkout main
git merge --no-ff hotfix/critical-issue
git tag -a v1.0.1 -m "Hotfix version 1.0.1"
git push origin main --tags

# Merge to develop
git checkout develop
git merge --no-ff hotfix/critical-issue
git push origin develop

# Clean up
git branch -d hotfix/critical-issue
```

## 📋 Release Process

```bash
# Create release branch
git checkout -b release/1.1.0 develop

# Version bump and final testing
pnpm version minor  # or major/patch
git commit -am "chore: bump version to 1.1.0"

# Merge to main
git checkout main
git merge --no-ff release/1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin main --tags

# Back-merge to develop
git checkout develop
git merge --no-ff release/1.1.0
git push origin develop
```

## 🛠️ Useful Git Commands

```bash
# Interactive rebase (clean up commits before PR)
git rebase -i HEAD~3

# Stash work in progress
git stash save "WIP: dashboard refactoring"
git stash list
git stash pop

# Check branch differences
git diff develop..feature/your-feature

# Cherry-pick specific commit
git cherry-pick <commit-hash>

# Reset to previous state
git reset --soft HEAD~1  # Keep changes staged
git reset --hard HEAD~1  # Discard changes

# View commit history
git log --oneline --graph --all

# Find who changed a line
git blame app/dashboard/page.tsx

# Search commit history
git log --grep="dashboard"
```

## ⚙️ Git Configuration

### Recommended Git Config

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Enable helpful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"

# Set default branch name
git config --global init.defaultBranch main

# Enable auto-correction
git config --global help.autocorrect 1

# Set merge strategy
git config --global pull.rebase false
```

## 🔍 GitHub Actions Integration

Our GitHub Actions workflows automatically:

1. **On Push to develop/main**:
   - Run CI pipeline
   - Execute tests
   - Build Docker image

2. **On Pull Request**:
   - Validate code quality
   - Check for sensitive data
   - Run automated tests
   - Add PR comment with results

3. **On Merge to main**:
   - Deploy to production (Vercel)
   - Build and push Docker image
   - Tag release

## 📝 Best Practices

### DO:
- ✅ Commit frequently with clear messages
- ✅ Keep commits atomic (one change per commit)
- ✅ Pull from develop regularly
- ✅ Test before pushing
- ✅ Use PR templates
- ✅ Request reviews from team members
- ✅ Update documentation with code changes

### DON'T:
- ❌ Commit directly to main
- ❌ Force push to shared branches
- ❌ Merge without review
- ❌ Leave console.log in production code
- ❌ Commit sensitive data (keys, passwords)
- ❌ Create huge PRs (>500 lines)

## 🎯 Feature Flags (Future Enhancement)

For gradual rollouts:

```typescript
// lib/feature-flags.ts
export const features = {
  newDashboard: process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true',
  stripePayments: process.env.NEXT_PUBLIC_FEATURE_STRIPE === 'true',
};

// Usage in components
import { features } from '@/lib/feature-flags';

if (features.newDashboard) {
  // New implementation
} else {
  // Current implementation
}
```

## 💡 Tips for Success

1. **Small, Frequent PRs**: Easier to review and less conflict-prone
2. **Descriptive Branch Names**: `feature/add-csv-export` not `feature/export`
3. **Update Regularly**: Merge develop into your feature branch daily
4. **Test Locally**: Always run `pnpm build` before pushing
5. **Document Changes**: Update README or docs/ for significant changes
6. **Clean History**: Use interactive rebase to clean commits before PR
7. **Playwright Testing**: Use MCP tools for automated testing