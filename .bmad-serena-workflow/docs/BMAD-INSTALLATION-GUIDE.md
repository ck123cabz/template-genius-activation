# BMAD Orchestrator Installation Guide

## 🚀 Quick Start: Extract & Install BMAD System

This guide shows how to extract the BMAD orchestration system from this project and install it in any other project.

---

## Step 1: Extract BMAD System from This Project

```bash
# Make the extraction script executable
chmod +x scripts/extract-bmad-system.sh

# Run the extraction
./scripts/extract-bmad-system.sh

# Output:
# 📦 Package created at: ../bmad-orchestrator
# Contains everything needed for installation
```

The extraction creates a portable `bmad-orchestrator` package in the parent directory.

---

## Step 2: Install in a New Project (Greenfield)

```bash
# 1. Create your new project
mkdir my-new-project
cd my-new-project
git init

# 2. Copy the bmad-orchestrator package
cp -r ../bmad-orchestrator .

# 3. Run the installer
cd bmad-orchestrator
./install.sh

# 4. Clean up (optional)
cd ..
rm -rf bmad-orchestrator  # Package files no longer needed
```

---

## Step 3: Install in an Existing Project (Brownfield)

```bash
# 1. Navigate to your existing project
cd existing-project

# 2. Copy the bmad-orchestrator package
cp -r path/to/bmad-orchestrator .

# 3. Run the installer
cd bmad-orchestrator
./install.sh
# Will detect existing project and preserve configurations

# 4. Clean up
cd ..
rm -rf bmad-orchestrator
```

---

## 📁 What Gets Installed

```
your-project/
├── .bmad-core/              # BMAD system
│   ├── agents/             # AI agent personas
│   ├── checklists/         # Quality checklists
│   ├── templates/          # Document templates
│   ├── tasks/              # Agent tasks
│   ├── core-config.yaml    # Configuration
│   └── epic-orchestration.yaml  # Orchestration settings
│
├── .claude/commands/        # Claude commands
│   ├── BMad/              # BMAD agent commands
│   └── bmad-execute-epic.md  # Orchestration command
│
├── docs/                   # Documentation structure
│   ├── stories/           # User stories
│   ├── prd/              # Product requirements
│   ├── architecture/     # Technical design
│   └── qa/               # Quality assurance
│
└── .serena/memories/       # Serena MCP memories (optional)
```

---

## ⚙️ Configuration

### Basic Configuration
Edit `.bmad-core/core-config.yaml`:

```yaml
# Adjust paths for your project structure
prd:
  prdFile: docs/prd.md      # Where PRDs are stored
  
architecture:
  architectureFile: docs/architecture.md
  
devStoryLocation: docs/stories  # Where stories go
```

### Orchestration Settings
Edit `.bmad-core/epic-orchestration.yaml`:

```yaml
orchestration:
  execution_mode: sequential  # or 'parallel'
  
  quality:
    minimum_gate: PASS       # Quality threshold
    require_tests: true
    
  human_approval:
    pre_epic: true          # Confirm before starting
    post_epic: true         # Approve completion
```

---

## 🎮 Using BMAD After Installation

### 1. Planning Phase (Manual)
```bash
# Open Claude Code in your project

# Create product requirements
/pm *create-prd

# Design architecture
/architect *create-full-stack-architecture  

# Create user stories
/po *shard-prd
```

### 2. Execution Phase (Automated!)
```bash
# Execute entire epic with one command
/bmad-execute-epic 1

# What happens automatically:
# ✓ SM drafts all stories
# ✓ Dev implements each story
# ✓ QA reviews everything
# ✓ Git commits with references
# ✓ PR created when done
```

---

## 📋 Manual Installation (Without Script)

If you prefer manual installation:

### 1. Copy Core Files
```bash
# From the extracted package
cp -r templates/.bmad-core your-project/
cp -r templates/.claude your-project/
```

### 2. Create Directory Structure
```bash
cd your-project
mkdir -p docs/stories
mkdir -p docs/prd  
mkdir -p docs/architecture
mkdir -p docs/qa
mkdir -p .serena/memories  # If using Serena MCP
```

### 3. Configure Settings
- Edit `.bmad-core/core-config.yaml`
- Adjust paths for your project
- Configure Git settings

### 4. Verify Installation
```bash
# In Claude Code
/pm *help  # Should show PM commands
/architect *help  # Should show Architect commands
```

---

## 🔧 Troubleshooting

### Issue: Commands Not Available
```bash
# Check if .claude/commands exists
ls -la .claude/commands/

# Ensure BMad folder is present
ls .claude/commands/BMad/
```

### Issue: Paths Not Working
```bash
# Verify directory structure
ls docs/
# Should see: stories/ prd/ architecture/

# Check config paths match
cat .bmad-core/core-config.yaml
```

### Issue: Existing Configuration Conflict
```bash
# Backup was created during install
cp .bmad-core/core-config.yaml.backup .bmad-core/core-config.yaml
# Then manually merge changes
```

---

## 🚀 Advanced: NPM Package Installation (Future)

Once published to NPM:

```bash
# Global installation
npm install -g @bmad/orchestrator
bmad init

# Or use npx
npx @bmad/orchestrator init

# Interactive setup
bmad configure  # Configuration wizard
bmad doctor    # Verify installation
```

---

## 📊 Verification Checklist

After installation, verify:

- [ ] `.bmad-core/` directory exists
- [ ] `.claude/commands/BMad/` has agent files
- [ ] `docs/stories/` directory created
- [ ] Can run `/pm *help` in Claude Code
- [ ] Can run `/bmad-execute-epic` command
- [ ] Git repository initialized (optional)
- [ ] Serena MCP working (optional)

---

## 🎯 Next Steps After Installation

1. **Start Planning**: `/pm *create-prd`
2. **Design System**: `/architect *create-full-stack-architecture`
3. **Create Stories**: `/po *shard-prd`
4. **Execute Automatically**: `/bmad-execute-epic 1`
5. **Monitor Progress**: Watch as Serena orchestrates everything!

---

## 📚 Additional Resources

- [BMAD System Extraction Analysis](BMAD-SYSTEM-EXTRACTION-ANALYSIS.md)
- [Serena Orchestration Workflow](SERENA-ORCHESTRATED-BMAD-WORKFLOW.md)
- [Quick Reference](BMAD-ORCHESTRATION-QUICK-REFERENCE.md)
- [Unified Workflow Guide](unified-workflow-guide.md)

---

**Transform any project with BMAD orchestration - from manual chaos to automated excellence!** 🚀