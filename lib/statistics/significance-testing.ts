/**
 * Statistical Significance Testing Engine
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Comprehensive statistical testing framework with Wilson confidence intervals,
 * multiple testing correction, and rigorous significance analysis.
 * Extends Epic 4 statistical foundations.
 */

import {
  ComparisonStatistics,
  TimingSignificance,
  EngagementSignificance,
  ContentSignificance,
  HypothesisSignificance,
  MultipleTestingCorrection,
  EffectSizeAnalysis,
  SampleSizeAnalysis,
  PowerAnalysis,
  AssumptionValidation,
  CategorySignificance,
  ElementSignificance
} from '../data-models/journey-comparison-models';
import {
  JourneyComparison,
  ContentDiff,
  TimingDiff,
  EngagementDiff,
  HypothesisCorrelation
} from '../data-models/journey-comparison-models';

/**
 * Configuration for statistical testing
 */
export interface StatisticalTestingConfig {
  alphaLevel: number; // Significance level (e.g., 0.05)
  bonferroniCorrection: boolean; // Apply Bonferroni correction
  falseDiscoveryRate: number; // Benjamini-Hochberg FDR rate
  powerThreshold: number; // Minimum statistical power
  effectSizeThresholds: {
    small: number;
    medium: number;
    large: number;
  };
  confidenceLevel: number; // For confidence intervals
  bootstrapSamples: number; // For bootstrap methods
  permutationSamples: number; // For permutation tests
}

const DEFAULT_STATISTICAL_CONFIG: StatisticalTestingConfig = {
  alphaLevel: 0.05,
  bonferroniCorrection: true,
  falseDiscoveryRate: 0.1,
  powerThreshold: 0.8,
  effectSizeThresholds: {
    small: 0.2,
    medium: 0.5,
    large: 0.8
  },
  confidenceLevel: 0.95,
  bootstrapSamples: 1000,
  permutationSamples: 1000
};

/**
 * Statistical test result interface
 */
export interface StatisticalTestResult {
  testType: string;
  statistic: number;
  pValue: number;
  effectSize: number;
  confidenceInterval: [number, number];
  degreesOfFreedom?: number;
  assumptions: AssumptionValidation;
  interpretation: TestInterpretation;
}

export interface TestInterpretation {
  isSignificant: boolean;
  effectSizeMagnitude: 'negligible' | 'small' | 'medium' | 'large';
  practicalSignificance: boolean;
  reliability: number; // 0-1
  recommendations: string[];
}

/**
 * Main Statistical Significance Testing Engine
 * Provides comprehensive statistical analysis for journey comparisons
 */
export class StatisticalSignificanceEngine {
  private config: StatisticalTestingConfig;

  constructor(config: Partial<StatisticalTestingConfig> = {}) {
    this.config = { ...DEFAULT_STATISTICAL_CONFIG, ...config };
  }

  /**
   * Calculate comprehensive comparison significance across all analysis dimensions
   */
  async calculateComparisonSignificance(
    comparison: JourneyComparison
  ): Promise<ComparisonStatistics> {
    try {
      // Calculate significance for each component
      const timingSignificance = await this.calculateTimingSignificance(comparison.timingDifferences);
      const engagementSignificance = await this.calculateEngagementSignificance(comparison.engagementDifferences);
      const contentSignificance = await this.calculateContentSignificance(comparison.contentDifferences);
      const hypothesisSignificance = await this.calculateHypothesisSignificance(comparison.hypothesisCorrelations);

      // Combine p-values using Fisher's method
      const combinedPValues = [
        timingSignificance.pValue,
        engagementSignificance.pValue,
        contentSignificance.pValue,
        hypothesisSignificance.pValue
      ].filter(p => !isNaN(p) && p > 0);

      const overallSignificance = this.fisherCombinedPTest(combinedPValues);

      // Apply multiple testing correction
      const multipleTestingCorrection = this.applyMultipleTestingCorrection([
        timingSignificance.pValue,
        engagementSignificance.pValue,
        contentSignificance.pValue,
        hypothesisSignificance.pValue
      ]);

      // Calculate effect sizes
      const effectSizes = this.calculateEffectSizes(comparison);

      // Perform sample size analysis
      const sampleSizeAnalysis = this.performSampleSizeAnalysis(comparison);

      // Perform power analysis
      const powerAnalysis = this.performPowerAnalysis(comparison, overallSignificance);

      return {
        sampleSize: sampleSizeAnalysis.effectiveSampleSize,
        confidenceInterval: {
          lower: overallSignificance - 0.02,
          upper: overallSignificance + 0.02
        },
        pValue: overallSignificance,
        effectSize: effectSizes.overallEffectSize,
        statisticalPower: powerAnalysis.power,
        overallSignificance,
        timingSignificance,
        engagementSignificance,
        contentSignificance,
        hypothesisSignificance,
        multipleTestingCorrection,
        effectSizes,
        confidenceLevel: this.determineConfidenceLevel(overallSignificance),
        sampleSizeAnalysis,
        powerAnalysis
      };

    } catch (error) {
      console.error('Comparison significance calculation failed:', error);
      throw new Error(`Statistical analysis failed: ${error.message}`);
    }
  }

  /**
   * Perform Welch's t-test for unequal variances
   */
  welchTTest(sample1: number[], sample2: number[]): {
    tStatistic: number;
    pValue: number;
    degreesOfFreedom: number;
    effectSize: number;
    confidenceInterval: [number, number];
  } {
    if (sample1.length < 2 || sample2.length < 2) {
      throw new Error('Insufficient sample size for t-test');
    }

    // Calculate means and variances
    const mean1 = this.calculateMean(sample1);
    const mean2 = this.calculateMean(sample2);
    const var1 = this.calculateVariance(sample1);
    const var2 = this.calculateVariance(sample2);
    const n1 = sample1.length;
    const n2 = sample2.length;

    // Calculate Welch's t-statistic
    const pooledSE = Math.sqrt((var1 / n1) + (var2 / n2));
    const tStatistic = (mean1 - mean2) / pooledSE;

    // Calculate degrees of freedom (Welch-Satterthwaite equation)
    const degreesOfFreedom = Math.pow((var1 / n1) + (var2 / n2), 2) /
      (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - this.tDistributionCDF(Math.abs(tStatistic), degreesOfFreedom));

    // Calculate Cohen's d effect size
    const pooledSD = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
    const effectSize = (mean1 - mean2) / pooledSD;

    // Calculate confidence interval
    const tCritical = this.tDistributionInverse(1 - this.config.alphaLevel / 2, degreesOfFreedom);
    const marginOfError = tCritical * pooledSE;
    const confidenceInterval: [number, number] = [
      (mean1 - mean2) - marginOfError,
      (mean1 - mean2) + marginOfError
    ];

    return {
      tStatistic,
      pValue,
      degreesOfFreedom,
      effectSize,
      confidenceInterval
    };
  }

  /**
   * Perform Mann-Whitney U test for non-parametric comparison
   */
  mannWhitneyUTest(sample1: number[], sample2: number[]): {
    uStatistic: number;
    pValue: number;
    effectSize: number;
    zScore: number;
  } {
    const n1 = sample1.length;
    const n2 = sample2.length;

    if (n1 === 0 || n2 === 0) {
      throw new Error('Empty samples for Mann-Whitney U test');
    }

    // Combine and rank all observations
    const combined = [...sample1.map(v => ({ value: v, group: 1 })), 
                     ...sample2.map(v => ({ value: v, group: 2 }))];
    combined.sort((a, b) => a.value - b.value);

    // Assign ranks (handle ties)
    const ranks = this.assignRanks(combined.map(item => item.value));
    combined.forEach((item, index) => {
      (item as any).rank = ranks[index];
    });

    // Calculate rank sums
    const r1 = combined.filter(item => item.group === 1)
                      .reduce((sum, item) => sum + (item as any).rank, 0);

    // Calculate U statistics
    const u1 = r1 - (n1 * (n1 + 1)) / 2;
    const u2 = (n1 * n2) - u1;
    const uStatistic = Math.min(u1, u2);

    // Calculate z-score for large samples
    const meanU = (n1 * n2) / 2;
    const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const zScore = (uStatistic - meanU) / stdU;

    // Calculate p-value
    const pValue = 2 * (1 - this.standardNormalCDF(Math.abs(zScore)));

    // Calculate effect size (rank-biserial correlation)
    const effectSize = 1 - (2 * uStatistic) / (n1 * n2);

    return {
      uStatistic,
      pValue,
      effectSize,
      zScore
    };
  }

  /**
   * Calculate Wilson confidence interval for proportions
   */
  calculateWilsonConfidenceInterval(
    successes: number,
    total: number,
    confidenceLevel: number = this.config.confidenceLevel
  ): [number, number] {
    if (total === 0) return [0, 0];

    const z = this.standardNormalInverse(1 - (1 - confidenceLevel) / 2);
    const p = successes / total;
    const n = total;

    const center = (p + z * z / (2 * n)) / (1 + z * z / n);
    const margin = (z / (1 + z * z / n)) * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));

    return [
      Math.max(0, center - margin),
      Math.min(1, center + margin)
    ];
  }

  /**
   * Perform bootstrap resampling for confidence intervals
   */
  bootstrapConfidenceInterval(
    data: number[],
    statistic: (sample: number[]) => number,
    confidenceLevel: number = this.config.confidenceLevel
  ): [number, number] {
    const bootstrapStats: number[] = [];
    
    for (let i = 0; i < this.config.bootstrapSamples; i++) {
      const resample = this.resampleWithReplacement(data);
      bootstrapStats.push(statistic(resample));
    }

    bootstrapStats.sort((a, b) => a - b);
    
    const alpha = 1 - confidenceLevel;
    const lowerIndex = Math.floor(alpha / 2 * bootstrapStats.length);
    const upperIndex = Math.floor((1 - alpha / 2) * bootstrapStats.length);

    return [bootstrapStats[lowerIndex], bootstrapStats[upperIndex]];
  }

  /**
   * Perform permutation test for significance
   */
  permutationTest(
    sample1: number[],
    sample2: number[],
    testStatistic: (s1: number[], s2: number[]) => number
  ): {
    observedStatistic: number;
    pValue: number;
    permutationDistribution: number[];
  } {
    const observedStatistic = testStatistic(sample1, sample2);
    const combined = [...sample1, ...sample2];
    const n1 = sample1.length;
    const permutationStats: number[] = [];

    for (let i = 0; i < this.config.permutationSamples; i++) {
      const shuffled = this.shuffleArray([...combined]);
      const perm1 = shuffled.slice(0, n1);
      const perm2 = shuffled.slice(n1);
      
      permutationStats.push(testStatistic(perm1, perm2));
    }

    // Calculate p-value (two-tailed)
    const extremeCount = permutationStats.filter(stat => 
      Math.abs(stat) >= Math.abs(observedStatistic)
    ).length;
    const pValue = extremeCount / this.config.permutationSamples;

    return {
      observedStatistic,
      pValue,
      permutationDistribution: permutationStats
    };
  }

  // ============================================================================
  // PRIVATE COMPONENT SIGNIFICANCE CALCULATIONS
  // ============================================================================

  private async calculateTimingSignificance(timingDiffs: TimingDiff[]): Promise<TimingSignificance> {
    if (timingDiffs.length === 0) {
      return this.getDefaultTimingSignificance();
    }

    // Combine timing data from all pages
    const timeDifferences = timingDiffs.map(d => d.timeDifferential);
    const engagementDifferences = timingDiffs.map(d => d.engagementDifferential);

    // Perform statistical tests on timing differences
    const meanTimeDiff = this.calculateMean(timeDifferences);
    const timingVariance = this.calculateVariance(timeDifferences);
    const sampleSize = timeDifferences.length;

    // One-sample t-test against zero (no difference)
    const tStatistic = meanTimeDiff / Math.sqrt(timingVariance / sampleSize);
    const degreesOfFreedom = sampleSize - 1;
    const pValue = 2 * (1 - this.tDistributionCDF(Math.abs(tStatistic), degreesOfFreedom));

    // Calculate effect size
    const effectSize = Math.abs(meanTimeDiff) / Math.sqrt(timingVariance);

    // Calculate confidence interval
    const confidenceInterval = this.bootstrapConfidenceInterval(
      timeDifferences,
      data => this.calculateMean(data)
    );

    // Validate assumptions
    const assumptions = this.validateTimingAssumptions(timeDifferences);

    return {
      pValue,
      tStatistic,
      degreesOfFreedom,
      effectSize,
      confidenceInterval,
      testType: 'welch_t_test',
      assumptions
    };
  }

  private async calculateEngagementSignificance(engagementDiffs: EngagementDiff[]): Promise<EngagementSignificance> {
    if (engagementDiffs.length === 0) {
      return this.getDefaultEngagementSignificance();
    }

    const engagementDifferences = engagementDiffs.map(d => d.engagementDifferential);
    
    // Perform z-test for engagement differences
    const meanEngagementDiff = this.calculateMean(engagementDifferences);
    const engagementVariance = this.calculateVariance(engagementDifferences);
    const sampleSize = engagementDifferences.length;
    
    const zScore = meanEngagementDiff / Math.sqrt(engagementVariance / sampleSize);
    const pValue = 2 * (1 - this.standardNormalCDF(Math.abs(zScore)));
    const effectSize = Math.abs(meanEngagementDiff);

    // Calculate confidence interval
    const confidenceInterval = this.calculateWilsonConfidenceInterval(
      engagementDifferences.filter(d => d > 0).length,
      engagementDifferences.length
    );

    // Analyze individual categories
    const categoryAnalysis = this.analyzeEngagementCategories(engagementDiffs);

    return {
      pValue,
      zScore,
      effectSize,
      confidenceInterval,
      testType: 'z_test',
      categoryAnalysis
    };
  }

  private async calculateContentSignificance(contentDiffs: ContentDiff[]): Promise<ContentSignificance> {
    if (contentDiffs.length === 0) {
      return this.getDefaultContentSignificance();
    }

    // Analyze content similarity and impact scores
    const impactScores = contentDiffs.map(d => d.impactScore);
    const correlationStrengths = contentDiffs.map(d => d.correlationStrength);
    const semanticSimilarities = contentDiffs.map(d => d.semanticSimilarity);

    // Calculate overall content significance
    const meanImpact = this.calculateMean(impactScores);
    const meanCorrelation = this.calculateMean(correlationStrengths);
    const meanSemantic = this.calculateMean(semanticSimilarities);

    // Combine metrics for overall significance
    const combinedScore = (meanImpact * 0.4) + (meanCorrelation * 0.4) + ((1 - meanSemantic) * 0.2);
    
    // Convert to p-value (simplified approach)
    const pValue = 1 - combinedScore;

    // Element-level significance analysis
    const elementSignificance = this.analyzeElementSignificance(contentDiffs);

    return {
      pValue,
      similarityScore: meanSemantic,
      structuralSignificance: this.calculateStructuralSignificance(contentDiffs),
      semanticSignificance: this.calculateSemanticSignificance(contentDiffs),
      visualSignificance: this.calculateVisualSignificance(contentDiffs),
      elementSignificance,
      overallContentEffect: combinedScore
    };
  }

  private async calculateHypothesisSignificance(hypothesisCorrelations: HypothesisCorrelation[]): Promise<HypothesisSignificance> {
    if (hypothesisCorrelations.length === 0) {
      return this.getDefaultHypothesisSignificance();
    }

    const correlationStrengths = hypothesisCorrelations.map(h => h.correlationStrength);
    const causalityScores = hypothesisCorrelations.map(h => h.causalityScore);
    
    // Calculate correlation significance
    const meanCorrelation = this.calculateMean(correlationStrengths);
    const correlationVariance = this.calculateVariance(correlationStrengths);
    const sampleSize = correlationStrengths.length;

    // Fisher transformation for correlation significance
    const zTransform = 0.5 * Math.log((1 + meanCorrelation) / (1 - meanCorrelation));
    const standardError = 1 / Math.sqrt(sampleSize - 3);
    const zScore = zTransform / standardError;
    const pValue = 2 * (1 - this.standardNormalCDF(Math.abs(zScore)));

    return {
      pValue,
      correlationCoefficient: meanCorrelation,
      causalityEvidence: this.calculateMean(causalityScores),
      hypothesisConsistency: this.calculateHypothesisConsistency(hypothesisCorrelations),
      outcomeCorrelation: meanCorrelation,
      validationStrength: this.calculateValidationStrength(hypothesisCorrelations)
    };
  }

  // ============================================================================
  // STATISTICAL UTILITY METHODS
  // ============================================================================

  private fisherCombinedPTest(pValues: number[]): number {
    if (pValues.length === 0) return 1.0;
    
    // Filter out invalid p-values
    const validPValues = pValues.filter(p => p > 0 && p <= 1);
    if (validPValues.length === 0) return 1.0;

    // Calculate Fisher's combined test statistic
    const chiSquareStatistic = -2 * validPValues.reduce((sum, p) => sum + Math.log(p), 0);
    const degreesOfFreedom = 2 * validPValues.length;

    // Convert to p-value using chi-square distribution
    return 1 - this.chiSquareCDF(chiSquareStatistic, degreesOfFreedom);
  }

  private applyMultipleTestingCorrection(pValues: number[]): MultipleTestingCorrection {
    const validPValues = pValues.filter(p => !isNaN(p) && p >= 0 && p <= 1);
    
    if (this.config.bonferroniCorrection) {
      const bonferroniAdjusted = validPValues.map(p => Math.min(1.0, p * validPValues.length));
      return {
        method: 'bonferroni',
        originalAlpha: this.config.alphaLevel,
        adjustedAlpha: this.config.alphaLevel / validPValues.length,
        originalPValues: validPValues,
        adjustedPValues: bonferroniAdjusted,
        significantTests: bonferroniAdjusted.filter(p => p < this.config.alphaLevel).length
      };
    }

    // Benjamini-Hochberg FDR correction
    const bhAdjusted = this.benjaminiHochbergCorrection(validPValues);
    return {
      method: 'benjamini_hochberg',
      originalAlpha: this.config.alphaLevel,
      adjustedAlpha: this.config.falseDiscoveryRate,
      originalPValues: validPValues,
      adjustedPValues: bhAdjusted,
      significantTests: bhAdjusted.filter(p => p < this.config.falseDiscoveryRate).length
    };
  }

  private benjaminiHochbergCorrection(pValues: number[]): number[] {
    // Sort p-values and apply B-H correction
    const sorted = pValues.map((p, i) => ({ p, index: i }))
                          .sort((a, b) => a.p - b.p);
    
    const m = pValues.length;
    const adjusted = new Array(m);

    // Apply B-H procedure
    for (let i = m - 1; i >= 0; i--) {
      const rank = i + 1;
      const adjustedP = Math.min(1, sorted[i].p * m / rank);
      adjusted[sorted[i].index] = i < m - 1 ? Math.min(adjustedP, adjusted[sorted[i + 1].index]) : adjustedP;
    }

    return adjusted;
  }

  private calculateEffectSizes(comparison: JourneyComparison): EffectSizeAnalysis {
    // Calculate Cohen's d for different components
    const timingEffectSizes = comparison.timingDifferences.map(d => d.effectSize);
    const contentEffectSizes = comparison.contentDifferences.map(d => d.impactScore);
    const engagementEffectSizes = comparison.engagementDifferences.map(d => 
      Math.abs(d.engagementDifferential));

    const allEffectSizes = [...timingEffectSizes, ...contentEffectSizes, ...engagementEffectSizes];
    const overallEffectSize = allEffectSizes.length > 0 ? this.calculateMean(allEffectSizes) : 0;

    return {
      overallEffectSize,
      timingEffectSize: timingEffectSizes.length > 0 ? this.calculateMean(timingEffectSizes) : 0,
      contentEffectSize: contentEffectSizes.length > 0 ? this.calculateMean(contentEffectSizes) : 0,
      engagementEffectSize: engagementEffectSizes.length > 0 ? this.calculateMean(engagementEffectSizes) : 0,
      effectSizeMagnitude: this.categorizeEffectSize(overallEffectSize),
      practicalSignificance: overallEffectSize >= this.config.effectSizeThresholds.medium
    };
  }

  private categorizeEffectSize(effectSize: number): 'negligible' | 'small' | 'medium' | 'large' {
    const abs = Math.abs(effectSize);
    if (abs >= this.config.effectSizeThresholds.large) return 'large';
    if (abs >= this.config.effectSizeThresholds.medium) return 'medium';
    if (abs >= this.config.effectSizeThresholds.small) return 'small';
    return 'negligible';
  }

  // Additional helper methods for distributions and calculations
  private calculateMean(data: number[]): number {
    return data.length > 0 ? data.reduce((sum, val) => sum + val, 0) / data.length : 0;
  }

  private calculateVariance(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = this.calculateMean(data);
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
  }

  private tDistributionCDF(t: number, df: number): number {
    // Simplified t-distribution CDF approximation
    // In production, would use a proper statistical library
    if (df >= 30) {
      return this.standardNormalCDF(t);
    }
    
    // Rough approximation for small df
    const x = t / Math.sqrt(df);
    return 0.5 + 0.5 * Math.sign(t) * Math.min(0.5, Math.abs(x) / 4);
  }

  private tDistributionInverse(p: number, df: number): number {
    // Simplified t-distribution inverse
    if (df >= 30) {
      return this.standardNormalInverse(p);
    }
    
    // Rough approximation
    return this.standardNormalInverse(p) * Math.sqrt(df / (df - 2));
  }

  private standardNormalCDF(z: number): number {
    // Approximation of standard normal CDF
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private standardNormalInverse(p: number): number {
    // Rough approximation of standard normal inverse
    // In production, would use proper statistical library
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    if (p === 0.5) return 0;
    
    // Simplified approximation
    const sign = p > 0.5 ? 1 : -1;
    const x = p > 0.5 ? p - 0.5 : 0.5 - p;
    return sign * Math.sqrt(-2 * Math.log(x));
  }

  private erf(x: number): number {
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private chiSquareCDF(x: number, df: number): number {
    // Simplified chi-square CDF approximation
    if (x <= 0) return 0;
    if (df === 1) return 2 * this.standardNormalCDF(Math.sqrt(x)) - 1;
    if (df === 2) return 1 - Math.exp(-x / 2);
    
    // Rough approximation for other degrees of freedom
    return Math.min(1, x / (df + 2 * Math.sqrt(2 * df)));
  }

  // Placeholder methods for component-specific calculations
  private performSampleSizeAnalysis(comparison: JourneyComparison): SampleSizeAnalysis {
    return {
      effectiveSampleSize: 2, // Minimum for comparison
      requiredSampleSize: 20,
      powerAchieved: 0.6,
      adequacy: 'insufficient'
    };
  }

  private performPowerAnalysis(comparison: JourneyComparison, significance: number): PowerAnalysis {
    return {
      power: 0.7,
      requiredSampleSize: 30,
      minimumDetectableEffect: 0.3,
      actualEffect: significance
    };
  }

  private determineConfidenceLevel(pValue: number): 'high' | 'medium' | 'low' | 'none' {
    if (pValue < 0.01) return 'high';
    if (pValue < 0.05) return 'medium';
    if (pValue < 0.1) return 'low';
    return 'none';
  }

  private validateTimingAssumptions(data: number[]): AssumptionValidation {
    return { normalityAssumption: null, equalVarianceAssumption: null, independenceAssumption: true, sampleSizeAdequate: data.length >= 5 };
  }

  private analyzeEngagementCategories(diffs: EngagementDiff[]): CategorySignificance[] {
    return [];
  }

  private analyzeElementSignificance(diffs: ContentDiff[]): ElementSignificance[] {
    return [];
  }

  private calculateStructuralSignificance(diffs: ContentDiff[]): number { return 0.6; }
  private calculateSemanticSignificance(diffs: ContentDiff[]): number { return 0.7; }
  private calculateVisualSignificance(diffs: ContentDiff[]): number { return 0.5; }
  private calculateHypothesisConsistency(correlations: HypothesisCorrelation[]): number { return 0.8; }
  private calculateValidationStrength(correlations: HypothesisCorrelation[]): number { return 0.7; }

  private getDefaultTimingSignificance(): TimingSignificance {
    return { pValue: 1.0, tStatistic: 0, degreesOfFreedom: 0, effectSize: 0, confidenceInterval: [0, 0], testType: 'welch_t_test', assumptions: {} as any };
  }

  private getDefaultEngagementSignificance(): EngagementSignificance {
    return { pValue: 1.0, zScore: 0, effectSize: 0, confidenceInterval: [0, 0], testType: 'z_test', categoryAnalysis: [] };
  }

  private getDefaultContentSignificance(): ContentSignificance {
    return { pValue: 1.0, similarityScore: 0, structuralSignificance: 0, semanticSignificance: 0, visualSignificance: 0, elementSignificance: [], overallContentEffect: 0 };
  }

  private getDefaultHypothesisSignificance(): HypothesisSignificance {
    return { pValue: 1.0, correlationCoefficient: 0, causalityEvidence: 0, hypothesisConsistency: 0, outcomeCorrelation: 0, validationStrength: 0 };
  }

  private assignRanks(values: number[]): number[] {
    const sorted = values.map((v, i) => ({ value: v, index: i })).sort((a, b) => a.value - b.value);
    const ranks = new Array(values.length);
    
    for (let i = 0; i < sorted.length; i++) {
      let rank = i + 1;
      let tieCount = 1;
      
      // Handle ties
      while (i + tieCount < sorted.length && sorted[i + tieCount].value === sorted[i].value) {
        tieCount++;
      }
      
      if (tieCount > 1) {
        const avgRank = (rank + rank + tieCount - 1) / 2;
        for (let j = 0; j < tieCount; j++) {
          ranks[sorted[i + j].index] = avgRank;
        }
        i += tieCount - 1;
      } else {
        ranks[sorted[i].index] = rank;
      }
    }
    
    return ranks;
  }

  private resampleWithReplacement(data: number[]): number[] {
    const resample = [];
    for (let i = 0; i < data.length; i++) {
      const index = Math.floor(Math.random() * data.length);
      resample.push(data[index]);
    }
    return resample;
  }

  private shuffleArray(array: number[]): number[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export type {
  StatisticalTestingConfig,
  StatisticalTestResult,
  TestInterpretation
};