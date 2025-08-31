/**
 * Pattern Recognition Data Models
 * Epic 4, Story 4.1: Success Pattern Identification
 * 
 * Comprehensive TypeScript interfaces and types for the pattern recognition system.
 * These models align with the database schema and provide type safety across the application.
 */

// Base pattern types
export type PatternType = 'hypothesis' | 'content-element' | 'timing' | 'mixed';
export type ElementType = 'headline' | 'pricing' | 'benefit' | 'feature' | 'cta' | 'testimonial' | 'social-proof';
export type RecommendationType = 'content' | 'hypothesis' | 'ab-test' | 'timing-optimization';
export type TrendIndicator = 'improving' | 'declining' | 'stable';
export type JobType = 'pattern-detection' | 'confidence-recalc' | 'recommendation-generation' | 'similarity-analysis';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SimilarityType = 'content' | 'hypothesis' | 'outcome' | 'timing';

// Content element analysis interfaces
export interface ContentElements {
  headline?: string;
  pricing?: {
    amount: number;
    currency: string;
    presentation: string; // "$500", "500 USD", etc.
  };
  benefits?: string[];
  features?: string[];
  callToActions?: string[];
  testimonials?: string[];
  socialProof?: string[];
}

export interface TimingFactors {
  avgTimeToPayment: number; // in minutes
  engagementDuration: number; // in minutes
  pageViews: number;
  interactionEvents: number;
}

export interface ContextFactors {
  clientIndustry?: string;
  contentVariation?: string;
  seasonality?: string;
  marketConditions?: string;
  clientSize?: 'startup' | 'small' | 'medium' | 'enterprise';
}

// Core pattern data structure
export interface PatternData {
  hypothesis?: string;
  contentElements?: ContentElements;
  timingFactors?: TimingFactors;
  contextFactors?: ContextFactors;
  metadata?: {
    sourceClientIds?: string[];
    originalHypotheses?: string[];
    contentVersionIds?: string[];
    averageConversionTime?: number;
  };
}

// Main success pattern interface
export interface SuccessPattern {
  id: string;
  patternType: PatternType;
  patternData: PatternData;
  confidenceScore: number; // 0-1 based on sample size and consistency
  sampleSize: number; // Number of successful outcomes
  successRate: number; // Success percentage for this pattern (0-1)
  statisticalSignificance: number; // P-value for pattern validity
  identifiedAt: Date;
  lastValidated: Date;
  isActive: boolean;
}

// Pattern element tracking
export interface PatternElement {
  id: string;
  patternId: string;
  elementType: ElementType;
  elementContent: string;
  elementHash: string; // SHA-256 hash for similarity matching
  successCount: number;
  totalCount: number;
  successRate: number; // Calculated field
  firstSeen: Date;
  lastUpdated: Date;
}

// Element performance analysis
export interface ElementPerformance {
  elementType: ElementType;
  elementContent: string;
  successRate: number;
  confidence: number;
  sampleSize: number;
  trend: TrendIndicator;
  similarElements?: string[]; // Related high-performing elements
}

// Pattern recommendation interface
export interface PatternRecommendation {
  id: string;
  patternId: string;
  recommendationType: RecommendationType;
  recommendationData: RecommendationData;
  confidenceScore: number;
  expectedImprovement?: number; // Expected conversion improvement (0-1)
  priorityScore: number; // 1-10, higher = more important
  targetClientSegments?: string[]; // Applicable client types/industries
  validationData?: ValidationData;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  usageCount: number;
  successCount: number;
}

export interface RecommendationData {
  title: string;
  description: string;
  implementation: {
    type: 'content-change' | 'hypothesis-test' | 'timing-adjustment' | 'ab-test-setup';
    specifics: any; // Type varies by recommendation type
  };
  expectedOutcome: string;
  confidenceFactors: string[];
}

export interface ValidationData {
  abTestResults?: {
    testId: string;
    conversionLift: number;
    statisticalSignificance: number;
    testDuration: number; // in days
  };
  manualValidation?: {
    validatedBy: string;
    validatedAt: Date;
    actualImprovement: number;
    notes: string;
  };
}

// Analytics and tracking
export interface PatternAnalytics {
  id: string;
  patternId: string;
  analyticsDate: Date;
  dailySuccessCount: number;
  dailyTotalCount: number;
  dailySuccessRate: number; // Calculated field
  confidenceScore: number;
  trendIndicator: TrendIndicator;
  createdAt: Date;
}

export interface PatternSimilarity {
  id: string;
  patternId1: string;
  patternId2: string;
  similarityScore: number; // 0-1
  similarityType: SimilarityType;
  calculatedAt: Date;
}

// Background processing
export interface PatternProcessingJob {
  id: string;
  jobType: JobType;
  jobData: ProcessingJobData;
  priority: number; // 1-10
  status: JobStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
}

export interface ProcessingJobData {
  clientId?: string;
  patternId?: string;
  outcomeData?: any;
  parameters?: {
    minSampleSize?: number;
    confidenceThreshold?: number;
    analysisDepth?: 'basic' | 'standard' | 'comprehensive';
  };
}

// Content similarity analysis
export interface ContentSimilarity {
  contentId1: string;
  contentId2: string;
  similarityScore: number;
  similarityFactors: {
    headlineSimilarity: number;
    structuralSimilarity: number;
    semanticSimilarity: number;
  };
}

// Pattern detection results
export interface PatternDetectionResult {
  patterns: SuccessPattern[];
  confidenceMetrics: {
    averageConfidence: number;
    highConfidencePatterns: number;
    totalPatterns: number;
  };
  recommendations: PatternRecommendation[];
  processingTime: number; // in milliseconds
  analysisMetadata: {
    samplesAnalyzed: number;
    clustersIdentified: number;
    statisticalTests: number;
  };
}

// Statistical analysis types
export interface StatisticalAnalysis {
  pValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  effectSize: number;
  sampleSize: number;
  powerAnalysis: {
    power: number;
    recommendedSampleSize: number;
  };
}

export interface ConfidenceCalculation {
  sampleSizeWeight: number; // Based on number of samples
  successRateWeight: number; // Based on success percentage
  consistencyWeight: number; // Based on variation in outcomes
  temporalWeight: number; // Based on recency and trend
  finalConfidence: number; // Weighted combination (0-1)
  factors: {
    sampleSize: number;
    successRate: number;
    consistency: number;
    recency: number;
  };
}

// API response types
export interface PatternAnalysisResponse {
  success: boolean;
  data?: PatternDetectionResult;
  error?: string;
  processingTime: number;
  cacheHit?: boolean;
}

export interface RecommendationResponse {
  success: boolean;
  recommendations: PatternRecommendation[];
  totalCount: number;
  filteredBy?: {
    confidenceThreshold?: number;
    clientSegment?: string;
    recommendationType?: RecommendationType;
  };
}

// Helper functions for type guards
export function isSuccessPattern(obj: any): obj is SuccessPattern {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.confidenceScore === 'number' &&
    typeof obj.successRate === 'number' &&
    obj.confidenceScore >= 0 && obj.confidenceScore <= 1 &&
    obj.successRate >= 0 && obj.successRate <= 1;
}

export function isPatternRecommendation(obj: any): obj is PatternRecommendation {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.patternId === 'string' &&
    typeof obj.confidenceScore === 'number' &&
    obj.confidenceScore >= 0 && obj.confidenceScore <= 1;
}

// Pattern confidence calculation functions
export function calculatePatternConfidence(
  successCount: number,
  totalAttempts: number,
  consistencyScore: number,
  recencyFactor: number = 1.0
): ConfidenceCalculation {
  // Sample size weight (more samples = higher confidence, max at 20 samples)
  const sampleSizeWeight = Math.min(successCount / 20, 1.0);
  
  // Success rate weight (higher success rate = higher confidence)
  const successRateWeight = successCount / totalAttempts;
  
  // Consistency weight (less variation in outcomes = higher confidence)
  const consistencyWeight = consistencyScore; // 0-1, provided by caller
  
  // Temporal weight (more recent patterns = higher confidence)
  const temporalWeight = recencyFactor; // 0-1, based on pattern age
  
  // Weighted combination (can be tuned based on business needs)
  const finalConfidence = (
    sampleSizeWeight * 0.3 + 
    successRateWeight * 0.3 + 
    consistencyWeight * 0.2 + 
    temporalWeight * 0.2
  );
  
  return {
    sampleSizeWeight,
    successRateWeight,
    consistencyWeight,
    temporalWeight,
    finalConfidence: Math.min(finalConfidence, 1.0),
    factors: {
      sampleSize: successCount,
      successRate: successRateWeight,
      consistency: consistencyScore,
      recency: recencyFactor
    }
  };
}

// Pattern similarity calculation
export function calculatePatternSimilarity(
  pattern1: SuccessPattern,
  pattern2: SuccessPattern,
  type: SimilarityType = 'content'
): number {
  switch (type) {
    case 'content':
      return calculateContentSimilarity(
        pattern1.patternData.contentElements,
        pattern2.patternData.contentElements
      );
    case 'hypothesis':
      return calculateHypothesisSimilarity(
        pattern1.patternData.hypothesis,
        pattern2.patternData.hypothesis
      );
    case 'outcome':
      return Math.abs(pattern1.successRate - pattern2.successRate) < 0.1 ? 0.8 : 0.2;
    case 'timing':
      return calculateTimingSimilarity(
        pattern1.patternData.timingFactors,
        pattern2.patternData.timingFactors
      );
    default:
      return 0;
  }
}

function calculateContentSimilarity(
  content1?: ContentElements,
  content2?: ContentElements
): number {
  if (!content1 || !content2) return 0;
  
  let similaritySum = 0;
  let comparisonCount = 0;
  
  // Compare headlines
  if (content1.headline && content2.headline) {
    similaritySum += calculateStringSimilarity(content1.headline, content2.headline);
    comparisonCount++;
  }
  
  // Compare benefits arrays
  if (content1.benefits && content2.benefits) {
    similaritySum += calculateArraySimilarity(content1.benefits, content2.benefits);
    comparisonCount++;
  }
  
  // Compare features arrays
  if (content1.features && content2.features) {
    similaritySum += calculateArraySimilarity(content1.features, content2.features);
    comparisonCount++;
  }
  
  return comparisonCount > 0 ? similaritySum / comparisonCount : 0;
}

function calculateHypothesisSimilarity(
  hypothesis1?: string,
  hypothesis2?: string
): number {
  if (!hypothesis1 || !hypothesis2) return 0;
  return calculateStringSimilarity(hypothesis1, hypothesis2);
}

function calculateTimingSimilarity(
  timing1?: TimingFactors,
  timing2?: TimingFactors
): number {
  if (!timing1 || !timing2) return 0;
  
  const timeDiff = Math.abs(timing1.avgTimeToPayment - timing2.avgTimeToPayment);
  const maxTime = Math.max(timing1.avgTimeToPayment, timing2.avgTimeToPayment);
  
  // Similarity decreases as time difference increases
  return maxTime > 0 ? Math.max(0, 1 - (timeDiff / maxTime)) : 1;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  // Simple Jaccard similarity for demonstration
  // In production, consider using more sophisticated NLP similarity measures
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Export types for external use
export type {
  PatternType,
  ElementType,
  RecommendationType,
  TrendIndicator,
  JobType,
  JobStatus,
  SimilarityType
};