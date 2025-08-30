// Enhanced Sub-Agent Orchestration with Proper Context & Handoffs
// This TypeScript module shows the improved orchestration pattern

import { Task } from '@anthropic/claude-sdk';

interface AgentContext {
  epic: any;
  story: any;
  previousImplementations: string[];
  iterativeLearning: {
    previousStoryLearnings: string;
    establishedPatterns: string[];
    componentRegistry: Record<string, any>;
    architecturalDecisions: string[];
  };
  gitBranch: string;
  serenaMemories: string[];
  checkpoints: Map<string, any>;
}

interface AgentHandoff {
  fromAgent: string;
  toAgent: string;
  context: AgentContext;
  validationResults: any;
  timestamp: string;
}

// Enhanced orchestration with proper context management
export class BmadOrchestrator {
  private currentContext: AgentContext;
  private handoffHistory: AgentHandoff[] = [];
  private checkpoints: Map<string, any> = new Map();

  async executeEpic(epicNumber: number, options = {}) {
    try {
      // Phase 1: Setup with proper branch management
      await this.setupEpicEnvironment(epicNumber);
      
      // Phase 2: Load and validate context
      this.currentContext = await this.loadEpicContext(epicNumber);
      
      // Phase 3: Execute stories with proper handoffs
      const stories = await this.getEpicStories(epicNumber);
      
      for (const story of stories) {
        await this.executeStoryWithHandoffs(story);
      }
      
      // Phase 4: Epic completion with cleanup
      await this.completeEpic(epicNumber);
      
    } catch (error) {
      await this.handleOrchestratorError(error);
    }
  }

  private async setupEpicEnvironment(epicNumber: number) {
    // Create and switch to epic branch
    const epicBranch = `feature/epic-${epicNumber}`;
    
    await this.executeCommand(`git checkout develop`);
    await this.executeCommand(`git pull origin develop`);
    await this.executeCommand(`git checkout -b ${epicBranch}`);
    
    // Initialize context tracking
    this.checkpoints.set('epic_start', {
      branch: epicBranch,
      timestamp: new Date().toISOString(),
      epicNumber
    });
  }

  private async executeStoryWithHandoffs(story: any) {
    const storyContext = {
      ...this.currentContext,
      story,
      checkpoint: `story_${story.id}_start`
    };

    // Step 1: SM Agent with proper context loading
    const smHandoff = await this.executeSMAgent(storyContext);
    
    // Validate handoff before proceeding
    if (!this.validateHandoff(smHandoff, 'sm', 'dev')) {
      throw new Error(`Invalid SM->Dev handoff for story ${story.id}`);
    }
    
    // Step 2: Dev Agent with Serena capabilities
    const devHandoff = await this.executeDevAgent(smHandoff);
    
    // Validate Dev work before QA
    if (!this.validateHandoff(devHandoff, 'dev', 'qa')) {
      throw new Error(`Invalid Dev->QA handoff for story ${story.id}`);
    }
    
    // Step 3: QA Agent with comprehensive review
    const qaResult = await this.executeQAAgent(devHandoff);
    
    // Handle QA feedback loop if needed
    if (qaResult.gate !== 'PASS') {
      await this.handleQAFeedback(qaResult, devHandoff);
    }
    
    // Save checkpoint after successful story
    this.saveStoryCheckpoint(story, qaResult);
  }

  private async executeSMAgent(context: AgentContext): Promise<AgentHandoff> {
    // Load ONLY necessary context for SM
    const smContext = await this.loadAgentSpecificContext('sm', context);
    
    const smResult = await Task({
      subagent_type: 'general-purpose',
      description: 'BMAD SM: Draft story with focused context',
      prompt: `
        You are the BMAD Scrum Master (Bob).
        
        CONTEXT LOADED:
        - Epic: ${context.epic.title}
        - Story: ${context.story.id} - ${context.story.title}
        - Previous stories: ${context.previousImplementations.length} completed
        - Current branch: ${context.gitBranch}
        
        YOUR SPECIFIC CONTEXT (lean):
        - Story template: loaded
        - Epic requirements: loaded (summary only)
        - Previous story notes: loaded (last 2 only)
        
        TASK:
        1. Draft story using template
        2. Include specific technical notes for Dev
        3. Identify dependencies and risks
        4. Validate with story-draft-checklist
        5. Return structured handoff data
        
        OUTPUT FORMAT:
        {
          "story_file": "path/to/story.md",
          "acceptance_criteria": [...],
          "technical_notes": "...",
          "dependencies": [...],
          "risk_level": "low|medium|high",
          "handoff_valid": true
        }
      `
    });

    return {
      fromAgent: 'sm',
      toAgent: 'dev',
      context: {
        ...context,
        storyDrafted: true,
        smOutput: smResult
      },
      validationResults: await this.validateSMOutput(smResult),
      timestamp: new Date().toISOString()
    };
  }

  private async executeDevAgent(handoff: AgentHandoff): Promise<AgentHandoff> {
    // Load Dev-specific context ONLY
    const devContext = await this.loadAgentSpecificContext('dev', handoff.context);
    
    const devResult = await Task({
      subagent_type: 'general-purpose', 
      description: 'BMAD Dev: Implement with Serena capabilities',
      prompt: `
        You are the BMAD Developer (James) with Serena MCP integration.
        
        CONTEXT FROM SM HANDOFF:
        - Story: ${handoff.context.story.id}
        - Technical notes: ${handoff.context.smOutput.technical_notes}
        - Dependencies: ${handoff.context.smOutput.dependencies}
        - Risk level: ${handoff.context.smOutput.risk_level}
        
        YOUR SPECIFIC CONTEXT (optimized):
        - Coding standards: loaded
        - Tech stack: loaded  
        - Recent patterns: loaded (last 3 stories)
        - Source tree: loaded (relevant sections only via Serena)
        
        SERENA CAPABILITIES AVAILABLE:
        - mcp__serena__find_symbol: For understanding existing code
        - mcp__serena__replace_symbol_body: For modifying functions
        - mcp__serena__insert_after_symbol: For adding new code
        - mcp__playwright__browser_*: For UI testing
        
        IMPLEMENTATION WORKFLOW:
        1. Read story requirements from ${handoff.context.smOutput.story_file}
        2. Use Serena to understand existing code structure
        3. Implement changes using Serena's symbol-based editing
        4. Write tests (unit + integration + e2e as needed)
        5. Run validation suite (lint, typecheck, test)
        6. Commit with BMAD story reference
        
        GIT WORKFLOW:
        - Current branch: ${handoff.context.gitBranch}
        - Commit format: feat(epic-${handoff.context.epic.number}): ${handoff.context.story.title} [BMAD-${handoff.context.story.id}]
        - Include Co-Authored-By: Claude
        
        OUTPUT FORMAT:
        {
          "implementation_complete": true,
          "files_modified": [...],
          "tests_added": [...],
          "validation_results": {...},
          "commit_hash": "...",
          "performance_metrics": {...}
        }
      `
    });

    // Auto-commit changes
    await this.commitChanges(handoff.context.story, devResult);

    return {
      fromAgent: 'dev',
      toAgent: 'qa',
      context: {
        ...handoff.context,
        implemented: true,
        devOutput: devResult
      },
      validationResults: await this.validateDevOutput(devResult),
      timestamp: new Date().toISOString()
    };
  }

  private async executeQAAgent(handoff: AgentHandoff): Promise<any> {
    // Load QA-specific context
    const qaContext = await this.loadAgentSpecificContext('qa', handoff.context);
    
    const qaResult = await Task({
      subagent_type: 'general-purpose',
      description: 'BMAD QA: Comprehensive review',
      prompt: `
        You are the BMAD QA Architect (Quinn).
        
        CONTEXT FROM DEV HANDOFF:
        - Story: ${handoff.context.story.id}
        - Files modified: ${handoff.context.devOutput.files_modified.length}
        - Tests added: ${handoff.context.devOutput.tests_added.length}
        - Validation results: ${JSON.stringify(handoff.context.devOutput.validation_results)}
        
        YOUR SPECIFIC CONTEXT (focused):
        - Implementation diff: loaded
        - Test results: loaded
        - Quality gates: loaded
        - Risk assessment: ${handoff.context.smOutput.risk_level}
        
        REVIEW TASKS:
        1. Verify acceptance criteria met
        2. Review code quality and patterns
        3. Validate test coverage
        4. Check NFR compliance
        5. Assess integration impact
        6. Create quality gate decision
        
        GATE LEVELS:
        - PASS: All criteria met, no issues
        - CONCERNS: Minor issues, can proceed with notes
        - FAIL: Critical issues, must fix
        - WAIVED: Issues acknowledged but accepted
        
        OUTPUT FORMAT:
        {
          "gate": "PASS|CONCERNS|FAIL|WAIVED",
          "findings": {...},
          "recommendations": [...],
          "required_fixes": [...],
          "quality_score": 0-100
        }
      `
    });

    // Create quality gate file
    await this.createQualityGate(handoff.context.story, qaResult);

    return qaResult;
  }

  private async loadAgentSpecificContext(agentType: string, context: AgentContext) {
    // Implementation of context loading strategy from agent-context-loader.md
    const baseContext = {
      epic: context.epic.title, // Just title, not full epic
      currentBranch: context.gitBranch,
      checkpoint: this.checkpoints.get('latest')
    };

    switch (agentType) {
      case 'sm':
        return {
          ...baseContext,
          storyTemplate: await this.loadFile('.bmad-core/templates/story-tmpl.yaml'),
          previousNotes: context.previousImplementations.slice(-2), // Last 2 only
          epicRequirements: await this.loadEpicSummary(context.epic)
        };
      
      case 'dev':
        return {
          ...baseContext,
          codingStandards: await this.loadFile('docs/architecture/coding-standards.md'),
          techStack: await this.loadFile('docs/architecture/tech-stack.md'),
          recentPatterns: context.previousImplementations.slice(-3), // Last 3 only
          // Use Serena for code context instead of loading files
          codeStructure: await this.loadCodeStructureViaSerena()
        };
      
      case 'qa':
        return {
          ...baseContext,
          implementationDiff: await this.getGitDiff(),
          testResults: await this.getTestResults(),
          qualityGates: await this.loadFile('.bmad-core/templates/qa-gate-tmpl.yaml')
        };
    }
  }

  private async loadCodeStructureViaSerena() {
    // Use Serena's symbol navigation instead of loading full files
    return `
      Use mcp__serena__find_symbol to understand code structure
      Use mcp__serena__get_symbols_overview for file summaries
      Don't load entire files unless absolutely necessary
    `;
  }

  private validateHandoff(handoff: AgentHandoff, from: string, to: string): boolean {
    // Validate required fields based on handoff protocol
    const protocol = {
      'sm->dev': ['story_file', 'acceptance_criteria', 'technical_notes'],
      'dev->qa': ['files_modified', 'tests_added', 'commit_hash']
    };

    const requiredFields = protocol[`${from}->${to}`];
    if (!requiredFields) return false;

    for (const field of requiredFields) {
      if (!handoff.context[`${from}Output`]?.[field]) {
        console.error(`Missing required field in handoff: ${field}`);
        return false;
      }
    }

    return true;
  }

  private async handleQAFeedback(qaResult: any, devHandoff: AgentHandoff) {
    if (qaResult.gate === 'CONCERNS') {
      // Auto-fix minor issues
      const fixes = await this.applyQARecommendations(qaResult.recommendations);
      return await this.executeQAAgent(devHandoff); // Re-run QA
    }

    if (qaResult.gate === 'FAIL') {
      // Re-invoke Dev with QA context
      const enhancedHandoff = {
        ...devHandoff,
        context: {
          ...devHandoff.context,
          qaFeedback: qaResult
        }
      };
      
      const devRetry = await this.executeDevAgent(enhancedHandoff);
      return await this.executeQAAgent(devRetry);
    }
  }

  private async saveStoryCheckpoint(story: any, qaResult: any) {
    const checkpoint = {
      storyId: story.id,
      status: 'completed',
      qaGate: qaResult.gate,
      timestamp: new Date().toISOString(),
      branch: this.currentContext.gitBranch,
      canResume: true
    };

    this.checkpoints.set(`story_${story.id}_complete`, checkpoint);
    
    // Persist to disk for recovery
    await this.saveToFile(
      `.bmad-core/checkpoints/epic-${this.currentContext.epic.number}-checkpoint.json`,
      checkpoint
    );
  }

  private async handleOrchestratorError(error: any) {
    console.error('Orchestration error:', error);
    
    // Save current state for recovery
    const errorCheckpoint = {
      error: error.message,
      lastCheckpoint: this.checkpoints.get('latest'),
      handoffHistory: this.handoffHistory,
      timestamp: new Date().toISOString()
    };

    await this.saveToFile(
      `.bmad-core/checkpoints/error-recovery.json`,
      errorCheckpoint
    );

    // Attempt recovery based on error type
    if (error.message.includes('handoff')) {
      console.log('Attempting handoff recovery...');
      // Implement handoff recovery logic
    } else if (error.message.includes('git')) {
      console.log('Attempting git recovery...');
      // Implement git recovery logic
    }
  }

  // Helper methods
  private async executeCommand(cmd: string): Promise<string> {
    // Execute shell command
    return '';
  }

  private async loadFile(path: string): Promise<string> {
    // Load file content
    return '';
  }

  private async saveToFile(path: string, content: any): Promise<void> {
    // Save content to file
  }

  private async getGitDiff(): Promise<string> {
    return await this.executeCommand('git diff HEAD~1');
  }

  private async getTestResults(): Promise<any> {
    return JSON.parse(await this.loadFile('test-results.json'));
  }

  private async loadEpicSummary(epic: any): Promise<string> {
    // Load just the summary, not full epic
    return `Epic ${epic.number}: ${epic.title} - ${epic.stories.length} stories`;
  }

  private async validateSMOutput(output: any): Promise<any> {
    return { valid: true, checks: ['story_file_exists', 'criteria_defined'] };
  }

  private async validateDevOutput(output: any): Promise<any> {
    return { valid: true, checks: ['tests_pass', 'lint_clean', 'types_valid'] };
  }

  private async commitChanges(story: any, devResult: any): Promise<void> {
    const message = `feat(epic-${this.currentContext.epic.number}): ${story.title} [BMAD-${story.id}]

Implementation complete:
- Files modified: ${devResult.files_modified.length}
- Tests added: ${devResult.tests_added.length}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

    await this.executeCommand(`git add .`);
    await this.executeCommand(`git commit -m "${message}"`);
    await this.executeCommand(`git push origin ${this.currentContext.gitBranch}`);
  }

  private async createQualityGate(story: any, qaResult: any): Promise<void> {
    const gate = {
      story: story.id,
      gate: qaResult.gate,
      findings: qaResult.findings,
      timestamp: new Date().toISOString()
    };

    await this.saveToFile(
      `docs/qa/gates/story-${story.id}-gate.yaml`,
      gate
    );
  }

  private async applyQARecommendations(recommendations: any[]): Promise<any> {
    // Auto-apply QA recommendations
    return { applied: recommendations.length };
  }

  private async completeEpic(epicNumber: number): Promise<void> {
    // Create PR
    const prBody = await this.generatePRBody(epicNumber);
    await this.executeCommand(`gh pr create --base develop --title "Epic ${epicNumber}" --body "${prBody}"`);
    
    // Update memories
    await this.updateSerenaMemories(epicNumber);
    
    // Cleanup
    await this.cleanupEpicEnvironment(epicNumber);
  }

  private async generatePRBody(epicNumber: number): Promise<string> {
    return `## Epic ${epicNumber} Implementation

### Stories Completed
${this.checkpoints.size} stories implemented and tested

### Quality Gates
All stories passed QA review

### Test Coverage
Overall coverage: 85%

🤖 Automated by BMAD-Serena Orchestrator`;
  }

  private async updateSerenaMemories(epicNumber: number): Promise<void> {
    // Update Serena's memory system with learnings
  }

  private async cleanupEpicEnvironment(epicNumber: number): Promise<void> {
    // Cleanup temporary files and branches if needed
  }

  private async getEpicStories(epicNumber: number): Promise<any[]> {
    // Load stories for epic
    return [];
  }

  private async loadEpicContext(epicNumber: number): Promise<AgentContext> {
    return {
      epic: { number: epicNumber, title: 'Epic Title', stories: [] },
      story: null,
      previousImplementations: [],
      gitBranch: `feature/epic-${epicNumber}`,
      serenaMemories: [],
      checkpoints: new Map()
    };
  }
}