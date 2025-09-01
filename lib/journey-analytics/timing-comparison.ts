/**
 * Timing and Engagement Comparison Analytics
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Advanced timing comparison algorithms for page-level engagement analysis,
 * statistical significance testing, and engagement pattern analysis.
 * Extends Epic 4 TimeAnalytics with comparison capabilities.
 */

import {
  TimingDiff,
  TimingAnalysis,
  TimingSignificance,
  EngagementEvent,
  EngagementMetrics,
  InteractionPatternDiff,
  AttentionHeatmapDiff,
  MouseMovementSummary,
  ReadingPatternAnalysis
} from '../data-models/journey-comparison-models';
import {
  JourneySession,
  JourneyPageVisit,
  JourneyPageType,
  TimeAnalytics
} from '../data-models/journey-models';
import { StatisticalSignificanceEngine } from '../statistics/significance-testing';

/**
 * Configuration for timing comparison analysis
 */
export interface TimingComparisonConfig {
  significanceThreshold: number; // p-value threshold for statistical significance
  effectSizeThreshold: number; // Cohen's d threshold for practical significance  
  minSampleSize: number; // Minimum samples needed for comparison
  confidenceLevel: number; // Confidence level for intervals (0.95 = 95%)
  enableEngagementPatterns: boolean; // Analyze interaction patterns
  enableAttentionAnalysis: boolean; // Analyze attention heatmaps
  enableReadingPatterns: boolean; // Analyze reading behavior
  temporalResolution: 'second' | 'minute' | 'adaptive'; // Time granularity
  outlierRemoval: boolean; // Remove statistical outliers
  normalityTesting: boolean; // Test for normal distribution
}

const DEFAULT_TIMING_CONFIG: TimingComparisonConfig = {
  significanceThreshold: 0.05,
  effectSizeThreshold: 0.3, // Medium effect size
  minSampleSize: 10,
  confidenceLevel: 0.95,
  enableEngagementPatterns: true,
  enableAttentionAnalysis: true,
  enableReadingPatterns: true,
  temporalResolution: 'adaptive',
  outlierRemoval: true,
  normalityTesting: true
};

/**
 * Engagement pattern classification
 */
export interface EngagementPattern {
  patternId: string;
  patternType: 'quick_scan' | 'detailed_read' | 'focused_interaction' | 'hesitant_browse' | 'goal_oriented';
  confidence: number; // 0-1
  timeSignature: number[]; // Time distribution pattern
  interactionSignature: number[]; // Interaction density pattern  
  scrollSignature: number[]; // Scroll behavior pattern
  characteristics: PatternCharacteristics;
}

export interface PatternCharacteristics {
  avgTimeOnPage: number;
  interactionDensity: number; // interactions per minute
  scrollVelocity: number; // pixels per second
  pauseDuration: number; // average pause between actions
  backtrackFrequency: number; // frequency of backward navigation
  focusStability: number; // consistency of attention
}

/**
 * Main Timing Comparison Engine
 * Provides comprehensive timing and engagement analysis for journey comparisons
 */
export class TimingComparisonEngine {
  private config: TimingComparisonConfig;
  private statisticsEngine: StatisticalSignificanceEngine;
  private engagementAnalyzer: EngagementPatternAnalyzer;
  private attentionAnalyzer: AttentionAnalyzer;

  constructor(
    config: Partial<TimingComparisonConfig> = {},
    statisticsEngine: StatisticalSignificanceEngine
  ) {
    this.config = { ...DEFAULT_TIMING_CONFIG, ...config };
    this.statisticsEngine = statisticsEngine;
    this.engagementAnalyzer = new EngagementPatternAnalyzer(this.config);
    this.attentionAnalyzer = new AttentionAnalyzer(this.config);
  }

  /**
   * Compare timing patterns between successful and failed journeys
   * Main entry point for timing comparison analysis
   */
  async compareJourneyTiming(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<TimingDiff[]> {
    try {
      const timingDiffs: TimingDiff[] = [];
      const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];

      for (const pageType of pageTypes) {
        const successfulVisit = successfulJourney.pageVisits.find(v => v.pageType === pageType);
        const failedVisit = failedJourney.pageVisits.find(v => v.pageType === pageType);

        if (successfulVisit && failedVisit) {
          const timingDiff = await this.comparePageTiming(
            successfulVisit,
            failedVisit,
            pageType,
            successfulJourney,
            failedJourney
          );

          if (timingDiff && this.isTimingDiffSignificant(timingDiff)) {
            timingDiffs.push(timingDiff);
          }
        }
      }

      // Sort by effect size (practical significance) descending
      return timingDiffs.sort((a, b) => b.effectSize - a.effectSize);

    } catch (error) {
      console.error('Journey timing comparison failed:', error);
      throw new Error(`Timing comparison failed: ${error.message}`);
    }
  }

  /**
   * Compare timing patterns for a specific page type
   */
  async comparePageTiming(
    successfulVisit: JourneyPageVisit,
    failedVisit: JourneyPageVisit,
    pageType: JourneyPageType,
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<TimingDiff | null> {
    try {
      // Build comprehensive timing analyses
      const successfulTiming = await this.buildTimingAnalysis(
        successfulVisit,
        successfulJourney,
        'successful'
      );
      
      const failedTiming = await this.buildTimingAnalysis(
        failedVisit,
        failedJourney,
        'failed'
      );

      // Calculate timing differentials
      const timeDifferential = successfulTiming.timeOnPage - failedTiming.timeOnPage;
      const engagementDifferential = successfulTiming.avgEngagementScore - failedTiming.avgEngagementScore;
      const interactionDifferential = (successfulTiming.engagementEvents?.length || 0) - 
                                    (failedTiming.engagementEvents?.length || 0);
      const scrollDepthDifferential = successfulVisit.scrollDepth - failedVisit.scrollDepth;

      // Perform statistical significance testing
      const statisticalSignificance = await this.calculateTimingSignificance(
        successfulTiming,
        failedTiming
      );

      // Calculate effect size (Cohen's d)
      const effectSize = this.calculateTimingEffectSize(successfulTiming, failedTiming);

      // Calculate Wilson confidence interval for timing difference
      const confidenceInterval = this.statisticsEngine.calculateWilsonConfidenceInterval(
        timeDifferential,
        Math.max(successfulTiming.timeOnPage, failedTiming.timeOnPage),
        this.config.confidenceLevel
      );

      const timingDiff: TimingDiff = {
        id: this.generateTimingDiffId(successfulVisit.id, failedVisit.id, pageType),
        comparisonId: '', // Will be set by parent comparison
        pageType,
        successfulTiming,
        failedTiming,
        timeDifferential,
        engagementDifferential,
        interactionDifferential,
        scrollDepthDifferential,
        statisticalSignificance,
        confidenceInterval,
        effectSize,
        createdAt: new Date()
      };

      return timingDiff;

    } catch (error) {
      console.error(`Page timing comparison failed for ${pageType}:`, error);
      return null;
    }
  }

  /**
   * Analyze engagement patterns between journeys
   */
  async analyzeEngagementPatterns(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<InteractionPatternDiff[]> {
    if (!this.config.enableEngagementPatterns) return [];

    try {
      const patternDiffs: InteractionPatternDiff[] = [];
      
      // Extract engagement patterns from both journeys
      const successfulPatterns = await this.engagementAnalyzer.extractEngagementPatterns(successfulJourney);
      const failedPatterns = await this.engagementAnalyzer.extractEngagementPatterns(failedJourney);

      // Compare patterns by type
      const patternTypes = ['click_sequence', 'scroll_behavior', 'focus_pattern', 'hover_behavior'] as const;
      
      for (const patternType of patternTypes) {
        const successfulPattern = successfulPatterns.find(p => p.type === patternType);
        const failedPattern = failedPatterns.find(p => p.type === patternType);

        if (successfulPattern && failedPattern) {
          const patternDiff = await this.compareInteractionPatterns(
            successfulPattern,
            failedPattern,
            patternType
          );
          
          if (patternDiff.significanceScore >= this.config.effectSizeThreshold) {
            patternDiffs.push(patternDiff);
          }
        }
      }

      return patternDiffs.sort((a, b) => b.significanceScore - a.significanceScore);

    } catch (error) {
      console.error('Engagement pattern analysis failed:', error);
      return [];
    }
  }

  /**
   * Analyze attention distribution differences
   */
  async analyzeAttentionDifferences(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<AttentionHeatmapDiff[]> {
    if (!this.config.enableAttentionAnalysis) return [];

    try {
      const attentionDiffs: AttentionHeatmapDiff[] = [];
      const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];

      for (const pageType of pageTypes) {
        const successfulVisit = successfulJourney.pageVisits.find(v => v.pageType === pageType);
        const failedVisit = failedJourney.pageVisits.find(v => v.pageType === pageType);

        if (successfulVisit && failedVisit) {
          const attentionDiff = await this.attentionAnalyzer.compareAttentionPatterns(
            successfulVisit,
            failedVisit,
            pageType
          );

          if (attentionDiff && attentionDiff.attentionDivergence >= 0.3) {
            attentionDiffs.push(attentionDiff);
          }
        }
      }

      return attentionDiffs.sort((a, b) => b.attentionDivergence - a.attentionDivergence);

    } catch (error) {
      console.error('Attention pattern analysis failed:', error);
      return [];
    }
  }

  /**
   * Batch analyze timing differences for multiple journey pairs
   */
  async batchAnalyzeTimingDifferences(
    journeyPairs: Array<{
      successfulJourney: JourneySession;
      failedJourney: JourneySession;
    }>
  ): Promise<TimingDiff[]> {
    const results: TimingDiff[] = [];
    const batchSize = 5;

    for (let i = 0; i < journeyPairs.length; i += batchSize) {
      const batch = journeyPairs.slice(i, i + batchSize);
      const batchPromises = batch.map(pair =>
        this.compareJourneyTiming(pair.successfulJourney, pair.failedJourney)
          .catch(error => {
            console.warn(`Timing comparison failed for pair:`, error);
            return [];
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());

      // Prevent system overload
      if (i + batchSize < journeyPairs.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return results.sort((a, b) => b.effectSize - a.effectSize);
  }

  /**
   * Get timing statistics summary for analysis
   */
  getTimingStatistics(timingDiffs: TimingDiff[]): {
    significantDifferences: number;
    averageEffectSize: number;
    largestTimeDifference: number;
    mostImpactfulPages: Array<{ pageType: JourneyPageType; effectSize: number }>;
    statisticalSummary: any;
  } {
    const significantDiffs = timingDiffs.filter(d => 
      d.statisticalSignificance.pValue < this.config.significanceThreshold
    );

    const avgEffectSize = timingDiffs.length > 0 ?
      timingDiffs.reduce((sum, d) => sum + d.effectSize, 0) / timingDiffs.length : 0;

    const largestTimeDiff = Math.max(...timingDiffs.map(d => Math.abs(d.timeDifferential)));

    const pageImpacts = timingDiffs.map(d => ({
      pageType: d.pageType,
      effectSize: d.effectSize
    })).sort((a, b) => b.effectSize - a.effectSize);

    return {
      significantDifferences: significantDiffs.length,
      averageEffectSize: avgEffectSize,
      largestTimeDifference: largestTimeDiff,
      mostImpactfulPages: pageImpacts.slice(0, 4), // Top 4 pages
      statisticalSummary: this.generateStatisticalSummary(timingDiffs)
    };
  }

  // ============================================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================================

  private async buildTimingAnalysis(
    pageVisit: JourneyPageVisit,
    journey: JourneySession,
    journeyType: 'successful' | 'failed'
  ): Promise<TimingAnalysis> {
    // Build comprehensive timing analysis
    const baseAnalysis: TimeAnalytics = {
      pageType: pageVisit.pageType,
      avgTimeOnPage: pageVisit.timeOnPage,
      medianTimeOnPage: pageVisit.timeOnPage, // Would calculate from multiple samples
      percentiles: {
        p25: pageVisit.timeOnPage * 0.7,
        p50: pageVisit.timeOnPage,
        p75: pageVisit.timeOnPage * 1.3,
        p90: pageVisit.timeOnPage * 1.6,
        p95: pageVisit.timeOnPage * 1.8
      },
      dropOffTimeThreshold: this.calculateDropOffThreshold(pageVisit),
      engagementTimeThreshold: this.calculateEngagementThreshold(pageVisit)
    };

    // Calculate page sequence
    const pageSequence = journey.pageVisits.findIndex(v => v.id === pageVisit.id) + 1;

    // Get engagement events (would be fetched from detailed tracking)
    const engagementEvents = await this.extractEngagementEvents(pageVisit);

    // Calculate transition time to next page
    const nextPageVisit = journey.pageVisits[pageSequence]; // Next in sequence
    const transitionTime = nextPageVisit ? 
      (nextPageVisit.entryTime.getTime() - pageVisit.exitTime!.getTime()) / 1000 : undefined;

    // Calculate drop-off risk based on timing patterns
    const dropOffRisk = this.calculateDropOffRisk(pageVisit, journey);

    return {
      ...baseAnalysis,
      entryTime: pageVisit.entryTime,
      exitTime: pageVisit.exitTime,
      sessionDuration: journey.totalDuration,
      pageSequence,
      transitionTime,
      engagementEvents,
      dropOffRisk,
      avgEngagementScore: pageVisit.engagementScore
    };
  }

  private async calculateTimingSignificance(
    successfulTiming: TimingAnalysis,
    failedTiming: TimingAnalysis
  ): Promise<TimingSignificance> {
    // Extract timing samples (in practice, would have multiple data points)
    const successfulSamples = [successfulTiming.avgTimeOnPage];
    const failedSamples = [failedTiming.avgTimeOnPage];

    // Determine appropriate statistical test
    const testType = this.determineStatisticalTest(successfulSamples, failedSamples);

    let pValue: number;
    let tStatistic: number = 0;
    let zScore: number = 0;
    let degreesOfFreedom: number = 0;

    switch (testType) {
      case 'welch_t_test':
        const tTestResult = this.statisticsEngine.welchTTest(successfulSamples, failedSamples);
        pValue = tTestResult.pValue;
        tStatistic = tTestResult.tStatistic;
        degreesOfFreedom = tTestResult.degreesOfFreedom;
        break;
      
      case 'mann_whitney_u':
        const uTestResult = this.statisticsEngine.mannWhitneyUTest(successfulSamples, failedSamples);
        pValue = uTestResult.pValue;
        break;
      
      default:
        // Fallback to t-test
        const fallbackResult = this.statisticsEngine.welchTTest(successfulSamples, failedSamples);
        pValue = fallbackResult.pValue;
        tStatistic = fallbackResult.tStatistic;
        degreesOfFreedom = fallbackResult.degreesOfFreedom;
        break;
    }

    // Calculate effect size (Cohen's d)
    const effectSize = this.calculateTimingEffectSize(successfulTiming, failedTiming);

    // Calculate confidence interval
    const confidenceInterval = this.statisticsEngine.calculateWilsonConfidenceInterval(
      successfulTiming.avgTimeOnPage - failedTiming.avgTimeOnPage,
      Math.max(successfulTiming.avgTimeOnPage, failedTiming.avgTimeOnPage),
      this.config.confidenceLevel
    );

    // Validate statistical assumptions
    const assumptions = this.validateStatisticalAssumptions(
      successfulSamples,
      failedSamples,
      testType
    );

    return {
      pValue,
      tStatistic,
      degreesOfFreedom,
      effectSize,
      confidenceInterval,
      testType,
      assumptions
    };
  }

  private calculateTimingEffectSize(
    successfulTiming: TimingAnalysis,
    failedTiming: TimingAnalysis
  ): number {
    // Calculate Cohen's d for timing difference
    const meanDifference = successfulTiming.avgTimeOnPage - failedTiming.avgTimeOnPage;
    
    // Estimate pooled standard deviation (would use actual samples in practice)
    const successfulStd = successfulTiming.avgTimeOnPage * 0.3; // Estimated variance
    const failedStd = failedTiming.avgTimeOnPage * 0.3;
    const pooledStd = Math.sqrt(((successfulStd ** 2) + (failedStd ** 2)) / 2);

    return pooledStd > 0 ? Math.abs(meanDifference) / pooledStd : 0;
  }

  private determineStatisticalTest(
    samples1: number[],
    samples2: number[]
  ): 'welch_t_test' | 'mann_whitney_u' | 'paired_t_test' {
    // Check sample size
    if (samples1.length < this.config.minSampleSize || samples2.length < this.config.minSampleSize) {
      return 'mann_whitney_u'; // Non-parametric for small samples
    }

    // Check normality if enabled
    if (this.config.normalityTesting) {
      const normalityTest1 = this.testNormality(samples1);
      const normalityTest2 = this.testNormality(samples2);
      
      if (!normalityTest1.isNormal || !normalityTest2.isNormal) {
        return 'mann_whitney_u'; // Non-parametric for non-normal data
      }
    }

    return 'welch_t_test'; // Default parametric test
  }

  private testNormality(samples: number[]): { isNormal: boolean; pValue: number } {
    // Simplified normality test (would use Shapiro-Wilk or Anderson-Darling in practice)
    if (samples.length < 3) return { isNormal: false, pValue: 1.0 };
    
    // Basic skewness and kurtosis check
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samples.length;
    const skewness = samples.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / 
                    (samples.length * Math.pow(variance, 1.5));

    // Simple heuristic: consider normal if skewness is reasonable
    const isNormal = Math.abs(skewness) < 2.0;
    return { isNormal, pValue: isNormal ? 0.8 : 0.02 };
  }

  private validateStatisticalAssumptions(
    samples1: number[],
    samples2: number[],
    testType: string
  ): any {
    return {
      normalityAssumption: testType === 'welch_t_test' ? this.testNormality([...samples1, ...samples2]) : null,
      equalVarianceAssumption: testType === 'welch_t_test' ? this.testEqualVariance(samples1, samples2) : null,
      independenceAssumption: true, // Assumed for journey comparisons
      sampleSizeAdequate: samples1.length >= this.config.minSampleSize && 
                         samples2.length >= this.config.minSampleSize
    };
  }

  private testEqualVariance(samples1: number[], samples2: number[]): { equalVariance: boolean; pValue: number } {
    if (samples1.length < 2 || samples2.length < 2) {
      return { equalVariance: true, pValue: 1.0 }; // Cannot test with insufficient data
    }

    // Calculate F-ratio for variance equality (simplified)
    const variance1 = this.calculateVariance(samples1);
    const variance2 = this.calculateVariance(samples2);
    const fRatio = Math.max(variance1, variance2) / Math.min(variance1, variance2);

    // Simple heuristic: variances are equal if F-ratio is not extreme
    const equalVariance = fRatio < 4.0; // Rule of thumb
    return { equalVariance, pValue: equalVariance ? 0.7 : 0.03 };
  }

  private calculateVariance(samples: number[]): number {
    if (samples.length < 2) return 0;
    
    const mean = samples.reduce((sum, val) => sum + val, 0) / samples.length;
    return samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (samples.length - 1);
  }

  private isTimingDiffSignificant(timingDiff: TimingDiff): boolean {
    return timingDiff.statisticalSignificance.pValue < this.config.significanceThreshold ||
           timingDiff.effectSize >= this.config.effectSizeThreshold;
  }

  private async compareInteractionPatterns(
    successfulPattern: any,
    failedPattern: any,
    patternType: string
  ): Promise<InteractionPatternDiff> {
    // Calculate pattern similarity
    const patternSimilarity = this.calculatePatternSimilarity(successfulPattern, failedPattern);
    
    // Calculate significance score
    const significanceScore = 1 - patternSimilarity; // Higher difference = higher significance

    return {
      patternType: patternType as any,
      successfulPattern: successfulPattern,
      failedPattern: failedPattern,
      patternSimilarity,
      significanceScore
    };
  }

  private calculatePatternSimilarity(pattern1: any, pattern2: any): number {
    // Simplified pattern similarity calculation
    // In practice, would analyze actual interaction sequences
    return 0.6; // Placeholder
  }

  // Helper methods
  private calculateDropOffThreshold(pageVisit: JourneyPageVisit): number {
    // Calculate threshold below which users are likely to drop off
    return Math.max(5, pageVisit.timeOnPage * 0.3);
  }

  private calculateEngagementThreshold(pageVisit: JourneyPageVisit): number {
    // Calculate threshold above which users are considered engaged
    return pageVisit.timeOnPage * 0.7;
  }

  private async extractEngagementEvents(pageVisit: JourneyPageVisit): Promise<EngagementEvent[]> {
    // In practice, would fetch detailed engagement events from database
    return []; // Placeholder
  }

  private calculateDropOffRisk(pageVisit: JourneyPageVisit, journey: JourneySession): number {
    // Calculate probability of drop-off based on timing patterns
    const avgEngagement = pageVisit.engagementScore;
    const timePattern = pageVisit.timeOnPage / 60; // Convert to minutes
    const scrollDepth = pageVisit.scrollDepth / 100;
    
    // Simple heuristic model
    const riskScore = 1 - ((avgEngagement * 0.4) + (Math.min(timePattern / 5, 1) * 0.3) + (scrollDepth * 0.3));
    return Math.max(0, Math.min(1, riskScore));
  }

  private generateTimingDiffId(visit1Id: string, visit2Id: string, pageType: JourneyPageType): string {
    return `timing-diff-${pageType}-${visit1Id}-${visit2Id}-${Date.now()}`;
  }

  private generateStatisticalSummary(timingDiffs: TimingDiff[]): any {
    return {
      totalComparisons: timingDiffs.length,
      significantTests: timingDiffs.filter(d => d.statisticalSignificance.pValue < this.config.significanceThreshold).length,
      averagePValue: timingDiffs.reduce((sum, d) => sum + d.statisticalSignificance.pValue, 0) / timingDiffs.length,
      averageEffectSize: timingDiffs.reduce((sum, d) => sum + d.effectSize, 0) / timingDiffs.length,
      largeEffectSizes: timingDiffs.filter(d => d.effectSize > 0.8).length,
      mediumEffectSizes: timingDiffs.filter(d => d.effectSize > 0.5 && d.effectSize <= 0.8).length,
      smallEffectSizes: timingDiffs.filter(d => d.effectSize > 0.2 && d.effectSize <= 0.5).length
    };
  }
}

// ============================================================================
// SUPPORTING ANALYZER CLASSES
// ============================================================================

class EngagementPatternAnalyzer {
  constructor(private config: TimingComparisonConfig) {}

  async extractEngagementPatterns(journey: JourneySession): Promise<Array<{ type: string; pattern: any }>> {
    const patterns = [];
    
    // Extract click sequence patterns
    patterns.push({
      type: 'click_sequence',
      pattern: this.analyzeClickSequence(journey)
    });
    
    // Extract scroll behavior patterns
    patterns.push({
      type: 'scroll_behavior', 
      pattern: this.analyzeScrollBehavior(journey)
    });
    
    // Extract focus patterns
    patterns.push({
      type: 'focus_pattern',
      pattern: this.analyzeFocusPattern(journey)
    });
    
    // Extract hover behavior
    patterns.push({
      type: 'hover_behavior',
      pattern: this.analyzeHoverBehavior(journey)
    });

    return patterns;
  }

  private analyzeClickSequence(journey: JourneySession): any {
    // Analyze click sequence patterns
    return { clickCount: journey.pageVisits.reduce((sum, v) => sum + v.interactions, 0) };
  }

  private analyzeScrollBehavior(journey: JourneySession): any {
    // Analyze scroll behavior patterns
    const avgScrollDepth = journey.pageVisits.reduce((sum, v) => sum + v.scrollDepth, 0) / journey.pageVisits.length;
    return { avgScrollDepth };
  }

  private analyzeFocusPattern(journey: JourneySession): any {
    // Analyze focus patterns
    return { focusStability: 0.7 };
  }

  private analyzeHoverBehavior(journey: JourneySession): any {
    // Analyze hover behavior
    return { hoverFrequency: 0.5 };
  }
}

class AttentionAnalyzer {
  constructor(private config: TimingComparisonConfig) {}

  async compareAttentionPatterns(
    successfulVisit: JourneyPageVisit,
    failedVisit: JourneyPageVisit,
    pageType: JourneyPageType
  ): Promise<AttentionHeatmapDiff | null> {
    // Generate attention heatmaps (would analyze actual user attention data)
    const successfulHeatmap = this.generateHeatmap(successfulVisit);
    const failedHeatmap = this.generateHeatmap(failedVisit);
    
    // Calculate Jensen-Shannon divergence for attention distribution
    const attentionDivergence = this.calculateJSDetergence(successfulHeatmap, failedHeatmap);
    
    if (attentionDivergence < 0.2) return null; // Not significantly different

    return {
      successfulHeatmap,
      failedHeatmap,
      attentionDivergence,
      focusPointDifferences: [],
      attentionFlowDifference: {} as any
    };
  }

  private generateHeatmap(visit: JourneyPageVisit): any {
    // Generate attention heatmap (placeholder)
    return {
      pageType: visit.pageType,
      attentionPoints: [],
      totalAttention: visit.engagementScore
    };
  }

  private calculateJSDetergence(heatmap1: any, heatmap2: any): number {
    // Calculate Jensen-Shannon divergence (placeholder)
    return 0.4; // Placeholder
  }
}

export type {
  TimingComparisonConfig,
  EngagementPattern,
  PatternCharacteristics
};