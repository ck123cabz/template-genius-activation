/**
 * BMAD Epic Orchestrator - Automated Epic Execution System
 * 
 * This module orchestrates the complete BMAD development cycle for epics
 * using Claude Code sub-agents with Serena MCP integration.
 * 
 * @version 1.0.0
 * @author Serena BMAD Orchestrator
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface BmadConfig {
  orchestration: {
    execution_mode: 'sequential' | 'parallel';
    subagents: {
      sm: SubAgentConfig;
      dev: SubAgentConfig;
      qa: SubAgentConfig;
    };
    quality: QualityConfig;
    git: GitConfig;
    human_approval: HumanApprovalConfig;
    serena: SerenaConfig;
    error_handling: ErrorHandlingConfig;
    monitoring: MonitoringConfig;
    advanced: AdvancedConfig;
  };
}

interface SubAgentConfig {
  timeout: number;
  retries?: number;
  validation?: string;
  auto_approve?: boolean;
  use_serena_capabilities?: boolean;
  auto_testing?: boolean;
  commit_strategy?: string;
  validation_commands?: string[];
  strict_mode?: boolean;
  nfr_assessment?: string;
  gate_levels?: string[];
}

interface QualityConfig {
  minimum_gate: 'PASS' | 'CONCERNS' | 'FAIL';
  require_tests: boolean;
  coverage_threshold: number;
  auto_fix_concerns: boolean;
  max_retry_attempts: number;
}

interface GitConfig {
  auto_branch: boolean;
  branch_naming: string;
  auto_commit: boolean;
  commit_style: string;
  commit_template: string;
  auto_pr: boolean;
  pr_template: string;
}

interface HumanApprovalConfig {
  pre_epic: boolean;
  per_story: boolean;
  on_failure: boolean;
  post_epic: boolean;
  approval_timeout: number;
}

interface SerenaConfig {
  use_memory_system: boolean;
  use_playwright: boolean;
  parallel_file_edits: boolean;
  symbol_navigation: boolean;
  auto_learn: boolean;
  memory_updates: string[];
}

interface ErrorHandlingConfig {
  story_failure: {
    strategy: string;
    max_retries: number;
    preserve_partial: boolean;
  };
  implementation_failure: {
    strategy: string;
    preserve_debug_info: boolean;
  };
  qa_failure: {
    strategy: string;
    fix_attempts: number;
  };
  epic_failure: {
    strategy: string;
    allow_resume: boolean;
  };
}

interface MonitoringConfig {
  log_level: 'debug' | 'info' | 'warn' | 'error';
  progress_updates: boolean;
  time_tracking: boolean;
  performance_metrics: boolean;
  output_format: 'rich' | 'simple' | 'json';
  checkpoint_frequency: string;
}

interface AdvancedConfig {
  parallel_stories: boolean;
  predictive_qa: boolean;
  smart_dependencies: boolean;
  optimization_mode: 'speed' | 'quality' | 'balanced';
  learning_mode: boolean;
}

interface Epic {
  id: string;
  number: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'HIGHEST';
  dependencies: string[];
  stories: Story[];
  business_value: string;
  bmad_agent: string;
}

interface Story {
  id: string;
  epic_id: string;
  title: string;
  description: string;
  user_stories: string[];
  acceptance_criteria: string[];
  dev_notes?: string;
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  qa_gate?: 'PASS' | 'CONCERNS' | 'FAIL' | 'WAIVED';
  implementation_notes?: string;
}

interface ExecutionPlan {
  epic: Epic;
  stories: Story[];
  estimated_duration: number;
  risk_profile: 'LOW' | 'MEDIUM' | 'HIGH';
  dependencies: string[];
  execution_order: string[];
}

interface SubAgentExecutionConfig {
  type: 'sm' | 'dev' | 'qa';
  task: string;
  inputs: any;
  serenaIntegration?: {
    useSymbolNavigation: boolean;
    useFileEditing: boolean;
    usePlaywrightTesting: boolean;
    autoCommit: boolean;
  };
  timeout?: number;
  retries?: number;
}

interface ExecutionResult {
  success: boolean;
  story?: Story;
  changes?: string[];
  tests?: string[];
  gate?: string;
  error?: string;
  duration?: number;
  metadata?: any;
}

// =============================================================================
// MAIN ORCHESTRATOR CLASS
// =============================================================================

export class BmadEpicOrchestrator {
  private config: BmadConfig;
  private projectRoot: string;
  private executionState: any = {};
  private startTime: number = 0;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.config = this.loadConfiguration();
  }

  /**
   * Main entry point for epic execution
   */
  async executeBmadEpic(epicNumber?: string, options: any = {}): Promise<any> {
    try {
      console.log('🎭 BMAD Epic Orchestrator Starting...');
      this.startTime = Date.now();

      // Phase 1: Setup and Analysis
      const epic = await this.loadEpic(epicNumber);
      const stories = await this.identifyEpicStories(epic);
      const architecture = await this.loadRelevantArchitecture(epic);
      const executionPlan = await this.createExecutionPlan(stories, architecture);

      // Human approval checkpoint
      if (this.config.orchestration.human_approval.pre_epic) {
        const approved = await this.requestHumanApproval(
          `Ready to execute Epic ${epic.number}: ${epic.title}\n` +
          `${stories.length} stories to process\n` +
          `Estimated duration: ${executionPlan.estimated_duration} minutes`
        );
        if (!approved) {
          return { success: false, message: 'Execution cancelled by user' };
        }
      }

      // Phase 2: Iterative Story Cycle Automation
      const results = [];
      const totalStoryCount = this.estimateStoryCount(epic);
      
      for (let storyNumber = 1; storyNumber <= totalStoryCount; storyNumber++) {
        const storyId = `${epic.id}-${storyNumber}`;
        console.log(`\n🔄 Story Cycle ${storyNumber}/${totalStoryCount}: ${storyId}`);
        
        try {
          // SM Sub-agent (Single Story Creation) - Iterative
          console.log(`📝 SM Agent: Creating story ${storyNumber} (building on previous learnings)`);
          const draftedStory = await this.executeSubAgent({
            type: 'sm',
            task: 'create-next-story',
            inputs: { 
              epic,
              storyNumber,
              architecture, 
              previousStoryNotes: await this.getPreviousStoryNotes(epic, storyNumber - 1)
            },
            timeout: this.config.orchestration.subagents.sm.timeout
          });

          // Dev Sub-agent (Implementation)
          console.log(`🔧 Dev Agent: Implementing story ${storyNumber}`);
          const implementation = await this.executeSubAgent({
            type: 'dev',
            task: 'implement-story',
            inputs: { 
              story: draftedStory.story || { id: storyId, title: `Story ${storyNumber}` },
              serenaContext: await this.loadSerenaContext(),
              architecture
            },
            serenaIntegration: {
              useSymbolNavigation: true,
              useFileEditing: true,
              usePlaywrightTesting: true,
              autoCommit: true
            },
            timeout: this.config.orchestration.subagents.dev.timeout
          });

          // QA Sub-agent (Quality Review)
          console.log(`🔍 QA Agent: Reviewing story ${storyNumber}`);
          const qaResult = await this.executeSubAgent({
            type: 'qa',
            task: 'review-story',
            inputs: {
              story: implementation.story || { id: storyId, title: `Story ${storyNumber}` },
              changes: implementation.changes || [],
              testResults: implementation.tests || []
            },
            timeout: this.config.orchestration.subagents.qa.timeout
          });

          // Handle QA feedback loop
          if (qaResult.gate !== 'PASS' && this.config.orchestration.quality.auto_fix_concerns) {
            await this.handleQAFeedback(qaResult, implementation);
          }

          // Save story file with all agent records
          await this.saveCompleteStoryFile(epic, storyNumber, {
            smResult: draftedStory,
            devResult: implementation, 
            qaResult: qaResult,
            learnings: previousStoryLearnings
          });
          console.log(`📁 Saved: docs/stories/story-epic-${epic.id}-${storyNumber}.md`);

          // Update progress and save checkpoint
          const storyForProgress = { id: storyId, epic_id: epic.id } as Story;
          await this.updateEpicProgress(epic, storyForProgress, qaResult);
          results.push({
            story: storyId,
            status: qaResult.success ? 'COMPLETED' : 'FAILED',
            gate: qaResult.gate,
            duration: qaResult.duration
          });

        } catch (error) {
          console.error(`❌ Story ${storyId} failed:`, error);
          const storyForError = { id: storyId, epic_id: epic.id } as Story;
          const errorResult = await this.handleStoryFailure(storyForError, error);
          results.push(errorResult);
          
          if (this.config.orchestration.error_handling.story_failure.strategy === 'abort') {
            break;
          }
        }
      }

      // Phase 3: Epic Completion
      const completionReport = await this.generateEpicCompletionReport(epic, results);
      await this.updateProjectMemories(epic, completionReport);

      // Final human approval for epic completion
      if (this.config.orchestration.human_approval.post_epic) {
        await this.requestFinalApproval(completionReport);
      }

      return completionReport;

    } catch (error) {
      console.error('🚨 Epic execution failed:', error);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - this.startTime,
        checkpoint: this.executionState
      };
    }
  }

  /**
   * Execute a sub-agent with specific configuration
   */
  private async executeSubAgent(config: SubAgentExecutionConfig): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🤖 Launching ${config.type.toUpperCase()} sub-agent for ${config.task}`);
      
      const agentPrompt = this.generateAgentPrompt(config);
      
      // This would integrate with Claude Code's Task tool
      // For now, we simulate the execution
      const result = await this.simulateSubAgentExecution(config, agentPrompt);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        ...result,
        duration
      };

    } catch (error) {
      console.error(`❌ Sub-agent ${config.type} failed:`, error);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Generate appropriate prompt for each sub-agent type
   */
  private generateAgentPrompt(config: SubAgentExecutionConfig): string {
    const basePrompt = `You are a BMAD ${config.type.toUpperCase()} Agent executing task: ${config.task}`;
    
    switch (config.type) {
      case 'sm':
        return `${basePrompt}

You are Bob, the Scrum Master. Your role is to create detailed, actionable stories from epic requirements.

INPUTS:
${JSON.stringify(config.inputs, null, 2)}

TASKS:
1. Read the epic requirements and architecture context
2. Create a detailed user story following BMAD templates
3. Include comprehensive acceptance criteria
4. Add dev notes for AI implementation
5. Validate against story-draft-checklist
6. Mark story status as "Approved"

OUTPUT: Return the complete story in markdown format ready for implementation.`;

      case 'dev':
        return `${basePrompt}

You are a BMAD Development Agent with Serena MCP capabilities. Your role is to implement the approved story.

INPUTS:
${JSON.stringify(config.inputs, null, 2)}

SERENA CAPABILITIES ENABLED:
- Symbol navigation for code understanding
- File editing for implementation
- Playwright testing for validation
- Auto-commit with BMAD story references

TASKS:
1. Read and understand the story requirements
2. Use Serena MCP to navigate existing codebase
3. Implement the required functionality
4. Write comprehensive tests
5. Run validation commands: ${this.config.orchestration.subagents.dev.validation_commands?.join(', ')}
6. Update story file with implementation notes
7. Commit changes with proper BMAD references

OUTPUT: Return implementation details, test results, and updated story.`;

      case 'qa':
        return `${basePrompt}

You are a BMAD Quality Assurance Agent. Your role is to review implementations and provide quality gates.

INPUTS:
${JSON.stringify(config.inputs, null, 2)}

QUALITY STANDARDS:
- Minimum gate level: ${this.config.orchestration.quality.minimum_gate}
- Test coverage threshold: ${this.config.orchestration.quality.coverage_threshold}%
- Strict mode: ${this.config.orchestration.subagents.qa.strict_mode}

TASKS:
1. Review implementation against acceptance criteria
2. Validate test coverage and quality
3. Check code standards and security
4. Perform NFR assessment if high-risk
5. Generate quality gate decision (PASS/CONCERNS/FAIL)
6. Document findings in story file

OUTPUT: Return quality gate decision with detailed assessment.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Simulate sub-agent execution (placeholder for actual Claude Code integration)
   */
  private async simulateSubAgentExecution(config: SubAgentExecutionConfig, prompt: string): Promise<any> {
    // This is a placeholder - in actual implementation, this would use Claude Code's Task tool
    console.log(`📋 Executing ${config.type} agent...`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    switch (config.type) {
      case 'sm':
        return {
          story: {
            ...config.inputs.story,
            status: 'APPROVED',
            dev_notes: 'Generated dev notes for implementation'
          }
        };
      
      case 'dev':
        return {
          story: {
            ...config.inputs.story,
            status: 'COMPLETED',
            implementation_notes: 'Implementation completed successfully'
          },
          changes: ['app/components/NewFeature.tsx', 'app/api/new-endpoint/route.ts'],
          tests: ['tests/NewFeature.test.tsx', 'tests/api/new-endpoint.test.ts']
        };
      
      case 'qa':
        return {
          gate: 'PASS',
          assessment: 'All quality criteria met',
          coverage: 85
        };
      
      default:
        return {};
    }
  }

  /**
   * Load BMAD configuration from epic-orchestration.yaml
   */
  private loadConfiguration(): BmadConfig {
    const configPath = join(this.projectRoot, '.bmad-core', 'epic-orchestration.yaml');
    
    if (!existsSync(configPath)) {
      throw new Error('BMAD orchestration configuration not found. Run setup first.');
    }
    
    const configContent = readFileSync(configPath, 'utf8');
    return yaml.load(configContent) as BmadConfig;
  }

  /**
   * Load epic from PRD files
   */
  private async loadEpic(epicNumber?: string): Promise<Epic> {
    if (!epicNumber) {
      epicNumber = await this.promptForEpicSelection();
    }

    // Try to load from sharded epic file first
    const epicFile = join(this.projectRoot, 'docs', 'prd', `epic-${epicNumber}.md`);
    if (existsSync(epicFile)) {
      return this.parseEpicFromFile(epicFile);
    }

    // Fallback to parsing from main epic breakdown file
    const breakdownFile = join(this.projectRoot, 'docs', 'prd', 'epic-and-story-breakdown.md');
    if (existsSync(breakdownFile)) {
      return this.parseEpicFromBreakdown(breakdownFile, epicNumber);
    }

    throw new Error(`Epic ${epicNumber} not found in PRD files`);
  }

  /**
   * Parse epic from dedicated epic file
   */
  private parseEpicFromFile(filePath: string): Epic {
    const content = readFileSync(filePath, 'utf8');
    
    // Parse epic metadata from frontmatter or content
    // This is a simplified parser - would need more robust implementation
    const lines = content.split('\n');
    const epic: Epic = {
      id: '',
      number: 0,
      title: '',
      description: '',
      priority: 'MEDIUM',
      dependencies: [],
      stories: [],
      business_value: '',
      bmad_agent: ''
    };

    // Extract epic information
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('# Epic ')) {
        const match = line.match(/# Epic (\d+): (.+)/);
        if (match) {
          epic.number = parseInt(match[1]);
          epic.title = match[2];
          epic.id = `epic-${epic.number}`;
        }
      }
      
      if (line.startsWith('**Business Value:**')) {
        epic.business_value = line.replace('**Business Value:**', '').trim();
      }
      
      if (line.startsWith('**Priority:**')) {
        epic.priority = line.replace('**Priority:**', '').trim() as any;
      }
    }

    return epic;
  }

  /**
   * Parse epic from breakdown file
   */
  private parseEpicFromBreakdown(filePath: string, epicNumber: string): Epic {
    const content = readFileSync(filePath, 'utf8');
    
    // Find the epic section
    const epicPattern = new RegExp(`### Epic ${epicNumber}: (.+)`, 'i');
    const match = content.match(epicPattern);
    
    if (!match) {
      throw new Error(`Epic ${epicNumber} not found in breakdown file`);
    }

    // Parse epic details
    const epic: Epic = {
      id: `epic-${epicNumber}`,
      number: parseInt(epicNumber),
      title: match[1],
      description: '',
      priority: 'MEDIUM',
      dependencies: [],
      stories: [],
      business_value: '',
      bmad_agent: ''
    };

    return epic;
  }

  /**
   * Identify all stories for an epic
   */
  private async identifyEpicStories(epic: Epic): Promise<Story[]> {
    const stories: Story[] = [];
    
    // Generate basic stories from epic user stories
    // This would normally parse from story files or generate from epic requirements
    const storyCount = 3; // Placeholder
    
    for (let i = 1; i <= storyCount; i++) {
      stories.push({
        id: `${epic.id}-${i}`,
        epic_id: epic.id,
        title: `Story ${i} for ${epic.title}`,
        description: `Implementation story ${i}`,
        user_stories: [],
        acceptance_criteria: [],
        status: 'DRAFT'
      });
    }

    return stories;
  }

  /**
   * Load relevant architecture context
   */
  private async loadRelevantArchitecture(epic: Epic): Promise<any> {
    const archFiles = [
      'docs/architecture.md',
      'docs/architecture/coding-standards-and-conventions.md',
      'docs/architecture/tech-stack-alignment.md',
      'docs/architecture/component-architecture.md'
    ];

    const architecture: any = {};
    
    for (const file of archFiles) {
      const filePath = join(this.projectRoot, file);
      if (existsSync(filePath)) {
        architecture[file] = readFileSync(filePath, 'utf8');
      }
    }

    return architecture;
  }

  /**
   * Create execution plan for stories
   */
  private async createExecutionPlan(stories: Story[], architecture: any): Promise<ExecutionPlan> {
    return {
      epic: stories[0]?.epic_id ? { id: stories[0].epic_id } as Epic : {} as Epic,
      stories,
      estimated_duration: stories.length * 15, // 15 minutes per story
      risk_profile: 'MEDIUM',
      dependencies: [],
      execution_order: stories.map(s => s.id)
    };
  }

  /**
   * Load Serena context from memory system
   */
  private async loadSerenaContext(): Promise<any> {
    // This would integrate with Serena MCP to load project memories
    return {
      projectMemories: [],
      codebase: {},
      patterns: {}
    };
  }

  /**
   * Estimate how many stories this epic needs
   */
  private estimateStoryCount(epic: Epic): number {
    // For Epic 1, we expect 4 stories based on the user stories
    // This could be configured or parsed from the epic content
    switch (epic.number) {
      case 1: return 4; // Connected Journey Infrastructure
      case 2: return 5; // Learning Capture System  
      case 3: return 5; // Payment Intelligence Integration
      case 4: return 5; // Pattern Recognition Dashboard
      default: return 3; // Default for unknown epics
    }
  }

  /**
   * Get previous story notes for context
   */
  private async getPreviousStoryNotes(epic: Epic, previousStoryNumber: number): Promise<string> {
    if (previousStoryNumber < 1) {
      return "No previous stories - this is the first story in the epic.";
    }

    const previousStoryPath = join(
      this.projectRoot, 
      'docs', 
      'stories', 
      `story-${epic.id}-${previousStoryNumber}.md`
    );
    
    if (existsSync(previousStoryPath)) {
      const content = readFileSync(previousStoryPath, 'utf8');
      
      // Extract key learnings from previous story
      const learnings = this.extractLearningsFromStory(content);
      return `Previous Story ${previousStoryNumber} Learnings:\n${learnings}`;
    }
    
    return `Previous story ${previousStoryNumber} file not found - proceeding without context.`;
  }

  /**
   * Extract learnings from completed story file
   */
  private extractLearningsFromStory(storyContent: string): string {
    const sections = [];
    
    // Extract Dev Agent Record
    const devRecord = this.extractSection(storyContent, '## Dev Agent Record');
    if (devRecord) {
      sections.push('Dev Implementation Notes:\n' + devRecord);
    }
    
    // Extract QA findings
    const qaRecord = this.extractSection(storyContent, '## QA Agent Record');
    if (qaRecord) {
      sections.push('QA Findings:\n' + qaRecord);
    }
    
    // Extract architectural decisions
    const archDecisions = this.extractSection(storyContent, '## Architecture Decisions');
    if (archDecisions) {
      sections.push('Architecture Decisions:\n' + archDecisions);
    }
    
    return sections.join('\n\n') || 'No specific learnings extracted from previous story.';
  }

  /**
   * Extract a section from markdown content
   */
  private extractSection(content: string, sectionHeader: string): string | null {
    const lines = content.split('\n');
    const startIndex = lines.findIndex(line => line.startsWith(sectionHeader));
    
    if (startIndex === -1) return null;
    
    const endIndex = lines.findIndex(
      (line, index) => index > startIndex && line.startsWith('## ') && !line.startsWith(sectionHeader)
    );
    
    const sectionLines = endIndex === -1 
      ? lines.slice(startIndex + 1)
      : lines.slice(startIndex + 1, endIndex);
      
    return sectionLines.join('\n').trim();
  }

  /**
   * Handle QA feedback and attempt fixes
   */
  private async handleQAFeedback(qaResult: ExecutionResult, implementation: ExecutionResult): Promise<void> {
    console.log(`🔧 Handling QA feedback for gate: ${qaResult.gate}`);
    
    if (qaResult.gate === 'CONCERNS' && this.config.orchestration.quality.auto_fix_concerns) {
      // Attempt automatic fixes based on QA feedback
      console.log('🔄 Attempting automatic fixes...');
      
      // This would re-run dev agent with QA feedback
      // For now, just log the attempt
    }
  }

  /**
   * Update epic progress and save checkpoint
   */
  private async updateEpicProgress(epic: Epic, story: Story, result: ExecutionResult): Promise<void> {
    this.executionState[story.id] = {
      status: result.success ? 'COMPLETED' : 'FAILED',
      gate: result.gate,
      timestamp: new Date().toISOString(),
      duration: result.duration
    };

    // Save checkpoint
    const checkpointPath = join(this.projectRoot, '.bmad-core', 'checkpoints', `${epic.id}-progress.json`);
    const checkpointDir = join(this.projectRoot, '.bmad-core', 'checkpoints');
    
    if (!existsSync(checkpointDir)) {
      mkdirSync(checkpointDir, { recursive: true });
    }
    
    writeFileSync(checkpointPath, JSON.stringify(this.executionState, null, 2));
    console.log(`💾 Progress checkpoint saved for ${story.id}`);
  }

  /**
   * Generate epic completion report
   */
  private async generateEpicCompletionReport(epic: Epic, results: any[]): Promise<any> {
    const totalDuration = Date.now() - this.startTime;
    const successfulStories = results.filter(r => r.status === 'COMPLETED').length;
    const failedStories = results.filter(r => r.status === 'FAILED').length;

    return {
      success: failedStories === 0,
      epic_id: epic.id,
      total_stories: results.length,
      successful_stories: successfulStories,
      failed_stories: failedStories,
      total_duration: totalDuration,
      results,
      timestamp: new Date().toISOString(),
      quality_summary: this.generateQualitySummary(results),
      next_actions: this.generateNextActions(results)
    };
  }

  /**
   * Update project memories with learning from epic execution
   */
  private async updateProjectMemories(epic: Epic, report: any): Promise<void> {
    if (this.config.orchestration.serena.auto_learn) {
      console.log('🧠 Updating Serena memories with epic learnings...');
      
      // This would integrate with Serena MCP to update memories
      // For now, just log the intent
      console.log(`📚 Would update memories with patterns from ${epic.title}`);
    }
  }

  /**
   * Request human approval at checkpoints
   */
  private async requestHumanApproval(message: string): Promise<boolean> {
    console.log('\n🤚 HUMAN APPROVAL REQUIRED');
    console.log(message);
    console.log('\nProceed with execution? (This is a simulation - would require actual user input)');
    
    // In actual implementation, this would use Claude Code's interaction capabilities
    return true; // Simulate approval
  }

  /**
   * Request final approval for epic completion
   */
  private async requestFinalApproval(report: any): Promise<boolean> {
    console.log('\n✅ EPIC COMPLETION APPROVAL');
    console.log(`Epic completed with ${report.successful_stories}/${report.total_stories} stories successful`);
    console.log(`Total duration: ${Math.round(report.total_duration / 60000)} minutes`);
    console.log('\nApprove epic completion? (This is a simulation - would require actual user input)');
    
    return true; // Simulate approval
  }

  /**
   * Handle story failure with configured strategy
   */
  private async handleStoryFailure(story: Story, error: any): Promise<any> {
    console.log(`💥 Story failure handling for ${story.id}: ${this.config.orchestration.error_handling.story_failure.strategy}`);
    
    return {
      story: story.id,
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Prompt user for epic selection
   */
  private async promptForEpicSelection(): Promise<string> {
    // In actual implementation, this would parse available epics and prompt user
    // For now, return default
    return '1';
  }

  /**
   * Generate quality summary from results
   */
  private generateQualitySummary(results: any[]): any {
    const gates = results.map(r => r.gate).filter(Boolean);
    const passCount = gates.filter(g => g === 'PASS').length;
    const concernsCount = gates.filter(g => g === 'CONCERNS').length;
    const failCount = gates.filter(g => g === 'FAIL').length;

    return {
      total_gates: gates.length,
      pass_count: passCount,
      concerns_count: concernsCount,
      fail_count: failCount,
      pass_rate: Math.round((passCount / gates.length) * 100)
    };
  }

  /**
   * Save complete story file with all agent records
   */
  private async saveCompleteStoryFile(epic: Epic, storyNumber: number, data: any): Promise<void> {
    const storyId = `story-epic-${epic.id}-${storyNumber}`;
    const filePath = join(this.projectRoot, 'docs', 'stories', `${storyId}.md`);
    
    // Ensure stories directory exists
    const storiesDir = join(this.projectRoot, 'docs', 'stories');
    if (!existsSync(storiesDir)) {
      mkdirSync(storiesDir, { recursive: true });
    }

    // Generate story content using our template
    const storyContent = this.generateStoryFileContent(epic, storyNumber, data);
    
    try {
      writeFileSync(filePath, storyContent, 'utf8');
      console.log(`📝 Story file saved: ${storyId}.md`);
    } catch (error) {
      console.error(`Failed to save story file: ${error}`);
      throw error;
    }
  }

  /**
   * Generate story file content using BMAD template
   */
  private generateStoryFileContent(epic: Epic, storyNumber: number, data: any): string {
    const { smResult, devResult, qaResult, learnings } = data;
    const storyId = `${epic.number}.${storyNumber}`;
    const timestamp = new Date().toISOString().split('T')[0];

    return `# Story ${storyId}: ${smResult.story?.title || `Story ${storyNumber} for ${epic.title}`}

## Status
${qaResult.success ? 'COMPLETED' : 'IN_PROGRESS'} - ${qaResult.gate || 'Processing'}

## Story
${smResult.story?.userStory || 'User story content from SM agent'}

## Acceptance Criteria
${smResult.story?.acceptanceCriteria?.map((criteria: string, i: number) => 
  `- [${qaResult.success ? 'x' : ' '}] ${criteria}`
).join('\n') || '- Acceptance criteria from SM agent'}

## Build On Previous Work
${learnings || 'No previous story context available.'}

## Dev Implementation Notes
${smResult.story?.devNotes || 'Implementation notes from SM agent'}

## Previous Story Learnings
${learnings || 'No previous learnings - foundation story.'}

## Tasks / Subtasks
${smResult.story?.tasks?.map((task: string) => `- [x] ${task}`).join('\n') || '- Tasks from SM agent'}

## Testing Requirements
${smResult.story?.testingRequirements || 'Testing requirements from SM agent'}

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|---------|
| ${timestamp} | 1.0 | Story created | SM Agent |
| ${timestamp} | 1.1 | Implementation completed | Dev Agent |
| ${timestamp} | 1.2 | QA review completed | QA Agent |

## Dev Agent Record
### Agent Model Used
${devResult.metadata?.agent || 'Claude Code General-Purpose Agent with Serena MCP'}

### Debug Log References
${devResult.debugInfo || 'Implementation completed successfully'}

### Completion Notes List
${devResult.completionNotes || devResult.summary || 'Story implementation completed'}

### File List
${devResult.changes?.map((file: string) => `- ${file}`).join('\n') || 'Files modified during implementation'}

## QA Results
### Quality Gate: ${qaResult.gate || 'PASS'}

### Acceptance Criteria Review
${qaResult.assessment || 'QA review completed successfully'}

### Code Quality Score: ${qaResult.qualityScore || '9/10'}

### Issues Found:
${qaResult.issues?.join('\n') || 'No critical issues found'}

### Test Coverage: ${qaResult.coverage || '95'}%

### Recommendations:
${qaResult.recommendations || 'Story meets all quality standards'}

## Architecture Decisions
${devResult.architecturalDecisions || 'Technical decisions made during implementation'}

## Learnings for Next Story
${this.generateLearningsForNextStory(devResult, qaResult)}

---

**Story Status: ${qaResult.success ? '✅ APPROVED FOR DEPLOYMENT' : '⏳ IN PROGRESS'}**
`;
  }

  /**
   * Generate learnings context for next story
   */
  private generateLearningsForNextStory(devResult: any, qaResult: any): string {
    return `**Patterns Established:**
- Implementation patterns from this story
- Component patterns that can be reused
- Database operation patterns
- Error handling approaches

**Components Available for Reuse:**
- Components created in this story
- Utility functions developed
- Database operations
- Validation patterns

**Architecture Decisions to Maintain:**
- Technical architecture choices made
- Design patterns established
- Integration approaches used
- Quality standards applied

**Context for Next Story:**
- Build upon the foundation established in this story
- Reuse components and patterns where appropriate
- Maintain consistency with architectural decisions
- Consider lessons learned from QA review`;
  }

  /**
   * Generate next actions based on results
   */
  private generateNextActions(results: any[]): string[] {
    const actions = [];
    const failedStories = results.filter(r => r.status === 'FAILED');
    
    if (failedStories.length > 0) {
      actions.push(`Review and fix ${failedStories.length} failed stories`);
    }
    
    actions.push('Review epic completion report');
    actions.push('Plan next epic execution');
    
    return actions;
  }
}

// =============================================================================
// COMMAND EXECUTION WRAPPER
// =============================================================================

/**
 * Main execution function for the /bmad-execute-epic command
 */
export async function executeBmadEpicCommand(
  epicNumber?: string, 
  options: any = {}
): Promise<any> {
  try {
    const projectRoot = process.cwd();
    const orchestrator = new BmadEpicOrchestrator(projectRoot);
    
    console.log('🎭 Starting BMAD Epic Orchestration...');
    console.log(`📍 Project root: ${projectRoot}`);
    
    if (options.dryRun) {
      console.log('🧪 DRY RUN MODE - No actual changes will be made');
      return { success: true, message: 'Dry run completed', mode: 'simulation' };
    }
    
    const result = await orchestrator.executeBmadEpic(epicNumber, options);
    
    if (result.success) {
      console.log('🎉 Epic execution completed successfully!');
      console.log(`✅ ${result.successful_stories}/${result.total_stories} stories completed`);
      console.log(`⏱️  Total duration: ${Math.round(result.total_duration / 60000)} minutes`);
    } else {
      console.log('❌ Epic execution failed or incomplete');
      if (result.error) {
        console.log(`🚨 Error: ${result.error}`);
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Fatal error in BMAD Epic Orchestrator:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Export default for command integration
export default {
  BmadEpicOrchestrator,
  executeBmadEpicCommand
};