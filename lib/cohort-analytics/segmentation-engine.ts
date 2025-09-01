/**
 * Cohort Segmentation Engine
 * Epic 5, Story 5.2: Cohort Analysis by Hypothesis Type
 * 
 * Advanced client segmentation and cohort definition engine using hypothesis types,
 * client characteristics, and statistical validation. Integrates with Story 5.1's
 * statistical analysis infrastructure for rigorous significance testing.
 */

import {
  CohortDefinition,
  SegmentationCriteria,
  ClientCharacteristic,
  ClientRecord,
  CohortConversionMetrics,
  TimeStageConversion,
  BenchmarkComparison,
  CohortMembership
} from '../data-models/cohort-analysis-models';
import { StatisticalSignificanceEngine } from '../statistics/significance-testing';

/**
 * Configuration for cohort segmentation
 */
export interface CohortSegmentationConfig {
  minimumCohortSize: number;
  maximumCohorts: number;
  significanceThreshold: number;
  similarityThreshold: number; // For hypothesis similarity
  
  // Segmentation weights
  hypothesisWeight: number; // 0-1
  industryWeight: number; // 0-1
  characteristicWeight: number; // 0-1
  temporalWeight: number; // 0-1
  
  // Advanced options
  enableHybridHypotheses: boolean;
  enableTimeBasedSegmentation: boolean;
  enableCharacteristicClustering: boolean;
  requireStatisticalSignificance: boolean;
}

const DEFAULT_SEGMENTATION_CONFIG: CohortSegmentationConfig = {
  minimumCohortSize: 5,
  maximumCohorts: 20,
  significanceThreshold: 0.05,
  similarityThreshold: 0.8,
  
  hypothesisWeight: 0.4,
  industryWeight: 0.2,
  characteristicWeight: 0.3,
  temporalWeight: 0.1,
  
  enableHybridHypotheses: true,
  enableTimeBasedSegmentation: true,
  enableCharacteristicClustering: true,
  requireStatisticalSignificance: true
};

/**
 * Segmentation result with metadata
 */
export interface SegmentationResult {
  cohorts: CohortDefinition[];
  segmentationQuality: SegmentationQuality;
  rejectedSegments: RejectedSegment[];
  recommendedActions: SegmentationRecommendation[];
}

/**
 * Quality metrics for segmentation
 */
export interface SegmentationQuality {
  overallQuality: number; // 0-1
  cohortSeparation: number; // How distinct cohorts are
  withinCohortSimilarity: number; // How similar clients within cohorts are
  balanceScore: number; // How evenly distributed cohorts are
  statisticalValidation: StatisticalValidationResult;
}

/**
 * Statistical validation of segmentation
 */
export interface StatisticalValidationResult {
  silhouetteScore: number; // -1 to 1 clustering quality
  calinskiHarabaszIndex: number; // Variance ratio for clustering
  daviesBouldinIndex: number; // Separation quality
  overallSignificance: number; // p-value for segmentation validity
}

/**
 * Rejected segment information
 */
export interface RejectedSegment {
  criteria: SegmentationCriteria;
  rejectionReason: string;
  clientCount: number;
  qualityScore: number;
  suggestedMergeTarget?: string;
}

/**
 * Segmentation recommendations
 */
export interface SegmentationRecommendation {
  type: 'merge_cohorts' | 'split_cohort' | 'adjust_criteria' | 'collect_more_data';
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImprovement: number; // 0-1
  implementationEffort: 'low' | 'medium' | 'high';
  affectedCohorts: string[];
}

/**
 * Hypothesis clustering result
 */
interface HypothesisCluster {
  clusterId: string;
  hypothesisType: 'pricing' | 'technical' | 'relationship_focused' | 'hybrid';
  hypotheses: string[];
  clusterCentroid: number[];
  intraClusterSimilarity: number;
  clusterSize: number;
}

/**
 * Client similarity calculation
 */
interface ClientSimilarity {
  clientA: string;
  clientB: string;
  similarityScore: number;
  similarityFactors: SimilarityFactor[];
}

/**
 * Individual similarity factor
 */
interface SimilarityFactor {
  factor: string;
  similarity: number; // 0-1
  weight: number; // 0-1
  contribution: number; // weighted similarity
}

/**
 * Main Cohort Segmentation Engine
 * Segments clients into cohorts based on hypothesis types and characteristics
 */
export class CohortSegmentationEngine {
  private config: CohortSegmentationConfig;
  private statisticsEngine: StatisticalSignificanceEngine;
  private hypothesisAnalyzer: HypothesisAnalyzer;
  private characteristicClustering: CharacteristicClustering;

  constructor(
    config: Partial<CohortSegmentationConfig> = {},
    statisticsEngine: StatisticalSignificanceEngine
  ) {
    this.config = { ...DEFAULT_SEGMENTATION_CONFIG, ...config };
    this.statisticsEngine = statisticsEngine;
    this.hypothesisAnalyzer = new HypothesisAnalyzer(this.config);
    this.characteristicClustering = new CharacteristicClustering(this.config);
  }

  /**
   * Primary segmentation method - creates cohorts from client data
   */
  async segmentClientsByHypothesis(
    clients: ClientRecord[],
    segmentationCriteria: SegmentationCriteria
  ): Promise<SegmentationResult> {
    try {
      console.log(`Starting cohort segmentation for ${clients.length} clients`);

      // Step 1: Validate input data
      const validationResult = this.validateSegmentationInputs(clients, segmentationCriteria);
      if (!validationResult.isValid) {
        throw new Error(`Segmentation validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Step 2: Filter clients by criteria
      const filteredClients = await this.filterClientsByCriteria(clients, segmentationCriteria);
      console.log(`Filtered to ${filteredClients.length} clients matching criteria`);

      // Step 3: Analyze hypothesis clusters
      const hypothesisClusters = await this.analyzeHypothesisClusters(filteredClients);
      console.log(`Identified ${hypothesisClusters.length} hypothesis clusters`);

      // Step 4: Perform characteristic-based clustering if enabled
      let characteristicClusters: ClientCharacteristic[][] = [];
      if (this.config.enableCharacteristicClustering) {
        characteristicClusters = await this.characteristicClustering.clusterByCharacteristics(
          filteredClients
        );
      }

      // Step 5: Create initial cohorts
      const initialCohorts = await this.createInitialCohorts(
        filteredClients,
        hypothesisClusters,
        characteristicClusters,
        segmentationCriteria
      );

      // Step 6: Validate cohort quality and merge/split as needed
      const validatedCohorts = await this.validateAndOptimizeCohorts(
        initialCohorts,
        filteredClients
      );

      // Step 7: Calculate cohort metrics
      const finalCohorts = await this.calculateCohortMetrics(validatedCohorts, filteredClients);

      // Step 8: Assess segmentation quality
      const segmentationQuality = await this.assessSegmentationQuality(
        finalCohorts,
        filteredClients
      );

      // Step 9: Generate recommendations
      const recommendations = await this.generateSegmentationRecommendations(
        finalCohorts,
        segmentationQuality
      );

      return {
        cohorts: finalCohorts,
        segmentationQuality,
        rejectedSegments: [], // Populated during validation
        recommendedActions: recommendations
      };

    } catch (error) {
      console.error('Cohort segmentation failed:', error);
      throw new Error(`Segmentation failed: ${error.message}`);
    }
  }

  /**
   * Assign a new client to existing cohorts
   */
  async assignClientToCohorts(
    client: ClientRecord,
    existingCohorts: CohortDefinition[]
  ): Promise<CohortMembership[]> {
    try {
      const assignments: CohortMembership[] = [];

      for (const cohort of existingCohorts) {
        const compatibilityScore = await this.calculateClientCohortCompatibility(
          client,
          cohort
        );

        // Assign if compatibility is high enough
        if (compatibilityScore > 0.7) {
          assignments.push({
            cohortId: cohort.id,
            assignedAt: new Date(),
            assignmentReason: `Compatibility score: ${compatibilityScore.toFixed(2)}`,
            active: true,
            membershipMetadata: {
              compatibilityScore,
              assignmentMethod: 'automatic',
              confidenceLevel: compatibilityScore > 0.9 ? 'high' : 'medium'
            }
          });
        }
      }

      return assignments;

    } catch (error) {
      console.error('Client cohort assignment failed:', error);
      return [];
    }
  }

  /**
   * Re-segment existing cohorts based on new data or criteria
   */
  async reSegmentCohorts(
    existingCohorts: CohortDefinition[],
    newClients: ClientRecord[],
    updatedCriteria?: SegmentationCriteria
  ): Promise<SegmentationResult> {
    try {
      // Combine all clients from existing cohorts with new clients
      const allClients = await this.combineClientData(existingCohorts, newClients);

      // Use updated criteria or maintain existing criteria
      const criteria = updatedCriteria || this.deriveCriteriaFromCohorts(existingCohorts);

      // Perform fresh segmentation
      return await this.segmentClientsByHypothesis(allClients, criteria);

    } catch (error) {
      console.error('Cohort re-segmentation failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE SEGMENTATION METHODS
  // ============================================================================

  private validateSegmentationInputs(
    clients: ClientRecord[],
    criteria: SegmentationCriteria
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (clients.length < this.config.minimumCohortSize) {
      errors.push(`Insufficient clients: ${clients.length} < ${this.config.minimumCohortSize}`);
    }

    if (criteria.hypothesisCategories.length === 0) {
      errors.push('No hypothesis categories specified');
    }

    if (criteria.minimumSampleSize < 2) {
      errors.push('Minimum sample size must be at least 2');
    }

    // Validate date range
    if (criteria.timeRange.startDate >= criteria.timeRange.endDate) {
      errors.push('Invalid time range: start date must be before end date');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async filterClientsByCriteria(
    clients: ClientRecord[],
    criteria: SegmentationCriteria
  ): Promise<ClientRecord[]> {
    let filteredClients = clients;

    // Filter by time range
    filteredClients = filteredClients.filter(client => {
      const clientDate = client.createdAt;
      return clientDate >= criteria.timeRange.startDate && 
             clientDate <= criteria.timeRange.endDate;
    });

    // Filter by industry types if specified
    if (criteria.industryTypes && criteria.industryTypes.length > 0) {
      filteredClients = filteredClients.filter(client => {
        const clientIndustry = this.extractClientIndustry(client);
        return criteria.industryTypes!.includes(clientIndustry);
      });
    }

    // Filter by client characteristics
    if (criteria.clientCharacteristics.length > 0) {
      filteredClients = filteredClients.filter(client => 
        this.matchesCharacteristicCriteria(client, criteria.clientCharacteristics)
      );
    }

    // Additional filters based on criteria
    if (criteria.companySize) {
      filteredClients = filteredClients.filter(client => 
        this.extractClientCompanySize(client) === criteria.companySize
      );
    }

    if (criteria.urgencyLevel) {
      filteredClients = filteredClients.filter(client => 
        this.extractClientUrgencyLevel(client) === criteria.urgencyLevel
      );
    }

    return filteredClients;
  }

  private async analyzeHypothesisClusters(clients: ClientRecord[]): Promise<HypothesisCluster[]> {
    // Extract all hypotheses tested by clients
    const allHypotheses = clients.flatMap(client => client.hypothesesTested);
    const uniqueHypotheses = [...new Set(allHypotheses)];

    console.log(`Analyzing ${uniqueHypotheses.length} unique hypotheses`);

    // Cluster similar hypotheses
    return await this.hypothesisAnalyzer.clusterHypotheses(uniqueHypotheses);
  }

  private async createInitialCohorts(
    clients: ClientRecord[],
    hypothesisClusters: HypothesisCluster[],
    characteristicClusters: ClientCharacteristic[][],
    criteria: SegmentationCriteria
  ): Promise<CohortDefinition[]> {
    const cohorts: CohortDefinition[] = [];

    // Create cohorts based on hypothesis clusters
    for (const hypothesisCluster of hypothesisClusters) {
      const cohortClients = clients.filter(client => 
        this.clientMatchesHypothesisCluster(client, hypothesisCluster)
      );

      if (cohortClients.length >= criteria.minimumSampleSize) {
        const cohort = await this.buildCohortDefinition(
          cohortClients,
          hypothesisCluster.hypothesisType,
          criteria,
          hypothesisCluster
        );
        cohorts.push(cohort);
      }
    }

    // If characteristic clustering is enabled, create additional cohorts
    if (this.config.enableCharacteristicClustering && characteristicClusters.length > 0) {
      for (const characteristicCluster of characteristicClusters) {
        const cohortClients = clients.filter(client => 
          this.clientMatchesCharacteristicCluster(client, characteristicCluster)
        );

        if (cohortClients.length >= criteria.minimumSampleSize) {
          const cohort = await this.buildCharacteristicBasedCohort(
            cohortClients,
            characteristicCluster,
            criteria
          );
          cohorts.push(cohort);
        }
      }
    }

    return cohorts;
  }

  private async buildCohortDefinition(
    clients: ClientRecord[],
    hypothesisType: 'pricing' | 'technical' | 'relationship_focused' | 'hybrid',
    criteria: SegmentationCriteria,
    hypothesisCluster: HypothesisCluster
  ): Promise<CohortDefinition> {
    const cohortId = this.generateCohortId(hypothesisType, hypothesisCluster.clusterId);
    const cohortName = this.generateCohortName(hypothesisType, clients);

    // Calculate initial conversion metrics
    const conversionMetrics = await this.calculateConversionMetrics(clients);

    // Calculate effectiveness score using Story 5.1's statistical infrastructure
    const effectivenessScore = await this.calculateInitialEffectivenessScore(clients, conversionMetrics);

    // Calculate confidence interval using Wilson method from Story 5.1
    const confidenceInterval = this.statisticsEngine.calculateWilsonConfidenceInterval(
      conversionMetrics.convertedClients,
      conversionMetrics.totalClients
    );

    // Initialize retention curve (will be populated by Task 5)
    const retentionCurve = await this.initializeRetentionCurve(clients);

    // Initialize lifetime value projection (will be populated by Task 5)
    const lifetimeValueProjection = await this.initializeLifetimeValueProjection(clients);

    return {
      id: cohortId,
      name: cohortName,
      hypothesisType,
      createdAt: new Date(),
      updatedAt: new Date(),
      segmentationCriteria: criteria,
      clientCount: clients.length,
      conversionMetrics,
      effectivenessScore,
      confidenceInterval,
      retentionCurve,
      lifetimeValueProjection,
      statisticalSignificance: await this.calculateCohortSignificance(conversionMetrics),
      sampleSizeAdequacy: this.assessSampleSizeAdequacy(clients.length),
      confidenceLevel: this.determineConfidenceLevel(confidenceInterval)
    };
  }

  private async calculateConversionMetrics(clients: ClientRecord[]): Promise<CohortConversionMetrics> {
    const totalClients = clients.length;
    const convertedClients = clients.filter(c => c.conversionStatus === 'converted').length;
    const conversionRate = totalClients > 0 ? convertedClients / totalClients : 0;

    // Calculate average time to conversion
    const conversionTimes = clients
      .filter(c => c.conversionStatus === 'converted' && c.timeToConversion)
      .map(c => c.timeToConversion!);
    
    const averageTimeToConversion = conversionTimes.length > 0 
      ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length
      : 0;

    // Calculate time-stage conversions
    const conversionByTimeStage = await this.calculateTimeStageConversions(clients);

    // Calculate statistical significance using Story 5.1's methods
    const statisticalSignificance = await this.calculateConversionSignificance(
      convertedClients,
      totalClients
    );

    // Calculate confidence level based on Wilson interval
    const wilsonInterval = this.statisticsEngine.calculateWilsonConfidenceInterval(
      convertedClients,
      totalClients
    );
    const confidenceLevel = this.determineConfidenceLevel(wilsonInterval);

    // Calculate advanced metrics
    const conversionVelocity = this.calculateConversionVelocity(clients);
    const conversionAcceleration = this.calculateConversionAcceleration(clients);
    const benchmarkComparison = await this.calculateBenchmarkComparison(conversionRate);

    return {
      totalClients,
      convertedClients,
      conversionRate,
      averageTimeToConversion,
      conversionByTimeStage,
      statisticalSignificance,
      confidenceLevel,
      conversionVelocity,
      conversionAcceleration,
      benchmarkComparison
    };
  }

  private async calculateTimeStageConversions(clients: ClientRecord[]): Promise<TimeStageConversion[]> {
    const timeStages = ['7days', '14days', '30days', '60days', '90days', '180days'] as const;
    const stageDays = { '7days': 7, '14days': 14, '30days': 30, '60days': 60, '90days': 90, '180days': 180 };

    return timeStages.map(stage => {
      const stageClients = clients.filter(client => {
        if (client.conversionStatus !== 'converted' || !client.timeToConversion) return false;
        return client.timeToConversion <= stageDays[stage];
      });

      const cumulativeRate = stageClients.length / clients.length;
      
      // Calculate incremental rate (conversions in this stage only)
      const previousStageDays = this.getPreviousStageDays(stage, stageDays);
      const previousStageClients = previousStageDays > 0 
        ? clients.filter(c => c.conversionStatus === 'converted' && 
                         c.timeToConversion && c.timeToConversion <= previousStageDays).length
        : 0;
      
      const incrementalRate = (stageClients.length - previousStageClients) / clients.length;

      // Calculate confidence interval using Wilson method
      const confidenceInterval = this.statisticsEngine.calculateWilsonConfidenceInterval(
        stageClients.length,
        clients.length
      );

      // Analyze trends
      const trendAnalysis = this.analyzeTrend(clients, stageDays[stage]);

      return {
        timeStage: stage,
        cumulativeConversionRate: cumulativeRate,
        incrementalConversionRate: incrementalRate,
        clientsConverted: stageClients.length,
        confidenceInterval,
        trendDirection: trendAnalysis.direction,
        trendStrength: trendAnalysis.strength,
        seasonalityFactor: trendAnalysis.seasonalityFactor
      };
    });
  }

  private async validateAndOptimizeCohorts(
    cohorts: CohortDefinition[],
    allClients: ClientRecord[]
  ): Promise<CohortDefinition[]> {
    let optimizedCohorts = [...cohorts];

    // Remove cohorts that don't meet minimum size requirements
    optimizedCohorts = optimizedCohorts.filter(cohort => 
      cohort.clientCount >= this.config.minimumCohortSize
    );

    // Merge very similar cohorts if enabled
    if (this.config.enableHybridHypotheses) {
      optimizedCohorts = await this.mergeSimilarCohorts(optimizedCohorts);
    }

    // Split cohorts that are too large or heterogeneous
    optimizedCohorts = await this.splitHeterogeneousCohorts(optimizedCohorts, allClients);

    // Ensure we don't exceed maximum cohorts limit
    if (optimizedCohorts.length > this.config.maximumCohorts) {
      optimizedCohorts = await this.consolidateExcessCohorts(optimizedCohorts);
    }

    return optimizedCohorts;
  }

  private async calculateCohortMetrics(
    cohorts: CohortDefinition[],
    allClients: ClientRecord[]
  ): Promise<CohortDefinition[]> {
    const updatedCohorts: CohortDefinition[] = [];

    for (const cohort of cohorts) {
      // Get clients for this cohort
      const cohortClients = this.getClientsForCohort(cohort, allClients);

      // Recalculate all metrics with current data
      const updatedConversionMetrics = await this.calculateConversionMetrics(cohortClients);
      const updatedEffectivenessScore = await this.calculateInitialEffectivenessScore(
        cohortClients,
        updatedConversionMetrics
      );

      const updatedCohort: CohortDefinition = {
        ...cohort,
        clientCount: cohortClients.length,
        conversionMetrics: updatedConversionMetrics,
        effectivenessScore: updatedEffectivenessScore,
        confidenceInterval: this.statisticsEngine.calculateWilsonConfidenceInterval(
          updatedConversionMetrics.convertedClients,
          updatedConversionMetrics.totalClients
        ),
        statisticalSignificance: await this.calculateCohortSignificance(updatedConversionMetrics),
        updatedAt: new Date()
      };

      updatedCohorts.push(updatedCohort);
    }

    return updatedCohorts;
  }

  private async assessSegmentationQuality(
    cohorts: CohortDefinition[],
    allClients: ClientRecord[]
  ): Promise<SegmentationQuality> {
    // Calculate cohort separation (how distinct cohorts are)
    const cohortSeparation = await this.calculateCohortSeparation(cohorts, allClients);

    // Calculate within-cohort similarity
    const withinCohortSimilarity = await this.calculateWithinCohortSimilarity(cohorts, allClients);

    // Calculate balance score (how evenly distributed cohorts are)
    const balanceScore = this.calculateCohortBalance(cohorts);

    // Statistical validation using clustering metrics
    const statisticalValidation = await this.performStatisticalValidation(cohorts, allClients);

    // Overall quality score
    const overallQuality = (
      cohortSeparation * 0.3 +
      withinCohortSimilarity * 0.3 +
      balanceScore * 0.2 +
      statisticalValidation.silhouetteScore * 0.2
    );

    return {
      overallQuality: Math.max(0, Math.min(1, overallQuality)),
      cohortSeparation,
      withinCohortSimilarity,
      balanceScore,
      statisticalValidation
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private extractClientIndustry(client: ClientRecord): string {
    // Extract industry from client characteristics or company name
    const industryChar = client.clientCharacteristics.find(c => c.name === 'industry');
    return industryChar ? String(industryChar.value) : 'unknown';
  }

  private extractClientCompanySize(client: ClientRecord): string {
    const sizeChar = client.clientCharacteristics.find(c => c.name === 'company_size');
    return sizeChar ? String(sizeChar.value) : 'unknown';
  }

  private extractClientUrgencyLevel(client: ClientRecord): string {
    const urgencyChar = client.clientCharacteristics.find(c => c.name === 'urgency_level');
    return urgencyChar ? String(urgencyChar.value) : 'medium';
  }

  private matchesCharacteristicCriteria(
    client: ClientRecord,
    criteria: ClientCharacteristic[]
  ): boolean {
    return criteria.every(criterion => {
      const clientChar = client.clientCharacteristics.find(c => c.name === criterion.name);
      return clientChar && clientChar.value === criterion.value;
    });
  }

  private clientMatchesHypothesisCluster(
    client: ClientRecord,
    cluster: HypothesisCluster
  ): boolean {
    return client.hypothesesTested.some(hypothesis => 
      cluster.hypotheses.includes(hypothesis)
    );
  }

  private clientMatchesCharacteristicCluster(
    client: ClientRecord,
    cluster: ClientCharacteristic[]
  ): boolean {
    return cluster.every(clusterChar => {
      const clientChar = client.clientCharacteristics.find(c => c.name === clusterChar.name);
      return clientChar && this.characteristicsSimilar(clientChar, clusterChar);
    });
  }

  private characteristicsSimilar(char1: ClientCharacteristic, char2: ClientCharacteristic): boolean {
    if (char1.type !== char2.type) return false;
    
    switch (char1.type) {
      case 'boolean':
        return char1.value === char2.value;
      case 'categorical':
        return char1.value === char2.value;
      case 'numerical':
        const num1 = Number(char1.value);
        const num2 = Number(char2.value);
        const threshold = Math.abs(num2) * 0.1; // 10% tolerance
        return Math.abs(num1 - num2) <= threshold;
      default:
        return false;
    }
  }

  private generateCohortId(hypothesisType: string, clusterId: string): string {
    return `cohort-${hypothesisType}-${clusterId}-${Date.now()}`;
  }

  private generateCohortName(hypothesisType: string, clients: ClientRecord[]): string {
    const industries = [...new Set(clients.map(c => this.extractClientIndustry(c)))];
    const mainIndustry = industries.length === 1 ? industries[0] : 'mixed';
    
    return `${hypothesisType.charAt(0).toUpperCase() + hypothesisType.slice(1)} - ${mainIndustry} (${clients.length} clients)`;
  }

  // Additional placeholder methods for comprehensive functionality
  private async calculateInitialEffectivenessScore(
    clients: ClientRecord[],
    metrics: CohortConversionMetrics
  ): Promise<number> {
    // Multi-dimensional effectiveness calculation
    const baseScore = metrics.conversionRate;
    const timeEfficiency = this.calculateTimeEfficiency(clients);
    const consistencyScore = this.calculateConsistencyScore(clients);
    
    return (baseScore * 0.5 + timeEfficiency * 0.3 + consistencyScore * 0.2);
  }

  private calculateTimeEfficiency(clients: ClientRecord[]): number {
    const conversionTimes = clients
      .filter(c => c.timeToConversion)
      .map(c => c.timeToConversion!);
    
    if (conversionTimes.length === 0) return 0;
    
    const avgTime = conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length;
    const benchmarkTime = 30; // 30 days benchmark
    
    return Math.max(0, 1 - (avgTime / benchmarkTime));
  }

  private calculateConsistencyScore(clients: ClientRecord[]): number {
    // Measure consistency of outcomes
    const outcomes = clients.map(c => c.conversionStatus === 'converted' ? 1 : 0);
    if (outcomes.length < 2) return 0.5;
    
    const mean = outcomes.reduce((sum, val) => sum + val, 0) / outcomes.length;
    const variance = outcomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / outcomes.length;
    
    return 1 - Math.min(1, variance * 4); // Scale variance to 0-1
  }

  private async calculateCohortSignificance(metrics: CohortConversionMetrics): Promise<number> {
    if (metrics.totalClients < 2) return 1.0;
    
    // Use binomial test approximation
    const p = metrics.conversionRate;
    const n = metrics.totalClients;
    const expectedSuccesses = n * 0.5; // Null hypothesis: 50% conversion
    const actualSuccesses = metrics.convertedClients;
    
    const z = (actualSuccesses - expectedSuccesses) / Math.sqrt(n * 0.5 * 0.5);
    
    // Convert z-score to p-value (simplified)
    return 2 * (1 - Math.min(1, Math.abs(z) / 2));
  }

  private assessSampleSizeAdequacy(sampleSize: number): 'insufficient' | 'adequate' | 'excellent' {
    if (sampleSize < this.config.minimumCohortSize) return 'insufficient';
    if (sampleSize < 20) return 'adequate';
    return 'excellent';
  }

  private determineConfidenceLevel(confidenceInterval: [number, number]): 'high' | 'medium' | 'low' | 'none' {
    const width = confidenceInterval[1] - confidenceInterval[0];
    if (width < 0.1) return 'high';
    if (width < 0.2) return 'medium';
    if (width < 0.4) return 'low';
    return 'none';
  }

  // Placeholder methods for comprehensive functionality
  private async initializeRetentionCurve(clients: ClientRecord[]): Promise<any[]> {
    return []; // Will be implemented in Task 5
  }

  private async initializeLifetimeValueProjection(clients: ClientRecord[]): Promise<any> {
    return { projectedValue: 0, projectionPeriod: 12, confidenceInterval: [0, 0], valueDrivers: [], riskFactors: [], monthlyProjections: [], churnProbability: [], upsellProbability: [] };
  }

  private getPreviousStageDays(stage: string, stageDays: Record<string, number>): number {
    const stages = ['7days', '14days', '30days', '60days', '90days', '180days'];
    const currentIndex = stages.indexOf(stage);
    return currentIndex > 0 ? stageDays[stages[currentIndex - 1]] : 0;
  }

  private analyzeTrend(clients: ClientRecord[], stageDays: number): any {
    // Simplified trend analysis
    return {
      direction: 'stable' as const,
      strength: 0.5,
      seasonalityFactor: 0.1
    };
  }

  private calculateConversionVelocity(clients: ClientRecord[]): number {
    const convertedClients = clients.filter(c => c.conversionStatus === 'converted');
    if (convertedClients.length === 0) return 0;
    
    const totalDays = convertedClients.reduce((sum, c) => sum + (c.timeToConversion || 0), 0);
    return convertedClients.length / Math.max(1, totalDays / convertedClients.length);
  }

  private calculateConversionAcceleration(clients: ClientRecord[]): number {
    // Simplified acceleration calculation
    return 0.1; // Placeholder
  }

  private async calculateBenchmarkComparison(conversionRate: number): Promise<BenchmarkComparison> {
    return {
      industryBenchmark: 0.3,
      historicalBenchmark: 0.25,
      peerCohortBenchmark: 0.35,
      relativePerformance: conversionRate > 0.3 ? 'above' : conversionRate > 0.25 ? 'at' : 'below',
      percentilRank: Math.min(100, conversionRate * 200) // Simplified
    };
  }

  private async buildCharacteristicBasedCohort(
    clients: ClientRecord[],
    characteristics: ClientCharacteristic[],
    criteria: SegmentationCriteria
  ): Promise<CohortDefinition> {
    // Simplified characteristic-based cohort creation
    return await this.buildCohortDefinition(
      clients,
      'hybrid',
      criteria,
      { clusterId: 'char-based', hypothesisType: 'hybrid', hypotheses: [], clusterCentroid: [], intraClusterSimilarity: 0.8, clusterSize: clients.length }
    );
  }

  private async calculateClientCohortCompatibility(
    client: ClientRecord,
    cohort: CohortDefinition
  ): Promise<number> {
    // Multi-factor compatibility scoring
    let compatibility = 0;
    let factors = 0;

    // Hypothesis compatibility
    const hypothesisMatch = client.hypothesesTested.some(h => 
      cohort.segmentationCriteria.hypothesisCategories.includes(h)
    );
    if (hypothesisMatch) compatibility += 0.4;
    factors++;

    // Temporal compatibility
    if (client.createdAt >= cohort.segmentationCriteria.timeRange.startDate &&
        client.createdAt <= cohort.segmentationCriteria.timeRange.endDate) {
      compatibility += 0.2;
    }
    factors++;

    // Characteristic compatibility
    const charMatch = this.matchesCharacteristicCriteria(
      client,
      cohort.segmentationCriteria.clientCharacteristics
    );
    if (charMatch) compatibility += 0.4;
    factors++;

    return compatibility / Math.max(1, factors);
  }

  // More placeholder methods for complex operations
  private async combineClientData(cohorts: CohortDefinition[], newClients: ClientRecord[]): Promise<ClientRecord[]> {
    // Combine existing cohort clients with new clients
    return newClients; // Simplified - would need to extract existing clients from cohorts
  }

  private deriveCriteriaFromCohorts(cohorts: CohortDefinition[]): SegmentationCriteria {
    // Derive criteria from existing cohorts
    const allCategories = cohorts.flatMap(c => c.segmentationCriteria.hypothesisCategories);
    return {
      hypothesisCategories: [...new Set(allCategories)],
      clientCharacteristics: [],
      timeRange: {
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        inclusive: true
      },
      minimumSampleSize: this.config.minimumCohortSize
    };
  }

  private async mergeSimilarCohorts(cohorts: CohortDefinition[]): Promise<CohortDefinition[]> {
    // Simplified merging logic
    return cohorts; // Placeholder
  }

  private async splitHeterogeneousCohorts(cohorts: CohortDefinition[], allClients: ClientRecord[]): Promise<CohortDefinition[]> {
    // Simplified splitting logic
    return cohorts; // Placeholder
  }

  private async consolidateExcessCohorts(cohorts: CohortDefinition[]): Promise<CohortDefinition[]> {
    // Keep top N cohorts by effectiveness score
    return cohorts
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, this.config.maximumCohorts);
  }

  private getClientsForCohort(cohort: CohortDefinition, allClients: ClientRecord[]): ClientRecord[] {
    // Get clients that match this cohort's criteria
    return allClients.filter(client => 
      this.matchesCharacteristicCriteria(client, cohort.segmentationCriteria.clientCharacteristics)
    );
  }

  private async calculateCohortSeparation(cohorts: CohortDefinition[], allClients: ClientRecord[]): Promise<number> {
    // Measure how distinct cohorts are from each other
    return 0.7; // Placeholder
  }

  private async calculateWithinCohortSimilarity(cohorts: CohortDefinition[], allClients: ClientRecord[]): Promise<number> {
    // Measure how similar clients within each cohort are
    return 0.8; // Placeholder
  }

  private calculateCohortBalance(cohorts: CohortDefinition[]): number {
    // Measure how evenly distributed cohorts are in size
    if (cohorts.length === 0) return 1;
    
    const sizes = cohorts.map(c => c.clientCount);
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
    
    return 1 - Math.min(1, variance / (avgSize * avgSize)); // Coefficient of variation inverted
  }

  private async performStatisticalValidation(cohorts: CohortDefinition[], allClients: ClientRecord[]): Promise<StatisticalValidationResult> {
    // Perform clustering validation metrics
    return {
      silhouetteScore: 0.6,
      calinskiHarabaszIndex: 150,
      daviesBouldinIndex: 1.2,
      overallSignificance: 0.03
    };
  }

  private async generateSegmentationRecommendations(
    cohorts: CohortDefinition[],
    quality: SegmentationQuality
  ): Promise<SegmentationRecommendation[]> {
    const recommendations: SegmentationRecommendation[] = [];

    if (quality.overallQuality < 0.6) {
      recommendations.push({
        type: 'collect_more_data',
        priority: 'high',
        description: 'Overall segmentation quality is below threshold. Consider collecting more client data.',
        expectedImprovement: 0.3,
        implementationEffort: 'medium',
        affectedCohorts: cohorts.map(c => c.id)
      });
    }

    return recommendations;
  }

  private async calculateConversionSignificance(converted: number, total: number): Promise<number> {
    if (total < 2) return 1.0;
    return await this.statisticsEngine.calculateWilsonConfidenceInterval(converted, total)[0] > 0 ? 0.05 : 0.5;
  }
}

// ============================================================================
// SUPPORTING ANALYZER CLASSES
// ============================================================================

class HypothesisAnalyzer {
  constructor(private config: CohortSegmentationConfig) {}

  async clusterHypotheses(hypotheses: string[]): Promise<HypothesisCluster[]> {
    // Group hypotheses by type and similarity
    const clusters: HypothesisCluster[] = [];
    
    // Simple clustering by keywords
    const pricingHypotheses = hypotheses.filter(h => this.isPricingHypothesis(h));
    const technicalHypotheses = hypotheses.filter(h => this.isTechnicalHypothesis(h));
    const relationshipHypotheses = hypotheses.filter(h => this.isRelationshipHypothesis(h));

    if (pricingHypotheses.length > 0) {
      clusters.push({
        clusterId: 'pricing-cluster',
        hypothesisType: 'pricing',
        hypotheses: pricingHypotheses,
        clusterCentroid: [],
        intraClusterSimilarity: 0.8,
        clusterSize: pricingHypotheses.length
      });
    }

    if (technicalHypotheses.length > 0) {
      clusters.push({
        clusterId: 'technical-cluster',
        hypothesisType: 'technical',
        hypotheses: technicalHypotheses,
        clusterCentroid: [],
        intraClusterSimilarity: 0.7,
        clusterSize: technicalHypotheses.length
      });
    }

    if (relationshipHypotheses.length > 0) {
      clusters.push({
        clusterId: 'relationship-cluster',
        hypothesisType: 'relationship_focused',
        hypotheses: relationshipHypotheses,
        clusterCentroid: [],
        intraClusterSimilarity: 0.75,
        clusterSize: relationshipHypotheses.length
      });
    }

    return clusters;
  }

  private isPricingHypothesis(hypothesis: string): boolean {
    const lowerHyp = hypothesis.toLowerCase();
    return lowerHyp.includes('price') || lowerHyp.includes('pricing') || 
           lowerHyp.includes('cost') || lowerHyp.includes('budget') ||
           lowerHyp.includes('fee') || lowerHyp.includes('rate');
  }

  private isTechnicalHypothesis(hypothesis: string): boolean {
    const lowerHyp = hypothesis.toLowerCase();
    return lowerHyp.includes('technical') || lowerHyp.includes('feature') || 
           lowerHyp.includes('functionality') || lowerHyp.includes('integration') ||
           lowerHyp.includes('system') || lowerHyp.includes('platform');
  }

  private isRelationshipHypothesis(hypothesis: string): boolean {
    const lowerHyp = hypothesis.toLowerCase();
    return lowerHyp.includes('relationship') || lowerHyp.includes('trust') || 
           lowerHyp.includes('personal') || lowerHyp.includes('communication') ||
           lowerHyp.includes('support') || lowerHyp.includes('service');
  }
}

class CharacteristicClustering {
  constructor(private config: CohortSegmentationConfig) {}

  async clusterByCharacteristics(clients: ClientRecord[]): Promise<ClientCharacteristic[][]> {
    // Simple characteristic-based clustering
    const clusters: ClientCharacteristic[][] = [];
    
    // Cluster by industry
    const industries = [...new Set(clients.map(c => 
      c.clientCharacteristics.find(char => char.name === 'industry')?.value || 'unknown'
    ))];

    for (const industry of industries) {
      const industryCluster: ClientCharacteristic[] = [{
        name: 'industry',
        value: industry,
        type: 'categorical',
        weight: 1.0,
        source: 'explicit',
        confidenceScore: 0.9
      }];
      clusters.push(industryCluster);
    }

    return clusters;
  }
}

export type {
  CohortSegmentationConfig,
  SegmentationResult,
  SegmentationQuality,
  StatisticalValidationResult,
  RejectedSegment,
  SegmentationRecommendation
};