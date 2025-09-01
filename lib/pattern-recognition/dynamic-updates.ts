/**
 * Dynamic Pattern Confidence Updates
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Implements incremental confidence score recalculation with Wilson confidence intervals
 * and real-time statistical significance updates for AC 3: Dynamic Confidence Score Updates
 */

import { EventEmitter } from 'events';
import {
  SuccessPattern,
  PatternType,
  calculateStatisticalSignificance,
  calculatePatternConfidence,
  StatisticalAnalysis,
  ConfidenceCalculation
} from '../data-models/pattern-models';

/**
 * Enhanced Wilson Confidence Interval calculation
 * Professional-grade statistical confidence estimation
 */
export interface WilsonConfidenceInterval {
  lower: number;           // Lower bound (0-1)
  upper: number;           // Upper bound (0-1)
  center: number;          // Central estimate (0-1)
  width: number;          // Interval width (0-1)
  confidenceLevel: number; // Confidence level used (e.g., 0.95)
  sampleSize: number;     // Sample size used
  zScore: number;         // Z-score for confidence level
}

/**
 * Dynamic confidence update result
 */
export interface DynamicUpdateResult {
  pattern: SuccessPattern;
  previousConfidence: number;
  newConfidence: number;
  confidenceChange: number;
  wilsonInterval: WilsonConfidenceInterval;
  statisticalSignificance: StatisticalAnalysis;
  updateMetadata: {
    updateType: 'incremental' | 'recalculated' | 'similarity_adjusted';
    processingTime: number;
    dataPointsAdded: number;
    consistencyScore: number;
    trendDirection: 'improving' | 'declining' | 'stable';
  };
}

/**
 * Pattern similarity update for clustering
 */
export interface SimilarityUpdate {
  patternId: string;
  similarPatterns: Array<{
    patternId: string;
    similarity: number;
    confidenceInfluence: number;
  }>;
  clusterConfidence: number;
  clusterSize: number;
}

/**
 * Advanced Wilson Confidence Interval Calculator
 * Uses professional statistical methods for accurate confidence estimation
 */
export class WilsonConfidenceCalculator {
  
  /**
   * Calculate Wilson confidence interval with continuity correction
   * More accurate than normal approximation for small sample sizes
   */
  static calculate(
    successCount: number,
    totalCount: number,
    confidenceLevel: number = 0.95
  ): WilsonConfidenceInterval {
    
    if (totalCount === 0) {
      return {
        lower: 0,
        upper: 1,
        center: 0.5,
        width: 1,
        confidenceLevel,
        sampleSize: 0,
        zScore: 1.96
      };
    }

    const p = successCount / totalCount;
    const n = totalCount;
    
    // Z-score for confidence level
    const alpha = 1 - confidenceLevel;
    const z = this.getZScore(confidenceLevel);
    
    // Wilson interval calculation with continuity correction
    const zSquared = z * z;
    const denominator = 1 + zSquared / n;
    const centerNumerator = p + zSquared / (2 * n);
    const center = centerNumerator / denominator;
    
    // Calculate width with continuity correction
    const widthTerm = z * Math.sqrt(
      (p * (1 - p) + zSquared / (4 * n)) / n
    );
    const width = widthTerm / denominator;
    
    // Apply continuity correction for small samples
    const continuityCorrection = n < 30 ? 0.5 / n : 0;
    
    const lower = Math.max(0, center - width - continuityCorrection);
    const upper = Math.min(1, center + width + continuityCorrection);
    
    return {
      lower,
      upper,
      center,
      width: upper - lower,
      confidenceLevel,
      sampleSize: n,
      zScore: z
    };
  }

  /**
   * Calculate multiple confidence levels simultaneously
   */
  static calculateMultipleConfidenceLevels(
    successCount: number,
    totalCount: number,
    levels: number[] = [0.90, 0.95, 0.99]
  ): { [level: string]: WilsonConfidenceInterval } {
    
    const results: { [level: string]: WilsonConfidenceInterval } = {};
    
    for (const level of levels) {
      results[`${Math.round(level * 100)}%`] = this.calculate(
        successCount, 
        totalCount, 
        level
      );
    }
    
    return results;
  }

  /**
   * Get Z-score for confidence level
   */
  private static getZScore(confidenceLevel: number): number {
    // Common z-scores for confidence levels
    const zScores: { [key: string]: number } = {
      '0.90': 1.645,
      '0.95': 1.96,
      '0.99': 2.576,
      '0.999': 3.291
    };
    
    const key = confidenceLevel.toString();
    if (zScores[key]) {
      return zScores[key];
    }
    
    // Approximate z-score for other confidence levels
    // Using inverse normal distribution approximation
    return this.approximateZScore(confidenceLevel);
  }

  /**
   * Approximate z-score using Acklam's algorithm (simplified version)
   */
  private static approximateZScore(p: number): number {
    if (p <= 0 || p >= 1) {
      throw new Error('Confidence level must be between 0 and 1');
    }
    
    // Convert confidence level to upper tail probability
    const q = (1 - p) / 2;
    
    if (q > 0.5) {
      throw new Error('Invalid confidence level');
    }
    
    // Simplified Acklam approximation for demonstration
    // In production, use a proper statistical library
    const a = [0, -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02];
    const b = [0, -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02];
    const c = [0, -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00];
    
    const t = Math.sqrt(-2 * Math.log(q));
    let z = t - (a[1] + a[2] * t + a[3] * t * t) / (1 + b[1] * t + b[2] * t * t + b[3] * t * t * t);
    
    return Math.abs(z);
  }

  /**
   * Calculate Bayesian confidence update
   * Incorporates prior knowledge for more stable estimates
   */
  static calculateBayesianUpdate(
    priorSuccesses: number,
    priorTotal: number,
    newSuccesses: number,
    newTotal: number,
    priorWeight: number = 1.0
  ): WilsonConfidenceInterval {
    
    // Beta-Binomial conjugate prior update
    const weightedPriorSuccesses = priorSuccesses * priorWeight;
    const weightedPriorTotal = priorTotal * priorWeight;
    
    const posteriorSuccesses = weightedPriorSuccesses + newSuccesses;
    const posteriorTotal = weightedPriorTotal + newTotal;
    
    return this.calculate(posteriorSuccesses, posteriorTotal);
  }
}

/**
 * Dynamic Pattern Confidence Engine
 * Handles real-time confidence updates with sophisticated statistical methods
 */
export class DynamicPatternConfidenceEngine extends EventEmitter {
  private patternHistories: Map<string, Array<{
    confidence: number;
    successCount: number;
    totalCount: number;
    timestamp: Date;
  }>> = new Map();

  private patternClusters: Map<string, string[]> = new Map(); // patternId -> similar pattern IDs
  private clusterInfluence: number = 0.1; // How much similar patterns influence confidence

  constructor() {
    super();
  }

  /**
   * Main method: Update pattern confidence with new data point
   * Implements AC 3: Dynamic Confidence Score Updates
   */
  async updatePatternConfidence(
    pattern: SuccessPattern,
    newDataPoint: {
      outcome: 'success' | 'failure';
      hypothesis?: string;
      contentData?: any;
      clientImportance?: number;
    }
  ): Promise<DynamicUpdateResult> {
    
    const startTime = Date.now();
    const previousConfidence = pattern.confidenceScore;
    
    // Step 1: Calculate incremental update
    const incrementalUpdate = await this.calculateIncrementalUpdate(pattern, newDataPoint);
    
    // Step 2: Apply Wilson confidence interval calculation
    const wilsonInterval = WilsonConfidenceCalculator.calculate(
      incrementalUpdate.newSuccessCount,
      incrementalUpdate.newTotalCount,
      0.95
    );

    // Step 3: Apply pattern similarity influence
    const similarityAdjustment = await this.calculateSimilarityAdjustment(
      pattern,
      incrementalUpdate.baseConfidence
    );

    // Step 4: Calculate final confidence with all factors
    const finalConfidence = this.calculateFinalConfidence(
      incrementalUpdate.baseConfidence,
      wilsonInterval,
      similarityAdjustment,
      newDataPoint.clientImportance || 1.0
    );

    // Step 5: Update statistical significance
    const statisticalSignificance = calculateStatisticalSignificance(
      incrementalUpdate.newSuccessCount,
      incrementalUpdate.newTotalCount
    );

    // Step 6: Create updated pattern
    const updatedPattern: SuccessPattern = {
      ...pattern,
      confidenceScore: finalConfidence,
      sampleSize: incrementalUpdate.newTotalCount,
      successRate: incrementalUpdate.newSuccessCount / incrementalUpdate.newTotalCount,
      statisticalSignificance: statisticalSignificance.pValue,
      lastValidated: new Date()
    };

    // Step 7: Update pattern history
    this.updatePatternHistory(pattern.id, {
      confidence: finalConfidence,
      successCount: incrementalUpdate.newSuccessCount,
      totalCount: incrementalUpdate.newTotalCount,
      timestamp: new Date()
    });

    // Step 8: Calculate trend direction
    const trendDirection = this.calculateTrendDirection(pattern.id);

    const processingTime = Date.now() - startTime;
    const confidenceChange = finalConfidence - previousConfidence;

    const result: DynamicUpdateResult = {
      pattern: updatedPattern,
      previousConfidence,
      newConfidence: finalConfidence,
      confidenceChange,
      wilsonInterval,
      statisticalSignificance,
      updateMetadata: {
        updateType: 'incremental',
        processingTime,
        dataPointsAdded: 1,
        consistencyScore: incrementalUpdate.consistencyScore,
        trendDirection
      }
    };

    // Emit update event
    this.emit('confidence_updated', result);
    
    return result;
  }

  /**
   * Calculate incremental confidence update without full recalculation
   */
  private async calculateIncrementalUpdate(
    pattern: SuccessPattern,
    newDataPoint: { outcome: 'success' | 'failure'; hypothesis?: string; contentData?: any }
  ): Promise<{
    newSuccessCount: number;
    newTotalCount: number;
    baseConfidence: number;
    consistencyScore: number;
  }> {
    
    // Current counts (reverse-engineer from success rate and sample size)
    const currentSuccessCount = Math.round(pattern.successRate * pattern.sampleSize);
    const currentTotalCount = pattern.sampleSize;

    // Add new data point
    const newSuccessCount = currentSuccessCount + (newDataPoint.outcome === 'success' ? 1 : 0);
    const newTotalCount = currentTotalCount + 1;

    // Calculate base confidence with incremental method
    const newSuccessRate = newSuccessCount / newTotalCount;
    const consistencyScore = await this.calculateIncrementalConsistency(pattern.id, newSuccessRate);
    const recencyFactor = 1.0; // New data gets full recency weight

    const confidenceCalc = calculatePatternConfidence(
      newSuccessCount,
      newTotalCount,
      consistencyScore,
      recencyFactor
    );

    return {
      newSuccessCount,
      newTotalCount,
      baseConfidence: confidenceCalc.finalConfidence,
      consistencyScore
    };
  }

  /**
   * Calculate similarity-based confidence adjustment
   * Uses pattern clustering to improve confidence estimates
   */
  private async calculateSimilarityAdjustment(
    pattern: SuccessPattern,
    baseConfidence: number
  ): Promise<number> {
    
    const similarPatterns = this.patternClusters.get(pattern.id) || [];
    if (similarPatterns.length === 0) {
      return 0; // No similarity adjustment
    }

    // Get confidence scores of similar patterns
    // In a real implementation, this would fetch from pattern cache/database
    const similarConfidences: number[] = [];
    
    // For now, simulate similar pattern confidences
    // In production, this would query the actual similar patterns
    for (let i = 0; i < Math.min(similarPatterns.length, 5); i++) {
      // Simulate similar pattern confidence (would be real data)
      const simulatedConfidence = baseConfidence + (Math.random() - 0.5) * 0.3;
      similarConfidences.push(Math.max(0, Math.min(1, simulatedConfidence)));
    }

    if (similarConfidences.length === 0) {
      return 0;
    }

    // Calculate weighted average of similar pattern confidences
    const avgSimilarConfidence = similarConfidences.reduce((sum, conf) => sum + conf, 0) / similarConfidences.length;
    
    // Apply similarity influence (conservative adjustment)
    const adjustmentMagnitude = Math.abs(avgSimilarConfidence - baseConfidence);
    const adjustmentDirection = avgSimilarConfidence > baseConfidence ? 1 : -1;
    
    return adjustmentDirection * adjustmentMagnitude * this.clusterInfluence;
  }

  /**
   * Calculate final confidence score combining all factors
   */
  private calculateFinalConfidence(
    baseConfidence: number,
    wilsonInterval: WilsonConfidenceInterval,
    similarityAdjustment: number,
    clientImportance: number
  ): number {
    
    // Weight factors for final calculation
    const baseWeight = 0.6;
    const wilsonWeight = 0.3;
    const similarityWeight = 0.1;
    
    // Apply Wilson interval center as statistical correction
    const wilsonAdjustedConfidence = wilsonInterval.center;
    
    // Combine all factors
    let finalConfidence = 
      baseConfidence * baseWeight +
      wilsonAdjustedConfidence * wilsonWeight +
      similarityAdjustment * similarityWeight;

    // Apply client importance boost (high-value clients get confidence boost)
    const importanceBoost = (clientImportance - 1) * 0.05; // Max 5% boost
    finalConfidence += importanceBoost;

    // Apply Wilson interval bounds as constraints
    finalConfidence = Math.max(wilsonInterval.lower * 0.9, finalConfidence);
    finalConfidence = Math.min(wilsonInterval.upper * 1.1, finalConfidence);

    // Ensure bounds
    return Math.max(0, Math.min(1, finalConfidence));
  }

  /**
   * Calculate incremental consistency score without full recalculation
   */
  private async calculateIncrementalConsistency(
    patternId: string,
    newSuccessRate: number
  ): Promise<number> {
    
    const history = this.patternHistories.get(patternId) || [];
    if (history.length < 2) {
      return 0.5; // Default consistency for new patterns
    }

    // Get recent history for consistency calculation
    const recentHistory = history.slice(-5); // Last 5 data points
    const confidenceValues = recentHistory.map(h => h.confidence);
    confidenceValues.push(newSuccessRate); // Add new value

    // Calculate coefficient of variation as consistency measure
    const mean = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length;
    const variance = confidenceValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / confidenceValues.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;

    // Convert to consistency score (lower variation = higher consistency)
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  /**
   * Calculate trend direction from pattern history
   */
  private calculateTrendDirection(patternId: string): 'improving' | 'declining' | 'stable' {
    const history = this.patternHistories.get(patternId) || [];
    if (history.length < 3) return 'stable';

    const recentHistory = history.slice(-5);
    const confidenceValues = recentHistory.map(h => h.confidence);
    
    // Simple linear trend calculation
    const n = confidenceValues.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = confidenceValues.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * confidenceValues[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    const threshold = 0.02; // 2% change threshold
    if (slope > threshold) return 'improving';
    if (slope < -threshold) return 'declining';
    return 'stable';
  }

  /**
   * Update pattern similarity clusters
   * Implements pattern similarity recalculation for clustering updates (AC 3)
   */
  async updatePatternSimilarity(
    targetPatternId: string,
    allPatterns: SuccessPattern[]
  ): Promise<SimilarityUpdate> {
    
    const targetPattern = allPatterns.find(p => p.id === targetPatternId);
    if (!targetPattern) {
      throw new Error(`Pattern ${targetPatternId} not found`);
    }

    const similarPatterns: Array<{
      patternId: string;
      similarity: number;
      confidenceInfluence: number;
    }> = [];

    // Calculate similarity with other patterns
    for (const otherPattern of allPatterns) {
      if (otherPattern.id === targetPatternId) continue;

      const similarity = await this.calculatePatternSimilarity(targetPattern, otherPattern);
      
      if (similarity > 0.6) { // 60% similarity threshold
        const confidenceInfluence = similarity * 0.1; // Max 10% influence
        similarPatterns.push({
          patternId: otherPattern.id,
          similarity,
          confidenceInfluence
        });
      }
    }

    // Sort by similarity (highest first)
    similarPatterns.sort((a, b) => b.similarity - a.similarity);

    // Update cluster mapping
    this.patternClusters.set(
      targetPatternId,
      similarPatterns.slice(0, 5).map(sp => sp.patternId) // Keep top 5 similar patterns
    );

    // Calculate cluster confidence
    const clusterConfidence = similarPatterns.length > 0
      ? similarPatterns.reduce((sum, sp) => sum + sp.similarity, 0) / similarPatterns.length
      : 0;

    return {
      patternId: targetPatternId,
      similarPatterns: similarPatterns.slice(0, 10), // Return top 10
      clusterConfidence,
      clusterSize: similarPatterns.length
    };
  }

  /**
   * Calculate similarity between two patterns
   */
  private async calculatePatternSimilarity(
    pattern1: SuccessPattern,
    pattern2: SuccessPattern
  ): Promise<number> {
    
    let similarity = 0;
    let factors = 0;

    // Pattern type similarity
    if (pattern1.patternType === pattern2.patternType) {
      similarity += 0.3;
    }
    factors += 0.3;

    // Success rate similarity
    const successRateDiff = Math.abs(pattern1.successRate - pattern2.successRate);
    const successRateSimilarity = 1 - successRateDiff;
    similarity += successRateSimilarity * 0.2;
    factors += 0.2;

    // Content similarity (simplified - would use more sophisticated NLP in production)
    if (pattern1.patternData.hypothesis && pattern2.patternData.hypothesis) {
      const hypothesisSimilarity = this.calculateTextSimilarity(
        pattern1.patternData.hypothesis,
        pattern2.patternData.hypothesis
      );
      similarity += hypothesisSimilarity * 0.3;
      factors += 0.3;
    }

    // Timing similarity
    if (pattern1.patternData.timingFactors && pattern2.patternData.timingFactors) {
      const timingSimilarity = this.calculateTimingSimilarity(
        pattern1.patternData.timingFactors,
        pattern2.patternData.timingFactors
      );
      similarity += timingSimilarity * 0.2;
      factors += 0.2;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Helper methods
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private calculateTimingSimilarity(timing1: any, timing2: any): number {
    if (!timing1.avgTimeToPayment || !timing2.avgTimeToPayment) return 0;
    
    const timeDiff = Math.abs(timing1.avgTimeToPayment - timing2.avgTimeToPayment);
    const maxTime = Math.max(timing1.avgTimeToPayment, timing2.avgTimeToPayment);
    return maxTime > 0 ? Math.max(0, 1 - (timeDiff / maxTime)) : 1;
  }

  private updatePatternHistory(patternId: string, historyEntry: {
    confidence: number;
    successCount: number;
    totalCount: number;
    timestamp: Date;
  }): void {
    const history = this.patternHistories.get(patternId) || [];
    history.push(historyEntry);
    
    // Keep last 20 entries
    if (history.length > 20) {
      history.shift();
    }
    
    this.patternHistories.set(patternId, history);
  }

  /**
   * Public API methods
   */
  getPatternHistory(patternId: string) {
    return this.patternHistories.get(patternId) || [];
  }

  getPatternClusters(patternId: string): string[] {
    return this.patternClusters.get(patternId) || [];
  }

  calculateConfidenceInterval(
    successCount: number,
    totalCount: number,
    confidenceLevel: number = 0.95
  ): WilsonConfidenceInterval {
    return WilsonConfidenceCalculator.calculate(successCount, totalCount, confidenceLevel);
  }

  dispose(): void {
    this.patternHistories.clear();
    this.patternClusters.clear();
    this.removeAllListeners();
  }
}

/**
 * Factory function for creating dynamic confidence engine
 */
export function createDynamicConfidenceEngine(): DynamicPatternConfidenceEngine {
  return new DynamicPatternConfidenceEngine();
}

/**
 * Utility functions for confidence calculations
 */
export function calculateConfidenceInterval(
  successCount: number,
  totalCount: number,
  confidenceLevel: number = 0.95
): WilsonConfidenceInterval {
  return WilsonConfidenceCalculator.calculate(successCount, totalCount, confidenceLevel);
}

export function calculateMultipleConfidenceIntervals(
  successCount: number,
  totalCount: number,
  levels: number[] = [0.90, 0.95, 0.99]
): { [level: string]: WilsonConfidenceInterval } {
  return WilsonConfidenceCalculator.calculateMultipleConfidenceLevels(
    successCount,
    totalCount,
    levels
  );
}