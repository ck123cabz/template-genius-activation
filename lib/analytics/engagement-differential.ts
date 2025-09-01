/**
 * Engagement Differential Analysis
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Advanced engagement pattern comparison algorithms with confidence intervals
 * and statistical significance testing for behavioral analysis.
 */

import {
  EngagementDiff,
  EngagementMetrics,
  EngagementEvent,
  ClickEvent,
  ScrollEvent,
  FocusEvent,
  MouseMovementSummary,
  ReadingPatternAnalysis,
  EngagementSignificance
} from '../data-models/journey-comparison-models';
import {
  JourneySession,
  JourneyPageVisit,
  JourneyPageType
} from '../data-models/journey-models';
import { StatisticalSignificanceEngine } from '../statistics/significance-testing';

/**
 * Configuration for engagement differential analysis
 */
export interface EngagementDifferentialConfig {
  significanceThreshold: number;
  minEngagementDuration: number; // seconds
  scrollVelocityThreshold: number; // pixels per second
  interactionDensityThreshold: number; // interactions per minute
  focusStabilityThreshold: number; // 0-1
  mouseTrackingEnabled: boolean;
  readingPatternAnalysis: boolean;
  attentionModelingEnabled: boolean;
  behavioralSegmentation: boolean;
}

const DEFAULT_ENGAGEMENT_CONFIG: EngagementDifferentialConfig = {
  significanceThreshold: 0.05,
  minEngagementDuration: 5,
  scrollVelocityThreshold: 200,
  interactionDensityThreshold: 3,
  focusStabilityThreshold: 0.6,
  mouseTrackingEnabled: true,
  readingPatternAnalysis: true,
  attentionModelingEnabled: true,
  behavioralSegmentation: true
};

/**
 * Behavioral engagement categories
 */
export type EngagementCategory = 
  | 'highly_engaged' 
  | 'moderately_engaged' 
  | 'passively_browsing' 
  | 'scanning_quickly' 
  | 'struggling_to_engage'
  | 'abandoning';

/**
 * Engagement behavior pattern
 */
export interface EngagementBehavior {
  category: EngagementCategory;
  confidence: number; // 0-1
  duration: number; // seconds in this behavior
  intensity: number; // 0-1, intensity of engagement
  characteristics: BehaviorCharacteristics;
  triggers: EngagementTrigger[];
  outcomes: EngagementOutcome[];
}

export interface BehaviorCharacteristics {
  averageInteractionInterval: number; // seconds between interactions
  scrollConsistency: number; // 0-1, consistency of scroll behavior
  focusDepth: number; // 0-1, depth of content focus
  navigationConfidence: number; // 0-1, confidence in navigation choices
  contentResonance: number; // 0-1, how well content resonates
}

export interface EngagementTrigger {
  triggerType: 'content_element' | 'visual_cue' | 'interaction_feedback' | 'time_pressure' | 'cognitive_load';
  element?: string; // Element that triggered engagement change
  timestamp: Date;
  intensity: number; // 0-1
  duration: number; // seconds of effect
}

export interface EngagementOutcome {
  outcomeType: 'continued_engagement' | 'increased_focus' | 'distraction' | 'drop_off_risk' | 'conversion_intent';
  probability: number; // 0-1
  timeToOutcome: number; // seconds
  confidence: number; // 0-1
}

/**
 * Main Engagement Differential Engine
 * Provides comprehensive engagement pattern analysis for journey comparisons
 */
export class EngagementDifferentialEngine {
  private config: EngagementDifferentialConfig;
  private statisticsEngine: StatisticalSignificanceEngine;
  private behaviorAnalyzer: BehaviorPatternAnalyzer;
  private attentionModeler: AttentionModeler;

  constructor(
    config: Partial<EngagementDifferentialConfig> = {},
    statisticsEngine: StatisticalSignificanceEngine
  ) {
    this.config = { ...DEFAULT_ENGAGEMENT_CONFIG, ...config };
    this.statisticsEngine = statisticsEngine;
    this.behaviorAnalyzer = new BehaviorPatternAnalyzer(this.config);
    this.attentionModeler = new AttentionModeler(this.config);
  }

  /**
   * Analyze engagement differences between successful and failed journeys
   */
  async analyzeEngagementDifferences(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<EngagementDiff[]> {
    try {
      const engagementDiffs: EngagementDiff[] = [];
      const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];

      for (const pageType of pageTypes) {
        const successfulVisit = successfulJourney.pageVisits.find(v => v.pageType === pageType);
        const failedVisit = failedJourney.pageVisits.find(v => v.pageType === pageType);

        if (successfulVisit && failedVisit) {
          const engagementDiff = await this.comparePageEngagement(
            successfulVisit,
            failedVisit,
            pageType,
            successfulJourney,
            failedJourney
          );

          if (engagementDiff && this.isEngagementDiffSignificant(engagementDiff)) {
            engagementDiffs.push(engagementDiff);
          }
        }
      }

      return engagementDiffs.sort((a, b) => b.engagementDifferential - a.engagementDifferential);

    } catch (error) {
      console.error('Engagement differential analysis failed:', error);
      throw new Error(`Engagement analysis failed: ${error.message}`);
    }
  }

  /**
   * Compare engagement metrics for a specific page
   */
  async comparePageEngagement(
    successfulVisit: JourneyPageVisit,
    failedVisit: JourneyPageVisit,
    pageType: JourneyPageType,
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<EngagementDiff | null> {
    try {
      // Build comprehensive engagement metrics
      const successfulEngagement = await this.buildEngagementMetrics(
        successfulVisit,
        successfulJourney,
        'successful'
      );

      const failedEngagement = await this.buildEngagementMetrics(
        failedVisit,
        failedJourney,
        'failed'
      );

      // Calculate engagement differential
      const engagementDifferential = successfulEngagement.overallScore - failedEngagement.overallScore;

      // Analyze interaction patterns
      const interactionPatterns = await this.analyzeInteractionPatternDifferences(
        successfulEngagement,
        failedEngagement
      );

      // Analyze attention patterns
      const attentionHeatmap = await this.analyzeAttentionDifferences(
        successfulVisit,
        failedVisit,
        pageType
      );

      // Calculate statistical significance
      const statisticalSignificance = await this.calculateEngagementSignificance(
        successfulEngagement,
        failedEngagement
      );

      const engagementDiff: EngagementDiff = {
        id: this.generateEngagementDiffId(successfulVisit.id, failedVisit.id, pageType),
        comparisonId: '', // Will be set by parent comparison
        pageType,
        successfulEngagement,
        failedEngagement,
        engagementDifferential,
        interactionPatterns,
        attentionHeatmap,
        statisticalSignificance,
        createdAt: new Date()
      };

      return engagementDiff;

    } catch (error) {
      console.error(`Page engagement comparison failed for ${pageType}:`, error);
      return null;
    }
  }

  /**
   * Analyze behavioral engagement patterns
   */
  async analyzeBehavioralPatterns(
    journeySession: JourneySession
  ): Promise<EngagementBehavior[]> {
    if (!this.config.behavioralSegmentation) return [];

    try {
      const behaviors: EngagementBehavior[] = [];

      for (const pageVisit of journeySession.pageVisits) {
        const pageBehaviors = await this.behaviorAnalyzer.analyzePageBehavior(
          pageVisit,
          journeySession
        );
        behaviors.push(...pageBehaviors);
      }

      // Merge and analyze behavioral transitions
      return this.analyzeBehavioralTransitions(behaviors);

    } catch (error) {
      console.error('Behavioral pattern analysis failed:', error);
      return [];
    }
  }

  /**
   * Generate engagement insights summary
   */
  generateEngagementInsights(engagementDiffs: EngagementDiff[]): {
    primaryEngagementFactors: Array<{
      factor: string;
      impact: number;
      significance: number;
      pages: JourneyPageType[];
    }>;
    behavioralDifferences: Array<{
      behavior: string;
      successfulFrequency: number;
      failedFrequency: number;
      impactScore: number;
    }>;
    attentionPatterns: Array<{
      pattern: string;
      divergence: number;
      affectedPages: JourneyPageType[];
    }>;
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      description: string;
      expectedImprovement: number;
    }>;
  } {
    const insights = {
      primaryEngagementFactors: this.identifyPrimaryEngagementFactors(engagementDiffs),
      behavioralDifferences: this.analyzeBehavioralDifferences(engagementDiffs),
      attentionPatterns: this.summarizeAttentionPatterns(engagementDiffs),
      recommendations: this.generateEngagementRecommendations(engagementDiffs)
    };

    return insights;
  }

  // ============================================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================================

  private async buildEngagementMetrics(
    pageVisit: JourneyPageVisit,
    journey: JourneySession,
    journeyType: 'successful' | 'failed'
  ): Promise<EngagementMetrics> {
    // Calculate overall engagement score
    const overallScore = this.calculateOverallEngagementScore(pageVisit, journey);

    // Extract detailed engagement events
    const clickEvents = await this.extractClickEvents(pageVisit);
    const scrollEvents = await this.extractScrollEvents(pageVisit);
    const focusEvents = await this.extractFocusEvents(pageVisit);

    // Analyze mouse movements
    const mouseMovements = this.config.mouseTrackingEnabled ? 
      await this.analyzeMouseMovements(pageVisit) : this.getEmptyMouseMovements();

    // Analyze reading patterns
    const readingPattern = this.config.readingPatternAnalysis ?
      await this.analyzeReadingPattern(pageVisit, clickEvents, scrollEvents, focusEvents) :
      this.getEmptyReadingPattern();

    return {
      overallScore,
      scrollDepth: pageVisit.scrollDepth,
      timeOnPage: pageVisit.timeOnPage,
      interactionCount: pageVisit.interactions,
      clickEvents,
      scrollEvents,
      focusEvents,
      mouseMovements,
      readingPattern
    };
  }

  private calculateOverallEngagementScore(
    pageVisit: JourneyPageVisit,
    journey: JourneySession
  ): number {
    // Multi-factor engagement score calculation
    const timeWeight = 0.3;
    const scrollWeight = 0.25;
    const interactionWeight = 0.25;
    const contextWeight = 0.2;

    // Normalize time on page (cap at 5 minutes for score calculation)
    const timeScore = Math.min(pageVisit.timeOnPage / 300, 1.0);

    // Scroll depth score
    const scrollScore = pageVisit.scrollDepth / 100;

    // Interaction density score (interactions per minute)
    const interactionScore = pageVisit.timeOnPage > 0 ? 
      Math.min((pageVisit.interactions / (pageVisit.timeOnPage / 60)) / 10, 1.0) : 0;

    // Context score (position in journey, previous engagement)
    const pageSequence = journey.pageVisits.findIndex(v => v.id === pageVisit.id) + 1;
    const contextScore = this.calculateContextualEngagement(pageVisit, journey, pageSequence);

    const overallScore = (
      timeScore * timeWeight +
      scrollScore * scrollWeight +
      interactionScore * interactionWeight +
      contextScore * contextWeight
    );

    return Math.min(1.0, overallScore);
  }

  private calculateContextualEngagement(
    pageVisit: JourneyPageVisit,
    journey: JourneySession,
    pageSequence: number
  ): number {
    // Calculate engagement relative to journey context
    let contextScore = 0.5; // Base score

    // Journey progression bonus
    const progressionBonus = Math.min(pageSequence / 4, 1.0) * 0.3;
    contextScore += progressionBonus;

    // Previous page engagement influence
    if (pageSequence > 1) {
      const previousVisit = journey.pageVisits[pageSequence - 2];
      const previousEngagement = previousVisit.engagementScore;
      const continuityBonus = previousEngagement * 0.2;
      contextScore += continuityBonus;
    }

    // Final outcome influence
    if (journey.finalOutcome === 'completed') {
      contextScore *= 1.2; // Boost for successful journeys
    } else if (journey.finalOutcome === 'dropped_off') {
      contextScore *= 0.8; // Penalty for failed journeys
    }

    return Math.min(1.0, contextScore);
  }

  private async calculateEngagementSignificance(
    successfulEngagement: EngagementMetrics,
    failedEngagement: EngagementMetrics
  ): Promise<EngagementSignificance> {
    // Prepare engagement data for statistical testing
    const successfulData = [
      successfulEngagement.overallScore,
      successfulEngagement.scrollDepth / 100,
      Math.min(successfulEngagement.interactionCount / 10, 1.0)
    ];

    const failedData = [
      failedEngagement.overallScore,
      failedEngagement.scrollDepth / 100,
      Math.min(failedEngagement.interactionCount / 10, 1.0)
    ];

    // Perform chi-square test for categorical engagement data
    const chiSquareResult = this.performEngagementChiSquareTest(
      successfulEngagement,
      failedEngagement
    );

    // Calculate z-score for engagement differential
    const zScore = this.calculateEngagementZScore(successfulEngagement, failedEngagement);

    // Calculate effect size
    const effectSize = Math.abs(successfulEngagement.overallScore - failedEngagement.overallScore);

    // Calculate confidence interval
    const confidenceInterval = this.statisticsEngine.calculateWilsonConfidenceInterval(
      effectSize,
      1.0, // Maximum possible difference
      0.95
    );

    // Analyze individual engagement categories
    const categoryAnalysis = this.analyzeEngagementCategories(
      successfulEngagement,
      failedEngagement
    );

    return {
      pValue: chiSquareResult.pValue,
      zScore,
      effectSize,
      confidenceInterval,
      testType: 'chi_square',
      categoryAnalysis
    };
  }

  private performEngagementChiSquareTest(
    successful: EngagementMetrics,
    failed: EngagementMetrics
  ): { pValue: number; chiSquare: number; degreesOfFreedom: number } {
    // Categorize engagement levels for chi-square test
    const successfulCategories = this.categorizeEngagement(successful);
    const failedCategories = this.categorizeEngagement(failed);

    // Simple chi-square calculation (would use proper statistical library in production)
    const observed = [successfulCategories.high, successfulCategories.medium, successfulCategories.low];
    const expected = [failedCategories.high, failedCategories.medium, failedCategories.low];

    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] > 0) {
        chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
      }
    }

    // Degrees of freedom for engagement categories
    const degreesOfFreedom = observed.length - 1;

    // Approximate p-value calculation (simplified)
    const pValue = this.approximateChiSquarePValue(chiSquare, degreesOfFreedom);

    return { pValue, chiSquare, degreesOfFreedom };
  }

  private categorizeEngagement(engagement: EngagementMetrics): { high: number; medium: number; low: number } {
    // Categorize engagement metrics into high/medium/low
    const timeCategory = this.categorizeMetric(engagement.timeOnPage, [30, 120]); // seconds
    const scrollCategory = this.categorizeMetric(engagement.scrollDepth, [30, 70]); // percentage
    const interactionCategory = this.categorizeMetric(engagement.interactionCount, [2, 8]); // count

    // Combine categories (simplified approach)
    const categories = [timeCategory, scrollCategory, interactionCategory];
    const high = categories.filter(c => c === 'high').length;
    const medium = categories.filter(c => c === 'medium').length;
    const low = categories.filter(c => c === 'low').length;

    return { high, medium, low };
  }

  private categorizeMetric(value: number, thresholds: [number, number]): 'high' | 'medium' | 'low' {
    if (value >= thresholds[1]) return 'high';
    if (value >= thresholds[0]) return 'medium';
    return 'low';
  }

  private calculateEngagementZScore(
    successful: EngagementMetrics,
    failed: EngagementMetrics
  ): number {
    const meanDiff = successful.overallScore - failed.overallScore;
    const pooledStd = 0.2; // Estimated standard deviation for engagement scores
    return pooledStd > 0 ? meanDiff / pooledStd : 0;
  }

  private analyzeEngagementCategories(
    successful: EngagementMetrics,
    failed: EngagementMetrics
  ): any[] {
    // Analyze specific engagement category differences
    return [
      {
        category: 'time_engagement',
        successfulValue: successful.timeOnPage,
        failedValue: failed.timeOnPage,
        significance: this.calculateCategorySignificance(successful.timeOnPage, failed.timeOnPage)
      },
      {
        category: 'scroll_engagement',
        successfulValue: successful.scrollDepth,
        failedValue: failed.scrollDepth,
        significance: this.calculateCategorySignificance(successful.scrollDepth, failed.scrollDepth)
      },
      {
        category: 'interaction_engagement',
        successfulValue: successful.interactionCount,
        failedValue: failed.interactionCount,
        significance: this.calculateCategorySignificance(successful.interactionCount, failed.interactionCount)
      }
    ];
  }

  private calculateCategorySignificance(value1: number, value2: number): number {
    // Simple significance calculation for individual categories
    const diff = Math.abs(value1 - value2);
    const maxValue = Math.max(value1, value2);
    return maxValue > 0 ? diff / maxValue : 0;
  }

  private approximateChiSquarePValue(chiSquare: number, df: number): number {
    // Simplified chi-square p-value approximation
    // In production, would use proper statistical library
    if (chiSquare < 3.84 && df === 1) return 0.05; // Critical value at 0.05
    if (chiSquare < 5.99 && df === 2) return 0.05;
    if (chiSquare < 7.81 && df === 3) return 0.05;
    
    return chiSquare > (3.84 * df) ? 0.01 : 0.1; // Very rough approximation
  }

  private isEngagementDiffSignificant(engagementDiff: EngagementDiff): boolean {
    return engagementDiff.statisticalSignificance.pValue < this.config.significanceThreshold ||
           Math.abs(engagementDiff.engagementDifferential) >= 0.2; // 20% difference threshold
  }

  private async analyzeInteractionPatternDifferences(
    successful: EngagementMetrics,
    failed: EngagementMetrics
  ): Promise<any[]> {
    // Analyze differences in interaction patterns
    return []; // Placeholder
  }

  private async analyzeAttentionDifferences(
    successfulVisit: JourneyPageVisit,
    failedVisit: JourneyPageVisit,
    pageType: JourneyPageType
  ): Promise<any> {
    // Analyze attention pattern differences
    return {}; // Placeholder
  }

  private analyzeBehavioralTransitions(behaviors: EngagementBehavior[]): EngagementBehavior[] {
    // Analyze transitions between behavioral states
    return behaviors; // Simplified
  }

  // Helper methods for extracting engagement events
  private async extractClickEvents(pageVisit: JourneyPageVisit): Promise<ClickEvent[]> {
    // Extract click events (would query detailed tracking data)
    return [];
  }

  private async extractScrollEvents(pageVisit: JourneyPageVisit): Promise<ScrollEvent[]> {
    // Extract scroll events
    return [];
  }

  private async extractFocusEvents(pageVisit: JourneyPageVisit): Promise<FocusEvent[]> {
    // Extract focus events
    return [];
  }

  private async analyzeMouseMovements(pageVisit: JourneyPageVisit): Promise<MouseMovementSummary> {
    // Analyze mouse movement patterns
    return {
      totalDistance: 0,
      averageVelocity: 0,
      pauseFrequency: 0,
      hoverDuration: 0,
      trajectoryPattern: 'linear'
    };
  }

  private async analyzeReadingPattern(
    pageVisit: JourneyPageVisit,
    clicks: ClickEvent[],
    scrolls: ScrollEvent[],
    focus: FocusEvent[]
  ): Promise<ReadingPatternAnalysis> {
    // Analyze reading behavior patterns
    return {
      readingSpeed: 0,
      comprehensionIndicators: 0,
      scanningBehavior: false,
      focusAreas: [],
      readingPath: []
    };
  }

  private getEmptyMouseMovements(): MouseMovementSummary {
    return {
      totalDistance: 0,
      averageVelocity: 0,
      pauseFrequency: 0,
      hoverDuration: 0,
      trajectoryPattern: 'unknown'
    };
  }

  private getEmptyReadingPattern(): ReadingPatternAnalysis {
    return {
      readingSpeed: 0,
      comprehensionIndicators: 0,
      scanningBehavior: false,
      focusAreas: [],
      readingPath: []
    };
  }

  // Insight generation methods
  private identifyPrimaryEngagementFactors(diffs: EngagementDiff[]): any[] {
    return []; // Placeholder
  }

  private analyzeBehavioralDifferences(diffs: EngagementDiff[]): any[] {
    return []; // Placeholder
  }

  private summarizeAttentionPatterns(diffs: EngagementDiff[]): any[] {
    return []; // Placeholder
  }

  private generateEngagementRecommendations(diffs: EngagementDiff[]): any[] {
    return []; // Placeholder
  }

  private generateEngagementDiffId(visit1Id: string, visit2Id: string, pageType: JourneyPageType): string {
    return `engagement-diff-${pageType}-${visit1Id}-${visit2Id}-${Date.now()}`;
  }
}

// ============================================================================
// SUPPORTING ANALYZER CLASSES
// ============================================================================

class BehaviorPatternAnalyzer {
  constructor(private config: EngagementDifferentialConfig) {}

  async analyzePageBehavior(
    pageVisit: JourneyPageVisit,
    journey: JourneySession
  ): Promise<EngagementBehavior[]> {
    const behaviors: EngagementBehavior[] = [];

    // Classify engagement behavior based on metrics
    const category = this.classifyEngagementBehavior(pageVisit, journey);
    const confidence = this.calculateBehaviorConfidence(pageVisit, category);

    const behavior: EngagementBehavior = {
      category,
      confidence,
      duration: pageVisit.timeOnPage,
      intensity: pageVisit.engagementScore,
      characteristics: {
        averageInteractionInterval: pageVisit.timeOnPage / Math.max(pageVisit.interactions, 1),
        scrollConsistency: this.calculateScrollConsistency(pageVisit),
        focusDepth: pageVisit.engagementScore,
        navigationConfidence: 0.7, // Placeholder
        contentResonance: 0.6 // Placeholder
      },
      triggers: [],
      outcomes: []
    };

    behaviors.push(behavior);
    return behaviors;
  }

  private classifyEngagementBehavior(pageVisit: JourneyPageVisit, journey: JourneySession): EngagementCategory {
    const timeOnPage = pageVisit.timeOnPage;
    const engagementScore = pageVisit.engagementScore;
    const scrollDepth = pageVisit.scrollDepth;
    const interactions = pageVisit.interactions;

    // Classification logic based on multiple factors
    if (engagementScore > 0.8 && timeOnPage > 120 && interactions > 5) return 'highly_engaged';
    if (engagementScore > 0.6 && timeOnPage > 60 && scrollDepth > 50) return 'moderately_engaged';
    if (timeOnPage > 30 && scrollDepth > 20 && interactions < 3) return 'passively_browsing';
    if (timeOnPage < 30 && scrollDepth > 60 && interactions > 2) return 'scanning_quickly';
    if (engagementScore < 0.3 && timeOnPage > 60) return 'struggling_to_engage';
    
    return 'abandoning';
  }

  private calculateBehaviorConfidence(pageVisit: JourneyPageVisit, category: EngagementCategory): number {
    // Calculate confidence in behavior classification
    const factors = [
      pageVisit.engagementScore,
      Math.min(pageVisit.timeOnPage / 180, 1.0), // Normalize to 3 minutes
      Math.min(pageVisit.scrollDepth / 100, 1.0),
      Math.min(pageVisit.interactions / 10, 1.0)
    ];

    const avgFactor = factors.reduce((sum, f) => sum + f, 0) / factors.length;
    return Math.min(1.0, avgFactor * 1.2); // Boost confidence slightly
  }

  private calculateScrollConsistency(pageVisit: JourneyPageVisit): number {
    // Calculate consistency of scroll behavior (would analyze detailed scroll events)
    return pageVisit.scrollDepth > 0 ? 0.7 : 0.3;
  }
}

class AttentionModeler {
  constructor(private config: EngagementDifferentialConfig) {}

  modelAttentionFlow(pageVisit: JourneyPageVisit): any {
    // Model user attention flow through the page
    return {}; // Placeholder
  }
}

export type {
  EngagementDifferentialConfig,
  EngagementCategory,
  EngagementBehavior,
  BehaviorCharacteristics,
  EngagementTrigger,
  EngagementOutcome
};