/**
 * Real-time Journey Recommendations Engine
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Immediate recommendation engine for in-progress client journeys based on fresh patterns.
 * Implements AC 5: Immediate recommendations for in-progress client journeys.
 */

import { EventEmitter } from 'events';
import {
  SuccessPattern,
  PatternType,
  PatternRecommendation,
  RecommendationType
} from '../data-models/pattern-models';
import { DynamicUpdateResult } from '../pattern-recognition/dynamic-updates';

/**
 * Active client journey state
 */
export interface ActiveClientJourney {
  clientId: string;
  sessionId: string;
  currentPage: 'activation' | 'agreement' | 'confirmation' | 'processing';
  timeOnCurrentPage: number; // milliseconds
  totalJourneyTime: number;  // milliseconds
  engagementScore: number;   // 0-1 based on interactions
  contentVersion: {
    id: string;
    hypothesis?: string;
    elements: any;
    confidence?: number;
  };
  clientSegment: string;
  industryCategory?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'enterprise';
  previousInteractions: Array<{
    action: string;
    timestamp: Date;
    pageType: string;
    elementId?: string;
  }>;
  dropOffRisk: number; // 0-1, higher = more likely to drop off
  conversionProbability: number; // 0-1 based on patterns
}

/**
 * Real-time recommendation for active journeys
 */
export interface RealTimeRecommendation {
  id: string;
  clientId: string;
  sessionId: string;
  type: 'content_optimization' | 'timing_adjustment' | 'intervention' | 'ab_test' | 'pattern_application';
  priority: 'critical' | 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'within_5min' | 'within_hour' | 'next_session';
  
  recommendation: {
    title: string;
    description: string;
    specificAction: string;
    expectedImpact: number; // 0-1, expected conversion improvement
    confidenceLevel: number; // 0-1, confidence in recommendation
  };
  
  patternBasis: {
    primaryPatternId: string;
    supportingPatternIds: string[];
    patternConfidence: number;
    sampleSize: number;
  };
  
  implementation: {
    method: 'content_swap' | 'element_highlight' | 'popup_intervention' | 'time_extension' | 'personalization';
    targetElement?: string;
    newContent?: any;
    timing?: number; // delay in milliseconds
    conditions?: string[];
  };
  
  monitoring: {
    shouldTrack: boolean;
    successMetrics: string[];
    timeframe: number; // monitoring period in milliseconds
  };
  
  generatedAt: Date;
  expiresAt: Date;
  appliedAt?: Date;
  outcome?: 'success' | 'failure' | 'neutral';
}

/**
 * Drop-off intervention strategy
 */
export interface DropOffIntervention {
  trigger: 'time_threshold' | 'low_engagement' | 'navigation_pattern' | 'scroll_stagnation';
  threshold: number;
  intervention: RealTimeRecommendation;
  activatedCount: number;
  successRate: number;
}

/**
 * A/B test suggestion based on patterns
 */
export interface ABTestSuggestion {
  testId: string;
  hypothesis: string;
  controlVersion: any;
  testVersion: any;
  expectedLift: number;
  requiredSampleSize: number;
  estimatedDuration: number; // days
  targetSegment?: string;
  basedOnPatterns: string[];
}

/**
 * Real-time Journey Recommendation Engine
 * Generates immediate recommendations for active client sessions
 */
export class RealTimeJourneyRecommendationEngine extends EventEmitter {
  private activeJourneys: Map<string, ActiveClientJourney> = new Map();
  private patternCache: Map<string, SuccessPattern> = new Map();
  private recommendationHistory: Map<string, RealTimeRecommendation[]> = new Map();
  private dropOffInterventions: DropOffIntervention[] = [];
  private abTestSuggestions: Map<string, ABTestSuggestion> = new Map();

  // Configuration for recommendation timing and thresholds
  private config = {
    dropOffTimeThreshold: 300000,    // 5 minutes of inactivity
    lowEngagementThreshold: 0.3,     // Engagement score below 30%
    recommendationCooldown: 60000,   // 1 minute between similar recommendations
    criticalInterventionTime: 180000, // 3 minutes for critical interventions
    maxRecommendationsPerSession: 5,  // Limit recommendations per session
    patternConfidenceThreshold: 0.7   // Minimum pattern confidence for recommendations
  };

  constructor() {
    super();
    this.initializeDropOffInterventions();
  }

  /**
   * Update active client journey and generate immediate recommendations
   */
  async updateClientJourney(journey: ActiveClientJourney): Promise<RealTimeRecommendation[]> {
    const previousJourney = this.activeJourneys.get(journey.clientId);
    this.activeJourneys.set(journey.clientId, journey);

    const recommendations: RealTimeRecommendation[] = [];

    try {
      // 1. Check for immediate intervention needs (critical priority)
      const interventions = await this.checkForImmediateInterventions(journey, previousJourney);
      recommendations.push(...interventions);

      // 2. Apply fresh patterns for content optimization
      const patternRecommendations = await this.generatePatternBasedRecommendations(journey);
      recommendations.push(...patternRecommendations);

      // 3. Generate A/B test suggestions for new patterns
      const abTestSuggestions = await this.generateABTestSuggestions(journey);
      recommendations.push(...abTestSuggestions);

      // 4. Personalization recommendations based on segment and behavior
      const personalizationRecs = await this.generatePersonalizationRecommendations(journey);
      recommendations.push(...personalizationRecs);

      // Filter and prioritize recommendations
      const filteredRecs = this.filterAndPrioritizeRecommendations(recommendations, journey);

      // Store recommendation history
      const clientHistory = this.recommendationHistory.get(journey.clientId) || [];
      clientHistory.push(...filteredRecs);
      this.recommendationHistory.set(journey.clientId, clientHistory);

      // Emit recommendations for real-time processing
      if (filteredRecs.length > 0) {
        this.emit('recommendations_generated', {
          clientId: journey.clientId,
          sessionId: journey.sessionId,
          recommendations: filteredRecs,
          journey,
          timestamp: new Date()
        });
      }

      return filteredRecs;

    } catch (error) {
      console.error(`Error generating recommendations for client ${journey.clientId}:`, error);
      return [];
    }
  }

  /**
   * Process pattern updates and generate immediate recommendations for affected journeys
   */
  async processPatternUpdate(updateResult: DynamicUpdateResult): Promise<void> {
    // Update pattern cache
    updateResult.updatedPatterns.forEach(pattern => {
      this.patternCache.set(pattern.id, pattern);
    });
    updateResult.newPatterns.forEach(pattern => {
      this.patternCache.set(pattern.id, pattern);
    });

    // Find active journeys that could benefit from updated patterns
    const affectedJourneys = this.findJourneysAffectedByPatterns(
      [...updateResult.updatedPatterns, ...updateResult.newPatterns]
    );

    // Generate recommendations for affected journeys
    for (const journey of affectedJourneys) {
      const recommendations = await this.generatePatternBasedRecommendations(journey, true);
      
      if (recommendations.length > 0) {
        // Update recommendation history
        const clientHistory = this.recommendationHistory.get(journey.clientId) || [];
        clientHistory.push(...recommendations);
        this.recommendationHistory.set(journey.clientId, clientHistory);

        this.emit('pattern_recommendations_generated', {
          clientId: journey.clientId,
          sessionId: journey.sessionId,
          recommendations,
          updatedPatterns: updateResult.updatedPatterns,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Check for immediate intervention needs (drop-off prevention)
   */
  private async checkForImmediateInterventions(
    currentJourney: ActiveClientJourney,
    previousJourney?: ActiveClientJourney
  ): Promise<RealTimeRecommendation[]> {
    
    const interventions: RealTimeRecommendation[] = [];

    // 1. Time-based drop-off risk
    if (currentJourney.timeOnCurrentPage > this.config.dropOffTimeThreshold) {
      const timeIntervention = await this.createTimeBasedIntervention(currentJourney);
      if (timeIntervention) interventions.push(timeIntervention);
    }

    // 2. Low engagement intervention
    if (currentJourney.engagementScore < this.config.lowEngagementThreshold) {
      const engagementIntervention = await this.createEngagementIntervention(currentJourney);
      if (engagementIntervention) interventions.push(engagementIntervention);
    }

    // 3. High drop-off risk based on patterns
    if (currentJourney.dropOffRisk > 0.7) {
      const riskIntervention = await this.createDropOffRiskIntervention(currentJourney);
      if (riskIntervention) interventions.push(riskIntervention);
    }

    // 4. Page transition hesitation
    if (previousJourney && 
        previousJourney.currentPage === currentJourney.currentPage &&
        currentJourney.timeOnCurrentPage > 120000) { // 2 minutes on same page
      
      const hesitationIntervention = await this.createHesitationIntervention(currentJourney);
      if (hesitationIntervention) interventions.push(hesitationIntervention);
    }

    return interventions;
  }

  /**
   * Generate pattern-based recommendations using fresh patterns
   */
  private async generatePatternBasedRecommendations(
    journey: ActiveClientJourney,
    isPatternUpdate: boolean = false
  ): Promise<RealTimeRecommendation[]> {
    
    const recommendations: RealTimeRecommendation[] = [];

    // Get relevant high-confidence patterns
    const relevantPatterns = this.findRelevantPatterns(journey);
    
    for (const pattern of relevantPatterns) {
      // Skip if pattern confidence is too low
      if (pattern.confidenceScore < this.config.patternConfidenceThreshold) continue;

      // Check if client's current content differs significantly from pattern
      const contentSimilarity = await this.calculateContentSimilarity(
        journey.contentVersion.elements,
        pattern.patternData.contentElements
      );

      // Generate recommendation if content can be improved
      if (contentSimilarity < 0.8) { // Less than 80% similar
        const patternRec = await this.createPatternBasedRecommendation(
          journey,
          pattern,
          isPatternUpdate
        );
        if (patternRec) recommendations.push(patternRec);
      }

      // Check for timing pattern applications
      if (pattern.patternType === 'timing' && pattern.patternData.timingFactors) {
        const timingRec = await this.createTimingRecommendation(journey, pattern);
        if (timingRec) recommendations.push(timingRec);
      }
    }

    return recommendations;
  }

  /**
   * Generate A/B test suggestions based on new patterns
   */
  private async generateABTestSuggestions(journey: ActiveClientJourney): Promise<RealTimeRecommendation[]> {
    const recommendations: RealTimeRecommendation[] = [];

    // Find patterns with high confidence that could be tested
    const testablePatterns = Array.from(this.patternCache.values()).filter(pattern => 
      pattern.confidenceScore > 0.8 && 
      pattern.sampleSize >= 10 &&
      pattern.statisticalSignificance <= 0.05
    );

    for (const pattern of testablePatterns.slice(0, 2)) { // Limit to 2 suggestions
      const abTestRec = await this.createABTestRecommendation(journey, pattern);
      if (abTestRec) recommendations.push(abTestRec);
    }

    return recommendations;
  }

  /**
   * Generate personalization recommendations
   */
  private async generatePersonalizationRecommendations(
    journey: ActiveClientJourney
  ): Promise<RealTimeRecommendation[]> {
    const recommendations: RealTimeRecommendation[] = [];

    // Industry-specific personalization
    if (journey.industryCategory) {
      const industryRec = await this.createIndustryPersonalizationRecommendation(journey);
      if (industryRec) recommendations.push(industryRec);
    }

    // Company size personalization
    if (journey.companySize) {
      const sizeRec = await this.createCompanySizePersonalizationRecommendation(journey);
      if (sizeRec) recommendations.push(sizeRec);
    }

    // Behavioral personalization based on interaction patterns
    const behaviorRec = await this.createBehavioralPersonalizationRecommendation(journey);
    if (behaviorRec) recommendations.push(behaviorRec);

    return recommendations;
  }

  /**
   * Create time-based drop-off intervention
   */
  private async createTimeBasedIntervention(journey: ActiveClientJourney): Promise<RealTimeRecommendation | null> {
    const interventionContent = this.getTimeInterventionContent(journey.currentPage);
    
    return {
      id: `time-intervention-${journey.clientId}-${Date.now()}`,
      clientId: journey.clientId,
      sessionId: journey.sessionId,
      type: 'intervention',
      priority: 'critical',
      urgency: 'immediate',
      
      recommendation: {
        title: 'Prevent Client Drop-off',
        description: `Client has been on ${journey.currentPage} page for ${Math.round(journey.timeOnCurrentPage / 60000)} minutes`,
        specificAction: 'Show engagement prompt with value reinforcement',
        expectedImpact: 0.25,
        confidenceLevel: 0.8
      },
      
      patternBasis: {
        primaryPatternId: 'time-based-intervention',
        supportingPatternIds: [],
        patternConfidence: 0.8,
        sampleSize: 50
      },
      
      implementation: {
        method: 'popup_intervention',
        newContent: interventionContent,
        timing: 0,
        conditions: [`timeOnPage > ${this.config.dropOffTimeThreshold}`]
      },
      
      monitoring: {
        shouldTrack: true,
        successMetrics: ['page_progression', 'engagement_increase'],
        timeframe: 300000
      },
      
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 300000)
    };
  }

  /**
   * Create pattern-based content recommendation
   */
  private async createPatternBasedRecommendation(
    journey: ActiveClientJourney,
    pattern: SuccessPattern,
    isPatternUpdate: boolean
  ): Promise<RealTimeRecommendation | null> {
    
    const expectedImpact = this.calculateExpectedImpact(pattern, journey);
    if (expectedImpact < 0.05) return null; // Less than 5% expected improvement

    return {
      id: `pattern-rec-${pattern.id}-${journey.clientId}-${Date.now()}`,
      clientId: journey.clientId,
      sessionId: journey.sessionId,
      type: 'pattern_application',
      priority: pattern.confidenceScore > 0.9 ? 'high' : 'medium',
      urgency: isPatternUpdate ? 'immediate' : 'within_5min',
      
      recommendation: {
        title: `Apply High-Confidence Pattern`,
        description: `Pattern shows ${Math.round(pattern.successRate * 100)}% success rate with ${pattern.sampleSize} samples`,
        specificAction: this.getPatternApplicationAction(pattern, journey),
        expectedImpact,
        confidenceLevel: pattern.confidenceScore
      },
      
      patternBasis: {
        primaryPatternId: pattern.id,
        supportingPatternIds: [],
        patternConfidence: pattern.confidenceScore,
        sampleSize: pattern.sampleSize
      },
      
      implementation: {
        method: 'content_swap',
        newContent: this.generatePatternBasedContent(pattern, journey),
        timing: 0
      },
      
      monitoring: {
        shouldTrack: true,
        successMetrics: ['conversion', 'engagement', 'time_to_next_page'],
        timeframe: 1800000 // 30 minutes
      },
      
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 900000) // 15 minutes
    };
  }

  /**
   * Helper methods
   */
  private findRelevantPatterns(journey: ActiveClientJourney): SuccessPattern[] {
    return Array.from(this.patternCache.values()).filter(pattern => {
      // Filter by client segment compatibility
      if (journey.clientSegment && pattern.patternData.metadata?.sourceClientIds) {
        // In production, would check segment compatibility
        return pattern.confidenceScore > 0.6;
      }
      return pattern.confidenceScore > 0.6;
    }).sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  private findJourneysAffectedByPatterns(patterns: SuccessPattern[]): ActiveClientJourney[] {
    const affected: ActiveClientJourney[] = [];
    
    for (const [clientId, journey] of this.activeJourneys) {
      for (const pattern of patterns) {
        if (this.isJourneyAffectedByPattern(journey, pattern)) {
          affected.push(journey);
          break;
        }
      }
    }
    
    return affected;
  }

  private isJourneyAffectedByPattern(journey: ActiveClientJourney, pattern: SuccessPattern): boolean {
    // Check if pattern is relevant to current journey context
    return pattern.confidenceScore > 0.7 && 
           (pattern.patternType === 'hypothesis' || 
            pattern.patternType === 'content-element' ||
            journey.clientSegment === 'matching-segment');
  }

  private calculateExpectedImpact(pattern: SuccessPattern, journey: ActiveClientJourney): number {
    const baseImpact = (pattern.successRate - 0.5) * pattern.confidenceScore;
    const sampleSizeAdjustment = Math.min(pattern.sampleSize / 50, 1); // Max at 50 samples
    return baseImpact * sampleSizeAdjustment;
  }

  private async calculateContentSimilarity(content1: any, content2?: any): Promise<number> {
    // Simplified content similarity calculation
    if (!content2) return 0;
    
    // In production, would use sophisticated content comparison
    return 0.6; // Mock similarity score
  }

  private getPatternApplicationAction(pattern: SuccessPattern, journey: ActiveClientJourney): string {
    switch (pattern.patternType) {
      case 'hypothesis':
        return `Apply hypothesis: "${pattern.patternData.hypothesis}"`;
      case 'content-element':
        return 'Update content elements based on successful pattern';
      case 'timing':
        return 'Optimize timing based on successful conversion pattern';
      default:
        return 'Apply successful pattern to improve conversion';
    }
  }

  private generatePatternBasedContent(pattern: SuccessPattern, journey: ActiveClientJourney): any {
    // Generate content based on pattern
    return {
      headline: pattern.patternData.contentElements?.headline || journey.contentVersion.elements.headline,
      benefits: pattern.patternData.contentElements?.benefits || journey.contentVersion.elements.benefits,
      cta: pattern.patternData.contentElements?.callToActions?.[0] || 'Get Started Now'
    };
  }

  private getTimeInterventionContent(currentPage: string): any {
    const interventions = {
      activation: {
        title: "Still deciding?",
        message: "Join 1,000+ companies who've already activated their account",
        cta: "Activate Now - Risk Free"
      },
      agreement: {
        title: "Questions about our terms?",
        message: "95% of clients find our agreement straightforward and fair",
        cta: "Continue - Full Money Back Guarantee"
      },
      confirmation: {
        title: "Almost there!",
        message: "Your customized solution is ready - just confirm to proceed",
        cta: "Confirm My Solution"
      },
      processing: {
        title: "Processing your request...",
        message: "This typically takes under 2 minutes",
        cta: "Processing..."
      }
    };

    return interventions[currentPage as keyof typeof interventions];
  }

  private filterAndPrioritizeRecommendations(
    recommendations: RealTimeRecommendation[],
    journey: ActiveClientJourney
  ): RealTimeRecommendation[] {
    // Remove duplicates and apply business rules
    const filtered = recommendations
      .filter((rec, index, arr) => 
        // Remove duplicates by type
        arr.findIndex(r => r.type === rec.type && r.recommendation.title === rec.recommendation.title) === index
      )
      .filter(rec => rec.recommendation.expectedImpact > 0.05) // Minimum 5% expected impact
      .sort((a, b) => {
        // Sort by priority and expected impact
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        return b.recommendation.expectedImpact - a.recommendation.expectedImpact;
      })
      .slice(0, this.config.maxRecommendationsPerSession);

    return filtered;
  }

  private initializeDropOffInterventions(): void {
    // Initialize common drop-off interventions
    this.dropOffInterventions = [
      {
        trigger: 'time_threshold',
        threshold: 300000, // 5 minutes
        intervention: {} as RealTimeRecommendation, // Would be populated
        activatedCount: 0,
        successRate: 0.25
      }
    ];
  }

  // Placeholder methods for additional intervention types
  private async createEngagementIntervention(journey: ActiveClientJourney): Promise<RealTimeRecommendation | null> {
    // Implementation for engagement-based interventions
    return null;
  }

  private async createDropOffRiskIntervention(journey: ActiveClientJourney): Promise<RealTimeRecommendation | null> {
    // Implementation for drop-off risk interventions
    return null;
  }

  private async createHesitationIntervention(journey: ActiveClientJourney): Promise<RealTimeRecommendation | null> {
    // Implementation for hesitation interventions
    return null;
  }

  private async createTimingRecommendation(journey: ActiveClientJourney, pattern: SuccessPattern): Promise<RealTimeRecommendation | null> {
    // Implementation for timing-based recommendations
    return null;
  }

  private async createABTestRecommendation(journey: ActiveClientJourney, pattern: SuccessPattern): Promise<RealTimeRecommendation | null> {
    // Implementation for A/B test recommendations
    return null;
  }

  private async createIndustryPersonalizationRecommendation(journey: ActiveClientJourney): Promise<RealTimeRecommendation | null> {
    // Implementation for industry personalization
    return null;
  }

  private async createCompanySizePersonalizationRecommendation(journey: ActiveClientJourney): Promise<RealTimeRecommendation | null> {
    // Implementation for company size personalization
    return null;
  }

  private async createBehavioralPersonalizationRecommendation(journey: ActiveClientJourney): Promise<RealTimeRecommendation | null> {
    // Implementation for behavioral personalization
    return null;
  }

  /**
   * Public API methods
   */
  getActiveJourneys(): ActiveClientJourney[] {
    return Array.from(this.activeJourneys.values());
  }

  getRecommendationHistory(clientId: string): RealTimeRecommendation[] {
    return this.recommendationHistory.get(clientId) || [];
  }

  updatePatternCache(patterns: SuccessPattern[]): void {
    patterns.forEach(pattern => {
      this.patternCache.set(pattern.id, pattern);
    });
  }

  removeClientJourney(clientId: string): void {
    this.activeJourneys.delete(clientId);
  }

  dispose(): void {
    this.activeJourneys.clear();
    this.patternCache.clear();
    this.recommendationHistory.clear();
    this.removeAllListeners();
  }
}

/**
 * Singleton instance for application-wide use
 */
export const realtimeRecommendationEngine = new RealTimeJourneyRecommendationEngine();

/**
 * Utility functions
 */
export function updateClientJourney(journey: ActiveClientJourney): Promise<RealTimeRecommendation[]> {
  return realtimeRecommendationEngine.updateClientJourney(journey);
}

export function processPatternUpdate(updateResult: DynamicUpdateResult): Promise<void> {
  return realtimeRecommendationEngine.processPatternUpdate(updateResult);
}

export function getActiveJourneys(): ActiveClientJourney[] {
  return realtimeRecommendationEngine.getActiveJourneys();
}