/**
 * Journey Comparison Data Models
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Extended TypeScript interfaces for journey comparison analysis, content diff detection,
 * timing analysis, and statistical significance testing. Integrates with Epic 4 infrastructure.
 */

import {
  JourneySession,
  JourneyPageVisit,
  JourneyPageType,
  TimeAnalytics,
  StatisticalAnalysis
} from './journey-models';
import { ContentElements, ElementType } from './pattern-models';

// ============================================================================
// CORE JOURNEY COMPARISON INTERFACES
// ============================================================================

export type ComparisonType = 'content_focused' | 'timing_focused' | 'engagement_focused' | 'comprehensive';
export type ChangeType = 'text_change' | 'structural_change' | 'element_addition' | 'element_removal';
export type DiffCategory = 'headline' | 'pricing' | 'benefits' | 'features' | 'cta' | 'testimonials' | 'social_proof' | 'layout';
export type SignificanceLevel = 'high' | 'medium' | 'low' | 'none';

/**
 * Main journey comparison interface
 * Links successful and failed journeys for side-by-side analysis
 */
export interface JourneyComparison {
  id: string;
  successfulJourneyId: string;
  failedJourneyId: string;
  comparisonType: ComparisonType;
  successfulJourney: JourneySession;
  failedJourney: JourneySession;
  contentDifferences: ContentDiff[];
  timingDifferences: TimingDiff[];
  engagementDifferences: EngagementDiff[];
  hypothesisCorrelations: HypothesisCorrelation[];
  statisticalSignificance: ComparisonStatistics;
  confidenceScore: number; // 0-1, overall confidence in comparison validity
  comparisonMetadata: ComparisonMetadata;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * Enhanced content difference analysis
 * Extends Epic 4 ContentElementParser with comparison capabilities
 */
export interface ContentDiff {
  id: string;
  comparisonId: string;
  pageType: JourneyPageType;
  changeType: ChangeType;
  diffCategory: DiffCategory;
  successfulContent: ContentVersion;
  failedContent: ContentVersion;
  diffDetails: DiffDetail[];
  impactScore: number; // 0-1, how significant this difference is for conversion
  correlationStrength: number; // 0-1, correlation with successful outcome
  semanticSimilarity: number; // 0-1, semantic similarity score
  structuralSimilarity: number; // 0-1, structural layout similarity
  visualDiff: VisualDiffData;
  createdAt: Date;
}

/**
 * Detailed content version information
 * Links to existing content_versions table with enhanced analysis
 */
export interface ContentVersion {
  id: string;
  versionHash: string;
  contentElements: ContentElements;
  rawContent: string;
  structuralElements: StructuralElements;
  visualElements: VisualElements;
  performanceMetrics: ContentPerformanceMetrics;
  createdAt: Date;
}

/**
 * Granular diff detail for specific content changes
 */
export interface DiffDetail {
  changeId: string;
  elementType: ElementType;
  changeDescription: string;
  successfulValue: string | number | object;
  failedValue: string | number | object;
  changeIntensity: number; // 0-1, magnitude of change
  semanticImpact: number; // 0-1, semantic significance of change
  visualImpact: number; // 0-1, visual prominence of change
  positionInPage: number; // 0-1, relative position (0=top, 1=bottom)
  changeContext: string; // surrounding content context
}

/**
 * Timing and engagement differences
 * Extends Epic 4 TimeAnalytics with comparison analysis
 */
export interface TimingDiff {
  id: string;
  comparisonId: string;
  pageType: JourneyPageType;
  successfulTiming: TimingAnalysis;
  failedTiming: TimingAnalysis;
  timeDifferential: number; // seconds difference (successful - failed)
  engagementDifferential: number; // engagement score difference (0-1)
  interactionDifferential: number; // interaction count difference
  scrollDepthDifferential: number; // scroll depth percentage difference
  statisticalSignificance: TimingSignificance;
  confidenceInterval: [number, number]; // Wilson confidence interval
  effectSize: number; // Cohen's d for timing differences
  createdAt: Date;
}

/**
 * Enhanced timing analysis with statistical rigor
 */
export interface TimingAnalysis extends TimeAnalytics {
  entryTime: Date;
  exitTime?: Date;
  sessionDuration: number; // total time in journey
  pageSequence: number; // order in journey (1, 2, 3, 4)
  transitionTime?: number; // time to next page
  engagementEvents: EngagementEvent[];
  dropOffRisk: number; // 0-1 probability of drop-off at this point
}

/**
 * Engagement pattern differences
 */
export interface EngagementDiff {
  id: string;
  comparisonId: string;
  pageType: JourneyPageType;
  successfulEngagement: EngagementMetrics;
  failedEngagement: EngagementMetrics;
  engagementDifferential: number;
  interactionPatterns: InteractionPatternDiff[];
  attentionHeatmap: AttentionHeatmapDiff;
  statisticalSignificance: EngagementSignificance;
  createdAt: Date;
}

/**
 * Enhanced engagement metrics with detailed analysis
 */
export interface EngagementMetrics {
  overallScore: number; // 0-1 composite engagement score
  scrollDepth: number; // 0-100 percentage
  timeOnPage: number; // seconds
  interactionCount: number;
  clickEvents: ClickEvent[];
  scrollEvents: ScrollEvent[];
  focusEvents: FocusEvent[];
  mouseMovements: MouseMovementSummary;
  readingPattern: ReadingPatternAnalysis;
}

/**
 * Hypothesis outcome correlation analysis
 * Links to existing learning capture system
 */
export interface HypothesisCorrelation {
  id: string;
  comparisonId: string;
  successfulHypothesis: string;
  failedHypothesis: string;
  hypothesisDiff: HypothesisDiff;
  correlationStrength: number; // 0-1, Pearson correlation coefficient
  causalityScore: number; // 0-1, estimated causal relationship strength
  confidenceInterval: [number, number]; // Wilson confidence interval
  sampleSize: number;
  statisticalSignificance: number; // p-value
  outcomeData: OutcomeCorrelationData;
  validationMetrics: ValidationMetrics;
  createdAt: Date;
}

// ============================================================================
// STATISTICAL ANALYSIS INTERFACES
// ============================================================================

/**
 * Comprehensive statistical analysis for journey comparisons
 * Extends Epic 4 StatisticalAnalysis with comparison-specific methods
 */
export interface ComparisonStatistics extends StatisticalAnalysis {
  overallSignificance: number; // Combined p-value using Fisher's method
  timingSignificance: TimingSignificance;
  engagementSignificance: EngagementSignificance;
  contentSignificance: ContentSignificance;
  hypothesisSignificance: HypothesisSignificance;
  multipleTestingCorrection: MultipleTestingCorrection;
  effectSizes: EffectSizeAnalysis;
  confidenceLevel: SignificanceLevel;
  sampleSizeAnalysis: SampleSizeAnalysis;
  powerAnalysis: PowerAnalysis;
}

export interface TimingSignificance {
  pValue: number;
  tStatistic: number;
  degreesOfFreedom: number;
  effectSize: number; // Cohen's d
  confidenceInterval: [number, number];
  testType: 'welch_t_test' | 'mann_whitney_u' | 'paired_t_test';
  assumptions: AssumptionValidation;
}

export interface EngagementSignificance {
  pValue: number;
  zScore: number;
  effectSize: number;
  confidenceInterval: [number, number];
  testType: 'chi_square' | 'fisher_exact' | 'z_test';
  categoryAnalysis: CategorySignificance[];
}

export interface ContentSignificance {
  pValue: number;
  similarityScore: number;
  structuralSignificance: number;
  semanticSignificance: number;
  visualSignificance: number;
  elementSignificance: ElementSignificance[];
  overallContentEffect: number;
}

export interface HypothesisSignificance {
  pValue: number;
  correlationCoefficient: number;
  causalityEvidence: number;
  hypothesisConsistency: number;
  outcomeCorrelation: number;
  validationStrength: number;
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface ComparisonMetadata {
  analysisVersion: string;
  processingTime: number; // milliseconds
  dataQuality: DataQualityMetrics;
  algorithmConfig: AlgorithmConfiguration;
  validationResults: ValidationResults;
  performanceMetrics: ComparisonPerformanceMetrics;
}

export interface StructuralElements {
  pageLayout: string; // 'single-column' | 'multi-column' | 'grid' | 'custom'
  sectionCount: number;
  navigationElements: string[];
  formElements: FormElement[];
  mediaElements: MediaElement[];
  interactiveElements: InteractiveElement[];
}

export interface VisualElements {
  colorScheme: ColorScheme;
  typography: TypographyElements;
  spacing: SpacingElements;
  imageUsage: ImageUsage;
  visualHierarchy: VisualHierarchy;
}

export interface ContentPerformanceMetrics {
  readabilityScore: number; // 0-100, Flesch-Kincaid
  semanticComplexity: number; // 0-1
  emotionalTone: EmotionalToneAnalysis;
  persuasionFactors: PersuasionFactorAnalysis;
  trustSignals: TrustSignalAnalysis;
}

export interface VisualDiffData {
  pixelDifference: number; // 0-1, visual similarity
  layoutChanges: LayoutChange[];
  colorChanges: ColorChange[];
  typographyChanges: TypographyChange[];
  imageChanges: ImageChange[];
  prominenceChanges: ProminenceChange[];
}

export interface InteractionPatternDiff {
  patternType: 'click_sequence' | 'scroll_behavior' | 'focus_pattern' | 'hover_behavior';
  successfulPattern: InteractionPattern;
  failedPattern: InteractionPattern;
  patternSimilarity: number; // 0-1
  significanceScore: number; // 0-1
}

export interface AttentionHeatmapDiff {
  successfulHeatmap: AttentionHeatmap;
  failedHeatmap: AttentionHeatmap;
  attentionDivergence: number; // 0-1, Jensen-Shannon divergence
  focusPointDifferences: FocusPointDiff[];
  attentionFlowDifference: AttentionFlowDiff;
}

// ============================================================================
// EVENT AND INTERACTION INTERFACES
// ============================================================================

export interface EngagementEvent {
  id: string;
  eventType: 'click' | 'scroll' | 'focus' | 'hover' | 'selection' | 'form_interaction';
  timestamp: Date;
  elementId?: string;
  elementType?: string;
  position: { x: number; y: number };
  duration?: number; // for hover, focus events
  value?: string; // for form interactions
  context: EventContext;
}

export interface ClickEvent {
  elementId: string;
  elementType: string;
  position: { x: number; y: number };
  timestamp: Date;
  clickSequence: number;
  timeFromPageEntry: number;
  preceedingActions: string[];
}

export interface ScrollEvent {
  scrollPosition: number; // 0-100 percentage
  scrollSpeed: number; // pixels per second
  scrollDirection: 'up' | 'down';
  timestamp: Date;
  viewportHeight: number;
  contentHeight: number;
}

export interface FocusEvent {
  elementId: string;
  elementType: string;
  focusDuration: number;
  focusSequence: number;
  timestamp: Date;
  focusMethod: 'mouse' | 'keyboard' | 'programmatic';
}

// ============================================================================
// ANALYSIS RESULT INTERFACES
// ============================================================================

export interface JourneyComparisonResult {
  comparison: JourneyComparison;
  insights: ComparisonInsights;
  recommendations: ComparisonRecommendation[];
  confidence: ConfidenceAnalysis;
  processingMetrics: ProcessingMetrics;
}

export interface ComparisonInsights {
  primaryDifferentiators: Differentiator[];
  keySuccessFactors: SuccessFactor[];
  failureIndicators: FailureIndicator[];
  patternMatches: PatternMatch[];
  anomalies: ComparisonAnomaly[];
}

export interface Differentiator {
  type: 'content' | 'timing' | 'engagement' | 'hypothesis';
  description: string;
  impactScore: number; // 0-1
  confidenceScore: number; // 0-1
  statisticalSignificance: number; // p-value
  supportingEvidence: Evidence[];
}

export interface ComparisonRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'content_optimization' | 'timing_adjustment' | 'engagement_enhancement' | 'hypothesis_refinement';
  title: string;
  description: string;
  actionItems: ActionItem[];
  expectedImpact: number; // 0-1, expected conversion improvement
  implementationEffort: 'low' | 'medium' | 'high';
  confidenceScore: number; // 0-1
  basedOnEvidence: Evidence[];
  validationSuggestions: ValidationSuggestion[];
  createdAt: Date;
}

// ============================================================================
// SUPPORTING TYPE DEFINITIONS
// ============================================================================

export interface Evidence {
  type: 'statistical' | 'content_analysis' | 'behavioral' | 'historical';
  description: string;
  strength: number; // 0-1
  source: string;
  data: any;
}

export interface ActionItem {
  description: string;
  priority: number; // 1-10
  estimatedEffort: number; // hours
  dependencies: string[];
  acceptanceCriteria: string[];
}

export interface ValidationSuggestion {
  method: 'ab_test' | 'content_experiment' | 'timing_test' | 'user_study';
  description: string;
  expectedDuration: number; // days
  requiredSampleSize: number;
  successMetrics: string[];
}

// Helper types for complex nested structures
export interface HypothesisDiff {
  textSimilarity: number;
  conceptualSimilarity: number;
  strategicAlignment: number;
  implementationDifference: number;
  outcomeExpectationDiff: number;
}

export interface OutcomeCorrelationData {
  successfulOutcomes: OutcomeMetrics;
  failedOutcomes: OutcomeMetrics;
  correlationFactors: CorrelationFactor[];
  causalityIndicators: CausalityIndicator[];
}

export interface OutcomeMetrics {
  conversionRate: number;
  averageSessionDuration: number;
  engagementScore: number;
  dropOffRate: number;
  pageCompletionRates: Record<JourneyPageType, number>;
}

// ============================================================================
// DATABASE SCHEMA TYPES
// ============================================================================

export interface JourneyComparisonSchema {
  id: string;
  successful_journey_id: string;
  failed_journey_id: string;
  comparison_type: ComparisonType;
  confidence_score: number;
  statistical_significance: number;
  processing_time: number;
  metadata: string; // JSON
  created_at: Date;
  updated_at: Date;
}

export interface ContentDiffSchema {
  id: string;
  comparison_id: string;
  page_type: JourneyPageType;
  change_type: ChangeType;
  diff_category: DiffCategory;
  successful_content_id: string;
  failed_content_id: string;
  diff_details: string; // JSON
  impact_score: number;
  correlation_strength: number;
  semantic_similarity: number;
  structural_similarity: number;
  visual_diff_data: string; // JSON
  created_at: Date;
}

export interface HypothesisCorrelationSchema {
  id: string;
  comparison_id: string;
  successful_hypothesis: string;
  failed_hypothesis: string;
  correlation_strength: number;
  causality_score: number;
  confidence_interval_lower: number;
  confidence_interval_upper: number;
  sample_size: number;
  statistical_significance: number;
  outcome_data: string; // JSON
  validation_metrics: string; // JSON
  created_at: Date;
}

// ============================================================================
// UTILITY FUNCTIONS AND TYPE GUARDS
// ============================================================================

export function isValidJourneyComparison(obj: any): obj is JourneyComparison {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.successfulJourneyId === 'string' &&
    typeof obj.failedJourneyId === 'string' &&
    typeof obj.confidenceScore === 'number' &&
    obj.confidenceScore >= 0 && obj.confidenceScore <= 1 &&
    Array.isArray(obj.contentDifferences) &&
    Array.isArray(obj.timingDifferences) &&
    Array.isArray(obj.engagementDifferences) &&
    Array.isArray(obj.hypothesisCorrelations);
}

export function isContentDiff(obj: any): obj is ContentDiff {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.comparisonId === 'string' &&
    typeof obj.impactScore === 'number' &&
    typeof obj.correlationStrength === 'number' &&
    obj.impactScore >= 0 && obj.impactScore <= 1 &&
    obj.correlationStrength >= 0 && obj.correlationStrength <= 1;
}

export function isSignificantDifference(significance: number, threshold: number = 0.05): boolean {
  return significance < threshold;
}

export function getSignificanceLevel(pValue: number): SignificanceLevel {
  if (pValue < 0.01) return 'high';
  if (pValue < 0.05) return 'medium';  
  if (pValue < 0.1) return 'low';
  return 'none';
}

// Export all types for external use
export type {
  ComparisonType,
  ChangeType,
  DiffCategory,
  SignificanceLevel
};