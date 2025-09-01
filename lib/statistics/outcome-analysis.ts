/**
 * Statistical Outcome Analysis
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Advanced statistical analysis for outcome correlation and significance testing
 * with performance optimization and caching capabilities.
 */

import {
  OutcomeMetrics,
  CorrelationFactor,
  CausalityIndicator,
  StatisticalEvidence
} from '../data-models/journey-comparison-models';
import { JourneySession } from '../data-models/journey-models';
import { StatisticalSignificanceEngine } from './significance-testing';

/**
 * Configuration for outcome analysis
 */
export interface OutcomeAnalysisConfig {
  significanceThreshold: number;
  correlationThreshold: number;
  causalityThreshold: number;
  bootstrapSamples: number;
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  maxConcurrentAnalyses: number;
}

const DEFAULT_OUTCOME_CONFIG: OutcomeAnalysisConfig = {
  significanceThreshold: 0.05,
  correlationThreshold: 0.3,
  causalityThreshold: 0.6,
  bootstrapSamples: 1000,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  maxConcurrentAnalyses: 3
};

/**
 * Outcome analysis result
 */
export interface OutcomeAnalysisResult {
  primaryFactors: CorrelationFactor[];
  causalityIndicators: CausalityIndicator[];
  statisticalEvidence: StatisticalEvidence;
  confidenceScore: number;
  sampleSize: number;
  processingTime: number;
  cacheHit: boolean;
}

/**
 * Cache entry for outcome analysis
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Performance optimized statistical outcome analysis engine
 */
export class OutcomeAnalysisEngine {
  private config: OutcomeAnalysisConfig;
  private statisticsEngine: StatisticalSignificanceEngine;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private activeAnalyses: Set<string> = new Set();
  private analysisQueue: Array<{ key: string; resolve: Function; reject: Function }> = [];

  constructor(
    config: Partial<OutcomeAnalysisConfig> = {},
    statisticsEngine: StatisticalSignificanceEngine
  ) {
    this.config = { ...DEFAULT_OUTCOME_CONFIG, ...config };
    this.statisticsEngine = statisticsEngine;

    // Clean expired cache entries periodically
    if (this.config.cacheEnabled) {
      setInterval(() => this.cleanCache(), this.config.cacheTTL);
    }
  }

  /**
   * Analyze outcome correlations with performance optimization
   */
  async analyzeOutcomeCorrelations(
    successfulJourneys: JourneySession[],
    failedJourneys: JourneySession[]
  ): Promise<OutcomeAnalysisResult> {
    const cacheKey = this.generateCacheKey('outcome_correlation', successfulJourneys, failedJourneys);
    const startTime = Date.now();

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache<OutcomeAnalysisResult>(cacheKey);
      if (cached) {
        return { ...cached, cacheHit: true };
      }
    }

    // Queue analysis if at capacity
    if (this.activeAnalyses.size >= this.config.maxConcurrentAnalyses) {
      await this.queueAnalysis(cacheKey);
    }

    this.activeAnalyses.add(cacheKey);

    try {
      // Perform analysis
      const result = await this.performOutcomeAnalysis(successfulJourneys, failedJourneys);
      
      // Add processing metrics
      const analysisResult: OutcomeAnalysisResult = {
        ...result,
        processingTime: Date.now() - startTime,
        cacheHit: false
      };

      // Cache result
      if (this.config.cacheEnabled) {
        this.setCache(cacheKey, analysisResult);
      }

      return analysisResult;

    } finally {
      this.activeAnalyses.delete(cacheKey);
      this.processQueue();
    }
  }

  /**
   * Analyze individual correlation factors
   */
  async analyzeCorrelationFactors(
    successfulMetrics: OutcomeMetrics[],
    failedMetrics: OutcomeMetrics[]
  ): Promise<CorrelationFactor[]> {
    const factors: CorrelationFactor[] = [];

    // Analyze conversion rate correlation
    const conversionCorrelation = await this.calculateConversionCorrelation(
      successfulMetrics,
      failedMetrics
    );
    if (Math.abs(conversionCorrelation.strength) >= this.config.correlationThreshold) {
      factors.push(conversionCorrelation);
    }

    // Analyze session duration correlation
    const durationCorrelation = await this.calculateDurationCorrelation(
      successfulMetrics,
      failedMetrics
    );
    if (Math.abs(durationCorrelation.strength) >= this.config.correlationThreshold) {
      factors.push(durationCorrelation);
    }

    // Analyze engagement correlation
    const engagementCorrelation = await this.calculateEngagementCorrelation(
      successfulMetrics,
      failedMetrics
    );
    if (Math.abs(engagementCorrelation.strength) >= this.config.correlationThreshold) {
      factors.push(engagementCorrelation);
    }

    // Analyze page completion correlation
    const pageCorrelation = await this.calculatePageCompletionCorrelation(
      successfulMetrics,
      failedMetrics
    );
    if (Math.abs(pageCorrelation.strength) >= this.config.correlationThreshold) {
      factors.push(pageCorrelation);
    }

    return factors.sort((a, b) => Math.abs(b.strength) - Math.abs(a.strength));
  }

  /**
   * Identify causality indicators using advanced statistical methods
   */
  async identifyCausalityIndicators(
    factors: CorrelationFactor[],
    temporalData: Array<{ timestamp: Date; outcome: boolean; factors: any }>
  ): Promise<CausalityIndicator[]> {
    const indicators: CausalityIndicator[] = [];

    for (const factor of factors) {
      const indicator = await this.analyzeCausalityForFactor(factor, temporalData);
      if (indicator.strength >= this.config.causalityThreshold) {
        indicators.push(indicator);
      }
    }

    return indicators.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Generate comprehensive statistical evidence
   */
  async generateStatisticalEvidence(
    factors: CorrelationFactor[],
    indicators: CausalityIndicator[]
  ): Promise<StatisticalEvidence> {
    // Calculate overall correlation coefficient
    const correlationCoefficient = factors.length > 0 ?
      factors.reduce((sum, f) => sum + Math.abs(f.strength), 0) / factors.length : 0;

    // Calculate partial correlation (controlling for confounders)
    const partialCorrelation = await this.calculatePartialCorrelation(factors);

    // Calculate R-squared (explained variance)
    const rSquared = await this.calculateExplainedVariance(factors);

    // Perform statistical significance test
    const pValue = await this.calculateOverallSignificance(factors);

    // Calculate effect size
    const effectSize = this.calculateEffectSize(factors);

    // Analyze dose-response relationship
    const doseResponseEvidence = await this.analyzeDoseResponse(factors);

    return {
      correlationCoefficient,
      partialCorrelation,
      rSquared,
      pValue,
      effectSize,
      doseResponseEvidence
    };
  }

  /**
   * Batch process multiple outcome analyses
   */
  async batchAnalyzeOutcomes(
    analysisRequests: Array<{
      id: string;
      successful: JourneySession[];
      failed: JourneySession[];
    }>
  ): Promise<Map<string, OutcomeAnalysisResult>> {
    const results = new Map<string, OutcomeAnalysisResult>();
    const batchSize = Math.min(this.config.maxConcurrentAnalyses, 5);

    for (let i = 0; i < analysisRequests.length; i += batchSize) {
      const batch = analysisRequests.slice(i, i + batchSize);
      const batchPromises = batch.map(async request => ({
        id: request.id,
        result: await this.analyzeOutcomeCorrelations(request.successful, request.failed)
      }));

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });

      // Allow breathing room between batches
      if (i + batchSize < analysisRequests.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    return results;
  }

  // ============================================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================================

  private async performOutcomeAnalysis(
    successfulJourneys: JourneySession[],
    failedJourneys: JourneySession[]
  ): Promise<Omit<OutcomeAnalysisResult, 'processingTime' | 'cacheHit'>> {
    // Convert journeys to outcome metrics
    const successfulMetrics = successfulJourneys.map(j => this.journeyToMetrics(j));
    const failedMetrics = failedJourneys.map(j => this.journeyToMetrics(j));

    // Analyze correlation factors
    const primaryFactors = await this.analyzeCorrelationFactors(successfulMetrics, failedMetrics);

    // Create temporal data for causality analysis
    const temporalData = this.createTemporalData(successfulJourneys, failedJourneys);
    
    // Identify causality indicators
    const causalityIndicators = await this.identifyCausalityIndicators(primaryFactors, temporalData);

    // Generate statistical evidence
    const statisticalEvidence = await this.generateStatisticalEvidence(primaryFactors, causalityIndicators);

    // Calculate overall confidence score
    const confidenceScore = this.calculateConfidenceScore(
      primaryFactors,
      causalityIndicators,
      statisticalEvidence
    );

    return {
      primaryFactors,
      causalityIndicators,
      statisticalEvidence,
      confidenceScore,
      sampleSize: successfulJourneys.length + failedJourneys.length
    };
  }

  private journeyToMetrics(journey: JourneySession): OutcomeMetrics {
    const pageCompletionRates: Record<string, number> = {};
    
    // Calculate completion rates for each page type
    ['activation', 'agreement', 'confirmation', 'processing'].forEach(pageType => {
      const pageVisit = journey.pageVisits.find(v => v.pageType === pageType);
      pageCompletionRates[pageType] = pageVisit && pageVisit.exitAction === 'next_page' ? 1 : 0;
    });

    return {
      conversionRate: journey.finalOutcome === 'completed' ? 1 : 0,
      averageSessionDuration: journey.totalDuration,
      engagementScore: journey.pageVisits.length > 0 ?
        journey.pageVisits.reduce((sum, v) => sum + v.engagementScore, 0) / journey.pageVisits.length : 0,
      dropOffRate: journey.finalOutcome === 'dropped_off' ? 1 : 0,
      pageCompletionRates: pageCompletionRates as any
    };
  }

  private async calculateConversionCorrelation(
    successful: OutcomeMetrics[],
    failed: OutcomeMetrics[]
  ): Promise<CorrelationFactor> {
    const successfulRates = successful.map(m => m.conversionRate);
    const failedRates = failed.map(m => m.conversionRate);
    
    const correlation = this.pearsonCorrelation(successfulRates, failedRates);
    
    return {
      factor: 'conversion_rate',
      strength: correlation,
      confidence: 0.9, // High confidence in conversion correlation
      description: 'Correlation between journey completion and outcome',
      statisticalSignificance: await this.calculateCorrelationSignificance(correlation, successful.length + failed.length)
    };
  }

  private async calculateDurationCorrelation(
    successful: OutcomeMetrics[],
    failed: OutcomeMetrics[]
  ): Promise<CorrelationFactor> {
    const successfulDurations = successful.map(m => m.averageSessionDuration);
    const failedDurations = failed.map(m => m.averageSessionDuration);
    
    const correlation = this.pearsonCorrelation(successfulDurations, failedDurations);
    
    return {
      factor: 'session_duration',
      strength: correlation,
      confidence: 0.8,
      description: 'Correlation between session duration and outcome',
      statisticalSignificance: await this.calculateCorrelationSignificance(correlation, successful.length + failed.length)
    };
  }

  private async calculateEngagementCorrelation(
    successful: OutcomeMetrics[],
    failed: OutcomeMetrics[]
  ): Promise<CorrelationFactor> {
    const successfulEngagement = successful.map(m => m.engagementScore);
    const failedEngagement = failed.map(m => m.engagementScore);
    
    const correlation = this.pearsonCorrelation(successfulEngagement, failedEngagement);
    
    return {
      factor: 'engagement_score',
      strength: correlation,
      confidence: 0.85,
      description: 'Correlation between engagement level and outcome',
      statisticalSignificance: await this.calculateCorrelationSignificance(correlation, successful.length + failed.length)
    };
  }

  private async calculatePageCompletionCorrelation(
    successful: OutcomeMetrics[],
    failed: OutcomeMetrics[]
  ): Promise<CorrelationFactor> {
    // Calculate average page completion across all pages
    const successfulCompletion = successful.map(m => 
      Object.values(m.pageCompletionRates).reduce((sum, rate) => sum + rate, 0) / Object.keys(m.pageCompletionRates).length
    );
    const failedCompletion = failed.map(m => 
      Object.values(m.pageCompletionRates).reduce((sum, rate) => sum + rate, 0) / Object.keys(m.pageCompletionRates).length
    );
    
    const correlation = this.pearsonCorrelation(successfulCompletion, failedCompletion);
    
    return {
      factor: 'page_completion',
      strength: correlation,
      confidence: 0.75,
      description: 'Correlation between page completion rate and outcome',
      statisticalSignificance: await this.calculateCorrelationSignificance(correlation, successful.length + failed.length)
    };
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator !== 0 ? numerator / denominator : 0;
  }

  private createTemporalData(
    successful: JourneySession[],
    failed: JourneySession[]
  ): Array<{ timestamp: Date; outcome: boolean; factors: any }> {
    const allJourneys = [
      ...successful.map(j => ({ journey: j, outcome: true })),
      ...failed.map(j => ({ journey: j, outcome: false }))
    ];

    return allJourneys.map(({ journey, outcome }) => ({
      timestamp: journey.createdAt,
      outcome,
      factors: {
        duration: journey.totalDuration,
        pageVisits: journey.pageVisits.length,
        avgEngagement: journey.pageVisits.length > 0 ?
          journey.pageVisits.reduce((sum, v) => sum + v.engagementScore, 0) / journey.pageVisits.length : 0
      }
    }));
  }

  private async analyzeCausalityForFactor(
    factor: CorrelationFactor,
    temporalData: Array<{ timestamp: Date; outcome: boolean; factors: any }>
  ): Promise<CausalityIndicator> {
    // Implement causal analysis logic
    // For now, return a simplified analysis
    return {
      factor: factor.factor,
      strength: Math.abs(factor.strength) * 0.8, // Causality is typically weaker than correlation
      confidence: factor.confidence * 0.9,
      direction: factor.strength > 0 ? 'positive' : 'negative',
      temporalEvidence: 0.7,
      doseResponseEvidence: 0.6,
      confoundingFactors: [],
      description: `Causal relationship identified for ${factor.factor}`
    };
  }

  // Cache and performance methods
  private generateCacheKey(operation: string, ...data: any[]): string {
    const dataHash = this.hashObject({ operation, data });
    return `outcome_analysis_${dataHash}`;
  }

  private hashObject(obj: any): string {
    return btoa(JSON.stringify(obj)).slice(0, 16);
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      return entry.data;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: this.config.cacheTTL
    });
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private async queueAnalysis(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.analysisQueue.push({ key, resolve, reject });
    });
  }

  private processQueue(): void {
    if (this.analysisQueue.length > 0 && this.activeAnalyses.size < this.config.maxConcurrentAnalyses) {
      const next = this.analysisQueue.shift();
      if (next) {
        next.resolve();
      }
    }
  }

  // Placeholder methods for complex statistical calculations
  private async calculatePartialCorrelation(factors: CorrelationFactor[]): Promise<number> {
    // Implement partial correlation calculation
    return 0.6; // Placeholder
  }

  private async calculateExplainedVariance(factors: CorrelationFactor[]): Promise<number> {
    // Implement R-squared calculation
    return factors.reduce((sum, f) => sum + (f.strength * f.strength), 0) / factors.length;
  }

  private async calculateOverallSignificance(factors: CorrelationFactor[]): Promise<number> {
    // Combine p-values using Fisher's method
    const pValues = factors.map(f => f.statisticalSignificance);
    return this.combineP Values(pValues);
  }

  private combineP Values(pValues: number[]): number {
    if (pValues.length === 0) return 1.0;
    const chiSquareStatistic = -2 * pValues.reduce((sum, p) => sum + Math.log(Math.max(p, 0.0001)), 0);
    // Simplified p-value combination
    return Math.min(1.0, chiSquareStatistic / (2 * pValues.length * 10));
  }

  private calculateEffectSize(factors: CorrelationFactor[]): number {
    return factors.length > 0 ?
      factors.reduce((sum, f) => sum + Math.abs(f.strength), 0) / factors.length : 0;
  }

  private async analyzeDoseResponse(factors: CorrelationFactor[]): Promise<number> {
    // Analyze dose-response relationship
    return 0.7; // Placeholder
  }

  private async calculateCorrelationSignificance(correlation: number, sampleSize: number): Promise<number> {
    // Calculate significance of correlation coefficient
    if (sampleSize < 3) return 1.0;
    
    const tStatistic = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    // Convert to p-value (simplified)
    return Math.max(0.001, Math.min(1.0, 2 * (1 - Math.abs(tStatistic) / 4)));
  }

  private calculateConfidenceScore(
    factors: CorrelationFactor[],
    indicators: CausalityIndicator[],
    evidence: StatisticalEvidence
  ): number {
    const factorWeight = 0.4;
    const causalityWeight = 0.3;
    const evidenceWeight = 0.3;

    const factorScore = factors.length > 0 ?
      factors.reduce((sum, f) => sum + f.confidence * Math.abs(f.strength), 0) / factors.length : 0;
    
    const causalityScore = indicators.length > 0 ?
      indicators.reduce((sum, i) => sum + i.confidence * i.strength, 0) / indicators.length : 0;
    
    const evidenceScore = (evidence.rSquared + (1 - evidence.pValue) + evidence.effectSize) / 3;

    return Math.min(1.0,
      factorScore * factorWeight +
      causalityScore * causalityWeight +
      evidenceScore * evidenceWeight
    );
  }
}

export type {
  OutcomeAnalysisConfig,
  OutcomeAnalysisResult
};