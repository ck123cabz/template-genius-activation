/**
 * Pattern-Based Recommendation Engine
 * Epic 4, Story 4.1: Success Pattern Identification
 * 
 * AI-powered recommendation system that generates content and strategy suggestions
 * based on identified success patterns. Provides actionable recommendations for new clients.
 */

import {
  SuccessPattern,
  PatternRecommendation,
  RecommendationType,
  RecommendationData,
  ContentElements,
  ElementType
} from '../data-models/pattern-models';

// Recommendation scoring weights
const SCORING_WEIGHTS = {
  CONFIDENCE: 0.4,        // Pattern confidence score
  SAMPLE_SIZE: 0.2,       // Number of successful samples
  RECENCY: 0.15,          // How recent the pattern is
  CONSISTENCY: 0.15,      // How consistent the pattern is across samples
  STATISTICAL_SIG: 0.1    // Statistical significance (p-value)
};

// Client segment classifications
export type ClientSegment = 'startup' | 'small-business' | 'enterprise' | 'ecommerce' | 'saas' | 'consulting' | 'general';

// Recommendation context for personalization
export interface RecommendationContext {
  clientSegment?: ClientSegment;
  industry?: string;
  currentContent?: ContentElements;
  businessGoals?: string[];
  constraints?: {
    budget?: number;
    timeline?: number; // in days
    contentLength?: 'short' | 'medium' | 'long';
    tone?: 'professional' | 'casual' | 'technical';
  };
}

// Enhanced pattern recommendation with context
export interface ContextualRecommendation extends PatternRecommendation {
  relevanceScore: number;
  implementation: {
    difficulty: 'low' | 'medium' | 'high';
    estimatedImpact: number; // 0-1 scale
    timeToImplement: number; // in hours
    resources: string[];
    specificActions: string[];
  };
  validation: {
    suggestedTests: string[];
    metrics: string[];
    duration: number; // suggested test duration in days
  };
}

export class PatternRecommendationEngine {
  private patterns: SuccessPattern[] = [];
  private clientSegmentPatterns: Map<ClientSegment, SuccessPattern[]> = new Map();

  constructor(patterns: SuccessPattern[] = []) {
    this.patterns = patterns;
    this.initializeSegmentPatterns();
  }

  /**
   * Generate recommendations for a specific context
   */
  async generateRecommendations(
    context: RecommendationContext,
    maxRecommendations: number = 10
  ): Promise<ContextualRecommendation[]> {
    try {
      // Filter patterns by relevance to context
      const relevantPatterns = this.filterRelevantPatterns(context);
      
      // Generate base recommendations
      const baseRecommendations = await Promise.all(
        relevantPatterns.map(pattern => this.createRecommendationFromPattern(pattern, context))
      );

      // Score and rank recommendations
      const scoredRecommendations = baseRecommendations
        .map(rec => ({ ...rec, relevanceScore: this.calculateRelevanceScore(rec, context) }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxRecommendations);

      return scoredRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Generate specific content recommendations
   */
  async generateContentRecommendations(
    currentContent: ContentElements,
    context: RecommendationContext
  ): Promise<ContextualRecommendation[]> {
    const contentRecommendations: ContextualRecommendation[] = [];

    // Analyze current content against successful patterns
    for (const pattern of this.patterns) {
      if (pattern.patternType === 'content-element' || pattern.patternType === 'mixed') {
        const recommendation = await this.analyzeContentGap(currentContent, pattern, context);
        if (recommendation) {
          contentRecommendations.push(recommendation);
        }
      }
    }

    return contentRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate A/B test recommendations
   */
  async generateABTestRecommendations(
    context: RecommendationContext
  ): Promise<ContextualRecommendation[]> {
    const testRecommendations: ContextualRecommendation[] = [];

    // Find patterns that suggest promising A/B tests
    const testablePatterns = this.patterns.filter(pattern => 
      pattern.confidenceScore > 0.6 && 
      pattern.sampleSize >= 5 &&
      pattern.statisticalSignificance < 0.1
    );

    for (const pattern of testablePatterns) {
      const testRecommendation = await this.createABTestRecommendation(pattern, context);
      testRecommendations.push(testRecommendation);
    }

    return testRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Generate timing optimization recommendations
   */
  async generateTimingRecommendations(
    context: RecommendationContext
  ): Promise<ContextualRecommendation[]> {
    const timingPatterns = this.patterns.filter(p => 
      p.patternType === 'timing' || 
      (p.patternType === 'mixed' && p.patternData.timingFactors)
    );

    return Promise.all(
      timingPatterns.map(pattern => this.createTimingRecommendation(pattern, context))
    );
  }

  /**
   * Filter patterns relevant to the given context
   */
  private filterRelevantPatterns(context: RecommendationContext): SuccessPattern[] {
    let relevant = this.patterns.filter(pattern => {
      // Basic quality filters
      if (pattern.confidenceScore < 0.5) return false;
      if (pattern.sampleSize < 3) return false;
      if (!pattern.isActive) return false;

      return true;
    });

    // Apply segment-specific filtering
    if (context.clientSegment) {
      const segmentPatterns = this.clientSegmentPatterns.get(context.clientSegment) || [];
      relevant = relevant.filter(pattern => 
        segmentPatterns.includes(pattern) || pattern.confidenceScore > 0.8
      );
    }

    // Sort by confidence and recency
    return relevant.sort((a, b) => {
      const scoreA = this.calculatePatternScore(a);
      const scoreB = this.calculatePatternScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Create a recommendation from a pattern
   */
  private async createRecommendationFromPattern(
    pattern: SuccessPattern,
    context: RecommendationContext
  ): Promise<ContextualRecommendation> {
    const recommendationType = this.determineRecommendationType(pattern);
    
    const baseRecommendation: PatternRecommendation = {
      id: `rec-${pattern.id}-${Date.now()}`,
      patternId: pattern.id,
      recommendationType,
      recommendationData: await this.generateRecommendationData(pattern, context),
      confidenceScore: pattern.confidenceScore,
      expectedImprovement: this.calculateExpectedImprovement(pattern),
      priorityScore: this.calculatePriorityScore(pattern, context),
      targetClientSegments: this.determineTargetSegments(pattern),
      createdAt: new Date(),
      isActive: true,
      usageCount: 0,
      successCount: 0
    };

    return {
      ...baseRecommendation,
      relevanceScore: 0, // Will be calculated later
      implementation: await this.generateImplementationPlan(pattern, context),
      validation: this.generateValidationPlan(pattern)
    };
  }

  /**
   * Analyze content gaps and generate improvement recommendations
   */
  private async analyzeContentGap(
    currentContent: ContentElements,
    pattern: SuccessPattern,
    context: RecommendationContext
  ): Promise<ContextualRecommendation | null> {
    const patternElements = pattern.patternData.contentElements;
    if (!patternElements) return null;

    const gaps: string[] = [];
    const improvements: string[] = [];

    // Check for missing headline optimization
    if (patternElements.headline && (!currentContent.headline || 
        !this.isHeadlineSimilar(currentContent.headline, patternElements.headline))) {
      gaps.push('headline');
      improvements.push(`Optimize headline following successful pattern: "${patternElements.headline}"`);
    }

    // Check for missing benefits
    if (patternElements.benefits && (!currentContent.benefits || 
        !this.hasSimilarBenefits(currentContent.benefits, patternElements.benefits))) {
      gaps.push('benefits');
      improvements.push('Add high-converting benefit statements based on successful patterns');
    }

    // Check for missing features
    if (patternElements.features && (!currentContent.features || 
        !this.hasSimilarFeatures(currentContent.features, patternElements.features))) {
      gaps.push('features');
      improvements.push('Include proven feature highlights that drive conversions');
    }

    if (gaps.length === 0) return null;

    return {
      id: `gap-rec-${pattern.id}-${Date.now()}`,
      patternId: pattern.id,
      recommendationType: 'content',
      recommendationData: {
        title: `Content Gap Analysis: ${gaps.join(', ')} optimization`,
        description: `Based on successful pattern analysis, your content could benefit from ${gaps.join(', ')} improvements`,
        implementation: {
          type: 'content-change',
          specifics: {
            gaps,
            improvements,
            patternElements
          }
        },
        expectedOutcome: `Potential ${Math.round(pattern.successRate * 100)}% improvement in conversion rate`,
        confidenceFactors: [
          `${Math.round(pattern.confidenceScore * 100)}% pattern confidence`,
          `${pattern.sampleSize} successful samples`,
          `Statistical significance: p < ${pattern.statisticalSignificance.toFixed(3)}`
        ]
      },
      confidenceScore: pattern.confidenceScore * 0.8, // Slightly lower for gap analysis
      expectedImprovement: this.calculateExpectedImprovement(pattern) * 0.7,
      priorityScore: gaps.length * 2, // Higher priority for more gaps
      targetClientSegments: context.clientSegment ? [context.clientSegment] : undefined,
      createdAt: new Date(),
      isActive: true,
      usageCount: 0,
      successCount: 0,
      relevanceScore: this.calculateGapRelevanceScore(gaps, context),
      implementation: {
        difficulty: gaps.length > 2 ? 'high' : gaps.length > 1 ? 'medium' : 'low',
        estimatedImpact: pattern.successRate,
        timeToImplement: gaps.length * 2, // 2 hours per gap
        resources: ['copywriter', 'content reviewer'],
        specificActions: improvements
      },
      validation: {
        suggestedTests: [`A/B test original vs. optimized ${gaps.join(' + ')}`],
        metrics: ['conversion_rate', 'engagement_time', 'bounce_rate'],
        duration: 14 // 2 weeks
      }
    };
  }

  /**
   * Create A/B test recommendation
   */
  private async createABTestRecommendation(
    pattern: SuccessPattern,
    context: RecommendationContext
  ): Promise<ContextualRecommendation> {
    const testVariations = this.generateTestVariations(pattern);
    
    return {
      id: `ab-test-${pattern.id}-${Date.now()}`,
      patternId: pattern.id,
      recommendationType: 'ab-test',
      recommendationData: {
        title: `A/B Test: ${this.getPatternTitle(pattern)}`,
        description: `Test the effectiveness of this ${pattern.patternType} pattern in your specific context`,
        implementation: {
          type: 'ab-test-setup',
          specifics: {
            variations: testVariations,
            trafficSplit: 50,
            successMetrics: ['conversion_rate', 'revenue_per_visitor'],
            minimumSampleSize: Math.max(100, pattern.sampleSize * 5)
          }
        },
        expectedOutcome: `Validate ${Math.round(pattern.successRate * 100)}% success rate in your context`,
        confidenceFactors: [
          `Pattern shows ${Math.round(pattern.successRate * 100)}% success rate`,
          `Statistically significant (p < ${pattern.statisticalSignificance.toFixed(3)})`,
          `Based on ${pattern.sampleSize} successful implementations`
        ]
      },
      confidenceScore: pattern.confidenceScore,
      expectedImprovement: this.calculateExpectedImprovement(pattern),
      priorityScore: this.calculatePriorityScore(pattern, context),
      targetClientSegments: this.determineTargetSegments(pattern),
      createdAt: new Date(),
      isActive: true,
      usageCount: 0,
      successCount: 0,
      relevanceScore: pattern.confidenceScore * 0.9,
      implementation: {
        difficulty: 'medium',
        estimatedImpact: pattern.successRate,
        timeToImplement: 8, // 8 hours to set up A/B test
        resources: ['developer', 'analyst', 'copywriter'],
        specificActions: [
          'Set up A/B testing framework',
          'Create test variations',
          'Define success metrics',
          'Configure traffic split',
          'Monitor and analyze results'
        ]
      },
      validation: {
        suggestedTests: ['Primary A/B test', 'Follow-up statistical analysis'],
        metrics: ['conversion_rate', 'statistical_significance', 'confidence_interval'],
        duration: 21 // 3 weeks for statistical power
      }
    };
  }

  /**
   * Create timing optimization recommendation
   */
  private async createTimingRecommendation(
    pattern: SuccessPattern,
    context: RecommendationContext
  ): Promise<ContextualRecommendation> {
    const timingFactors = pattern.patternData.timingFactors;
    
    return {
      id: `timing-${pattern.id}-${Date.now()}`,
      patternId: pattern.id,
      recommendationType: 'timing-optimization',
      recommendationData: {
        title: `Timing Optimization: ${this.getTimingTitle(timingFactors)}`,
        description: `Optimize content reveal timing based on successful engagement patterns`,
        implementation: {
          type: 'timing-adjustment',
          specifics: {
            optimalEngagementTime: timingFactors?.avgTimeToPayment,
            recommendedSequence: this.generateTimingSequence(timingFactors),
            triggerEvents: this.generateTriggerEvents(timingFactors)
          }
        },
        expectedOutcome: `${Math.round((pattern.successRate - 0.5) * 200)}% improvement in conversion timing`,
        confidenceFactors: [
          `Optimal timing: ${timingFactors?.avgTimeToPayment} minutes`,
          `${Math.round(pattern.confidenceScore * 100)}% confidence`,
          `Validated across ${pattern.sampleSize} samples`
        ]
      },
      confidenceScore: pattern.confidenceScore,
      expectedImprovement: this.calculateExpectedImprovement(pattern),
      priorityScore: this.calculatePriorityScore(pattern, context),
      targetClientSegments: this.determineTargetSegments(pattern),
      createdAt: new Date(),
      isActive: true,
      usageCount: 0,
      successCount: 0,
      relevanceScore: pattern.confidenceScore * 0.85,
      implementation: {
        difficulty: 'medium',
        estimatedImpact: pattern.successRate,
        timeToImplement: 6, // 6 hours for timing optimization
        resources: ['developer', 'ux-designer'],
        specificActions: [
          'Implement progressive content reveal',
          'Set up engagement tracking',
          'Configure timing triggers',
          'Test timing sequences'
        ]
      },
      validation: {
        suggestedTests: ['Timing A/B test', 'Engagement flow analysis'],
        metrics: ['time_to_conversion', 'engagement_duration', 'drop_off_rate'],
        duration: 14 // 2 weeks
      }
    };
  }

  // Helper methods
  private calculateRelevanceScore(
    recommendation: ContextualRecommendation,
    context: RecommendationContext
  ): number {
    let score = recommendation.confidenceScore;

    // Boost score for segment match
    if (context.clientSegment && 
        recommendation.targetClientSegments?.includes(context.clientSegment)) {
      score *= 1.2;
    }

    // Boost score for constraints match
    if (context.constraints) {
      if (recommendation.implementation.difficulty === 'low' && context.constraints.timeline && context.constraints.timeline < 7) {
        score *= 1.1;
      }
      if (recommendation.implementation.timeToImplement <= (context.constraints.timeline || Infinity) * 8) {
        score *= 1.05;
      }
    }

    return Math.min(score, 1.0);
  }

  private calculatePatternScore(pattern: SuccessPattern): number {
    const recencyScore = this.calculateRecencyScore(pattern.identifiedAt);
    const sampleScore = Math.min(pattern.sampleSize / 20, 1);
    const sigScore = pattern.statisticalSignificance < 0.05 ? 1 : 0.5;

    return (
      pattern.confidenceScore * SCORING_WEIGHTS.CONFIDENCE +
      sampleScore * SCORING_WEIGHTS.SAMPLE_SIZE +
      recencyScore * SCORING_WEIGHTS.RECENCY +
      sigScore * SCORING_WEIGHTS.STATISTICAL_SIG
    );
  }

  private calculateRecencyScore(identifiedAt: Date): number {
    const daysSince = (Date.now() - identifiedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysSince / 30); // Decay over 30 days
  }

  private calculateExpectedImprovement(pattern: SuccessPattern): number {
    // Conservative estimate based on success rate and confidence
    return (pattern.successRate - 0.5) * pattern.confidenceScore;
  }

  private calculatePriorityScore(pattern: SuccessPattern, context: RecommendationContext): number {
    let score = pattern.confidenceScore * 5; // Base score 0-5

    // Boost for high success rate
    if (pattern.successRate > 0.8) score += 2;
    else if (pattern.successRate > 0.7) score += 1;

    // Boost for large sample size
    if (pattern.sampleSize >= 10) score += 1;

    // Boost for statistical significance
    if (pattern.statisticalSignificance < 0.05) score += 1;

    return Math.min(Math.round(score), 10);
  }

  private determineRecommendationType(pattern: SuccessPattern): RecommendationType {
    switch (pattern.patternType) {
      case 'content-element':
        return 'content';
      case 'timing':
        return 'timing-optimization';
      case 'hypothesis':
        return 'hypothesis';
      case 'mixed':
        return 'ab-test'; // Mixed patterns are good candidates for A/B testing
      default:
        return 'content';
    }
  }

  private async generateRecommendationData(
    pattern: SuccessPattern,
    context: RecommendationContext
  ): Promise<RecommendationData> {
    return {
      title: this.getPatternTitle(pattern),
      description: this.generateRecommendationDescription(pattern, context),
      implementation: {
        type: this.getImplementationType(pattern),
        specifics: this.extractImplementationDetails(pattern, context)
      },
      expectedOutcome: this.generateExpectedOutcome(pattern),
      confidenceFactors: this.generateConfidenceFactors(pattern)
    };
  }

  private async generateImplementationPlan(
    pattern: SuccessPattern,
    context: RecommendationContext
  ) {
    const complexity = this.assessImplementationComplexity(pattern, context);
    
    return {
      difficulty: complexity.difficulty,
      estimatedImpact: pattern.successRate,
      timeToImplement: complexity.timeHours,
      resources: complexity.requiredResources,
      specificActions: this.generateActionPlan(pattern, context)
    };
  }

  private generateValidationPlan(pattern: SuccessPattern) {
    return {
      suggestedTests: this.generateSuggestedTests(pattern),
      metrics: this.generateRelevantMetrics(pattern),
      duration: this.calculateTestDuration(pattern)
    };
  }

  // Additional helper methods would be implemented here...
  private initializeSegmentPatterns(): void {
    // Group patterns by client segments based on metadata
    // This would be implemented based on pattern metadata analysis
  }

  private isHeadlineSimilar(current: string, pattern: string): boolean {
    // Simple similarity check - in production, use more sophisticated NLP
    const currentWords = new Set(current.toLowerCase().split(' '));
    const patternWords = new Set(pattern.toLowerCase().split(' '));
    const intersection = new Set([...currentWords].filter(x => patternWords.has(x)));
    return intersection.size / Math.max(currentWords.size, patternWords.size) > 0.3;
  }

  private hasSimilarBenefits(current: string[], pattern: string[]): boolean {
    if (!current || !pattern) return false;
    const currentSet = new Set(current.map(b => b.toLowerCase()));
    const patternSet = new Set(pattern.map(b => b.toLowerCase()));
    const intersection = new Set([...currentSet].filter(x => patternSet.has(x)));
    return intersection.size > 0;
  }

  private hasSimilarFeatures(current: string[], pattern: string[]): boolean {
    return this.hasSimilarBenefits(current, pattern); // Same logic
  }

  private calculateGapRelevanceScore(gaps: string[], context: RecommendationContext): number {
    let score = gaps.length * 0.2; // Base score for number of gaps
    
    // Boost for important gaps
    if (gaps.includes('headline')) score += 0.3;
    if (gaps.includes('benefits')) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  private generateTestVariations(pattern: SuccessPattern): any {
    return {
      control: "Current implementation",
      variation: `Implementation based on ${pattern.patternType} pattern`,
      patternData: pattern.patternData
    };
  }

  private getPatternTitle(pattern: SuccessPattern): string {
    return `${pattern.patternType.replace('-', ' ')} optimization`;
  }

  private getTimingTitle(timingFactors: any): string {
    return `Optimal engagement timing (${timingFactors?.avgTimeToPayment}min)`;
  }

  private generateTimingSequence(timingFactors: any): string[] {
    return [
      'Initial engagement',
      'Content presentation',
      'Value demonstration',
      'Pricing reveal',
      'Call to action'
    ];
  }

  private generateTriggerEvents(timingFactors: any): string[] {
    return [
      'Page load',
      'Scroll depth 50%',
      'Time on page 3min',
      'Engagement indicator'
    ];
  }

  private determineTargetSegments(pattern: SuccessPattern): string[] {
    // Based on pattern metadata, determine applicable segments
    return ['general']; // Placeholder
  }

  private generateRecommendationDescription(pattern: SuccessPattern, context: RecommendationContext): string {
    return `Apply successful ${pattern.patternType} pattern with ${Math.round(pattern.confidenceScore * 100)}% confidence`;
  }

  private getImplementationType(pattern: SuccessPattern): any {
    switch (pattern.patternType) {
      case 'content-element': return 'content-change';
      case 'timing': return 'timing-adjustment';
      case 'hypothesis': return 'hypothesis-test';
      default: return 'ab-test-setup';
    }
  }

  private extractImplementationDetails(pattern: SuccessPattern, context: RecommendationContext): any {
    return pattern.patternData;
  }

  private generateExpectedOutcome(pattern: SuccessPattern): string {
    return `${Math.round((pattern.successRate - 0.5) * 200)}% improvement potential`;
  }

  private generateConfidenceFactors(pattern: SuccessPattern): string[] {
    return [
      `${Math.round(pattern.confidenceScore * 100)}% confidence`,
      `${pattern.sampleSize} samples`,
      `p < ${pattern.statisticalSignificance.toFixed(3)}`
    ];
  }

  private assessImplementationComplexity(pattern: SuccessPattern, context: RecommendationContext): {
    difficulty: 'low' | 'medium' | 'high';
    timeHours: number;
    requiredResources: string[];
  } {
    switch (pattern.patternType) {
      case 'content-element':
        return { difficulty: 'low', timeHours: 2, requiredResources: ['copywriter'] };
      case 'timing':
        return { difficulty: 'medium', timeHours: 6, requiredResources: ['developer', 'ux-designer'] };
      case 'hypothesis':
        return { difficulty: 'high', timeHours: 12, requiredResources: ['developer', 'analyst', 'designer'] };
      default:
        return { difficulty: 'medium', timeHours: 8, requiredResources: ['developer', 'analyst'] };
    }
  }

  private generateActionPlan(pattern: SuccessPattern, context: RecommendationContext): string[] {
    const actions = ['Analyze current implementation', 'Apply pattern modifications'];
    
    switch (pattern.patternType) {
      case 'content-element':
        actions.push('Update content elements', 'Review and approve changes');
        break;
      case 'timing':
        actions.push('Implement timing controls', 'Test engagement flow');
        break;
      case 'hypothesis':
        actions.push('Design test scenarios', 'Implement tracking');
        break;
    }
    
    return actions;
  }

  private generateSuggestedTests(pattern: SuccessPattern): string[] {
    return [`A/B test ${pattern.patternType} pattern`, 'Monitor conversion metrics'];
  }

  private generateRelevantMetrics(pattern: SuccessPattern): string[] {
    const baseMetrics = ['conversion_rate', 'engagement_time'];
    
    if (pattern.patternType === 'timing') {
      baseMetrics.push('time_to_conversion', 'drop_off_rate');
    }
    if (pattern.patternType === 'content-element') {
      baseMetrics.push('click_through_rate', 'bounce_rate');
    }
    
    return baseMetrics;
  }

  private calculateTestDuration(pattern: SuccessPattern): number {
    // Base duration on pattern confidence and expected impact
    const baseDuration = 14; // 2 weeks
    const confidenceMultiplier = pattern.confidenceScore < 0.7 ? 1.5 : 1;
    const impactMultiplier = pattern.successRate > 0.8 ? 0.8 : 1;
    
    return Math.round(baseDuration * confidenceMultiplier * impactMultiplier);
  }
}

// Export utility functions
export function createRecommendationEngine(patterns: SuccessPattern[]): PatternRecommendationEngine {
  return new PatternRecommendationEngine(patterns);
}

export function calculateRecommendationPriority(
  recommendation: ContextualRecommendation,
  businessGoals: string[]
): number {
  let priority = recommendation.priorityScore;
  
  // Boost priority based on business goals alignment
  if (businessGoals.includes('conversion_optimization') && recommendation.recommendationType === 'content') {
    priority += 2;
  }
  if (businessGoals.includes('user_experience') && recommendation.recommendationType === 'timing-optimization') {
    priority += 2;
  }
  
  return Math.min(priority, 10);
}