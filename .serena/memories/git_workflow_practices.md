# Git Workflow & Version Control Practices

## Branch Strategy

**Git Flow Model**:
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features (base: develop)
- `bugfix/*` - Bug fixes (base: develop)
- `hotfix/*` - Critical fixes (base: main)
- `release/*` - Release preparation (base: develop)

## Feature Development Process

### 1. Starting Features
```bash
git checkout develop
git pull origin develop
git checkout -b feature/feature-name
```

### 2. Commit Convention
**Format**: `<type>(<scope>): <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance
- `perf`: Performance
- `ci`: CI/CD changes

**Examples**:
```bash
git commit -m "feat(dashboard): add client export functionality"
git commit -m "fix(auth): resolve token expiration issue"
git commit -m "docs(readme): update setup instructions"
```

### 3. Pull Request Flow
1. Push feature branch
2. Create PR to develop
3. Automated checks run (CI/CD)
4. Code review
5. Merge after approval
6. Delete feature branch

## GitHub Actions Workflows

### CI Pipeline (`ci.yml`)
- **Triggers**: Push to main/develop, PRs
- **Jobs**:
  - Lint and type check
  - Build verification
  - Playwright tests (when available)
  - Docker build check

### PR Validation (`pr-validation.yml`)
- **Triggers**: PR events
- **Checks**:
  - Commit message format
  - Console.log detection
  - TODO/FIXME tracking
  - Sensitive data scanning
  - Bundle size impact

### Deployment (`deploy.yml`)
- **Triggers**: Push to main
- **Actions**:
  - Deploy to Vercel
  - Build Docker image
  - Push to registries
  - Production deployment

## Daily Development Workflow

### Morning
```bash
git checkout develop
git pull origin develop
git checkout feature/current-feature
git merge develop
```

### During Development
```bash
# Atomic commits
git add -p
git commit -m "feat: specific change"

# Keep updated
git fetch origin
git merge origin/develop
```

### End of Day
```bash
git push origin feature/current-feature
```

## Testing Requirements

### Before Commit
1. Run `pnpm lint`
2. Run `pnpm build`
3. Test with Playwright MCP
4. Check browser console for errors

### PR Checklist
- [ ] Code follows conventions
- [ ] Tests pass
- [ ] No console.log statements
- [ ] Documentation updated
- [ ] Sensitive data removed
- [ ] PR description complete

## Best Practices

### DO ✅
- Commit frequently with clear messages
- Keep commits atomic
- Update from develop regularly
- Test before pushing
- Use PR templates
- Request code reviews
- Update documentation

### DON'T ❌
- Commit directly to main
- Force push shared branches
- Merge without review
- Leave debugging code
- Commit sensitive data
- Create large PRs (>500 lines)

## Version Management

### Semantic Versioning
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

### Release Process
1. Create release branch from develop
2. Version bump
3. Final testing
4. Merge to main and tag
5. Back-merge to develop

## Git Configuration

```bash
# Essential aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"

# Merge strategy
git config --global pull.rebase false
```

## Security Practices

- Never commit `.env` files
- Use secrets in GitHub Actions
- Scan for sensitive data before commit
- Review security warnings in PRs
- Keep dependencies updated

## Collaboration Guidelines

1. **Small PRs**: Easier to review
2. **Descriptive names**: Clear branch/commit names
3. **Regular updates**: Daily merges from develop
4. **Local testing**: Always build before push
5. **Documentation**: Update with code changes
6. **Clean history**: Rebase before PR if needed
7. **Automated testing**: Use Playwright MCP