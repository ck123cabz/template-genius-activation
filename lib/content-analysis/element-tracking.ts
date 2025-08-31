/**
 * Story 4.1: Content Element Performance Tracking
 * 
 * Implements element-level performance tracking and comparison system
 * for identifying high-performing content components.
 */

import { 
  PatternElement, 
  ElementPerformanceAnalysis, 
  ElementType, 
  SuccessPattern,
  ContentElements,
  ContentOutcome,
  ContentVersion
} from '../data-models/pattern-models';

import { 
  ContentElementParser, 
  generateContentHash, 
  calculateContentSimilarity 
} from './element-parser';

import { 
  calculatePatternConfidence, 
  calculateConsistencyScore 
} from '../pattern-recognition/confidence-scoring';

/**
 * Element Performance Tracking System
 * 
 * Tracks and analyzes performance of individual content elements
 * across different client interactions and outcomes.
 */
export class ElementPerformanceTracker {
  private parser: ContentElementParser;

  constructor() {
    this.parser = new ContentElementParser();
  }

  /**
   * Track element performance from content versions and outcomes
   * 
   * @param contentVersions - Historical content versions
   * @param outcomes - Associated outcomes (success/failure)
   * @returns Array of tracked pattern elements with performance metrics
   */
  async trackElementPerformance(
    contentVersions: ContentVersion[],
    outcomes: ContentOutcome[]
  ): Promise<PatternElement[]> {
    const elementMap = new Map<string, PatternElement>();

    // Process each content version
    for (const version of contentVersions) {
      const elements = this.parser.parseContentElements(version.content);
      const versionOutcomes = outcomes.filter(o => o.contentVersionId === version.id);
      const successCount = versionOutcomes.filter(o => o.outcome === 'success').length;
      const totalCount = versionOutcomes.length;

      // Track each element type
      await this.trackElementsOfType(elements.headlines || [], 'headline', elementMap, successCount, totalCount);
      await this.trackElementsOfType(elements.benefits || [], 'benefit', elementMap, successCount, totalCount);
      await this.trackElementsOfType(elements.features || [], 'feature', elementMap, successCount, totalCount);
      await this.trackElementsOfType(elements.callToActions || [], 'cta', elementMap, successCount, totalCount);
      await this.trackElementsOfType(elements.testimonials || [], 'testimonial', elementMap, successCount, totalCount);
      await this.trackElementsOfType(elements.socialProof || [], 'social-proof', elementMap, successCount, totalCount);

      // Handle pricing as special case
      if (elements.pricing) {
        await this.trackPricingElement(elements.pricing, elementMap, successCount, totalCount);
      }
    }

    return Array.from(elementMap.values()).sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Analyze element performance across different contexts
   * 
   * @param patternElements - Elements to analyze
   * @param contextData - Additional context for analysis
   * @returns Comprehensive element performance analysis
   */
  async analyzeElementPerformance(
    patternElements: PatternElement[],
    contextData?: {
      timeRange?: { start: Date; end: Date };
      clientSegments?: string[];
      contentTypes?: string[];
    }
  ): Promise<ElementPerformanceAnalysis[]> {
    const analyses: ElementPerformanceAnalysis[] = [];

    // Group elements by type
    const elementsByType = this.groupElementsByType(patternElements);

    for (const [elementType, elements] of elementsByType) {
      // Find top performers
      const topPerformers = elements
        .filter(e => e.totalCount >= 3) // Minimum sample size
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 10)
        .map(element => ({
          element,
          pattern: this.createPatternFromElement(element),
          relativePerformance: this.calculateRelativePerformance(element, elements)
        }));

      // Calculate performance trends
      const trends = await this.calculatePerformanceTrends(elements, contextData?.timeRange);

      // Generate recommendations
      const recommendations = await this.generateElementRecommendations(elementType, topPerformers);

      if (this.isValidElementType(elementType)) {
        analyses.push({
          elementType,
          topPerformers,
          trends,
          recommendations
        });
      }
    }

    return analyses;
  }

  /**
   * Compare element performance between different variations
   * 
   * @param elementType - Type of elements to compare
   * @param elements - Elements to compare
   * @returns Comparison results with statistical significance
   */
  async compareElementVariations(
    elementType: ElementType,
    elements: PatternElement[]
  ): Promise<{
    baselineElement: PatternElement;
    variations: {
      element: PatternElement;
      performanceDelta: number;
      confidence: number;
      statisticalSignificance: number;
      recommendation: 'adopt' | 'test' | 'reject';
    }[];
  }> {
    if (elements.length < 2) {
      throw new Error('Need at least 2 elements for comparison');
    }

    // Find baseline (highest total count or best performer)
    const baseline = elements.reduce((best, current) => 
      current.totalCount > best.totalCount ? current : best
    );

    const variations = elements
      .filter(e => e.id !== baseline.id)
      .map(element => {
        const performanceDelta = element.successRate - baseline.successRate;
        const confidence = this.calculateComparisonConfidence(baseline, element);
        const statisticalSignificance = this.calculateStatisticalSignificance(baseline, element);
        const recommendation = this.getVariationRecommendation(performanceDelta, confidence, statisticalSignificance);

        return {
          element,
          performanceDelta,
          confidence,
          statisticalSignificance,
          recommendation
        };
      })
      .sort((a, b) => b.performanceDelta - a.performanceDelta);

    return {
      baselineElement: baseline,
      variations
    };
  }

  /**
   * Identify winning element combinations
   * 
   * @param patternElements - Elements to analyze for combinations
   * @returns Winning combinations with synergy scores
   */
  async identifyWinningCombinations(
    patternElements: PatternElement[]
  ): Promise<{
    combination: PatternElement[];
    synergyScore: number;
    expectedPerformance: number;
    confidence: number;
  }[]> {
    const combinations: any[] = [];

    // Generate element combinations (pairs and triplets)
    const elementsByType = this.groupElementsByType(patternElements);
    const types = Array.from(elementsByType.keys());

    // Two-element combinations
    for (let i = 0; i < types.length; i++) {
      for (let j = i + 1; j < types.length; j++) {
        const type1Elements = elementsByType.get(types[i]) || [];
        const type2Elements = elementsByType.get(types[j]) || [];

        for (const elem1 of type1Elements.slice(0, 5)) { // Top 5 from each type
          for (const elem2 of type2Elements.slice(0, 5)) {
            const combination = [elem1, elem2];
            const synergyScore = this.calculateSynergyScore(combination);
            
            if (synergyScore > 0.1) { // Minimum synergy threshold
              combinations.push({
                combination,
                synergyScore,
                expectedPerformance: this.calculateCombinationPerformance(combination),
                confidence: this.calculateCombinationConfidence(combination)
              });
            }
          }
        }
      }
    }

    // Three-element combinations (selective)
    const topPairs = combinations
      .sort((a, b) => b.synergyScore - a.synergyScore)
      .slice(0, 20); // Top 20 pairs

    for (const pair of topPairs) {
      const usedTypes = new Set(pair.combination.map((e: PatternElement) => e.elementType));
      const remainingTypes = types.filter(t => !usedTypes.has(t));

      for (const remainingType of remainingTypes) {
        const remainingElements = elementsByType.get(remainingType) || [];
        const topRemaining = remainingElements.slice(0, 3); // Top 3 from remaining type

        for (const elem3 of topRemaining) {
          const tripletCombination = [...pair.combination, elem3];
          const synergyScore = this.calculateSynergyScore(tripletCombination);
          
          if (synergyScore > pair.synergyScore * 1.1) { // 10% improvement over pair
            combinations.push({
              combination: tripletCombination,
              synergyScore,
              expectedPerformance: this.calculateCombinationPerformance(tripletCombination),
              confidence: this.calculateCombinationConfidence(tripletCombination)
            });
          }
        }
      }
    }

    return combinations
      .sort((a, b) => b.expectedPerformance - a.expectedPerformance)
      .slice(0, 15); // Top 15 combinations
  }

  // Private helper methods

  private async trackElementsOfType(
    elements: string[],
    elementType: ElementType,
    elementMap: Map<string, PatternElement>,
    successCount: number,
    totalCount: number
  ): Promise<void> {
    for (const elementContent of elements) {
      const hash = generateContentHash(elementContent);
      const key = `${elementType}_${hash}`;

      if (elementMap.has(key)) {
        const existing = elementMap.get(key)!;
        existing.successCount += successCount;
        existing.totalCount += totalCount;
        existing.updatedAt = new Date();
      } else {
        const patternElement: PatternElement = {
          id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          patternId: '', // Will be set when pattern is created
          elementType,
          elementContent,
          elementHash: hash,
          successCount,
          totalCount,
          successRate: totalCount > 0 ? successCount / totalCount : 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        elementMap.set(key, patternElement);
      }
    }
  }

  private async trackPricingElement(
    pricing: any,
    elementMap: Map<string, PatternElement>,
    successCount: number,
    totalCount: number
  ): Promise<void> {
    const pricingText = `${pricing.presentation || ''} ${pricing.frequency || ''}`.trim();
    if (!pricingText) return;

    const hash = generateContentHash(pricingText);
    const key = `pricing_${hash}`;

    if (elementMap.has(key)) {
      const existing = elementMap.get(key)!;
      existing.successCount += successCount;
      existing.totalCount += totalCount;
      existing.updatedAt = new Date();
    } else {
      const patternElement: PatternElement = {
        id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patternId: '',
        elementType: 'pricing',
        elementContent: pricingText,
        elementHash: hash,
        successCount,
        totalCount,
        successRate: totalCount > 0 ? successCount / totalCount : 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      elementMap.set(key, patternElement);
    }
  }

  private groupElementsByType(elements: PatternElement[]): Map<string, PatternElement[]> {
    const grouped = new Map<string, PatternElement[]>();

    for (const element of elements) {
      const type = element.elementType;
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(element);
    }

    return grouped;
  }

  private createPatternFromElement(element: PatternElement): SuccessPattern {
    return {
      id: `pattern_${element.id}`,
      patternType: 'content-element',
      patternData: {
        contentElements: {
          [element.elementType + 's']: [element.elementContent]
        }
      },
      confidenceScore: calculatePatternConfidence({
        successCount: element.successCount,
        totalAttempts: element.totalCount,
        consistencyScore: 0.8 // Simplified
      }),
      sampleSize: element.successCount,
      successRate: element.successRate,
      identifiedAt: element.createdAt,
      lastValidated: element.updatedAt,
      isActive: true
    };
  }

  private calculateRelativePerformance(element: PatternElement, allElements: PatternElement[]): number {
    const avgSuccessRate = allElements.reduce((sum, e) => sum + e.successRate, 0) / allElements.length;
    return element.successRate - avgSuccessRate;
  }

  private async calculatePerformanceTrends(
    elements: PatternElement[],
    timeRange?: { start: Date; end: Date }
  ): Promise<{ period: string; performanceChange: number; significanceLevel: number; }[]> {
    // Simplified trend calculation - in production, this would analyze time-series data
    const trends = [
      { period: 'last_30_days', performanceChange: 0.05, significanceLevel: 0.7 },
      { period: 'last_7_days', performanceChange: 0.02, significanceLevel: 0.4 }
    ];

    return trends;
  }

  private async generateElementRecommendations(
    elementType: ElementType,
    topPerformers: any[]
  ): Promise<any[]> {
    // Generate recommendations based on top performers
    return topPerformers.slice(0, 3).map(performer => ({
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patternId: performer.pattern.id,
      recommendationType: 'content',
      recommendationData: {
        title: `Use High-Performing ${elementType}`,
        description: `This ${elementType} has shown ${Math.round(performer.element.successRate * 100)}% success rate`,
        actionItems: [{
          type: 'content-change',
          description: `Replace current ${elementType} with: "${performer.element.elementContent}"`,
          suggestedValue: performer.element.elementContent,
          priority: 'high'
        }],
        expectedOutcome: `Expected ${Math.round(performer.relativePerformance * 100)}% improvement over baseline`,
        implementationComplexity: 'low',
        estimatedImpact: performer.relativePerformance > 0.2 ? 'high' : 'medium'
      },
      confidenceScore: performer.pattern.confidenceScore,
      expectedImprovement: performer.relativePerformance,
      createdAt: new Date(),
      isActive: true
    }));
  }

  private calculateComparisonConfidence(baseline: PatternElement, variation: PatternElement): number {
    // Wilson score interval for difference of proportions
    const n1 = baseline.totalCount;
    const n2 = variation.totalCount;
    const p1 = baseline.successRate;
    const p2 = variation.successRate;

    if (n1 < 5 || n2 < 5) return 0.3; // Low confidence for small samples

    const pooledP = (baseline.successCount + variation.successCount) / (n1 + n2);
    const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    if (pooledSE === 0) return 0.5;

    const zScore = Math.abs(p1 - p2) / pooledSE;
    
    // Convert z-score to confidence (simplified)
    return Math.min(zScore / 3, 1); // Max confidence of 1
  }

  private calculateStatisticalSignificance(baseline: PatternElement, variation: PatternElement): number {
    // Two-proportion z-test
    const n1 = baseline.totalCount;
    const n2 = variation.totalCount;
    const p1 = baseline.successRate;
    const p2 = variation.successRate;

    if (n1 < 5 || n2 < 5) return 1.0; // Not significant for small samples

    const pooledP = (baseline.successCount + variation.successCount) / (n1 + n2);
    const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
    
    if (pooledSE === 0) return 1.0;

    const zScore = Math.abs(p1 - p2) / pooledSE;
    
    // Convert to p-value (simplified normal approximation)
    return Math.max(0.01, 2 * (1 - this.normalCDF(Math.abs(zScore))));
  }

  private normalCDF(x: number): number {
    // Simplified normal CDF approximation
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Error function approximation
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  private getVariationRecommendation(
    performanceDelta: number,
    confidence: number,
    statisticalSignificance: number
  ): 'adopt' | 'test' | 'reject' {
    if (performanceDelta > 0.1 && confidence > 0.8 && statisticalSignificance < 0.05) {
      return 'adopt'; // Strong positive result
    } else if (performanceDelta > 0.05 && confidence > 0.6) {
      return 'test'; // Promising result worth testing
    } else {
      return 'reject'; // Not promising enough
    }
  }

  private calculateSynergyScore(combination: PatternElement[]): number {
    // Simplified synergy calculation
    // Real implementation would analyze how elements work together
    const avgSuccessRate = combination.reduce((sum, e) => sum + e.successRate, 0) / combination.length;
    const diversityBonus = new Set(combination.map(e => e.elementType)).size * 0.1;
    
    return Math.min(avgSuccessRate + diversityBonus, 1);
  }

  private calculateCombinationPerformance(combination: PatternElement[]): number {
    // Weighted average based on sample sizes
    const totalWeight = combination.reduce((sum, e) => sum + e.totalCount, 0);
    if (totalWeight === 0) return 0;

    return combination.reduce((sum, e) => 
      sum + (e.successRate * e.totalCount), 0
    ) / totalWeight;
  }

  private calculateCombinationConfidence(combination: PatternElement[]): number {
    // Combination confidence decreases with more elements (complexity penalty)
    const avgConfidence = combination.reduce((sum, e) => {
      const elementConfidence = calculatePatternConfidence({
        successCount: e.successCount,
        totalAttempts: e.totalCount,
        consistencyScore: 0.8
      });
      return sum + elementConfidence;
    }, 0) / combination.length;

    const complexityPenalty = Math.max(0, (combination.length - 2) * 0.1);
    return Math.max(0, avgConfidence - complexityPenalty);
  }

  private isValidElementType(elementType: string): elementType is ElementType {
    const validTypes: ElementType[] = ['headline', 'pricing', 'benefit', 'feature', 'cta', 'testimonial', 'social-proof'];
    return validTypes.includes(elementType as ElementType);
  }
}

/**
 * Calculate element-level success rate for specific element content
 * 
 * @param elementContent - Content text to analyze
 * @param elementType - Type of element
 * @param outcomes - Historical outcomes to analyze
 * @param contentVersions - Associated content versions
 * @returns Success rate for the specific element
 */
export async function calculateElementSuccessRate(
  elementContent: string,
  elementType: ElementType,
  outcomes: ContentOutcome[],
  contentVersions: ContentVersion[]
): Promise<number> {
  const parser = new ContentElementParser();
  let matchingVersions = 0;
  let successfulMatches = 0;

  for (const version of contentVersions) {
    const elements = parser.parseContentElements(version.content);
    let hasElement = false;

    // Check if this version contains the element
    switch (elementType) {
      case 'headline':
        hasElement = elements.headlines?.some(h => 
          calculateContentSimilarity(h, elementContent) > 0.8
        ) || false;
        break;
      case 'benefit':
        hasElement = elements.benefits?.some(b => 
          calculateContentSimilarity(b, elementContent) > 0.8
        ) || false;
        break;
      case 'feature':
        hasElement = elements.features?.some(f => 
          calculateContentSimilarity(f, elementContent) > 0.8
        ) || false;
        break;
      case 'cta':
        hasElement = elements.callToActions?.some(c => 
          calculateContentSimilarity(c, elementContent) > 0.8
        ) || false;
        break;
      default:
        hasElement = false;
    }

    if (hasElement) {
      matchingVersions++;
      const versionOutcomes = outcomes.filter(o => o.contentVersionId === version.id);
      const successCount = versionOutcomes.filter(o => o.outcome === 'success').length;
      if (successCount > 0) {
        successfulMatches++;
      }
    }
  }

  return matchingVersions > 0 ? successfulMatches / matchingVersions : 0;
}

/**
 * Group similar elements for pattern analysis
 * 
 * @param elements - Array of element content strings
 * @returns Grouped elements by similarity
 */
export function groupSimilarElements(elements: string[]): {
  representative: string;
  members: string[];
  successes: number;
  total: number;
  consistency: number;
}[] {
  const groups: any[] = [];
  const processed = new Set<string>();

  for (const element of elements) {
    if (processed.has(element)) continue;

    const similarElements = elements.filter(e => 
      !processed.has(e) && calculateContentSimilarity(element, e) > 0.7
    );

    if (similarElements.length > 0) {
      // Mark all similar elements as processed
      similarElements.forEach(e => processed.add(e));

      groups.push({
        representative: element,
        members: similarElements,
        successes: similarElements.length, // Simplified
        total: similarElements.length,
        consistency: 0.8 // Simplified consistency score
      });
    }
  }

  return groups;
}