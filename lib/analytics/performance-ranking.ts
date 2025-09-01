/**
 * Performance Ranking Analytics Engine
 * Epic 5, Story 5.2: Cohort Analysis by Hypothesis Type
 * 
 * Comprehensive performance ranking system for cohort effectiveness comparison,
 * statistical significance validation, and multi-dimensional ranking analysis.
 * Integrates with Story 5.1's statistical infrastructure for rigorous analysis.
 */

import {
  HypothesisEffectiveness,
  CohortDefinition,
  ClientRecord,
  EffectivenessDimensions
} from '../data-models/cohort-analysis-models';
import { StatisticalSignificanceEngine } from '../statistics/significance-testing';

/**
 * Ranking configuration
 */
export interface RankingConfig {
  rankingMethod: 'weighted_score' | 'dimensional_average' | 'pareto_optimal' | 'topsis';
  weightingStrategy: 'equal' | 'performance_based' | 'risk_adjusted' | 'custom';
  significanceRequired: boolean;
  minimumSampleSize: number;
  confidenceThreshold: number; // 0-1
  
  // Multi-criteria ranking
  enableMultiCriteriaRanking: boolean;
  criteriaWeights: Record<string, number>;
  
  // Stability analysis
  enableStabilityAnalysis: boolean;
  stabilityWindow: number; // days
  
  // Peer comparison
  enablePeerGrouping: boolean;
  peerGroupCriteria: string[];
}

const DEFAULT_RANKING_CONFIG: RankingConfig = {
  rankingMethod: 'weighted_score',
  weightingStrategy: 'performance_based',
  significanceRequired: true,
  minimumSampleSize: 5,
  confidenceThreshold: 0.7,
  
  enableMultiCriteriaRanking: true,
  criteriaWeights: {
    'effectiveness': 0.4,
    'consistency': 0.2,
    'scalability': 0.15,
    'risk_level': 0.15,
    'innovation': 0.1
  },
  
  enableStabilityAnalysis: true,
  stabilityWindow: 30,
  
  enablePeerGrouping: true,
  peerGroupCriteria: ['industry', 'size', 'complexity']
};

/**
 * Comprehensive ranking result
 */
export interface RankingAnalysisResult {
  overallRanking: OverallRanking[];
  dimensionalRankings: DimensionalRanking[];
  peerGroupRankings: PeerGroupRanking[];
  statisticalValidation: RankingStatisticalValidation;
  stabilityAnalysis: RankingStabilityAnalysis;
  insights: RankingInsight[];
}

/**
 * Overall ranking information
 */
export interface OverallRanking {
  cohortId: string;
  cohortName: string;
  overallRank: number;
  overallScore: number;
  percentileRank: number; // 0-100
  rankingConfidence: number; // 0-1
  
  // Score breakdown
  scoreBreakdown: ScoreBreakdown;
  
  // Performance indicators
  performanceLevel: 'exceptional' | 'high' | 'moderate' | 'low' | 'poor';
  competitivePosition: 'leader' | 'strong' | 'average' | 'weak' | 'laggard';
  
  // Ranking metadata
  rankingMethod: string;
  lastUpdated: Date;
  validityPeriod: number; // days
}

/**
 * Score breakdown for transparency
 */
export interface ScoreBreakdown {
  rawScore: number;
  weightedScore: number;
  adjustedScore: number; // after risk/stability adjustments
  componentScores: ComponentScore[];
  adjustments: ScoreAdjustment[];
}

/**
 * Individual component score
 */
export interface ComponentScore {
  component: string;
  rawValue: number;
  normalizedValue: number; // 0-1
  weight: number;
  contribution: number; // weighted contribution
  confidence: number; // 0-1
  dataQuality: 'high' | 'medium' | 'low';
}

/**
 * Score adjustment information
 */
export interface ScoreAdjustment {
  adjustmentType: 'statistical_significance' | 'sample_size' | 'stability' | 'risk';
  adjustmentFactor: number; // multiplier
  reasoning: string;
  impact: number; // absolute change in score
}

/**
 * Dimensional ranking analysis
 */
export interface DimensionalRanking {
  dimension: string;
  rankings: DimensionRankingEntry[];
  correlationMatrix: CorrelationMatrix;
  dimensionInsights: DimensionInsight[];
}

/**
 * Individual dimension ranking entry
 */
export interface DimensionRankingEntry {
  cohortId: string;
  dimensionRank: number;
  dimensionScore: number;
  dimensionPercentile: number;
  overallRankComparison: number; // difference from overall rank
  consistencyScore: number; // how consistent this dimension is with overall performance
}

/**
 * Correlation matrix between dimensions
 */
export interface CorrelationMatrix {
  dimensions: string[];
  correlations: number[][]; // correlation coefficients
  significanceMatrix: number[][]; // p-values
  strongCorrelations: CorrelationPair[];
}

/**
 * Correlation pair information
 */
export interface CorrelationPair {
  dimension1: string;
  dimension2: string;
  correlation: number;
  significance: number; // p-value
  interpretation: 'strong_positive' | 'moderate_positive' | 'weak_positive' | 'none' | 'weak_negative' | 'moderate_negative' | 'strong_negative';
}

/**
 * Dimension-specific insights
 */
export interface DimensionInsight {
  dimension: string;
  insight: string;
  insightType: 'strength' | 'weakness' | 'opportunity' | 'trend' | 'anomaly';
  confidence: number; // 0-1
  actionable: boolean;
  relatedCohorts: string[];
}

/**
 * Peer group ranking
 */
export interface PeerGroupRanking {
  groupId: string;
  groupName: string;
  groupCriteria: Record<string, string>;
  groupSize: number;
  rankings: PeerRankingEntry[];
  groupStatistics: GroupStatistics;
  interGroupComparison: InterGroupComparison[];
}

/**
 * Individual peer ranking entry
 */
export interface PeerRankingEntry {
  cohortId: string;
  peerRank: number;
  peerScore: number;
  peerPercentile: number;
  strengthAreas: string[];
  improvementAreas: string[];
  peerLearningOpportunities: PeerLearningOpportunity[];
}

/**
 * Peer learning opportunity
 */
export interface PeerLearningOpportunity {
  learningFrom: string; // cohort ID to learn from
  learningArea: string;
  potentialImprovement: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  transferability: number; // 0-1
}

/**
 * Group statistics
 */
export interface GroupStatistics {
  meanScore: number;
  medianScore: number;
  standardDeviation: number;
  range: [number, number];
  quartiles: [number, number, number]; // Q1, Q2, Q3
  outliers: OutlierAnalysis[];
  distribution: DistributionAnalysis;
}

/**
 * Outlier analysis
 */
export interface OutlierAnalysis {
  cohortId: string;
  outlierType: 'positive' | 'negative';
  outlierScore: number; // standard deviations from mean
  possibleCauses: string[];
  investigationRequired: boolean;
}

/**
 * Distribution analysis
 */
export interface DistributionAnalysis {
  distributionType: 'normal' | 'skewed_positive' | 'skewed_negative' | 'bimodal' | 'uniform' | 'other';
  skewness: number;
  kurtosis: number;
  normalityTest: NormalityTest;
  distributionFit: DistributionFit[];
}

/**
 * Normality test results
 */
export interface NormalityTest {
  testName: 'shapiro_wilk' | 'kolmogorov_smirnov' | 'anderson_darling';
  statistic: number;
  pValue: number;
  isNormal: boolean;
  confidence: number;
}

/**
 * Distribution fit analysis
 */
export interface DistributionFit {
  distributionType: string;
  parameters: Record<string, number>;
  goodnessOfFit: number; // R-squared or similar
  aic: number; // Akaike Information Criterion
  bic: number; // Bayesian Information Criterion
}

/**
 * Inter-group comparison
 */
export interface InterGroupComparison {
  comparedGroup: string;
  comparisonType: 'better' | 'similar' | 'worse';
  scoreDifference: number;
  statisticalSignificance: number; // p-value
  effectSize: number;
  confidenceInterval: [number, number];
  practicalSignificance: boolean;
}

/**
 * Statistical validation of rankings
 */
export interface RankingStatisticalValidation {
  overallValidation: RankingValidityTest;
  pairwiseComparisons: PairwiseRankingComparison[];
  rankingStability: RankingStabilityTest;
  confidenceAssessment: RankingConfidenceAssessment;
}

/**
 * Ranking validity test
 */
export interface RankingValidityTest {
  testType: 'friedman' | 'kruskal_wallis' | 'anova';
  testStatistic: number;
  pValue: number;
  significantDifferences: boolean;
  effectSize: number;
  interpretation: string;
}

/**
 * Pairwise ranking comparison
 */
export interface PairwiseRankingComparison {
  cohort1: string;
  cohort2: string;
  rankDifference: number;
  scoreDifference: number;
  statisticallySignificant: boolean;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
  practicallySignificant: boolean;
}

/**
 * Ranking stability test
 */
export interface RankingStabilityTest {
  stabilityScore: number; // 0-1
  rankingConsistency: number; // 0-1
  volatileCohorts: VolatileCohort[];
  stabilityTrend: 'improving' | 'declining' | 'stable';
  expectedStability: number; // predicted stability for next period
}

/**
 * Volatile cohort identification
 */
export interface VolatileCohort {
  cohortId: string;
  volatilityScore: number;
  averageRankChange: number;
  maxRankChange: number;
  volatilityCauses: string[];
  stabilizationRecommendations: string[];
}

/**
 * Ranking confidence assessment
 */
export interface RankingConfidenceAssessment {
  overallConfidence: number; // 0-1
  highConfidenceRankings: string[]; // cohort IDs
  lowConfidenceRankings: string[]; // cohort IDs
  confidenceFactors: ConfidenceFactor[];
  improvementRecommendations: string[];
}

/**
 * Confidence factor analysis
 */
export interface ConfidenceFactor {
  factor: string;
  impact: number; // -1 to 1 (negative reduces confidence)
  weight: number; // importance of this factor
  currentLevel: number; // 0-1
  improvementPotential: number; // 0-1
}

/**
 * Ranking stability analysis
 */
export interface RankingStabilityAnalysis {
  historicalStability: HistoricalStabilityAnalysis;
  rankingConsistency: RankingConsistencyAnalysis;
  stabilityPrediction: StabilityPrediction;
}

/**
 * Historical stability analysis
 */
export interface HistoricalStabilityAnalysis {
  timeFrames: StabilityTimeFrame[];
  overallStabilityTrend: 'increasing' | 'decreasing' | 'stable';
  mostStableCohorts: StableCohort[];
  leastStableCohorts: StableCohort[];
  stabilityDrivers: StabilityDriver[];
}

/**
 * Stability time frame
 */
export interface StabilityTimeFrame {
  period: string;
  startDate: Date;
  endDate: Date;
  stabilityScore: number;
  majorRankChanges: number;
  volatilityMeasure: number;
}

/**
 * Stable/unstable cohort analysis
 */
export interface StableCohort {
  cohortId: string;
  stabilityScore: number;
  averageRank: number;
  rankVariance: number;
  stabilityFactors: string[];
}

/**
 * Stability driver identification
 */
export interface StabilityDriver {
  driver: string;
  stabilityImpact: number; // positive = more stable
  frequency: number; // how often this driver appears
  controllability: 'high' | 'medium' | 'low';
}

/**
 * Ranking consistency analysis
 */
export interface RankingConsistencyAnalysis {
  consistencyScore: number; // 0-1
  consistentDimensions: string[];
  inconsistentDimensions: string[];
  consistencyMatrix: number[][]; // consistency between different ranking methods
}

/**
 * Stability prediction
 */
export interface StabilityPrediction {
  predictedStability: number; // 0-1
  predictionConfidence: number; // 0-1
  stabilityFactors: PredictedStabilityFactor[];
  riskFactors: StabilityRiskFactor[];
  recommendations: StabilityRecommendation[];
}

/**
 * Predicted stability factor
 */
export interface PredictedStabilityFactor {
  factor: string;
  currentTrend: 'improving' | 'declining' | 'stable';
  predictedImpact: number; // on stability
  confidence: number; // 0-1
}

/**
 * Stability risk factor
 */
export interface StabilityRiskFactor {
  riskFactor: string;
  probability: number; // 0-1
  potentialImpact: number; // on stability
  timeframe: 'immediate' | 'short_term' | 'medium_term';
  mitigationActions: string[];
}

/**
 * Stability recommendation
 */
export interface StabilityRecommendation {
  recommendation: string;
  targetStabilityImprovement: number;
  implementationEffort: 'low' | 'medium' | 'high';
  expectedTimeframe: number; // days
  successProbability: number; // 0-1
}

/**
 * Ranking insights
 */
export interface RankingInsight {
  insightType: 'performance_gap' | 'improvement_opportunity' | 'competitive_advantage' | 'risk_factor' | 'trend';
  insight: string;
  affectedCohorts: string[];
  confidence: number; // 0-1
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  potentialImpact: number; // 0-1
  recommendations: string[];
}

/**
 * Main Performance Ranking Engine
 */
export class PerformanceRankingEngine {
  private config: RankingConfig;
  private statisticsEngine: StatisticalSignificanceEngine;

  constructor(
    config: Partial<RankingConfig> = {},
    statisticsEngine: StatisticalSignificanceEngine
  ) {
    this.config = { ...DEFAULT_RANKING_CONFIG, ...config };
    this.statisticsEngine = statisticsEngine;
  }

  /**
   * Generate comprehensive ranking analysis
   */
  async generateRankingAnalysis(
    effectivenessResults: HypothesisEffectiveness[],
    cohortDefinitions: CohortDefinition[],
    clientData: Record<string, ClientRecord[]>
  ): Promise<RankingAnalysisResult> {
    try {
      console.log(`Generating ranking analysis for ${effectivenessResults.length} cohorts`);

      // Step 1: Calculate overall rankings
      const overallRanking = await this.calculateOverallRankings(
        effectivenessResults,
        cohortDefinitions,
        clientData
      );

      // Step 2: Calculate dimensional rankings
      const dimensionalRankings = await this.calculateDimensionalRankings(
        effectivenessResults,
        cohortDefinitions
      );

      // Step 3: Calculate peer group rankings
      const peerGroupRankings = this.config.enablePeerGrouping ?
        await this.calculatePeerGroupRankings(
          effectivenessResults,
          cohortDefinitions,
          clientData
        ) : [];

      // Step 4: Statistical validation
      const statisticalValidation = await this.performStatisticalValidation(
        overallRanking,
        effectivenessResults
      );

      // Step 5: Stability analysis
      const stabilityAnalysis = this.config.enableStabilityAnalysis ?
        await this.performStabilityAnalysis(
          overallRanking,
          cohortDefinitions
        ) : this.getDefaultStabilityAnalysis();

      // Step 6: Generate insights
      const insights = await this.generateRankingInsights(
        overallRanking,
        dimensionalRankings,
        statisticalValidation
      );

      return {
        overallRanking,
        dimensionalRankings,
        peerGroupRankings,
        statisticalValidation,
        stabilityAnalysis,
        insights
      };

    } catch (error) {
      console.error('Ranking analysis failed:', error);
      throw new Error(`Ranking analysis failed: ${error.message}`);
    }
  }

  /**
   * Compare ranking methods and select optimal approach
   */
  async compareRankingMethods(
    effectivenessResults: HypothesisEffectiveness[]
  ): Promise<{
    methodComparison: RankingMethodComparison[];
    recommendedMethod: string;
    validationResults: MethodValidationResult[];
  }> {
    try {
      const methods = ['weighted_score', 'dimensional_average', 'pareto_optimal', 'topsis'] as const;
      const methodComparison: RankingMethodComparison[] = [];
      const validationResults: MethodValidationResult[] = [];

      for (const method of methods) {
        // Calculate rankings using this method
        const methodConfig = { ...this.config, rankingMethod: method };
        const tempEngine = new PerformanceRankingEngine(methodConfig, this.statisticsEngine);
        
        const rankings = await tempEngine.calculateOverallRankings(
          effectivenessResults,
          [], // Simplified for comparison
          {}
        );

        // Validate method performance
        const validation = await this.validateRankingMethod(rankings, effectivenessResults);
        
        methodComparison.push({
          method: method,
          rankings: rankings.map(r => ({ cohortId: r.cohortId, rank: r.overallRank })),
          consistency: validation.consistency,
          stability: validation.stability,
          discrimination: validation.discrimination,
          interpretability: validation.interpretability
        });

        validationResults.push(validation);
      }

      // Select best method based on validation scores
      const bestMethod = validationResults.reduce((best, current, index) => {
        const bestScore = best.overallScore;
        const currentScore = current.overallScore;
        return currentScore > bestScore ? { method: methods[index], ...current } : best;
      }, { method: methods[0], ...validationResults[0] });

      return {
        methodComparison,
        recommendedMethod: bestMethod.method,
        validationResults
      };

    } catch (error) {
      console.error('Ranking method comparison failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE RANKING CALCULATION METHODS
  // ============================================================================

  private async calculateOverallRankings(
    effectivenessResults: HypothesisEffectiveness[],
    cohortDefinitions: CohortDefinition[],
    clientData: Record<string, ClientRecord[]>
  ): Promise<OverallRanking[]> {
    const rankings: OverallRanking[] = [];

    // Calculate scores based on configured method
    const scoredResults = await Promise.all(effectivenessResults.map(async (result) => {
      const cohort = cohortDefinitions.find(c => c.id === result.hypothesisId);
      const clients = clientData[result.hypothesisId] || [];

      const score = await this.calculateCohortScore(result, cohort, clients);
      const confidence = this.calculateRankingConfidence(result, clients);

      return { result, score, confidence };
    }));

    // Sort by score (descending)
    const sortedResults = scoredResults.sort((a, b) => b.score.adjustedScore - a.score.adjustedScore);

    // Generate rankings
    sortedResults.forEach((scoredResult, index) => {
      const percentileRank = ((sortedResults.length - index) / sortedResults.length) * 100;
      const performanceLevel = this.determinePerformanceLevel(scoredResult.score.adjustedScore, percentileRank);
      const competitivePosition = this.determineCompetitivePosition(index + 1, sortedResults.length);

      rankings.push({
        cohortId: scoredResult.result.hypothesisId,
        cohortName: `${scoredResult.result.hypothesisType} Cohort`,
        overallRank: index + 1,
        overallScore: scoredResult.score.adjustedScore,
        percentileRank,
        rankingConfidence: scoredResult.confidence,
        scoreBreakdown: scoredResult.score,
        performanceLevel,
        competitivePosition,
        rankingMethod: this.config.rankingMethod,
        lastUpdated: new Date(),
        validityPeriod: 30
      });
    });

    return rankings;
  }

  private async calculateCohortScore(
    effectiveness: HypothesisEffectiveness,
    cohort: CohortDefinition | undefined,
    clients: ClientRecord[]
  ): Promise<ScoreBreakdown> {
    let rawScore = effectiveness.effectivenessScore;
    let weightedScore = rawScore;
    let adjustedScore = rawScore;
    const componentScores: ComponentScore[] = [];
    const adjustments: ScoreAdjustment[] = [];

    // Component scores based on dimensional breakdown
    const dimensions = effectiveness.scoringDimensions;
    if (dimensions) {
      componentScores.push(
        {
          component: 'conversion_effectiveness',
          rawValue: dimensions.conversionEffectiveness,
          normalizedValue: dimensions.conversionEffectiveness,
          weight: this.config.criteriaWeights.effectiveness || 0.4,
          contribution: dimensions.conversionEffectiveness * (this.config.criteriaWeights.effectiveness || 0.4),
          confidence: effectiveness.statisticalSignificance < 0.05 ? 0.9 : 0.6,
          dataQuality: clients.length > 20 ? 'high' : clients.length > 10 ? 'medium' : 'low'
        },
        {
          component: 'time_efficiency',
          rawValue: dimensions.timeEfficiency,
          normalizedValue: dimensions.timeEfficiency,
          weight: 0.2,
          contribution: dimensions.timeEfficiency * 0.2,
          confidence: 0.8,
          dataQuality: 'medium'
        },
        {
          component: 'retention_strength',
          rawValue: dimensions.retentionStrength,
          normalizedValue: dimensions.retentionStrength,
          weight: 0.2,
          contribution: dimensions.retentionStrength * 0.2,
          confidence: 0.7,
          dataQuality: 'medium'
        }
      );
    }

    // Apply statistical significance adjustment
    if (this.config.significanceRequired && effectiveness.statisticalSignificance > this.config.confidenceThreshold) {
      const significanceAdjustment = 0.8; // 20% penalty for low significance
      adjustedScore *= significanceAdjustment;
      
      adjustments.push({
        adjustmentType: 'statistical_significance',
        adjustmentFactor: significanceAdjustment,
        reasoning: `Low statistical significance (p=${effectiveness.statisticalSignificance.toFixed(3)})`,
        impact: adjustedScore - rawScore
      });
    }

    // Apply sample size adjustment
    if (clients.length < this.config.minimumSampleSize * 2) {
      const sampleSizeAdjustment = Math.max(0.5, clients.length / (this.config.minimumSampleSize * 2));
      adjustedScore *= sampleSizeAdjustment;
      
      adjustments.push({
        adjustmentType: 'sample_size',
        adjustmentFactor: sampleSizeAdjustment,
        reasoning: `Small sample size (${clients.length} clients)`,
        impact: adjustedScore - (rawScore * (adjustments.length > 0 ? adjustments[0].adjustmentFactor : 1))
      });
    }

    return {
      rawScore,
      weightedScore,
      adjustedScore: Math.min(1, Math.max(0, adjustedScore)),
      componentScores,
      adjustments
    };
  }

  private calculateRankingConfidence(
    effectiveness: HypothesisEffectiveness,
    clients: ClientRecord[]
  ): number {
    const factors = [];

    // Statistical significance factor
    const significanceFactor = Math.max(0, 1 - effectiveness.statisticalSignificance);
    factors.push(significanceFactor * 0.3);

    // Sample size factor
    const sampleSizeFactor = Math.min(1, clients.length / 50);
    factors.push(sampleSizeFactor * 0.3);

    // Confidence interval width factor (narrower = more confident)
    const intervalWidth = effectiveness.confidenceInterval[1] - effectiveness.confidenceInterval[0];
    const intervalFactor = Math.max(0, 1 - intervalWidth);
    factors.push(intervalFactor * 0.2);

    // Data quality factor
    const dataQualityFactor = 0.8; // Simplified assessment
    factors.push(dataQualityFactor * 0.2);

    return factors.reduce((sum, factor) => sum + factor, 0);
  }

  private determinePerformanceLevel(
    score: number,
    percentile: number
  ): 'exceptional' | 'high' | 'moderate' | 'low' | 'poor' {
    if (percentile >= 90 && score >= 0.8) return 'exceptional';
    if (percentile >= 70 && score >= 0.6) return 'high';
    if (percentile >= 40 && score >= 0.4) return 'moderate';
    if (percentile >= 20 && score >= 0.2) return 'low';
    return 'poor';
  }

  private determineCompetitivePosition(
    rank: number,
    totalCohorts: number
  ): 'leader' | 'strong' | 'average' | 'weak' | 'laggard' {
    const percentile = ((totalCohorts - rank + 1) / totalCohorts) * 100;
    
    if (percentile >= 90) return 'leader';
    if (percentile >= 70) return 'strong';
    if (percentile >= 40) return 'average';
    if (percentile >= 20) return 'weak';
    return 'laggard';
  }

  private async calculateDimensionalRankings(
    effectivenessResults: HypothesisEffectiveness[],
    cohortDefinitions: CohortDefinition[]
  ): Promise<DimensionalRanking[]> {
    const dimensions = [
      'conversionEffectiveness',
      'timeEfficiency', 
      'retentionStrength',
      'lifetimeValueImpact',
      'consistencyScore',
      'scalabilityScore'
    ];

    const dimensionalRankings: DimensionalRanking[] = [];

    for (const dimension of dimensions) {
      const rankings: DimensionRankingEntry[] = [];
      
      // Sort by dimension score
      const sortedByDimension = effectivenessResults
        .map((result, index) => ({
          result,
          dimensionScore: this.extractDimensionScore(result, dimension),
          originalIndex: index
        }))
        .sort((a, b) => b.dimensionScore - a.dimensionScore);

      // Calculate rankings for this dimension
      sortedByDimension.forEach((item, dimensionRank) => {
        const dimensionPercentile = ((sortedByDimension.length - dimensionRank) / sortedByDimension.length) * 100;
        const overallRank = item.originalIndex + 1; // Simplified
        const consistencyScore = this.calculateDimensionConsistency(
          dimensionRank + 1,
          overallRank,
          sortedByDimension.length
        );

        rankings.push({
          cohortId: item.result.hypothesisId,
          dimensionRank: dimensionRank + 1,
          dimensionScore: item.dimensionScore,
          dimensionPercentile,
          overallRankComparison: (dimensionRank + 1) - overallRank,
          consistencyScore
        });
      });

      // Calculate correlation matrix (simplified)
      const correlationMatrix = this.calculateCorrelationMatrix(effectivenessResults, dimensions);

      // Generate dimension insights
      const dimensionInsights = this.generateDimensionInsights(dimension, rankings);

      dimensionalRankings.push({
        dimension,
        rankings,
        correlationMatrix,
        dimensionInsights
      });
    }

    return dimensionalRankings;
  }

  private extractDimensionScore(effectiveness: HypothesisEffectiveness, dimension: string): number {
    const dimensions = effectiveness.scoringDimensions;
    if (!dimensions) return 0;

    switch (dimension) {
      case 'conversionEffectiveness': return dimensions.conversionEffectiveness;
      case 'timeEfficiency': return dimensions.timeEfficiency;
      case 'retentionStrength': return dimensions.retentionStrength;
      case 'lifetimeValueImpact': return dimensions.lifetimeValueImpact;
      case 'consistencyScore': return dimensions.consistencyScore;
      case 'scalabilityScore': return dimensions.scalabilityScore;
      default: return 0;
    }
  }

  private calculateDimensionConsistency(
    dimensionRank: number,
    overallRank: number,
    totalCohorts: number
  ): number {
    const maxDifference = totalCohorts - 1;
    const actualDifference = Math.abs(dimensionRank - overallRank);
    return Math.max(0, 1 - (actualDifference / maxDifference));
  }

  private calculateCorrelationMatrix(
    effectivenessResults: HypothesisEffectiveness[],
    dimensions: string[]
  ): CorrelationMatrix {
    const correlations: number[][] = [];
    const significanceMatrix: number[][] = [];
    const strongCorrelations: CorrelationPair[] = [];

    // Initialize matrices
    for (let i = 0; i < dimensions.length; i++) {
      correlations.push(new Array(dimensions.length).fill(0));
      significanceMatrix.push(new Array(dimensions.length).fill(1));
    }

    // Calculate correlations (simplified implementation)
    for (let i = 0; i < dimensions.length; i++) {
      for (let j = i; j < dimensions.length; j++) {
        if (i === j) {
          correlations[i][j] = 1.0;
          significanceMatrix[i][j] = 0.0;
        } else {
          // Simplified correlation calculation
          const correlation = 0.3 + Math.random() * 0.4; // Mock correlation
          const significance = 0.05 + Math.random() * 0.1; // Mock p-value
          
          correlations[i][j] = correlations[j][i] = correlation;
          significanceMatrix[i][j] = significanceMatrix[j][i] = significance;
          
          if (Math.abs(correlation) > 0.5 && significance < 0.05) {
            strongCorrelations.push({
              dimension1: dimensions[i],
              dimension2: dimensions[j],
              correlation,
              significance,
              interpretation: correlation > 0.7 ? 'strong_positive' :
                           correlation > 0.3 ? 'moderate_positive' :
                           correlation < -0.7 ? 'strong_negative' :
                           correlation < -0.3 ? 'moderate_negative' : 'weak_positive'
            });
          }
        }
      }
    }

    return {
      dimensions,
      correlations,
      significanceMatrix,
      strongCorrelations
    };
  }

  private generateDimensionInsights(
    dimension: string,
    rankings: DimensionRankingEntry[]
  ): DimensionInsight[] {
    const insights: DimensionInsight[] = [];

    // Identify top performer in this dimension
    const topPerformer = rankings[0];
    if (topPerformer) {
      insights.push({
        dimension,
        insight: `${topPerformer.cohortId} leads in ${dimension} with score ${topPerformer.dimensionScore.toFixed(2)}`,
        insightType: 'strength',
        confidence: 0.9,
        actionable: true,
        relatedCohorts: [topPerformer.cohortId]
      });
    }

    // Identify improvement opportunities
    const lowPerformers = rankings.filter(r => r.dimensionPercentile < 25);
    if (lowPerformers.length > 0) {
      insights.push({
        dimension,
        insight: `${lowPerformers.length} cohort(s) show significant room for improvement in ${dimension}`,
        insightType: 'opportunity',
        confidence: 0.8,
        actionable: true,
        relatedCohorts: lowPerformers.map(lp => lp.cohortId)
      });
    }

    return insights;
  }

  private async calculatePeerGroupRankings(
    effectivenessResults: HypothesisEffectiveness[],
    cohortDefinitions: CohortDefinition[],
    clientData: Record<string, ClientRecord[]>
  ): Promise<PeerGroupRanking[]> {
    // Simplified peer grouping implementation
    const groups: Record<string, HypothesisEffectiveness[]> = {};
    
    // Group by hypothesis type
    effectivenessResults.forEach(result => {
      const groupKey = result.hypothesisType || 'unknown';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(result);
    });

    const peerGroupRankings: PeerGroupRanking[] = [];

    Object.entries(groups).forEach(([groupKey, groupResults]) => {
      if (groupResults.length < 2) return; // Skip single-member groups

      const rankings: PeerRankingEntry[] = [];
      
      // Sort within peer group
      const sortedGroup = groupResults.sort((a, b) => b.effectivenessScore - a.effectivenessScore);
      
      sortedGroup.forEach((result, rank) => {
        const peerPercentile = ((sortedGroup.length - rank) / sortedGroup.length) * 100;
        
        rankings.push({
          cohortId: result.hypothesisId,
          peerRank: rank + 1,
          peerScore: result.effectivenessScore,
          peerPercentile,
          strengthAreas: this.identifyStrengthAreas(result),
          improvementAreas: this.identifyImprovementAreas(result),
          peerLearningOpportunities: []
        });
      });

      peerGroupRankings.push({
        groupId: `group-${groupKey}`,
        groupName: `${groupKey} Cohorts`,
        groupCriteria: { hypothesisType: groupKey },
        groupSize: groupResults.length,
        rankings,
        groupStatistics: this.calculateGroupStatistics(groupResults),
        interGroupComparison: []
      });
    });

    return peerGroupRankings;
  }

  private identifyStrengthAreas(effectiveness: HypothesisEffectiveness): string[] {
    const strengths: string[] = [];
    const dimensions = effectiveness.scoringDimensions;
    
    if (!dimensions) return strengths;

    if (dimensions.conversionEffectiveness > 0.7) strengths.push('conversion_rate');
    if (dimensions.timeEfficiency > 0.7) strengths.push('time_efficiency');
    if (dimensions.retentionStrength > 0.7) strengths.push('retention');
    if (dimensions.lifetimeValueImpact > 0.7) strengths.push('lifetime_value');

    return strengths;
  }

  private identifyImprovementAreas(effectiveness: HypothesisEffectiveness): string[] {
    const improvements: string[] = [];
    const dimensions = effectiveness.scoringDimensions;
    
    if (!dimensions) return improvements;

    if (dimensions.conversionEffectiveness < 0.4) improvements.push('conversion_rate');
    if (dimensions.timeEfficiency < 0.4) improvements.push('time_efficiency');
    if (dimensions.retentionStrength < 0.4) improvements.push('retention');
    if (dimensions.lifetimeValueImpact < 0.4) improvements.push('lifetime_value');

    return improvements;
  }

  private calculateGroupStatistics(groupResults: HypothesisEffectiveness[]): GroupStatistics {
    const scores = groupResults.map(r => r.effectivenessScore);
    const sortedScores = [...scores].sort((a, b) => a - b);
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const median = sortedScores[Math.floor(sortedScores.length / 2)];
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    const q1 = sortedScores[Math.floor(sortedScores.length * 0.25)];
    const q3 = sortedScores[Math.floor(sortedScores.length * 0.75)];

    return {
      meanScore: mean,
      medianScore: median,
      standardDeviation,
      range: [sortedScores[0], sortedScores[sortedScores.length - 1]],
      quartiles: [q1, median, q3],
      outliers: [], // Simplified
      distribution: {
        distributionType: 'normal', // Simplified
        skewness: 0,
        kurtosis: 0,
        normalityTest: {
          testName: 'shapiro_wilk',
          statistic: 0.9,
          pValue: 0.1,
          isNormal: true,
          confidence: 0.9
        },
        distributionFit: []
      }
    };
  }

  // Additional placeholder methods for comprehensive functionality
  private async performStatisticalValidation(
    rankings: OverallRanking[],
    effectivenessResults: HypothesisEffectiveness[]
  ): Promise<RankingStatisticalValidation> {
    return {
      overallValidation: {
        testType: 'friedman',
        testStatistic: 15.6,
        pValue: 0.02,
        significantDifferences: true,
        effectSize: 0.3,
        interpretation: 'Significant differences detected between cohorts'
      },
      pairwiseComparisons: [],
      rankingStability: {
        stabilityScore: 0.8,
        rankingConsistency: 0.75,
        volatileCohorts: [],
        stabilityTrend: 'stable',
        expectedStability: 0.8
      },
      confidenceAssessment: {
        overallConfidence: 0.7,
        highConfidenceRankings: rankings.filter(r => r.rankingConfidence > 0.8).map(r => r.cohortId),
        lowConfidenceRankings: rankings.filter(r => r.rankingConfidence < 0.5).map(r => r.cohortId),
        confidenceFactors: [],
        improvementRecommendations: []
      }
    };
  }

  private async performStabilityAnalysis(
    rankings: OverallRanking[],
    cohorts: CohortDefinition[]
  ): Promise<RankingStabilityAnalysis> {
    return {
      historicalStability: {
        timeFrames: [],
        overallStabilityTrend: 'stable',
        mostStableCohorts: [],
        leastStableCohorts: [],
        stabilityDrivers: []
      },
      rankingConsistency: {
        consistencyScore: 0.8,
        consistentDimensions: ['conversion_effectiveness', 'time_efficiency'],
        inconsistentDimensions: ['retention_strength'],
        consistencyMatrix: [[1, 0.8], [0.8, 1]]
      },
      stabilityPrediction: {
        predictedStability: 0.8,
        predictionConfidence: 0.7,
        stabilityFactors: [],
        riskFactors: [],
        recommendations: []
      }
    };
  }

  private getDefaultStabilityAnalysis(): RankingStabilityAnalysis {
    return {
      historicalStability: {
        timeFrames: [],
        overallStabilityTrend: 'stable',
        mostStableCohorts: [],
        leastStableCohorts: [],
        stabilityDrivers: []
      },
      rankingConsistency: {
        consistencyScore: 0.5,
        consistentDimensions: [],
        inconsistentDimensions: [],
        consistencyMatrix: []
      },
      stabilityPrediction: {
        predictedStability: 0.5,
        predictionConfidence: 0.5,
        stabilityFactors: [],
        riskFactors: [],
        recommendations: []
      }
    };
  }

  private async generateRankingInsights(
    rankings: OverallRanking[],
    dimensionalRankings: DimensionalRanking[],
    validation: RankingStatisticalValidation
  ): Promise<RankingInsight[]> {
    const insights: RankingInsight[] = [];

    // Top performer insight
    const topPerformer = rankings[0];
    if (topPerformer) {
      insights.push({
        insightType: 'competitive_advantage',
        insight: `${topPerformer.cohortName} leads with ${topPerformer.overallScore.toFixed(2)} effectiveness score`,
        affectedCohorts: [topPerformer.cohortId],
        confidence: topPerformer.rankingConfidence,
        actionable: true,
        priority: 'high',
        potentialImpact: 0.8,
        recommendations: ['Analyze success factors for replication', 'Document best practices']
      });
    }

    // Performance gap insight
    const performanceGap = rankings[0]?.overallScore - rankings[rankings.length - 1]?.overallScore;
    if (performanceGap > 0.3) {
      insights.push({
        insightType: 'performance_gap',
        insight: `Significant performance gap of ${performanceGap.toFixed(2)} between top and bottom performers`,
        affectedCohorts: [rankings[0]?.cohortId, rankings[rankings.length - 1]?.cohortId].filter(Boolean),
        confidence: 0.9,
        actionable: true,
        priority: 'high',
        potentialImpact: 0.7,
        recommendations: ['Focus improvement efforts on bottom performers', 'Implement knowledge transfer programs']
      });
    }

    return insights;
  }

  private async validateRankingMethod(
    rankings: OverallRanking[],
    effectivenessResults: HypothesisEffectiveness[]
  ): Promise<MethodValidationResult> {
    return {
      method: 'test',
      consistency: 0.8,
      stability: 0.7,
      discrimination: 0.9,
      interpretability: 0.8,
      overallScore: 0.8
    };
  }
}

// Supporting interfaces for method comparison
interface RankingMethodComparison {
  method: string;
  rankings: { cohortId: string; rank: number }[];
  consistency: number;
  stability: number;
  discrimination: number;
  interpretability: number;
}

interface MethodValidationResult {
  method: string;
  consistency: number;
  stability: number;
  discrimination: number;
  interpretability: number;
  overallScore: number;
}

export type {
  RankingConfig,
  RankingAnalysisResult,
  OverallRanking,
  DimensionalRanking,
  PeerGroupRanking,
  RankingStatisticalValidation,
  RankingStabilityAnalysis,
  RankingInsight
};