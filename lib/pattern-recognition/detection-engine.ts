/**
 * Automated Pattern Detection Engine
 * Epic 4, Story 4.1: Success Pattern Identification
 * 
 * Core algorithms for identifying success patterns from content and outcome data.
 * This engine processes client learning data to discover patterns that lead to payment.
 */

import { createHash } from 'crypto';
import {
  SuccessPattern,
  PatternDetectionResult,
  ConfidenceCalculation,
  StatisticalAnalysis,
  ContentElements,
  TimingFactors,
  ContextFactors,
  PatternType,
  calculatePatternConfidence
} from '../data-models/pattern-models';

// Statistical analysis functions
export function calculateStatisticalSignificance(
  successCount: number,
  totalCount: number,
  baselineRate: number = 0.5
): StatisticalAnalysis {
  if (totalCount < 3) {
    return {
      pValue: 1.0, // Not significant with insufficient data
      confidenceInterval: { lower: 0, upper: 1 },
      effectSize: 0,
      sampleSize: totalCount,
      powerAnalysis: { power: 0, recommendedSampleSize: 10 }
    };
  }

  const observedRate = successCount / totalCount;
  const standardError = Math.sqrt(
    (baselineRate * (1 - baselineRate)) / totalCount
  );

  // Z-test for proportion
  const zScore = (observedRate - baselineRate) / standardError;
  const pValue = 2 * (1 - standardNormalCDF(Math.abs(zScore)));

  // Effect size (Cohen's h for proportions)
  const effectSize = 2 * (Math.asin(Math.sqrt(observedRate)) - Math.asin(Math.sqrt(baselineRate)));

  // Wilson confidence interval for proportion
  const z = 1.96; // 95% confidence
  const center = observedRate + (z * z) / (2 * totalCount);
  const halfWidth = z * Math.sqrt(
    (observedRate * (1 - observedRate) + (z * z) / (4 * totalCount)) / totalCount
  );
  const denominator = 1 + (z * z) / totalCount;

  const confidenceInterval = {
    lower: Math.max(0, (center - halfWidth) / denominator),
    upper: Math.min(1, (center + halfWidth) / denominator)
  };

  // Power analysis (simplified)
  const power = calculateStatisticalPower(effectSize, totalCount);
  const recommendedSampleSize = calculateRecommendedSampleSize(effectSize);

  return {
    pValue,
    confidenceInterval,
    effectSize,
    sampleSize: totalCount,
    powerAnalysis: { power, recommendedSampleSize }
  };
}

function standardNormalCDF(x: number): number {
  // Approximation of standard normal CDF
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

function calculateStatisticalPower(effectSize: number, sampleSize: number): number {
  // Simplified power calculation for demonstration
  // In production, use proper statistical libraries
  const ncp = effectSize * Math.sqrt(sampleSize / 2); // Non-centrality parameter
  return Math.min(0.99, Math.max(0.05, 1 - standardNormalCDF(1.96 - ncp)));
}

function calculateRecommendedSampleSize(effectSize: number): number {
  // Sample size for 80% power at α = 0.05
  const z_alpha = 1.96;
  const z_beta = 0.84; // 80% power
  return Math.ceil(2 * Math.pow(z_alpha + z_beta, 2) / Math.pow(effectSize, 2));
}

// Core pattern detection engine
export class PatternDetectionEngine {
  private minSampleSize: number = 3;
  private minConfidenceThreshold: number = 0.6;
  private maxProcessingTime: number = 30000; // 30 seconds

  constructor(options?: {
    minSampleSize?: number;
    minConfidenceThreshold?: number;
    maxProcessingTime?: number;
  }) {
    if (options?.minSampleSize) this.minSampleSize = options.minSampleSize;
    if (options?.minConfidenceThreshold) this.minConfidenceThreshold = options.minConfidenceThreshold;
    if (options?.maxProcessingTime) this.maxProcessingTime = options.maxProcessingTime;
  }

  /**
   * Main pattern detection method
   * Analyzes content outcomes to identify success patterns
   */
  async analyzeOutcomes(outcomeData: ContentOutcomeData[]): Promise<PatternDetectionResult> {
    const startTime = Date.now();
    
    try {
      // Group outcomes by similarity
      const groupedOutcomes = await this.groupSimilarOutcomes(outcomeData);
      
      // Identify patterns within each group
      const patterns: SuccessPattern[] = [];
      for (const group of groupedOutcomes) {
        const groupPatterns = await this.identifyPatternsInGroup(group);
        patterns.push(...groupPatterns);
      }

      // Calculate confidence metrics
      const confidenceMetrics = this.calculateConfidenceMetrics(patterns);

      // Generate recommendations
      const recommendations = await this.generatePatternRecommendations(patterns);

      const processingTime = Date.now() - startTime;

      return {
        patterns,
        confidenceMetrics,
        recommendations,
        processingTime,
        analysisMetadata: {
          samplesAnalyzed: outcomeData.length,
          clustersIdentified: groupedOutcomes.length,
          statisticalTests: patterns.length
        }
      };
    } catch (error) {
      console.error('Pattern detection failed:', error);
      return this.createEmptyResult(Date.now() - startTime);
    }
  }

  /**
   * Process new outcome and trigger pattern recalculation
   */
  async processNewOutcome(clientId: string, outcome: 'success' | 'failure'): Promise<void> {
    try {
      // Get recent content history for this client
      const contentHistory = await this.getClientContentHistory(clientId);
      
      if (contentHistory.length < this.minSampleSize) {
        console.log(`Insufficient data for pattern analysis: ${contentHistory.length} samples`);
        return;
      }

      // Find similar successful outcomes
      const similarSuccesses = await this.findSimilarSuccessfulOutcomes(contentHistory);

      if (similarSuccesses.length >= this.minSampleSize) {
        // Identify potential patterns
        const patterns = await this.identifyPatternsInGroup(similarSuccesses);
        
        for (const pattern of patterns) {
          if (pattern.confidenceScore >= this.minConfidenceThreshold) {
            await this.saveSuccessPattern(pattern);
            await this.generateRecommendationsForPattern(pattern);
          }
        }

        // Trigger cache invalidation
        await this.invalidatePatternCache();
      }
    } catch (error) {
      console.error('Error processing new outcome:', error);
      // Don't throw - this should be non-blocking
    }
  }

  /**
   * Group similar outcomes for pattern analysis
   */
  private async groupSimilarOutcomes(outcomes: ContentOutcomeData[]): Promise<ContentOutcomeData[][]> {
    const groups: ContentOutcomeData[][] = [];
    const processed = new Set<number>();

    for (let i = 0; i < outcomes.length; i++) {
      if (processed.has(i)) continue;

      const group = [outcomes[i]];
      processed.add(i);

      // Find similar outcomes
      for (let j = i + 1; j < outcomes.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.calculateOutcomeSimilarity(outcomes[i], outcomes[j]);
        if (similarity > 0.7) { // 70% similarity threshold
          group.push(outcomes[j]);
          processed.add(j);
        }
      }

      // Only consider groups with successful outcomes
      const successfulOutcomes = group.filter(o => o.outcome === 'success');
      if (successfulOutcomes.length >= this.minSampleSize) {
        groups.push(successfulOutcomes);
      }
    }

    return groups;
  }

  /**
   * Identify patterns within a group of similar outcomes
   */
  private async identifyPatternsInGroup(outcomes: ContentOutcomeData[]): Promise<SuccessPattern[]> {
    const patterns: SuccessPattern[] = [];

    if (outcomes.length < this.minSampleSize) return patterns;

    // Analyze hypothesis patterns
    const hypothesisPattern = await this.analyzeHypothesisPattern(outcomes);
    if (hypothesisPattern) patterns.push(hypothesisPattern);

    // Analyze content element patterns
    const elementPattern = await this.analyzeContentElementPattern(outcomes);
    if (elementPattern) patterns.push(elementPattern);

    // Analyze timing patterns
    const timingPattern = await this.analyzeTimingPattern(outcomes);
    if (timingPattern) patterns.push(timingPattern);

    // Analyze mixed patterns
    if (patterns.length > 1) {
      const mixedPattern = await this.analyzeMixedPattern(outcomes, patterns);
      if (mixedPattern) patterns.push(mixedPattern);
    }

    return patterns;
  }

  /**
   * Analyze hypothesis-based patterns
   */
  private async analyzeHypothesisPattern(outcomes: ContentOutcomeData[]): Promise<SuccessPattern | null> {
    const hypotheses = outcomes
      .map(o => o.hypothesis)
      .filter((h, i, arr) => h && arr.indexOf(h) === i); // Unique hypotheses

    if (hypotheses.length === 0) return null;

    // Find the most common hypothesis
    const hypothesisCounts = new Map<string, number>();
    outcomes.forEach(o => {
      if (o.hypothesis) {
        hypothesisCounts.set(o.hypothesis, (hypothesisCounts.get(o.hypothesis) || 0) + 1);
      }
    });

    const dominantHypothesis = Array.from(hypothesisCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];

    if (dominantHypothesis[1] < this.minSampleSize) return null;

    const successCount = outcomes.filter(o => o.hypothesis === dominantHypothesis[0] && o.outcome === 'success').length;
    const totalCount = outcomes.filter(o => o.hypothesis === dominantHypothesis[0]).length;
    const successRate = successCount / totalCount;

    // Calculate confidence
    const consistencyScore = this.calculateHypothesisConsistency(outcomes, dominantHypothesis[0]);
    const confidence = calculatePatternConfidence(
      successCount,
      totalCount,
      consistencyScore
    );

    // Statistical significance
    const stats = calculateStatisticalSignificance(successCount, totalCount);

    return {
      id: this.generatePatternId('hypothesis', dominantHypothesis[0]),
      patternType: 'hypothesis',
      patternData: {
        hypothesis: dominantHypothesis[0],
        metadata: {
          sourceClientIds: outcomes.map(o => o.clientId),
          originalHypotheses: [dominantHypothesis[0]]
        }
      },
      confidenceScore: confidence.finalConfidence,
      sampleSize: totalCount,
      successRate,
      statisticalSignificance: stats.pValue,
      identifiedAt: new Date(),
      lastValidated: new Date(),
      isActive: true
    };
  }

  /**
   * Analyze content element patterns
   */
  private async analyzeContentElementPattern(outcomes: ContentOutcomeData[]): Promise<SuccessPattern | null> {
    const contentElements = this.extractCommonElements(outcomes);
    if (!contentElements || Object.keys(contentElements).length === 0) return null;

    const successCount = outcomes.filter(o => o.outcome === 'success').length;
    const totalCount = outcomes.length;
    const successRate = successCount / totalCount;

    if (successCount < this.minSampleSize) return null;

    const consistencyScore = this.calculateContentConsistency(outcomes);
    const confidence = calculatePatternConfidence(
      successCount,
      totalCount,
      consistencyScore
    );

    const stats = calculateStatisticalSignificance(successCount, totalCount);

    return {
      id: this.generatePatternId('content-element', JSON.stringify(contentElements)),
      patternType: 'content-element',
      patternData: {
        contentElements,
        metadata: {
          sourceClientIds: outcomes.map(o => o.clientId),
          contentVersionIds: outcomes.map(o => o.contentVersionId).filter(Boolean) as string[]
        }
      },
      confidenceScore: confidence.finalConfidence,
      sampleSize: totalCount,
      successRate,
      statisticalSignificance: stats.pValue,
      identifiedAt: new Date(),
      lastValidated: new Date(),
      isActive: true
    };
  }

  /**
   * Analyze timing patterns
   */
  private async analyzeTimingPattern(outcomes: ContentOutcomeData[]): Promise<SuccessPattern | null> {
    const timingData = outcomes.filter(o => o.timingFactors).map(o => o.timingFactors!);
    if (timingData.length < this.minSampleSize) return null;

    const avgTimingFactors = this.calculateAverageTimingFactors(timingData);
    const successCount = outcomes.filter(o => o.outcome === 'success' && o.timingFactors).length;
    const totalCount = timingData.length;
    const successRate = successCount / totalCount;

    const consistencyScore = this.calculateTimingConsistency(timingData);
    const confidence = calculatePatternConfidence(
      successCount,
      totalCount,
      consistencyScore
    );

    const stats = calculateStatisticalSignificance(successCount, totalCount);

    return {
      id: this.generatePatternId('timing', JSON.stringify(avgTimingFactors)),
      patternType: 'timing',
      patternData: {
        timingFactors: avgTimingFactors,
        metadata: {
          sourceClientIds: outcomes.map(o => o.clientId),
          averageConversionTime: avgTimingFactors.avgTimeToPayment
        }
      },
      confidenceScore: confidence.finalConfidence,
      sampleSize: totalCount,
      successRate,
      statisticalSignificance: stats.pValue,
      identifiedAt: new Date(),
      lastValidated: new Date(),
      isActive: true
    };
  }

  /**
   * Analyze mixed patterns (combination of multiple factors)
   */
  private async analyzeMixedPattern(
    outcomes: ContentOutcomeData[],
    existingPatterns: SuccessPattern[]
  ): Promise<SuccessPattern | null> {
    // Create combined pattern from strongest individual patterns
    const strongPatterns = existingPatterns.filter(p => p.confidenceScore > 0.7);
    if (strongPatterns.length < 2) return null;

    const combinedData = {
      hypothesis: strongPatterns.find(p => p.patternType === 'hypothesis')?.patternData.hypothesis,
      contentElements: strongPatterns.find(p => p.patternType === 'content-element')?.patternData.contentElements,
      timingFactors: strongPatterns.find(p => p.patternType === 'timing')?.patternData.timingFactors
    };

    const successCount = outcomes.filter(o => o.outcome === 'success').length;
    const totalCount = outcomes.length;
    const successRate = successCount / totalCount;

    // Mixed patterns get bonus confidence for combining multiple factors
    const baseConfidence = strongPatterns.reduce((sum, p) => sum + p.confidenceScore, 0) / strongPatterns.length;
    const bonusConfidence = Math.min(0.1, strongPatterns.length * 0.02);
    const finalConfidence = Math.min(1.0, baseConfidence + bonusConfidence);

    const stats = calculateStatisticalSignificance(successCount, totalCount);

    return {
      id: this.generatePatternId('mixed', JSON.stringify(combinedData)),
      patternType: 'mixed',
      patternData: combinedData,
      confidenceScore: finalConfidence,
      sampleSize: totalCount,
      successRate,
      statisticalSignificance: stats.pValue,
      identifiedAt: new Date(),
      lastValidated: new Date(),
      isActive: true
    };
  }

  // Helper methods
  private calculateOutcomeSimilarity(outcome1: ContentOutcomeData, outcome2: ContentOutcomeData): number {
    let similarity = 0;
    let factors = 0;

    // Hypothesis similarity
    if (outcome1.hypothesis && outcome2.hypothesis) {
      similarity += this.calculateStringSimilarity(outcome1.hypothesis, outcome2.hypothesis);
      factors++;
    }

    // Content similarity
    if (outcome1.contentElements && outcome2.contentElements) {
      similarity += this.calculateContentElementSimilarity(outcome1.contentElements, outcome2.contentElements);
      factors++;
    }

    // Context similarity
    if (outcome1.contextFactors && outcome2.contextFactors) {
      similarity += this.calculateContextSimilarity(outcome1.contextFactors, outcome2.contextFactors);
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateContentElementSimilarity(content1: ContentElements, content2: ContentElements): number {
    let similarity = 0;
    let factors = 0;

    if (content1.headline && content2.headline) {
      similarity += this.calculateStringSimilarity(content1.headline, content2.headline);
      factors++;
    }

    if (content1.benefits && content2.benefits) {
      similarity += this.calculateArraySimilarity(content1.benefits, content2.benefits);
      factors++;
    }

    if (content1.features && content2.features) {
      similarity += this.calculateArraySimilarity(content1.features, content2.features);
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  private calculateArraySimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1.map(s => s.toLowerCase()));
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateContextSimilarity(context1: ContextFactors, context2: ContextFactors): number {
    let similarity = 0;
    let factors = 0;

    if (context1.clientIndustry && context2.clientIndustry) {
      similarity += context1.clientIndustry === context2.clientIndustry ? 1 : 0;
      factors++;
    }

    if (context1.clientSize && context2.clientSize) {
      similarity += context1.clientSize === context2.clientSize ? 1 : 0;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  private extractCommonElements(outcomes: ContentOutcomeData[]): ContentElements | null {
    const allElements = outcomes.map(o => o.contentElements).filter(Boolean) as ContentElements[];
    if (allElements.length === 0) return null;

    // Find most common elements
    const headlineCounts = new Map<string, number>();
    const benefitCounts = new Map<string, number>();
    const featureCounts = new Map<string, number>();

    allElements.forEach(elements => {
      if (elements.headline) {
        headlineCounts.set(elements.headline, (headlineCounts.get(elements.headline) || 0) + 1);
      }
      if (elements.benefits) {
        elements.benefits.forEach(benefit => {
          benefitCounts.set(benefit, (benefitCounts.get(benefit) || 0) + 1);
        });
      }
      if (elements.features) {
        elements.features.forEach(feature => {
          featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
        });
      }
    });

    const minOccurrences = Math.ceil(allElements.length * 0.6); // At least 60% of samples

    const commonElements: ContentElements = {};

    // Most common headline
    const commonHeadline = Array.from(headlineCounts.entries())
      .filter(([, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])[0];
    if (commonHeadline) commonElements.headline = commonHeadline[0];

    // Common benefits
    const commonBenefits = Array.from(benefitCounts.entries())
      .filter(([, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])
      .map(([benefit]) => benefit);
    if (commonBenefits.length > 0) commonElements.benefits = commonBenefits;

    // Common features
    const commonFeatures = Array.from(featureCounts.entries())
      .filter(([, count]) => count >= minOccurrences)
      .sort((a, b) => b[1] - a[1])
      .map(([feature]) => feature);
    if (commonFeatures.length > 0) commonElements.features = commonFeatures;

    return Object.keys(commonElements).length > 0 ? commonElements : null;
  }

  private calculateAverageTimingFactors(timingData: TimingFactors[]): TimingFactors {
    const avgTime = timingData.reduce((sum, t) => sum + t.avgTimeToPayment, 0) / timingData.length;
    const avgDuration = timingData.reduce((sum, t) => sum + t.engagementDuration, 0) / timingData.length;
    const avgViews = timingData.reduce((sum, t) => sum + t.pageViews, 0) / timingData.length;
    const avgEvents = timingData.reduce((sum, t) => sum + t.interactionEvents, 0) / timingData.length;

    return {
      avgTimeToPayment: avgTime,
      engagementDuration: avgDuration,
      pageViews: Math.round(avgViews),
      interactionEvents: Math.round(avgEvents)
    };
  }

  private calculateHypothesisConsistency(outcomes: ContentOutcomeData[], hypothesis: string): number {
    const relevantOutcomes = outcomes.filter(o => o.hypothesis === hypothesis);
    if (relevantOutcomes.length < 2) return 0.5;

    const successRate = relevantOutcomes.filter(o => o.outcome === 'success').length / relevantOutcomes.length;
    
    // Consistency based on how far from 0.5 (random) the success rate is
    return Math.abs(successRate - 0.5) * 2;
  }

  private calculateContentConsistency(outcomes: ContentOutcomeData[]): number {
    // Calculate variation in content elements across outcomes
    const contentOutcomes = outcomes.filter(o => o.contentElements);
    if (contentOutcomes.length < 2) return 0.5;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < contentOutcomes.length; i++) {
      for (let j = i + 1; j < contentOutcomes.length; j++) {
        totalSimilarity += this.calculateContentElementSimilarity(
          contentOutcomes[i].contentElements!,
          contentOutcomes[j].contentElements!
        );
        comparisons++;
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0.5;
  }

  private calculateTimingConsistency(timingData: TimingFactors[]): number {
    if (timingData.length < 2) return 0.5;

    const avgTime = timingData.reduce((sum, t) => sum + t.avgTimeToPayment, 0) / timingData.length;
    const variance = timingData.reduce((sum, t) => sum + Math.pow(t.avgTimeToPayment - avgTime, 2), 0) / timingData.length;
    const coefficientOfVariation = avgTime > 0 ? Math.sqrt(variance) / avgTime : 1;

    // Lower coefficient of variation = higher consistency
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private generatePatternId(type: string, data: string): string {
    const hash = createHash('sha256').update(`${type}-${data}-${Date.now()}`).digest('hex');
    return `pattern-${type}-${hash.substring(0, 12)}`;
  }

  private calculateConfidenceMetrics(patterns: SuccessPattern[]) {
    const totalPatterns = patterns.length;
    const highConfidencePatterns = patterns.filter(p => p.confidenceScore > 0.8).length;
    const averageConfidence = totalPatterns > 0 
      ? patterns.reduce((sum, p) => sum + p.confidenceScore, 0) / totalPatterns 
      : 0;

    return {
      averageConfidence,
      highConfidencePatterns,
      totalPatterns
    };
  }

  private createEmptyResult(processingTime: number): PatternDetectionResult {
    return {
      patterns: [],
      confidenceMetrics: { averageConfidence: 0, highConfidencePatterns: 0, totalPatterns: 0 },
      recommendations: [],
      processingTime,
      analysisMetadata: { samplesAnalyzed: 0, clustersIdentified: 0, statisticalTests: 0 }
    };
  }

  // These methods would interface with the database/storage layer
  private async getClientContentHistory(clientId: string): Promise<ContentOutcomeData[]> {
    // Implementation would query the database
    // For now, return empty array
    return [];
  }

  private async findSimilarSuccessfulOutcomes(contentHistory: ContentOutcomeData[]): Promise<ContentOutcomeData[]> {
    return contentHistory.filter(c => c.outcome === 'success');
  }

  private async saveSuccessPattern(pattern: SuccessPattern): Promise<void> {
    // Implementation would save to database
    console.log('Saving pattern:', pattern.id);
  }

  private async generateRecommendationsForPattern(pattern: SuccessPattern): Promise<void> {
    // Implementation would generate and save recommendations
    console.log('Generating recommendations for pattern:', pattern.id);
  }

  private async generatePatternRecommendations(patterns: SuccessPattern[]): Promise<any[]> {
    // Implementation would generate recommendations
    return [];
  }

  private async invalidatePatternCache(): Promise<void> {
    // Implementation would invalidate cache
    console.log('Pattern cache invalidated');
  }
}

// Supporting interfaces
export interface ContentOutcomeData {
  clientId: string;
  contentVersionId?: string;
  outcome: 'success' | 'failure';
  hypothesis?: string;
  contentElements?: ContentElements;
  timingFactors?: TimingFactors;
  contextFactors?: ContextFactors;
  createdAt: Date;
}

// Export the main engine class and helper functions
export { calculateStatisticalSignificance };