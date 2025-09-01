/**
 * Journey Comparison Engine
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Core algorithms for journey comparison, pairing successful vs failed journeys,
 * and performing comprehensive statistical analysis. Integrates with Epic 4 infrastructure.
 */

import {
  JourneyComparison,
  JourneyComparisonResult,
  ComparisonType,
  ComparisonInsights,
  ComparisonRecommendation,
  Differentiator,
  Evidence,
  ComparisonStatistics,
  ComparisonMetadata,
  TimingDiff,
  EngagementDiff
} from '../data-models/journey-comparison-models';
import {
  JourneySession,
  JourneyPageType,
  JourneyOutcome
} from '../data-models/journey-models';
import { DropOffDetectionEngine } from './drop-off-engine';
import { ContentDiffEngine } from '../content-analysis/content-diff-engine';
import { TimingComparisonEngine } from './timing-comparison';
import { HypothesisCorrelationEngine } from '../hypothesis-analytics/correlation-engine';
import { StatisticalSignificanceEngine } from '../statistics/significance-testing';

/**
 * Configuration for journey comparison analysis
 */
export interface ComparisonEngineConfig {
  minSampleSize: number;
  confidenceThreshold: number;
  significanceLevel: number;
  maxComparisonDistance: number; // days between journeys
  requireHypothesisMatch: boolean;
  enableContentAnalysis: boolean;
  enableTimingAnalysis: boolean;
  enableEngagementAnalysis: boolean;
  enableHypothesisAnalysis: boolean;
  backgroundProcessing: boolean;
}

/**
 * Default configuration aligned with Epic 4 standards
 */
const DEFAULT_CONFIG: ComparisonEngineConfig = {
  minSampleSize: 5,
  confidenceThreshold: 0.6,
  significanceLevel: 0.05,
  maxComparisonDistance: 30,
  requireHypothesisMatch: false,
  enableContentAnalysis: true,
  enableTimingAnalysis: true,
  enableEngagementAnalysis: true,
  enableHypothesisAnalysis: true,
  backgroundProcessing: true
};

/**
 * Journey pairing criteria for comparison analysis
 */
export interface JourneyPairingCriteria {
  clientIndustry?: string;
  contentVariationType?: string;
  timeWindow?: { start: Date; end: Date };
  minimumEngagement?: number;
  pageTypes?: JourneyPageType[];
  hypothesisCategories?: string[];
  outcomeTypes?: JourneyOutcome[];
}

/**
 * Journey pairing result with matching confidence
 */
export interface JourneyPair {
  successfulJourney: JourneySession;
  failedJourney: JourneySession;
  matchingScore: number; // 0-1, how well they match for comparison
  matchingFactors: MatchingFactor[];
  comparisonViability: number; // 0-1, confidence in comparison validity
  recommendedAnalysisType: ComparisonType;
}

export interface MatchingFactor {
  factor: 'temporal_proximity' | 'content_similarity' | 'client_similarity' | 'hypothesis_alignment' | 'engagement_level';
  score: number; // 0-1
  weight: number; // 0-1
  description: string;
}

/**
 * Main Journey Comparison Engine
 * Orchestrates comparison analysis using Epic 4 statistical foundations
 */
export class JourneyComparisonEngine {
  private config: ComparisonEngineConfig;
  private dropOffEngine: DropOffDetectionEngine;
  private contentDiffEngine: ContentDiffEngine;
  private timingEngine: TimingComparisonEngine;
  private hypothesisEngine: HypothesisCorrelationEngine;
  private statisticsEngine: StatisticalSignificanceEngine;

  constructor(
    config: Partial<ComparisonEngineConfig> = {},
    dropOffEngine: DropOffDetectionEngine,
    contentDiffEngine: ContentDiffEngine,
    timingEngine: TimingComparisonEngine,
    hypothesisEngine: HypothesisCorrelationEngine,
    statisticsEngine: StatisticalSignificanceEngine
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dropOffEngine = dropOffEngine;
    this.contentDiffEngine = contentDiffEngine;
    this.timingEngine = timingEngine;
    this.hypothesisEngine = hypothesisEngine;
    this.statisticsEngine = statisticsEngine;
  }

  /**
   * Find optimal journey pairs for comparison analysis
   * Uses intelligent matching algorithms to pair successful vs failed journeys
   */
  async findOptimalJourneyPairs(
    criteria: JourneyPairingCriteria = {},
    limit: number = 50
  ): Promise<JourneyPair[]> {
    try {
      // Fetch candidate journeys based on criteria
      const [successfulJourneys, failedJourneys] = await Promise.all([
        this.fetchJourneysByCriteria({ ...criteria, outcomeTypes: ['completed'] }),
        this.fetchJourneysByCriteria({ ...criteria, outcomeTypes: ['dropped_off'] })
      ]);

      if (successfulJourneys.length < this.config.minSampleSize || 
          failedJourneys.length < this.config.minSampleSize) {
        throw new Error(`Insufficient sample size: ${successfulJourneys.length} successful, ${failedJourneys.length} failed`);
      }

      // Generate all possible pairs and score them
      const candidatePairs: JourneyPair[] = [];
      
      for (const successfulJourney of successfulJourneys) {
        for (const failedJourney of failedJourneys) {
          const pair = await this.evaluateJourneyPair(successfulJourney, failedJourney);
          
          if (pair.comparisonViability >= this.config.confidenceThreshold) {
            candidatePairs.push(pair);
          }
        }
      }

      // Sort by comparison viability and return top pairs
      return candidatePairs
        .sort((a, b) => b.comparisonViability - a.comparisonViability)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding journey pairs:', error);
      throw new Error(`Journey pairing failed: ${error.message}`);
    }
  }

  /**
   * Perform comprehensive comparison analysis on a journey pair
   */
  async compareJourneys(
    successfulJourney: JourneySession,
    failedJourney: JourneySession,
    analysisType: ComparisonType = 'comprehensive'
  ): Promise<JourneyComparisonResult> {
    const startTime = Date.now();

    try {
      // Validate journey pair suitability
      const pairEvaluation = await this.evaluateJourneyPair(successfulJourney, failedJourney);
      if (pairEvaluation.comparisonViability < this.config.confidenceThreshold) {
        throw new Error(`Journey pair not suitable for comparison: viability ${pairEvaluation.comparisonViability}`);
      }

      // Initialize comparison object
      const comparison: JourneyComparison = {
        id: this.generateComparisonId(successfulJourney.id, failedJourney.id),
        successfulJourneyId: successfulJourney.id,
        failedJourneyId: failedJourney.id,
        comparisonType: analysisType,
        successfulJourney,
        failedJourney,
        contentDifferences: [],
        timingDifferences: [],
        engagementDifferences: [],
        hypothesisCorrelations: [],
        statisticalSignificance: {} as ComparisonStatistics,
        confidenceScore: 0,
        comparisonMetadata: {} as ComparisonMetadata,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      // Perform component analyses based on type
      const analysisPromises: Promise<any>[] = [];

      if (analysisType === 'comprehensive' || analysisType === 'content_focused') {
        if (this.config.enableContentAnalysis) {
          analysisPromises.push(
            this.contentDiffEngine.compareJourneyContent(successfulJourney, failedJourney)
              .then(diffs => { comparison.contentDifferences = diffs; })
          );
        }
      }

      if (analysisType === 'comprehensive' || analysisType === 'timing_focused') {
        if (this.config.enableTimingAnalysis) {
          analysisPromises.push(
            this.timingEngine.compareJourneyTiming(successfulJourney, failedJourney)
              .then(diffs => { comparison.timingDifferences = diffs; })
          );
        }
      }

      if (analysisType === 'comprehensive' || analysisType === 'engagement_focused') {
        if (this.config.enableEngagementAnalysis) {
          analysisPromises.push(
            this.analyzeEngagementDifferences(successfulJourney, failedJourney)
              .then(diffs => { comparison.engagementDifferences = diffs; })
          );
        }
      }

      if (analysisType === 'comprehensive' && this.config.enableHypothesisAnalysis) {
        analysisPromises.push(
          this.hypothesisEngine.analyzeHypothesisCorrelations(successfulJourney, failedJourney)
            .then(correlations => { comparison.hypothesisCorrelations = correlations; })
        );
      }

      // Execute all analyses in parallel
      await Promise.all(analysisPromises);

      // Calculate comprehensive statistical significance
      comparison.statisticalSignificance = await this.statisticsEngine.calculateComparisonSignificance(comparison);

      // Calculate overall confidence score
      comparison.confidenceScore = this.calculateOverallConfidence(comparison);

      // Generate metadata
      comparison.comparisonMetadata = this.generateComparisonMetadata(
        comparison,
        Date.now() - startTime,
        pairEvaluation
      );

      // Generate insights and recommendations
      const insights = await this.generateComparisonInsights(comparison);
      const recommendations = await this.generateComparisonRecommendations(comparison, insights);

      return {
        comparison,
        insights,
        recommendations,
        confidence: {
          overall: comparison.confidenceScore,
          components: {
            content: this.calculateComponentConfidence(comparison.contentDifferences),
            timing: this.calculateTimingConfidence(comparison.timingDifferences),
            engagement: this.calculateEngagementConfidence(comparison.engagementDifferences),
            hypothesis: this.calculateHypothesisConfidence(comparison.hypothesisCorrelations)
          },
          factors: this.identifyConfidenceFactors(comparison)
        },
        processingMetrics: {
          totalTime: Date.now() - startTime,
          analysisType,
          componentsAnalyzed: this.getAnalyzedComponents(comparison),
          statisticalTests: this.getStatisticalTestCount(comparison.statisticalSignificance)
        }
      };

    } catch (error) {
      console.error('Journey comparison failed:', error);
      throw new Error(`Comparison analysis failed: ${error.message}`);
    }
  }

  /**
   * Batch process multiple journey comparisons
   * Optimized for performance with background processing
   */
  async batchCompareJourneys(
    pairs: JourneyPair[],
    analysisType: ComparisonType = 'comprehensive'
  ): Promise<JourneyComparisonResult[]> {
    const results: JourneyComparisonResult[] = [];
    const batchSize = 5; // Process 5 comparisons concurrently

    for (let i = 0; i < pairs.length; i += batchSize) {
      const batch = pairs.slice(i, i + batchSize);
      const batchPromises = batch.map(pair =>
        this.compareJourneys(pair.successfulJourney, pair.failedJourney, analysisType)
          .catch(error => {
            console.warn(`Comparison failed for pair ${pair.successfulJourney.id} vs ${pair.failedJourney.id}:`, error);
            return null; // Continue with other comparisons
          })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));

      // Allow event loop breathing room between batches
      if (i + batchSize < pairs.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return results;
  }

  /**
   * Get comparison summary statistics
   */
  async getComparisonStatistics(comparisonIds: string[]): Promise<{
    totalComparisons: number;
    significantDifferences: number;
    averageConfidence: number;
    topDifferentiators: Differentiator[];
    commonPatterns: any[];
  }> {
    // This would typically query the database for stored comparisons
    // Implementation depends on data layer integration
    throw new Error('Comparison statistics retrieval not yet implemented');
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async evaluateJourneyPair(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<JourneyPair> {
    const matchingFactors: MatchingFactor[] = [];

    // Temporal proximity (journeys close in time are more comparable)
    const timeDiff = Math.abs(successfulJourney.createdAt.getTime() - failedJourney.createdAt.getTime());
    const maxTime = this.config.maxComparisonDistance * 24 * 60 * 60 * 1000; // Convert days to ms
    const temporalScore = Math.max(0, 1 - (timeDiff / maxTime));
    
    matchingFactors.push({
      factor: 'temporal_proximity',
      score: temporalScore,
      weight: 0.3,
      description: `Journeys ${Math.round(timeDiff / (24 * 60 * 60 * 1000))} days apart`
    });

    // Content similarity (if available)
    const contentScore = await this.calculateContentSimilarity(successfulJourney, failedJourney);
    matchingFactors.push({
      factor: 'content_similarity',
      score: contentScore,
      weight: 0.25,
      description: `Content similarity: ${Math.round(contentScore * 100)}%`
    });

    // Client similarity (industry, company size, etc.)
    const clientScore = await this.calculateClientSimilarity(successfulJourney.clientId, failedJourney.clientId);
    matchingFactors.push({
      factor: 'client_similarity',
      score: clientScore,
      weight: 0.2,
      description: `Client similarity: ${Math.round(clientScore * 100)}%`
    });

    // Engagement level similarity (similar base engagement makes comparison more valid)
    const engagementScore = this.calculateEngagementSimilarity(successfulJourney, failedJourney);
    matchingFactors.push({
      factor: 'engagement_level',
      score: engagementScore,
      weight: 0.15,
      description: `Engagement similarity: ${Math.round(engagementScore * 100)}%`
    });

    // Hypothesis alignment (if hypothesis analysis enabled)
    const hypothesisScore = this.config.enableHypothesisAnalysis ? 
      await this.calculateHypothesisAlignment(successfulJourney, failedJourney) : 0.5;
    matchingFactors.push({
      factor: 'hypothesis_alignment',
      score: hypothesisScore,
      weight: 0.1,
      description: `Hypothesis alignment: ${Math.round(hypothesisScore * 100)}%`
    });

    // Calculate weighted matching score
    const matchingScore = matchingFactors.reduce((sum, factor) => 
      sum + (factor.score * factor.weight), 0);

    // Determine comparison viability
    const comparisonViability = this.assessComparisonViability(matchingFactors, successfulJourney, failedJourney);

    // Recommend analysis type based on matching factors
    const recommendedAnalysisType = this.recommendAnalysisType(matchingFactors);

    return {
      successfulJourney,
      failedJourney,
      matchingScore,
      matchingFactors,
      comparisonViability,
      recommendedAnalysisType
    };
  }

  private async calculateContentSimilarity(journey1: JourneySession, journey2: JourneySession): Promise<number> {
    try {
      // Calculate content similarity across all page types
      let totalSimilarity = 0;
      let pageCount = 0;

      const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];
      
      for (const pageType of pageTypes) {
        const page1 = journey1.pageVisits.find(p => p.pageType === pageType);
        const page2 = journey2.pageVisits.find(p => p.pageType === pageType);
        
        if (page1?.contentVersionId && page2?.contentVersionId) {
          const similarity = await this.contentDiffEngine.calculateContentSimilarity(
            page1.contentVersionId,
            page2.contentVersionId
          );
          totalSimilarity += similarity;
          pageCount++;
        }
      }

      return pageCount > 0 ? totalSimilarity / pageCount : 0.5; // Default neutral similarity
    } catch (error) {
      console.warn('Content similarity calculation failed:', error);
      return 0.5; // Neutral similarity on error
    }
  }

  private async calculateClientSimilarity(clientId1: string, clientId2: string): Promise<number> {
    if (clientId1 === clientId2) return 1.0; // Same client

    // This would typically query client data to compare industry, size, etc.
    // For now, return neutral similarity
    return 0.5;
  }

  private calculateEngagementSimilarity(journey1: JourneySession, journey2: JourneySession): Promise<number> {
    const engagement1 = this.calculateAverageEngagement(journey1);
    const engagement2 = this.calculateAverageEngagement(journey2);
    
    // Similarity based on engagement score proximity
    const diff = Math.abs(engagement1 - engagement2);
    return Promise.resolve(Math.max(0, 1 - (diff / 0.5))); // Max diff of 0.5 for 0 similarity
  }

  private calculateAverageEngagement(journey: JourneySession): number {
    if (journey.pageVisits.length === 0) return 0;
    
    const totalEngagement = journey.pageVisits.reduce((sum, visit) => sum + visit.engagementScore, 0);
    return totalEngagement / journey.pageVisits.length;
  }

  private async calculateHypothesisAlignment(journey1: JourneySession, journey2: JourneySession): Promise<number> {
    // This would analyze hypothesis similarity if available
    // For now, return neutral alignment
    return 0.5;
  }

  private assessComparisonViability(
    factors: MatchingFactor[],
    journey1: JourneySession,
    journey2: JourneySession
  ): number {
    const baseViability = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);
    
    // Apply viability penalties for poor comparison conditions
    let viabilityModifier = 1.0;

    // Penalize if journeys are too different in duration
    const durationDiff = Math.abs(journey1.totalDuration - journey2.totalDuration);
    if (durationDiff > 3600) { // More than 1 hour difference
      viabilityModifier *= 0.8;
    }

    // Penalize if page visit counts are very different
    const visitCountDiff = Math.abs(journey1.pageVisits.length - journey2.pageVisits.length);
    if (visitCountDiff > 1) {
      viabilityModifier *= 0.9;
    }

    // Bonus for journeys with similar exit points (if both dropped off)
    if (journey1.exitPoint && journey2.exitPoint && journey1.exitPoint === journey2.exitPoint) {
      viabilityModifier *= 1.1;
    }

    return Math.min(1.0, baseViability * viabilityModifier);
  }

  private recommendAnalysisType(factors: MatchingFactor[]): ComparisonType {
    const contentFactor = factors.find(f => f.factor === 'content_similarity')?.score || 0;
    const temporalFactor = factors.find(f => f.factor === 'temporal_proximity')?.score || 0;
    const engagementFactor = factors.find(f => f.factor === 'engagement_level')?.score || 0;

    if (contentFactor > 0.8) return 'content_focused';
    if (temporalFactor > 0.8 && engagementFactor > 0.7) return 'timing_focused';
    if (engagementFactor > 0.8) return 'engagement_focused';
    
    return 'comprehensive'; // Default to comprehensive analysis
  }

  private async analyzeEngagementDifferences(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<EngagementDiff[]> {
    // Implementation would analyze engagement patterns
    // This is a placeholder for the actual engagement analysis
    return [];
  }

  private calculateOverallConfidence(comparison: JourneyComparison): number {
    const weights = {
      statistical: 0.4,
      content: 0.3,
      timing: 0.2,
      engagement: 0.1
    };

    let confidence = 0;
    
    // Statistical significance contribution
    confidence += (1 - comparison.statisticalSignificance.pValue) * weights.statistical;
    
    // Content analysis contribution
    if (comparison.contentDifferences.length > 0) {
      const avgContentConfidence = comparison.contentDifferences
        .reduce((sum, diff) => sum + diff.correlationStrength, 0) / comparison.contentDifferences.length;
      confidence += avgContentConfidence * weights.content;
    }
    
    // Timing analysis contribution  
    if (comparison.timingDifferences.length > 0) {
      const avgTimingConfidence = comparison.timingDifferences
        .reduce((sum, diff) => sum + (1 - diff.statisticalSignificance.pValue), 0) / comparison.timingDifferences.length;
      confidence += avgTimingConfidence * weights.timing;
    }
    
    // Engagement analysis contribution
    if (comparison.engagementDifferences.length > 0) {
      confidence += 0.7 * weights.engagement; // Placeholder
    }

    return Math.min(1.0, confidence);
  }

  private generateComparisonMetadata(
    comparison: JourneyComparison,
    processingTime: number,
    pairEvaluation: JourneyPair
  ): ComparisonMetadata {
    return {
      analysisVersion: '5.1.0',
      processingTime,
      dataQuality: {
        completeness: this.assessDataCompleteness(comparison),
        reliability: pairEvaluation.comparisonViability,
        consistency: this.assessDataConsistency(comparison)
      },
      algorithmConfig: this.config,
      validationResults: {
        passed: comparison.confidenceScore >= this.config.confidenceThreshold,
        score: comparison.confidenceScore,
        issues: this.identifyValidationIssues(comparison)
      },
      performanceMetrics: {
        contentAnalysisTime: 0, // Would be measured
        timingAnalysisTime: 0,
        engagementAnalysisTime: 0,
        statisticalAnalysisTime: 0,
        memoryUsage: 0,
        cacheHitRate: 0
      }
    };
  }

  private async generateComparisonInsights(comparison: JourneyComparison): Promise<ComparisonInsights> {
    // Generate insights based on comparison results
    return {
      primaryDifferentiators: await this.identifyPrimaryDifferentiators(comparison),
      keySuccessFactors: await this.identifyKeySuccessFactors(comparison),
      failureIndicators: await this.identifyFailureIndicators(comparison),
      patternMatches: await this.findPatternMatches(comparison),
      anomalies: await this.detectComparisonAnomalies(comparison)
    };
  }

  private async generateComparisonRecommendations(
    comparison: JourneyComparison,
    insights: ComparisonInsights
  ): Promise<ComparisonRecommendation[]> {
    // Generate actionable recommendations based on insights
    const recommendations: ComparisonRecommendation[] = [];
    
    // Content recommendations
    for (const differentiator of insights.primaryDifferentiators.filter(d => d.type === 'content')) {
      recommendations.push({
        id: `content-rec-${Date.now()}`,
        priority: differentiator.impactScore > 0.8 ? 'high' : 'medium',
        category: 'content_optimization',
        title: `Optimize ${differentiator.description}`,
        description: `Based on comparison analysis, ${differentiator.description.toLowerCase()} shows significant impact on conversion`,
        actionItems: [
          {
            description: `Review and optimize ${differentiator.description.toLowerCase()}`,
            priority: 8,
            estimatedEffort: 4,
            dependencies: [],
            acceptanceCriteria: [`${differentiator.description} updated based on successful journey pattern`]
          }
        ],
        expectedImpact: differentiator.impactScore,
        implementationEffort: 'medium',
        confidenceScore: differentiator.confidenceScore,
        basedOnEvidence: differentiator.supportingEvidence,
        validationSuggestions: [
          {
            method: 'ab_test',
            description: `A/B test the optimized ${differentiator.description.toLowerCase()}`,
            expectedDuration: 14,
            requiredSampleSize: 100,
            successMetrics: ['conversion_rate', 'engagement_score']
          }
        ],
        createdAt: new Date()
      });
    }
    
    return recommendations;
  }

  // Additional helper methods would be implemented here...
  private async fetchJourneysByCriteria(criteria: JourneyPairingCriteria): Promise<JourneySession[]> {
    // Database query implementation
    throw new Error('Journey fetching not yet implemented');
  }

  private generateComparisonId(journey1Id: string, journey2Id: string): string {
    return `comp-${journey1Id}-${journey2Id}-${Date.now()}`;
  }

  // Placeholder methods for helper functions
  private calculateComponentConfidence(diffs: any[]): number { return 0.8; }
  private calculateTimingConfidence(diffs: TimingDiff[]): number { return 0.8; }
  private calculateEngagementConfidence(diffs: EngagementDiff[]): number { return 0.8; }
  private calculateHypothesisConfidence(correlations: any[]): number { return 0.8; }
  private identifyConfidenceFactors(comparison: JourneyComparison): any[] { return []; }
  private getAnalyzedComponents(comparison: JourneyComparison): string[] { return []; }
  private getStatisticalTestCount(stats: ComparisonStatistics): number { return 0; }
  private assessDataCompleteness(comparison: JourneyComparison): number { return 0.9; }
  private assessDataConsistency(comparison: JourneyComparison): number { return 0.9; }
  private identifyValidationIssues(comparison: JourneyComparison): string[] { return []; }
  private async identifyPrimaryDifferentiators(comparison: JourneyComparison): Promise<Differentiator[]> { return []; }
  private async identifyKeySuccessFactors(comparison: JourneyComparison): Promise<any[]> { return []; }
  private async identifyFailureIndicators(comparison: JourneyComparison): Promise<any[]> { return []; }
  private async findPatternMatches(comparison: JourneyComparison): Promise<any[]> { return []; }
  private async detectComparisonAnomalies(comparison: JourneyComparison): Promise<any[]> { return []; }
}

// Export helper interfaces and types
export type {
  ComparisonEngineConfig,
  JourneyPairingCriteria,
  JourneyPair,
  MatchingFactor
};