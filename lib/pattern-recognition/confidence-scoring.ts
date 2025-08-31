/**
 * Story 4.1: Pattern Confidence Scoring Algorithms
 * 
 * Implements sophisticated confidence scoring for pattern recognition,
 * combining sample size, success rate, and consistency metrics.
 */

import { 
  SuccessPattern, 
  ConfidenceCalculationParams, 
  StatisticalAnalysisResult,
  PatternValidationResult 
} from '../data-models/pattern-models';

/**
 * Calculate pattern confidence score based on sample size, success rate, and consistency
 * 
 * Confidence score combines:
 * - Sample Size Weight (40%): More samples = higher confidence, max at 10+ samples
 * - Success Rate Weight (40%): Higher success rate = higher confidence
 * - Consistency Weight (20%): Lower variation in outcomes = higher confidence
 * 
 * @param params - Confidence calculation parameters
 * @returns Confidence score between 0 and 1
 */
export function calculatePatternConfidence(params: ConfidenceCalculationParams): number {
  const {
    successCount,
    totalAttempts,
    consistencyScore,
    sampleSizeWeight = 0.4,
    successRateWeight = 0.4,
    consistencyWeight = 0.2
  } = params;

  // Input validation
  if (totalAttempts === 0) return 0;
  if (successCount > totalAttempts) throw new Error('Success count cannot exceed total attempts');
  if (consistencyScore < 0 || consistencyScore > 1) {
    throw new Error('Consistency score must be between 0 and 1');
  }

  // Sample size weight: logarithmic scaling, maxed at 10+ samples
  const sampleSizeComponent = Math.min(Math.log10(totalAttempts + 1) / Math.log10(11), 1);
  
  // Success rate weight: direct proportion
  const successRateComponent = successCount / totalAttempts;
  
  // Consistency weight: direct use of consistency score
  const consistencyComponent = consistencyScore;

  // Weighted combination
  const confidence = (
    sampleSizeComponent * sampleSizeWeight +
    successRateComponent * successRateWeight +
    consistencyComponent * consistencyWeight
  );

  return Math.min(Math.max(confidence, 0), 1); // Clamp between 0 and 1
}

/**
 * Calculate consistency score based on outcome variation
 * 
 * @param outcomes - Array of outcome results (true for success, false for failure)
 * @returns Consistency score between 0 and 1 (1 = perfectly consistent)
 */
export function calculateConsistencyScore(outcomes: boolean[]): number {
  if (outcomes.length === 0) return 0;
  if (outcomes.length === 1) return 1; // Single outcome is perfectly consistent

  const successRate = outcomes.filter(o => o).length / outcomes.length;
  
  // Calculate variance from expected success rate
  const variance = outcomes.reduce((sum, outcome) => {
    const deviation = (outcome ? 1 : 0) - successRate;
    return sum + deviation * deviation;
  }, 0) / outcomes.length;

  // Convert variance to consistency score (inverse relationship)
  // Maximum variance is 0.25 (occurs when success rate = 0.5)
  const maxVariance = 0.25;
  const consistency = 1 - (variance / maxVariance);

  return Math.min(Math.max(consistency, 0), 1);
}

/**
 * Calculate statistical significance (p-value) for pattern validation
 * 
 * Uses binomial test to determine if observed success rate is significantly
 * different from random chance (null hypothesis: success rate = 0.5)
 * 
 * @param successCount - Number of successes observed
 * @param totalAttempts - Total number of attempts
 * @param nullHypothesis - Null hypothesis success rate (default: 0.5)
 * @returns Statistical analysis result including p-value and significance
 */
export function calculateStatisticalSignificance(
  successCount: number,
  totalAttempts: number,
  nullHypothesis: number = 0.5
): StatisticalAnalysisResult {
  if (totalAttempts === 0) {
    return {
      pValue: 1.0,
      confidenceInterval: [0, 0],
      effectSize: 0,
      statisticalPower: 0,
      isSignificant: false,
      recommendationStrength: 'weak'
    };
  }

  const observedRate = successCount / totalAttempts;
  
  // Binomial test calculation (approximation for large samples)
  const pValue = calculateBinomialPValue(successCount, totalAttempts, nullHypothesis);
  
  // Calculate confidence interval (Wilson score interval)
  const confidenceInterval = calculateWilsonConfidenceInterval(successCount, totalAttempts, 0.95);
  
  // Effect size (Cohen's h for proportions)
  const effectSize = 2 * (Math.asin(Math.sqrt(observedRate)) - Math.asin(Math.sqrt(nullHypothesis)));
  
  // Statistical power approximation
  const statisticalPower = calculateStatisticalPower(successCount, totalAttempts, nullHypothesis);
  
  // Determine significance and recommendation strength
  const isSignificant = pValue < 0.05;
  const recommendationStrength = getRecommendationStrength(pValue, effectSize, totalAttempts);

  return {
    pValue,
    confidenceInterval,
    effectSize: Math.abs(effectSize),
    statisticalPower,
    isSignificant,
    recommendationStrength
  };
}

/**
 * Calculate binomial p-value using normal approximation with continuity correction
 * 
 * @param successCount - Observed successes
 * @param totalAttempts - Total attempts
 * @param nullHypothesis - Expected success rate under null hypothesis
 * @returns Two-tailed p-value
 */
function calculateBinomialPValue(
  successCount: number,
  totalAttempts: number,
  nullHypothesis: number
): number {
  const expectedSuccesses = totalAttempts * nullHypothesis;
  const variance = totalAttempts * nullHypothesis * (1 - nullHypothesis);
  const standardDeviation = Math.sqrt(variance);

  if (standardDeviation === 0) return 1.0;

  // Apply continuity correction
  const continuityCorrection = 0.5;
  const correctedDeviation = Math.abs(successCount - expectedSuccesses) - continuityCorrection;
  
  // Z-score calculation
  const zScore = correctedDeviation / standardDeviation;
  
  // Two-tailed p-value using standard normal distribution
  const pValue = 2 * (1 - standardNormalCDF(Math.abs(zScore)));
  
  return Math.min(Math.max(pValue, 0), 1);
}

/**
 * Calculate Wilson confidence interval for binomial proportion
 * 
 * @param successCount - Number of successes
 * @param totalAttempts - Total attempts
 * @param confidenceLevel - Confidence level (e.g., 0.95 for 95%)
 * @returns Confidence interval [lower, upper]
 */
function calculateWilsonConfidenceInterval(
  successCount: number,
  totalAttempts: number,
  confidenceLevel: number
): [number, number] {
  if (totalAttempts === 0) return [0, 0];

  const z = getZScore(confidenceLevel);
  const p = successCount / totalAttempts;
  const n = totalAttempts;

  const denominator = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denominator;
  const margin = (z / denominator) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));

  return [
    Math.max(center - margin, 0),
    Math.min(center + margin, 1)
  ];
}

/**
 * Calculate statistical power for detecting effect size
 * 
 * @param successCount - Observed successes
 * @param totalAttempts - Total attempts
 * @param nullHypothesis - Null hypothesis success rate
 * @returns Statistical power (0-1)
 */
function calculateStatisticalPower(
  successCount: number,
  totalAttempts: number,
  nullHypothesis: number
): number {
  if (totalAttempts < 5) return 0; // Insufficient power for small samples

  const observedRate = successCount / totalAttempts;
  const effectSize = Math.abs(observedRate - nullHypothesis);
  
  // Simplified power calculation based on effect size and sample size
  const powerEstimate = Math.min(effectSize * Math.sqrt(totalAttempts) * 2, 1);
  
  return Math.max(powerEstimate, 0);
}

/**
 * Determine recommendation strength based on statistical metrics
 * 
 * @param pValue - Statistical p-value
 * @param effectSize - Effect size magnitude
 * @param sampleSize - Sample size
 * @returns Recommendation strength category
 */
function getRecommendationStrength(
  pValue: number,
  effectSize: number,
  sampleSize: number
): 'strong' | 'moderate' | 'weak' {
  if (pValue < 0.01 && effectSize > 0.5 && sampleSize >= 10) {
    return 'strong';
  } else if (pValue < 0.05 && effectSize > 0.2 && sampleSize >= 5) {
    return 'moderate';
  } else {
    return 'weak';
  }
}

/**
 * Standard normal cumulative distribution function (CDF)
 * 
 * @param x - Value to evaluate
 * @returns Cumulative probability
 */
function standardNormalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * Error function approximation using Abramowitz and Stegun formula
 * 
 * @param x - Input value
 * @returns Error function result
 */
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

/**
 * Get z-score for confidence level
 * 
 * @param confidenceLevel - Confidence level (e.g., 0.95)
 * @returns Corresponding z-score
 */
function getZScore(confidenceLevel: number): number {
  const alpha = 1 - confidenceLevel;
  
  // Common z-scores for standard confidence levels
  if (Math.abs(confidenceLevel - 0.90) < 0.001) return 1.645;
  if (Math.abs(confidenceLevel - 0.95) < 0.001) return 1.96;
  if (Math.abs(confidenceLevel - 0.99) < 0.001) return 2.576;
  
  // Approximation for other confidence levels
  return Math.sqrt(2) * inverseErf(1 - alpha);
}

/**
 * Inverse error function approximation
 * 
 * @param y - Input value between -1 and 1
 * @returns Inverse error function result
 */
function inverseErf(y: number): number {
  if (Math.abs(y) >= 1) return y > 0 ? Infinity : -Infinity;
  
  const a = 0.147;
  const b = 2 / (Math.PI * a);
  
  const term1 = b + Math.log(1 - y * y) / 2;
  const term2 = Math.log(1 - y * y) / a;
  
  const result = Math.sqrt(term1 * term1 - term2) - term1;
  
  return Math.sign(y) * Math.sqrt(result);
}

/**
 * Validate pattern based on multiple criteria
 * 
 * @param pattern - Success pattern to validate
 * @param minSampleSize - Minimum required sample size
 * @param minConfidence - Minimum required confidence score
 * @returns Pattern validation result
 */
export function validatePattern(
  pattern: SuccessPattern,
  minSampleSize: number = 3,
  minConfidence: number = 0.6
): PatternValidationResult {
  const validationReasons: string[] = [];
  const recommendedActions: string[] = [];
  let isValid = true;

  // Sample size validation
  if (pattern.sampleSize < minSampleSize) {
    isValid = false;
    validationReasons.push(`Sample size too small: ${pattern.sampleSize} < ${minSampleSize}`);
    recommendedActions.push('Collect more outcome data before validating pattern');
  }

  // Confidence validation
  if (pattern.confidenceScore < minConfidence) {
    isValid = false;
    validationReasons.push(`Confidence too low: ${pattern.confidenceScore} < ${minConfidence}`);
    recommendedActions.push('Improve pattern consistency or collect more data');
  }

  // Statistical significance validation
  if (pattern.statisticalSignificance && pattern.statisticalSignificance > 0.05) {
    validationReasons.push(`Low statistical significance: p = ${pattern.statisticalSignificance}`);
    recommendedActions.push('Consider collecting more data for statistical validation');
  }

  // Success rate validation (should be meaningfully above chance)
  if (pattern.successRate < 0.6) {
    validationReasons.push(`Success rate below threshold: ${pattern.successRate} < 0.6`);
    recommendedActions.push('Investigate pattern effectiveness or consider different success criteria');
  }

  // Age validation (patterns should be revalidated periodically)
  const daysSinceValidation = (Date.now() - pattern.lastValidated.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceValidation > 30) {
    validationReasons.push(`Pattern not validated recently: ${Math.round(daysSinceValidation)} days ago`);
    recommendedActions.push('Revalidate pattern with recent outcome data');
  }

  // Set next validation date
  const nextValidationDate = new Date();
  nextValidationDate.setDate(nextValidationDate.getDate() + (isValid ? 30 : 7));

  return {
    isValid,
    confidenceScore: pattern.confidenceScore,
    statisticalSignificance: pattern.statisticalSignificance || 1.0,
    validationReasons,
    recommendedActions,
    nextValidationDate
  };
}

/**
 * Advanced confidence scoring with domain-specific adjustments
 * 
 * @param pattern - Pattern to score
 * @param contextFactors - Additional context for scoring adjustments
 * @returns Enhanced confidence score
 */
export function calculateAdvancedConfidence(
  pattern: SuccessPattern,
  contextFactors: {
    industryVariance?: number; // 0-1, higher = more variable industry
    competitiveIntensity?: number; // 0-1, higher = more competitive
    seasonalityFactor?: number; // 0-1, higher = more seasonal
    innovationRate?: number; // 0-1, higher = faster changing field
  } = {}
): number {
  const baseConfidence = pattern.confidenceScore;
  
  // Apply context adjustments
  let adjustedConfidence = baseConfidence;
  
  // Industry variance adjustment (reduce confidence in highly variable industries)
  if (contextFactors.industryVariance) {
    adjustedConfidence *= (1 - contextFactors.industryVariance * 0.2);
  }
  
  // Competitive intensity adjustment (reduce confidence in highly competitive spaces)
  if (contextFactors.competitiveIntensity) {
    adjustedConfidence *= (1 - contextFactors.competitiveIntensity * 0.15);
  }
  
  // Seasonality adjustment (reduce confidence for seasonal patterns outside season)
  if (contextFactors.seasonalityFactor) {
    adjustedConfidence *= (1 - contextFactors.seasonalityFactor * 0.1);
  }
  
  // Innovation rate adjustment (reduce confidence in fast-changing fields)
  if (contextFactors.innovationRate) {
    adjustedConfidence *= (1 - contextFactors.innovationRate * 0.25);
  }
  
  // Ensure result stays within valid range
  return Math.min(Math.max(adjustedConfidence, 0), 1);
}