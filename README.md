# Template Genius Activation Platform - Revenue Intelligence Engine

> **🎯 SINGLE SOURCE OF TRUTH** - This README is your central hub for the Revenue Intelligence Engine that transforms client interactions into systematic learning for conversion optimization.

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js) ![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript) ![BMAD](https://img.shields.io/badge/BMAD-Orchestrated-green?style=for-the-badge)

**Template Genius Revenue Intelligence Engine** captures conversion intelligence from every client journey to systematically improve activation rates. Each client teaches us what drives revenue through hypothesis tracking, outcome recording, and pattern recognition.

---

## 📑 Table of Contents

- [🎯 What This Platform Does](#-what-this-platform-does)
- [🚀 Getting Started (Beginner-Friendly)](#-getting-started-beginner-friendly)
- [💻 Development Workflow](#-development-workflow)
- [🏗️ Architecture & Code Organization](#️-architecture--code-organization)
- [🔧 Available Commands](#-available-commands)
- [🧪 Testing & Quality Assurance](#-testing--quality-assurance)
- [🌳 Git Workflow & Version Control](#-git-workflow--version-control)
- [🚨 Troubleshooting Guide](#-troubleshooting-guide)
- [📚 Reference Documentation](#-reference-documentation)
- [🆘 Getting Help](#-getting-help)

---

## 🎯 What This Platform Does

### Business Purpose - Revenue Intelligence Engine
- **Core Problem**: $73,250 in signed contracts → $0 invoiced (clients ghost after free work)
- **Solution**: Revenue Intelligence Engine that learns from every client interaction
- **Target**: $10K monthly activation revenue through $500 activation fees
- **Goal**: Improve from 4.5% to 30%+ activation rate through systematic learning
- **Timeline**: 1-2 day implementation with BMAD, revenue validation in Week 1

### Core Features - Connected Journey Intelligence
1. **Revenue Intelligence Dashboard** (`/dashboard`) - Learning capture and pattern recognition
2. **Connected Client Journey** (`/activate/[token]`) - 4-page experience with hypothesis tracking
3. **Learning Capture System** - Track why changes are made and what outcomes occur
4. **Pattern Recognition** - Identify what converts vs what doesn't across clients
5. **Payment Intelligence** - Link payments to specific content for correlation
6. **BMAD Orchestration** - AI-powered development for rapid iteration

### Key Pages
- **Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) - Main admin interface
- **Preview**: [http://localhost:3000/activate/preview](http://localhost:3000/activate/preview) - Content preview
- **Sample Activation**: [http://localhost:3000/activate/multi-position-sample](http://localhost:3000/activate/multi-position-sample)

---

## 🚀 Getting Started (Beginner-Friendly)

### Step 1: Install Required Software

**Option A: Using Node.js (Recommended for beginners)**
1. Install Node.js 22+ from [nodejs.org](https://nodejs.org)
2. Install pnpm: `npm install -g pnpm`
3. Verify installation: `node --version` and `pnpm --version`

**Option B: Using Docker (Alternative)**
1. Install Docker Desktop from [docker.com](https://docker.com)
2. Verify installation: `docker --version`

### Step 2: Get the Code

```bash
# 1. Download the project (if you don't have it)
git clone https://github.com/your-org/template-genius-activation.git
cd template-genius-activation

# 2. Install all dependencies
pnpm install

# 3. Set up environment (creates .env.local file)
cp .env.example .env.local
```

### Step 3: Start the Application

```bash
# Start the development server
pnpm dev

# ✅ Success: You should see "ready - started server on 0.0.0.0:3000"
# Open your browser to: http://localhost:3000
```

**What you should see:**
- Browser redirects to `/dashboard`
- Dashboard with client management interface
- Tabs for "Clients" and "Content" management

### Step 4: Verify Everything Works

1. **Dashboard Test**: Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. **Preview Test**: Click "Preview Page" or go to [http://localhost:3000/activate/preview](http://localhost:3000/activate/preview)
3. **Add Test Client**: Try creating a new client in the dashboard
4. **Content Edit**: Try editing content in the "Content" tab

---

## 💻 Development Workflow

### Development Workflow Options

#### Option 1: Standard Development Process
```bash
# 1. Check current status
git status
git fetch origin

# 2. Switch to development branch
git checkout develop
git pull origin develop

# 3. Start development server
pnpm dev

# 4. Create feature branch
git checkout -b feature/your-feature-name

# 5. Make changes and commit
git add .
git commit -m "feat(scope): what you changed

Detailed description of changes made

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

#### Option 2: 🚀 AI-Orchestrated Development (NEW)
**For structured feature development using BMAD methodology with Serena orchestration:**

```bash
# Phase 1: Strategic Planning (Manual)
/pm *create-prd           # Define requirements
/architect *create-full-stack-architecture  # Design system
/po *shard-prd           # Create epics/stories

# Phase 2: Automated Epic Execution (Magic!)
/bmad-execute-epic 1      # ONE COMMAND DOES EVERYTHING!

# What happens automatically:
# ✓ SM agent creates story 1 from epic requirements
# ✓ Dev agent implements story 1 with Serena MCP tools
# ✓ QA agent reviews with quality gates
# ✓ SM agent creates story 2 building on story 1 learnings
# ✓ Dev agent implements story 2 reusing story 1 patterns
# ✓ QA agent includes regression tests for story 1
# ✓ Process continues with each story building incrementally
# ✓ Git commits with BMAD story references
# ✓ PR created when epic completes
```

**Benefits of AI Orchestration:**
- **98% fewer commands** (1 vs 30-50)
- **85% faster delivery** (30-60 min vs 3-4 hours)  
- **100% quality consistency** with automated gates
- **Zero context switching** between agents
- **🧠 Iterative Learning** - each story builds on previous learnings
- **📐 Incremental Architecture** - patterns established and reused
- **🔄 Regression Protection** - previous stories tested with each new story

#### Completing Features
```bash
# 1. Final quality checks
pnpm lint    # Check code quality
pnpm build   # Test production build

# 2. Push to remote
git push origin feature/your-feature-name

# 3. Create pull request (if using GitHub)
gh pr create --title "feat: your feature" --base develop
```

### Understanding the Codebase

**File Structure Guide:**
```
template-genius-activation/
├── app/                     # Main application (Next.js App Router)
│   ├── dashboard/          # 📊 Admin dashboard
│   │   ├── page.tsx       # Main dashboard component
│   │   └── components/    # Dashboard-specific components
│   ├── activate/          # 🎯 Client activation flow
│   │   ├── [token]/       # Dynamic activation pages
│   │   └── preview/       # Content preview
│   ├── layout.tsx         # Root layout with theme
│   └── globals.css        # Global styles
├── components/            # 🧩 Reusable UI components
│   ├── ui/               # Shadcn component library (40+ components)
│   └── theme-provider.tsx # Dark/light theme management
├── lib/                  # 🛠️ Utilities and helpers
│   ├── utils.ts         # cn() utility for styling
│   ├── supabase.ts      # Database client
│   └── supabase-server.ts # Server-side database
├── docs/                 # 📚 Documentation
├── .serena/memories/     # 🧠 AI knowledge base
├── .github/workflows/    # 🤖 Automated CI/CD
└── supabase/            # 🗄️ Database schemas
```

### Key Development Concepts

**1. Styling System**
```typescript
import { cn } from "@/lib/utils"

// Use cn() for conditional classes
<Button className={cn("base-styles", isActive && "active-styles")} />
```

**2. Component Pattern**
```typescript
// Follow this structure for new components
export function ComponentName({ className, ...props }: ComponentProps) {
  return (
    <div className={cn("default-styles", className)} {...props}>
      {/* Component content */}
    </div>
  )
}
```

**3. Data Management**
- **Mock Data**: Development uses mock data (no database required)
- **Supabase**: Production uses Supabase PostgreSQL
- **State Management**: React built-in hooks (useState, useEffect)

---

## 🏗️ Architecture & Code Organization

### AI Development Methodology

**BMAD + Serena Orchestration**
- **BMAD Method** - Business Methodology for Agile Development with specialized AI agents
- **Serena MCP** - Memory-based context system that orchestrates BMAD workflow
- **Automated Workflow** - Single command (`/bmad-execute-epic`) executes entire epics
- **Quality Gates** - Automated SM → Dev → QA cycle with feedback loops
- **Sub-agent Orchestration** - Serena spawns specialized agents for each phase

**Available BMAD Agents:**
- **PM (John)** - Product Manager for requirements
- **Architect (Winston)** - System architecture design
- **PO (Anna)** - Product Owner for story creation
- **SM (Bob)** - Scrum Master for story drafting
- **Dev (James)** - Developer for implementation
- **QA (Quinn)** - Quality Assurance for validation

### Technology Stack

**Core Framework**
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5.7** - Type-safe development
- **Node.js 22+** - JavaScript runtime

**UI & Styling**
- **Tailwind CSS 4.1.9** - Utility-first styling
- **Shadcn/ui** - Component library (40+ components)
- **Radix UI** - Accessibility primitives
- **Lucide React** - Icon system
- **Geist Fonts** - Typography

**Data & Forms**
- **Supabase** - Database with real-time features
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Mock Data System** - Local development

**Development Tools**
- **Docker** - Containerized development
- **pnpm** - Package manager
- **Playwright MCP** - Browser testing
- **GitHub Actions** - CI/CD automation

### Application Architecture

**Router Structure** (Next.js App Router)
```
app/
├── page.tsx              # → redirects to /dashboard
├── dashboard/           # 📊 Admin Interface
│   ├── page.tsx        # Main dashboard (clients + content)
│   └── components/     # Dashboard components
├── activate/           # 🎯 Client Activation
│   ├── [token]/        # Dynamic pages: /activate/abc123
│   ├── preview/        # Live preview: /activate/preview
│   └── multi-position-sample/  # Sample page
├── agreement/          # Terms & conditions
├── confirmation/       # Post-activation success
└── processing/         # Payment processing
```

**Component Library** (`components/ui/`)
- Pre-built components following design system
- Based on Radix UI + Tailwind CSS
- Examples: Button, Card, Dialog, Form, Input, Table, etc.

**Utility Functions** (`lib/`)
- `utils.ts` - Essential `cn()` function for className merging
- `supabase.ts` - Database client configuration
- Export pattern: `export { function } from './file'`

### Data Flow

1. **Mock Data** → Components (development)
2. **Supabase** → API calls → Components (production)
3. **React Hook Form** → Zod validation → State updates
4. **Local Storage** → Client-side caching

---

## 🔧 Available Commands

### Essential Commands
```bash
# Development
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Create production build
pnpm start        # Start production server
pnpm lint         # Check code quality

# Package Management
pnpm install      # Install dependencies
pnpm add [pkg]    # Add new package
pnpm remove [pkg] # Remove package

# Docker Alternative
docker-compose up        # Start with Docker
docker-compose up --build  # Rebuild and start
docker-compose down      # Stop containers
```

### Git Commands
```bash
# Branch Management
git status                    # Check current state
git checkout develop         # Switch to develop branch  
git checkout -b feature/name # Create feature branch
git branch -a               # List all branches

# Daily Workflow
git add .                   # Stage all changes
git commit -m "message"     # Commit with message
git push origin branch-name # Push to remote
git pull origin develop     # Get latest changes

# Advanced
git merge develop          # Merge develop into current branch
git rebase -i HEAD~3      # Interactive rebase (clean history)
git stash                 # Temporarily save changes
git stash pop             # Restore stashed changes
```

### Testing Commands (with Playwright MCP)
```bash
# Browser automation (via Claude Code)
mcp__playwright__browser_navigate --url "http://localhost:3000/dashboard"
mcp__playwright__browser_take_screenshot
mcp__playwright__browser_click --element "button" --ref "[data-testid=btn]"
mcp__playwright__browser_console_messages  # Check for errors
```

---

## 🧪 Testing & Quality Assurance

### Manual Testing Checklist

**Before Every Commit:**
- [ ] `pnpm dev` starts without errors
- [ ] [Dashboard](http://localhost:3000/dashboard) loads correctly
- [ ] Can create new client
- [ ] Can edit content in Content tab
- [ ] [Preview page](http://localhost:3000/activate/preview) shows changes
- [ ] No console errors in browser dev tools
- [ ] `pnpm build` completes successfully

**Before Pull Request:**
- [ ] All manual tests pass
- [ ] `pnpm lint` shows no errors
- [ ] Feature works in both Chrome and Safari
- [ ] Mobile responsive (test with browser dev tools)
- [ ] Dark/light theme works (toggle in top bar)

### Automated Testing (Playwright MCP)

**Browser Automation Tests:**
```typescript
// Dashboard functionality test
navigate → http://localhost:3000/dashboard
screenshot → dashboard-loaded.png  
click → "Add Client" button
fill form → client details
submit → form
verify → client appears in list
screenshot → client-added.png
```

**Console Monitoring:**
- Automatically checks for JavaScript errors
- Monitors network requests
- Validates form submissions
- Tracks performance metrics

### Quality Gates (Automated)

**GitHub Actions CI/CD:**
1. **Lint Check** - Code style validation
2. **Type Check** - TypeScript compilation
3. **Build Test** - Production build verification
4. **Security Scan** - Check for sensitive data
5. **Docker Build** - Container image creation

---

## 🌳 Git Workflow & Version Control

### Branch Strategy (Git Flow)

```
main (production)     ← Deploy to production
└── develop          ← Integration branch
    ├── feature/client-export     ← New features
    ├── feature/payment-gateway   ← New features  
    ├── bugfix/dashboard-layout   ← Bug fixes
    └── hotfix/security-patch     ← Critical fixes → main
```

### Feature Development Process

**1. Start New Feature**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/descriptive-name
```

**2. Development Cycle**
```bash
# Make changes
# Test changes  
git add .
git commit -m "feat(scope): what changed

Details about the change

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**3. Complete Feature**  
```bash
git push origin feature/descriptive-name
gh pr create --title "feat: description" --base develop
# After review → merge to develop
# Periodically develop → main for production
```

### Commit Message Format

**Convention**: `<type>(<scope>): <subject>`

**Types:**
- `feat` - New feature
- `fix` - Bug fix  
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Testing
- `chore` - Maintenance

**Examples:**
```bash
feat(dashboard): add client export functionality
fix(auth): resolve token expiration issue
docs(readme): update setup instructions  
style(components): format button component
```

### GitHub Integration

**Automated Workflows:**
- **CI Pipeline** (`.github/workflows/ci.yml`) - Tests on every push/PR
- **PR Validation** (`.github/workflows/pr-validation.yml`) - Quality checks
- **Deployment** (`.github/workflows/deploy.yml`) - Auto-deploy to production

**Pull Request Template** (`.github/pull_request_template.md`)
- Standardized PR format
- Testing checklist
- Type of change indicators
- Security considerations

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 🔴 "pnpm dev" doesn't work

**Symptoms:** Command not found, or server won't start
```bash
# Solution 1: Install pnpm
npm install -g pnpm

# Solution 2: Use npm instead (temporary)  
npm run dev

# Solution 3: Check Node.js version
node --version  # Should be 22+
```

#### 🔴 "Port 3000 already in use"

**Symptoms:** `Error: listen EADDRINUSE: address already in use :::3000`
```bash
# Solution 1: Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Solution 2: Use different port
pnpm dev --port 3001

# Solution 3: Find what's using the port
lsof -i :3000
```

#### 🔴 Dependencies won't install

**Symptoms:** `pnpm install` fails or takes forever
```bash
# Solution 1: Clear cache
pnpm store prune
rm -rf node_modules
pnpm install

# Solution 2: Check disk space
df -h

# Solution 3: Use npm as fallback
rm pnpm-lock.yaml
npm install
```

#### 🔴 Build failures

**Symptoms:** `pnpm build` fails with errors
```bash
# Solution 1: Check for TypeScript errors
npx tsc --noEmit

# Solution 2: Check for linting errors  
pnpm lint

# Solution 3: Clear Next.js cache
rm -rf .next
pnpm build
```

#### 🔴 Docker issues

**Symptoms:** Docker commands fail or containers won't start
```bash
# Solution 1: Restart Docker Desktop
# Quit Docker Desktop and restart it

# Solution 2: Clear Docker cache
docker system prune -a

# Solution 3: Rebuild image
docker-compose down
docker-compose up --build
```

#### 🔴 Git issues

**Symptoms:** Git commands fail or branches are confusing
```bash
# Solution 1: Check current status
git status
git branch -a

# Solution 2: Reset to clean state
git stash  # Save current changes
git checkout develop
git pull origin develop

# Solution 3: Fix merge conflicts
git status  # Shows conflicted files
# Edit files to resolve conflicts
git add .
git commit -m "resolve merge conflicts"
```

#### 🔴 Browser shows errors

**Symptoms:** White screen, console errors, features don't work

**Debug Steps:**
1. Open browser dev tools (F12)
2. Check Console tab for red errors
3. Check Network tab for failed requests
4. Try hard refresh (Ctrl/Cmd + Shift + R)

**Common fixes:**
```bash
# Clear browser cache
# Restart dev server
pnpm dev

# Check if API endpoints work
curl http://localhost:3000/api/health
```

### Emergency Recovery

**If everything is broken:**
```bash
# Nuclear option: Start fresh
git stash  # Save any important changes
git checkout main
git pull origin main  
rm -rf node_modules .next
pnpm install
pnpm dev
```

**If you lost your changes:**
```bash
# Check if git saved them
git stash list
git stash show -p stash@{0}

# Check reflog for recent commits
git reflog --since="2 days ago"
```

### Getting Debug Information

**For support requests, include:**
```bash
# System info
node --version
pnpm --version
git --version
docker --version

# Project status
git status
git log --oneline -5
pnpm list --depth=0

# Error details
# Copy full error messages from terminal
# Include browser console errors
# Add screenshots if UI issues
```

---

## 📚 Reference Documentation

### File Structure Reference

**Important Files You Should Know:**

| File | Purpose | When to Edit |
|------|---------|--------------|
| `app/dashboard/page.tsx` | Main dashboard interface | Adding dashboard features |
| `app/activate/[token]/page.tsx` | Client activation page | Changing activation flow |
| `components/ui/button.tsx` | Button component | Styling button variants |
| `lib/utils.ts` | Utility functions | Adding helper functions |
| `app/globals.css` | Global styles | Site-wide style changes |
| `package.json` | Dependencies & scripts | Adding packages |
| `next.config.mjs` | Next.js configuration | Build settings |
| `tailwind.config.js` | Tailwind CSS config | Design system changes |
| `.env.local` | Environment variables | API keys, secrets |

### Environment Variables

**Required Variables** (in `.env.local`):
```bash
# Supabase (optional - uses mock data if missing)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Future: Stripe Payment Integration
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

### API Endpoints

**Available Routes:**
- `/` - Redirects to dashboard
- `/dashboard` - Main admin interface
- `/activate/[token]` - Client activation pages
- `/activate/preview` - Content preview
- `/agreement` - Terms and conditions
- `/confirmation` - Success page
- `/processing` - Payment processing

### Database Schema

**Supabase Tables:**
```sql
-- clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  position TEXT,
  salary TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- content table  
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'activation', 'agreement', 'confirmation'
  data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Component Library

**Available Shadcn Components** (`components/ui/`):
- `Button` - Various button styles
- `Card` - Content containers
- `Dialog` - Modal dialogs
- `Form` - Form components
- `Input` - Text inputs
- `Table` - Data tables
- `Tabs` - Tabbed interfaces
- `Toast` - Notifications
- `Badge` - Status indicators
- `Avatar` - User avatars
- `Calendar` - Date pickers
- `Sheet` - Slide-out panels

**Usage Example:**
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Button onClick={handleClick}>Click me</Button>
  </CardContent>
</Card>
```

---

## 🆘 Getting Help

### Quick Self-Help

1. **Check this README** - Most answers are here
2. **Check browser console** - Look for red errors
3. **Restart dev server** - `pnpm dev` often fixes issues  
4. **Try fresh branch** - `git checkout main && git pull`

### Knowledge Base

**Project Memory System** (via Claude Code):
```bash
mcp__serena__list_memories  # See all available knowledge
mcp__serena__read_memory --memory_file_name "project_overview.md"
```

**Additional Documentation:**
- [`docs/QUICK-REFERENCE.md`](docs/QUICK-REFERENCE.md) - Fast orientation
- [`docs/CONTEXT-RECOVERY-GUIDE.md`](docs/CONTEXT-RECOVERY-GUIDE.md) - Detailed workflows
- [`docs/unified-workflow-guide.md`](docs/unified-workflow-guide.md) - BMAD + Serena unified workflow
- [`docs/SERENA-ORCHESTRATED-BMAD-WORKFLOW.md`](docs/SERENA-ORCHESTRATED-BMAD-WORKFLOW.md) - AI orchestration details
- [`docs/BMAD-ORCHESTRATION-QUICK-REFERENCE.md`](docs/BMAD-ORCHESTRATION-QUICK-REFERENCE.md) - Quick orchestration guide
- [`docs/GIT-WORKFLOW.md`](docs/GIT-WORKFLOW.md) - Complete Git guide
- [`CLAUDE.md`](CLAUDE.md) - Claude Code instructions

### Development Support

**For Code Issues:**
1. Use Claude Code with context recovery
2. Check `.serena/memories/` for detailed guides
3. Review recent commits: `git log --oneline -10`

**For Git Issues:**
1. Check [`docs/GIT-WORKFLOW.md`](docs/GIT-WORKFLOW.md)
2. Use `git status` to understand current state
3. Recovery commands in troubleshooting section above

**For Deployment Issues:**
1. Check GitHub Actions in repository
2. Verify environment variables
3. Test production build: `pnpm build && pnpm start`

---

## 📈 Keeping This README Current

> **🔄 Auto-Update Workflow**: This README is maintained through automated processes

### When to Update This README

**Automatic Updates** (via development workflow):
- New features added → Update features section
- New commands added → Update commands section  
- Architecture changes → Update structure section
- New dependencies → Update technology stack

**Manual Updates Needed:**
- Business goals change → Update purpose section
- New team members → Update contact information
- Major workflow changes → Update development process

### README Maintenance Rules

1. **Every PR should check README relevance**
2. **Feature additions must update relevant sections**
3. **Breaking changes require README updates**
4. **Keep troubleshooting section current**
5. **Version badges auto-update via GitHub Actions**

### Validation Checklist

Before any major release, verify:
- [ ] All links work (especially localhost URLs)
- [ ] Commands are accurate and tested
- [ ] File paths are correct
- [ ] Screenshots are current (if any)
- [ ] Environment variables are up to date
- [ ] Troubleshooting covers recent issues

---

**Last Updated**: Automatically maintained via GitHub Actions  
**Questions?** This README should answer everything - if not, it needs updating!

🤖 *This README is automatically maintained through the development workflow to ensure accuracy*