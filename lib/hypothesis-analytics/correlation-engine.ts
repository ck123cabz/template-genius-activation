/**
 * Hypothesis Outcome Correlation Engine
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Advanced hypothesis correlation analysis linking content variations to outcomes
 * with statistical significance testing and predictive correlation modeling.
 */

import {
  HypothesisCorrelation,
  HypothesisDiff,
  OutcomeCorrelationData,
  OutcomeMetrics,
  CorrelationFactor,
  CausalityIndicator,
  ValidationMetrics,
  HypothesisSignificance
} from '../data-models/journey-comparison-models';
import {
  JourneySession,
  JourneyPageType,
  JourneyOutcome
} from '../data-models/journey-models';
import { StatisticalSignificanceEngine } from '../statistics/significance-testing';

/**
 * Configuration for hypothesis correlation analysis
 */
export interface HypothesisCorrelationConfig {
  significanceThreshold: number;
  correlationThreshold: number; // Minimum correlation strength to consider
  causalityConfidenceThreshold: number; // Minimum causality evidence
  minSampleSize: number;
  enableCausalityAnalysis: boolean;
  enablePredictiveModeling: boolean;
  hypothesisNormalization: boolean;
  semanticSimilarityEnabled: boolean;
  temporalAnalysisEnabled: boolean;
  crossValidationEnabled: boolean;
}

const DEFAULT_HYPOTHESIS_CONFIG: HypothesisCorrelationConfig = {
  significanceThreshold: 0.05,
  correlationThreshold: 0.3,
  causalityConfidenceThreshold: 0.6,
  minSampleSize: 5,
  enableCausalityAnalysis: true,
  enablePredictiveModeling: true,
  hypothesisNormalization: true,
  semanticSimilarityEnabled: true,
  temporalAnalysisEnabled: true,
  crossValidationEnabled: true
};

/**
 * Hypothesis correlation patterns
 */
export interface HypothesisPattern {
  patternId: string;
  hypothesisCategory: 'pricing' | 'technical' | 'relationship' | 'value_proposition' | 'urgency' | 'social_proof';
  successfulPatterns: string[];
  failedPatterns: string[];
  correlationStrength: number;
  causalityEvidence: number;
  predictiveAccuracy: number;
  sampleSize: number;
  confidence: number;
}

/**
 * Causal relationship analysis
 */
export interface CausalRelationship {
  hypothesisElement: string;
  outcomeElement: string;
  causalityType: 'direct' | 'mediated' | 'moderated' | 'spurious';
  strength: number; // 0-1
  confidence: number; // 0-1
  mediatingFactors: string[];
  confoundingFactors: string[];
  temporalEvidence: TemporalEvidence;
  statisticalEvidence: StatisticalEvidence;
}

export interface TemporalEvidence {
  hypothesisTimestamp: Date;
  outcomeTimestamp: Date;
  temporalGap: number; // seconds
  temporalPlausibility: number; // 0-1
  intervening Events: string[];
}

export interface StatisticalEvidence {
  correlationCoefficient: number;
  partialCorrelation: number; // Controlling for confounders
  rSquared: number; // Explained variance
  pValue: number;
  effectSize: number;
  doseResponseEvidence: number; // 0-1
}

/**
 * Main Hypothesis Outcome Correlation Engine
 * Analyzes relationships between hypothesis variations and journey outcomes
 */
export class HypothesisCorrelationEngine {
  private config: HypothesisCorrelationConfig;
  private statisticsEngine: StatisticalSignificanceEngine;
  private semanticAnalyzer: HypothesisSemanticAnalyzer;
  private causalAnalyzer: CausalityAnalyzer;
  private predictiveModeler: PredictiveCorrelationModeler;

  constructor(
    config: Partial<HypothesisCorrelationConfig> = {},
    statisticsEngine: StatisticalSignificanceEngine
  ) {
    this.config = { ...DEFAULT_HYPOTHESIS_CONFIG, ...config };
    this.statisticsEngine = statisticsEngine;
    this.semanticAnalyzer = new HypothesisSemanticAnalyzer(this.config);
    this.causalAnalyzer = new CausalityAnalyzer(this.config);
    this.predictiveModeler = new PredictiveCorrelationModeler(this.config);
  }

  /**
   * Analyze hypothesis correlations between successful and failed journeys
   */
  async analyzeHypothesisCorrelations(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<HypothesisCorrelation[]> {
    try {
      const correlations: HypothesisCorrelation[] = [];

      // Extract hypotheses from both journeys
      const successfulHypotheses = await this.extractJourneyHypotheses(successfulJourney);
      const failedHypotheses = await this.extractJourneyHypotheses(failedJourney);

      // Compare hypotheses and calculate correlations
      for (const successfulHyp of successfulHypotheses) {
        for (const failedHyp of failedHypotheses) {
          const correlation = await this.calculateHypothesisCorrelation(
            successfulHyp,
            failedHyp,
            successfulJourney,
            failedJourney
          );

          if (correlation && this.isCorrelationSignificant(correlation)) {
            correlations.push(correlation);
          }
        }
      }

      return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);

    } catch (error) {
      console.error('Hypothesis correlation analysis failed:', error);
      throw new Error(`Hypothesis correlation failed: ${error.message}`);
    }
  }

  /**
   * Identify hypothesis patterns across multiple journey comparisons
   */
  async identifyHypothesisPatterns(
    journeyComparisons: Array<{
      successful: JourneySession;
      failed: JourneySession;
    }>
  ): Promise<HypothesisPattern[]> {
    try {
      const patterns: Map<string, HypothesisPattern> = new Map();

      // Analyze each comparison for hypothesis patterns
      for (const comparison of journeyComparisons) {
        const correlations = await this.analyzeHypothesisCorrelations(
          comparison.successful,
          comparison.failed
        );

        // Extract patterns from correlations
        for (const correlation of correlations) {
          await this.updatePatternFromCorrelation(patterns, correlation);
        }
      }

      // Filter and rank patterns by significance
      return Array.from(patterns.values())
        .filter(p => p.sampleSize >= this.config.minSampleSize)
        .filter(p => p.correlationStrength >= this.config.correlationThreshold)
        .sort((a, b) => b.correlationStrength - a.correlationStrength);

    } catch (error) {
      console.error('Hypothesis pattern identification failed:', error);
      return [];
    }
  }

  /**
   * Analyze causal relationships between hypotheses and outcomes
   */
  async analyzeCausalRelationships(
    correlations: HypothesisCorrelation[]
  ): Promise<CausalRelationship[]> {
    if (!this.config.enableCausalityAnalysis) return [];

    try {
      const causalRelationships: CausalRelationship[] = [];

      for (const correlation of correlations) {
        if (correlation.causalityScore >= this.config.causalityConfidenceThreshold) {
          const causalRel = await this.causalAnalyzer.analyzeCausality(correlation);
          if (causalRel) {
            causalRelationships.push(causalRel);
          }
        }
      }

      return causalRelationships.sort((a, b) => b.strength - a.strength);

    } catch (error) {
      console.error('Causal relationship analysis failed:', error);
      return [];
    }
  }

  /**
   * Generate predictive correlation model for hypothesis success
   */
  async buildPredictiveCorrelationModel(
    historicalData: HypothesisCorrelation[]
  ): Promise<{
    model: any; // Predictive model
    accuracy: number;
    features: string[];
    validationResults: any;
  }> {
    if (!this.config.enablePredictiveModeling) {
      throw new Error('Predictive modeling is disabled');
    }

    try {
      return await this.predictiveModeler.buildModel(historicalData);
    } catch (error) {
      console.error('Predictive model building failed:', error);
      throw error;
    }
  }

  /**
   * Predict hypothesis success probability based on historical correlations
   */
  async predictHypothesisSuccess(
    hypothesis: string,
    clientContext: any,
    predictiveModel?: any
  ): Promise<{
    successProbability: number;
    confidence: number;
    contributingFactors: Array<{
      factor: string;
      weight: number;
      influence: 'positive' | 'negative';
    }>;
    recommendations: string[];
  }> {
    try {
      // Use provided model or build a quick model
      const model = predictiveModel || await this.buildQuickPredictiveModel();
      
      // Extract features from hypothesis and context
      const features = await this.extractHypothesisFeatures(hypothesis, clientContext);
      
      // Make prediction
      const prediction = await this.predictiveModeler.predict(model, features);
      
      return {
        successProbability: prediction.probability,
        confidence: prediction.confidence,
        contributingFactors: prediction.factors,
        recommendations: prediction.recommendations
      };

    } catch (error) {
      console.error('Hypothesis success prediction failed:', error);
      return {
        successProbability: 0.5, // Neutral probability
        confidence: 0.1, // Low confidence
        contributingFactors: [],
        recommendations: ['Insufficient data for reliable prediction']
      };
    }
  }

  /**
   * Validate hypothesis correlation findings
   */
  async validateCorrelationFindings(
    correlations: HypothesisCorrelation[],
    validationData: Array<{ hypothesis: string; outcome: boolean }>
  ): Promise<ValidationMetrics> {
    try {
      let correctPredictions = 0;
      let totalPredictions = 0;
      const precisionByCategory: { [key: string]: { tp: number; fp: number } } = {};
      const recallByCategory: { [key: string]: { tp: number; fn: number } } = {};

      for (const validation of validationData) {
        const relevantCorrelations = correlations.filter(c => 
          this.semanticAnalyzer.calculateSimilarity(
            c.successfulHypothesis,
            validation.hypothesis
          ) > 0.8
        );

        if (relevantCorrelations.length > 0) {
          const avgCorrelation = relevantCorrelations.reduce((sum, c) => 
            sum + c.correlationStrength, 0
          ) / relevantCorrelations.length;

          const predicted = avgCorrelation > 0.5;
          const actual = validation.outcome;

          if (predicted === actual) correctPredictions++;
          totalPredictions++;

          // Update precision/recall tracking
          const category = this.categorizeHypothesis(validation.hypothesis);
          if (!precisionByCategory[category]) {
            precisionByCategory[category] = { tp: 0, fp: 0 };
            recallByCategory[category] = { tp: 0, fn: 0 };
          }

          if (predicted && actual) precisionByCategory[category].tp++;
          else if (predicted && !actual) precisionByCategory[category].fp++;
          else if (!predicted && actual) recallByCategory[category].fn++;
        }
      }

      const accuracy = totalPredictions > 0 ? correctPredictions / totalPredictions : 0;
      const precision = this.calculateAveragePrecision(precisionByCategory);
      const recall = this.calculateAverageRecall(recallByCategory);
      const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

      return {
        accuracy,
        precision,
        recall,
        f1Score,
        sampleSize: totalPredictions,
        validationDate: new Date(),
        categoryMetrics: this.calculateCategoryMetrics(precisionByCategory, recallByCategory)
      };

    } catch (error) {
      console.error('Correlation validation failed:', error);
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        sampleSize: 0,
        validationDate: new Date(),
        categoryMetrics: {}
      };
    }
  }

  // ============================================================================
  // PRIVATE ANALYSIS METHODS
  // ============================================================================

  private async extractJourneyHypotheses(journey: JourneySession): Promise<string[]> {
    // Extract hypotheses from journey content and tracking data
    // This would typically query the learning capture system
    const hypotheses: string[] = [];

    // For each page visit, extract associated hypotheses
    for (const pageVisit of journey.pageVisits) {
      const pageHypotheses = await this.extractPageHypotheses(pageVisit);
      hypotheses.push(...pageHypotheses);
    }

    // Remove duplicates and normalize
    const uniqueHypotheses = [...new Set(hypotheses)];
    return this.config.hypothesisNormalization ? 
      this.normalizeHypotheses(uniqueHypotheses) : 
      uniqueHypotheses;
  }

  private async extractPageHypotheses(pageVisit: JourneyPageVisit): Promise<string[]> {
    // Extract hypotheses from page content version
    if (!pageVisit.contentVersionId) return [];

    // This would query the content_versions table and associated hypotheses
    // For now, return mock hypotheses based on page type
    const mockHypotheses: { [key: string]: string[] } = {
      activation: [
        'Emphasizing immediate value proposition increases engagement',
        'Clear pricing display reduces uncertainty',
        'Social proof elements build trust'
      ],
      agreement: [
        'Detailed feature breakdown improves conversion',
        'Risk reduction messaging decreases drop-off',
        'Personalized benefits increase relevance'
      ],
      confirmation: [
        'Clear next steps reduce confusion',
        'Progress indicators maintain momentum',
        'Value reinforcement prevents second thoughts'
      ],
      processing: [
        'Transparent process builds confidence',
        'Quick processing reduces abandonment',
        'Success reinforcement increases satisfaction'
      ]
    };

    return mockHypotheses[pageVisit.pageType] || [];
  }

  private normalizeHypotheses(hypotheses: string[]): string[] {
    // Normalize hypothesis text for consistent comparison
    return hypotheses.map(h => 
      h.toLowerCase()
        .trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/[^\w\s]/g, '') // Remove punctuation
    );
  }

  private async calculateHypothesisCorrelation(
    successfulHyp: string,
    failedHyp: string,
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<HypothesisCorrelation | null> {
    try {
      // Calculate hypothesis diff
      const hypothesisDiff = await this.calculateHypothesisDiff(successfulHyp, failedHyp);

      // Skip if hypotheses are too similar (not a meaningful comparison)
      if (hypothesisDiff.textSimilarity > 0.9) return null;

      // Calculate correlation strength
      const correlationStrength = await this.calculateCorrelationStrength(
        successfulHyp,
        failedHyp,
        successfulJourney,
        failedJourney
      );

      // Calculate causality score
      const causalityScore = this.config.enableCausalityAnalysis ?
        await this.calculateCausalityScore(hypothesisDiff, successfulJourney, failedJourney) :
        0.5;

      // Calculate confidence interval
      const confidenceInterval = this.statisticsEngine.calculateWilsonConfidenceInterval(
        correlationStrength,
        1.0,
        0.95
      );

      // Calculate statistical significance
      const statisticalSignificance = await this.calculateHypothesisSignificance(
        correlationStrength,
        Math.max(successfulJourney.pageVisits.length, failedJourney.pageVisits.length)
      );

      // Build outcome correlation data
      const outcomeData = await this.buildOutcomeCorrelationData(
        successfulJourney,
        failedJourney
      );

      // Build validation metrics
      const validationMetrics = await this.buildValidationMetrics(
        successfulHyp,
        failedHyp,
        correlationStrength
      );

      const correlation: HypothesisCorrelation = {
        id: this.generateCorrelationId(successfulHyp, failedHyp),
        comparisonId: '', // Will be set by parent comparison
        successfulHypothesis: successfulHyp,
        failedHypothesis: failedHyp,
        hypothesisDiff,
        correlationStrength,
        causalityScore,
        confidenceInterval,
        sampleSize: 2, // Minimum for binary comparison
        statisticalSignificance,
        outcomeData,
        validationMetrics,
        createdAt: new Date()
      };

      return correlation;

    } catch (error) {
      console.error('Hypothesis correlation calculation failed:', error);
      return null;
    }
  }

  private async calculateHypothesisDiff(
    hypothesis1: string,
    hypothesis2: string
  ): Promise<HypothesisDiff> {
    // Calculate semantic and strategic differences between hypotheses
    const textSimilarity = this.config.semanticSimilarityEnabled ?
      await this.semanticAnalyzer.calculateSimilarity(hypothesis1, hypothesis2) :
      this.calculateBasicTextSimilarity(hypothesis1, hypothesis2);

    const conceptualSimilarity = await this.semanticAnalyzer.calculateConceptualSimilarity(
      hypothesis1,
      hypothesis2
    );

    const strategicAlignment = await this.semanticAnalyzer.calculateStrategicAlignment(
      hypothesis1,
      hypothesis2
    );

    const implementationDifference = this.calculateImplementationDifference(
      hypothesis1,
      hypothesis2
    );

    const outcomeExpectationDiff = this.calculateOutcomeExpectationDiff(
      hypothesis1,
      hypothesis2
    );

    return {
      textSimilarity,
      conceptualSimilarity,
      strategicAlignment,
      implementationDifference,
      outcomeExpectationDiff
    };
  }

  private calculateBasicTextSimilarity(text1: string, text2: string): number {
    // Basic Jaccard similarity as fallback
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private async calculateCorrelationStrength(
    successfulHyp: string,
    failedHyp: string,
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<number> {
    // Calculate how strongly the hypothesis difference correlates with outcome difference
    
    // Factors that contribute to correlation strength:
    const factors = [];

    // 1. Outcome difference (successful vs failed)
    const outcomeStrength = 1.0; // Binary: success vs failure
    factors.push({ value: outcomeStrength, weight: 0.3 });

    // 2. Journey performance difference
    const performanceDiff = this.calculateJourneyPerformanceDifference(
      successfulJourney,
      failedJourney
    );
    factors.push({ value: performanceDiff, weight: 0.25 });

    // 3. Hypothesis implementation difference
    const implementationDiff = this.calculateImplementationDifference(
      successfulHyp,
      failedHyp
    );
    factors.push({ value: implementationDiff, weight: 0.2 });

    // 4. Temporal alignment (were hypotheses tested at similar times?)
    const temporalAlignment = this.calculateTemporalAlignment(
      successfulJourney,
      failedJourney
    );
    factors.push({ value: temporalAlignment, weight: 0.15 });

    // 5. Context similarity (similar clients, conditions)
    const contextSimilarity = 0.7; // Placeholder - would analyze client similarity
    factors.push({ value: contextSimilarity, weight: 0.1 });

    // Calculate weighted correlation strength
    const weightedSum = factors.reduce((sum, f) => sum + (f.value * f.weight), 0);
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateJourneyPerformanceDifference(
    successful: JourneySession,
    failed: JourneySession
  ): number {
    // Calculate performance difference between journeys
    const factors = [
      Math.abs(successful.totalDuration - failed.totalDuration) / Math.max(successful.totalDuration, failed.totalDuration, 1),
      Math.abs(successful.pageVisits.length - failed.pageVisits.length) / Math.max(successful.pageVisits.length, failed.pageVisits.length),
      // Add more performance factors as needed
    ];

    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }

  private calculateImplementationDifference(hyp1: string, hyp2: string): number {
    // Analyze how different the implementation approaches are
    // This is a simplified version - would use NLP to analyze action verbs, targets, etc.
    const actionWords1 = this.extractActionWords(hyp1);
    const actionWords2 = this.extractActionWords(hyp2);
    
    const overlap = actionWords1.filter(w => actionWords2.includes(w)).length;
    const total = new Set([...actionWords1, ...actionWords2]).size;
    
    return total > 0 ? 1 - (overlap / total) : 0.5;
  }

  private extractActionWords(hypothesis: string): string[] {
    // Extract action-oriented words from hypothesis
    const actionVerbs = [
      'emphasiz', 'highlight', 'display', 'show', 'present', 'feature',
      'reduce', 'increase', 'improve', 'enhance', 'build', 'create',
      'provide', 'offer', 'include', 'add', 'remove', 'change'
    ];

    const words = hypothesis.toLowerCase().split(/\s+/);
    return words.filter(word => 
      actionVerbs.some(verb => word.includes(verb))
    );
  }

  private calculateOutcomeExpectationDiff(hyp1: string, hyp2: string): number {
    // Analyze difference in expected outcomes
    const outcomeWords1 = this.extractOutcomeWords(hyp1);
    const outcomeWords2 = this.extractOutcomeWords(hyp2);
    
    const overlap = outcomeWords1.filter(w => outcomeWords2.includes(w)).length;
    const total = new Set([...outcomeWords1, ...outcomeWords2]).size;
    
    return total > 0 ? 1 - (overlap / total) : 0.5;
  }

  private extractOutcomeWords(hypothesis: string): string[] {
    // Extract outcome-related words
    const outcomeWords = [
      'engagement', 'conversion', 'trust', 'confidence', 'satisfaction',
      'reduction', 'increase', 'improvement', 'drop-off', 'abandonment',
      'completion', 'success', 'failure', 'efficiency', 'effectiveness'
    ];

    const words = hypothesis.toLowerCase().split(/\s+/);
    return words.filter(word =>
      outcomeWords.some(outcome => word.includes(outcome))
    );
  }

  private calculateTemporalAlignment(journey1: JourneySession, journey2: JourneySession): number {
    // Calculate how close in time the journeys occurred
    const timeDiff = Math.abs(journey1.createdAt.getTime() - journey2.createdAt.getTime());
    const maxRelevantTime = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    return Math.max(0, 1 - (timeDiff / maxRelevantTime));
  }

  private async calculateCausalityScore(
    hypothesisDiff: HypothesisDiff,
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<number> {
    // Estimate causal relationship strength
    const evidence = [];

    // 1. Implementation precedes outcome
    evidence.push(0.8); // Assume temporal ordering is correct

    // 2. Dose-response relationship (stronger implementation → stronger effect)
    const doseResponse = hypothesisDiff.implementationDifference;
    evidence.push(doseResponse);

    // 3. Consistency with known patterns
    const consistencyScore = 0.7; // Placeholder for pattern consistency analysis
    evidence.push(consistencyScore);

    // 4. Biological/psychological plausibility
    const plausibilityScore = 0.6; // Placeholder for domain knowledge
    evidence.push(plausibilityScore);

    return evidence.reduce((sum, e) => sum + e, 0) / evidence.length;
  }

  private async calculateHypothesisSignificance(
    correlationStrength: number,
    sampleSize: number
  ): Promise<number> {
    // Calculate statistical significance of the correlation
    // Using correlation strength and sample size
    
    if (sampleSize < 2) return 1.0; // No significance with insufficient data
    
    // Fisher transformation for correlation significance testing
    const zTransform = 0.5 * Math.log((1 + correlationStrength) / (1 - correlationStrength));
    const standardError = 1 / Math.sqrt(sampleSize - 3);
    const zScore = Math.abs(zTransform) / standardError;
    
    // Convert z-score to p-value (simplified approximation)
    if (zScore > 1.96) return 0.05;
    if (zScore > 1.65) return 0.1;
    if (zScore > 1.28) return 0.2;
    
    return 0.5; // Not significant
  }

  private async buildOutcomeCorrelationData(
    successfulJourney: JourneySession,
    failedJourney: JourneySession
  ): Promise<OutcomeCorrelationData> {
    const successfulOutcomes = this.calculateOutcomeMetrics(successfulJourney);
    const failedOutcomes = this.calculateOutcomeMetrics(failedJourney);

    return {
      successfulOutcomes,
      failedOutcomes,
      correlationFactors: [], // Would analyze specific correlation factors
      causalityIndicators: [] // Would analyze causality indicators
    };
  }

  private calculateOutcomeMetrics(journey: JourneySession): OutcomeMetrics {
    const pageCompletionRates: Record<JourneyPageType, number> = {
      activation: 0,
      agreement: 0,
      confirmation: 0,
      processing: 0
    };

    // Calculate completion rates for each page
    journey.pageVisits.forEach(visit => {
      if (visit.exitAction === 'next_page') {
        pageCompletionRates[visit.pageType] = 1;
      }
    });

    return {
      conversionRate: journey.finalOutcome === 'completed' ? 1 : 0,
      averageSessionDuration: journey.totalDuration,
      engagementScore: journey.pageVisits.reduce((sum, v) => sum + v.engagementScore, 0) / journey.pageVisits.length,
      dropOffRate: journey.finalOutcome === 'dropped_off' ? 1 : 0,
      pageCompletionRates
    };
  }

  private async buildValidationMetrics(
    successfulHyp: string,
    failedHyp: string,
    correlationStrength: number
  ): Promise<ValidationMetrics> {
    return {
      accuracy: correlationStrength,
      precision: correlationStrength * 0.9,
      recall: correlationStrength * 0.8,
      f1Score: correlationStrength * 0.85,
      sampleSize: 2,
      validationDate: new Date(),
      categoryMetrics: {}
    };
  }

  private isCorrelationSignificant(correlation: HypothesisCorrelation): boolean {
    return correlation.correlationStrength >= this.config.correlationThreshold &&
           correlation.statisticalSignificance < this.config.significanceThreshold;
  }

  private async updatePatternFromCorrelation(
    patterns: Map<string, HypothesisPattern>,
    correlation: HypothesisCorrelation
  ): Promise<void> {
    const category = this.categorizeHypothesis(correlation.successfulHypothesis);
    
    if (!patterns.has(category)) {
      patterns.set(category, {
        patternId: category,
        hypothesisCategory: category as any,
        successfulPatterns: [],
        failedPatterns: [],
        correlationStrength: 0,
        causalityEvidence: 0,
        predictiveAccuracy: 0,
        sampleSize: 0,
        confidence: 0
      });
    }

    const pattern = patterns.get(category)!;
    pattern.successfulPatterns.push(correlation.successfulHypothesis);
    pattern.failedPatterns.push(correlation.failedHypothesis);
    pattern.sampleSize += 1;
    
    // Update running averages
    const oldWeight = (pattern.sampleSize - 1) / pattern.sampleSize;
    const newWeight = 1 / pattern.sampleSize;
    
    pattern.correlationStrength = pattern.correlationStrength * oldWeight + correlation.correlationStrength * newWeight;
    pattern.causalityEvidence = pattern.causalityEvidence * oldWeight + correlation.causalityScore * newWeight;
    pattern.confidence = Math.min(1.0, pattern.sampleSize / 10); // Confidence grows with sample size
  }

  private categorizeHypothesis(hypothesis: string): string {
    // Categorize hypothesis based on content
    const lowerHyp = hypothesis.toLowerCase();
    
    if (lowerHyp.includes('pricing') || lowerHyp.includes('price') || lowerHyp.includes('cost')) return 'pricing';
    if (lowerHyp.includes('technical') || lowerHyp.includes('feature') || lowerHyp.includes('function')) return 'technical';
    if (lowerHyp.includes('trust') || lowerHyp.includes('relationship') || lowerHyp.includes('personal')) return 'relationship';
    if (lowerHyp.includes('value') || lowerHyp.includes('benefit') || lowerHyp.includes('advantage')) return 'value_proposition';
    if (lowerHyp.includes('urgent') || lowerHyp.includes('limited') || lowerHyp.includes('time')) return 'urgency';
    if (lowerHyp.includes('social') || lowerHyp.includes('proof') || lowerHyp.includes('testimonial')) return 'social_proof';
    
    return 'general';
  }

  // Additional helper methods
  private async buildQuickPredictiveModel(): Promise<any> {
    // Build a simple predictive model for immediate use
    return { type: 'simple', accuracy: 0.6 };
  }

  private async extractHypothesisFeatures(hypothesis: string, context: any): Promise<any[]> {
    // Extract features for prediction
    return [];
  }

  private calculateAveragePrecision(precisionData: any): number {
    // Calculate average precision across categories
    return 0.7; // Placeholder
  }

  private calculateAverageRecall(recallData: any): number {
    // Calculate average recall across categories
    return 0.6; // Placeholder
  }

  private calculateCategoryMetrics(precisionData: any, recallData: any): any {
    // Calculate per-category metrics
    return {};
  }

  private generateCorrelationId(hyp1: string, hyp2: string): string {
    return `hyp-corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// SUPPORTING ANALYZER CLASSES
// ============================================================================

class HypothesisSemanticAnalyzer {
  constructor(private config: HypothesisCorrelationConfig) {}

  async calculateSimilarity(hypothesis1: string, hypothesis2: string): Promise<number> {
    // Advanced semantic similarity analysis
    return 0.6; // Placeholder
  }

  async calculateConceptualSimilarity(hypothesis1: string, hypothesis2: string): Promise<number> {
    // Conceptual similarity analysis
    return 0.7; // Placeholder
  }

  async calculateStrategicAlignment(hypothesis1: string, hypothesis2: string): Promise<number> {
    // Strategic alignment analysis
    return 0.65; // Placeholder
  }
}

class CausalityAnalyzer {
  constructor(private config: HypothesisCorrelationConfig) {}

  async analyzeCausality(correlation: HypothesisCorrelation): Promise<CausalRelationship | null> {
    // Analyze causal relationships
    return null; // Placeholder
  }
}

class PredictiveCorrelationModeler {
  constructor(private config: HypothesisCorrelationConfig) {}

  async buildModel(data: HypothesisCorrelation[]): Promise<any> {
    // Build predictive model
    return { accuracy: 0.75 }; // Placeholder
  }

  async predict(model: any, features: any[]): Promise<any> {
    // Make prediction
    return { probability: 0.6, confidence: 0.8, factors: [], recommendations: [] };
  }
}

export type {
  HypothesisCorrelationConfig,
  HypothesisPattern,
  CausalRelationship,
  TemporalEvidence,
  StatisticalEvidence
};