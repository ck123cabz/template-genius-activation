/**
 * Cohort Analysis Data Models
 * Epic 5, Story 5.2: Cohort Analysis by Hypothesis Type
 * 
 * Comprehensive TypeScript interfaces for cohort segmentation, effectiveness scoring,
 * and predictive modeling. Builds upon Story 5.1's statistical analysis infrastructure.
 */

/**
 * Core cohort definition with hypothesis-based segmentation
 */
export interface CohortDefinition {
  id: string;
  name: string;
  hypothesisType: 'pricing' | 'technical' | 'relationship_focused' | 'hybrid';
  createdAt: Date;
  updatedAt: Date;
  segmentationCriteria: SegmentationCriteria;
  clientCount: number;
  conversionMetrics: CohortConversionMetrics;
  effectivenessScore: number;
  confidenceInterval: [number, number];
  retentionCurve: RetentionDataPoint[];
  lifetimeValueProjection: LifetimeValueData;
  
  // Statistical metadata
  statisticalSignificance: number; // p-value
  sampleSizeAdequacy: 'insufficient' | 'adequate' | 'excellent';
  confidenceLevel: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Segmentation criteria for cohort definition
 */
export interface SegmentationCriteria {
  hypothesisCategories: string[];
  industryTypes?: string[];
  clientCharacteristics: ClientCharacteristic[];
  timeRange: DateRange;
  minimumSampleSize: number;
  
  // Advanced filtering
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  geographicRegion?: string;
  previousExperience?: 'none' | 'basic' | 'advanced';
  urgencyLevel?: 'low' | 'medium' | 'high';
  budgetRange?: 'low' | 'medium' | 'high' | 'premium';
}

/**
 * Client characteristics for segmentation
 */
export interface ClientCharacteristic {
  name: string;
  value: string | number | boolean;
  type: 'categorical' | 'numerical' | 'boolean';
  weight: number; // 0-1 importance in segmentation
  source: 'explicit' | 'inferred' | 'behavioral';
  confidenceScore: number; // 0-1 confidence in this characteristic
}

/**
 * Date range specification
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
  inclusive: boolean;
}

/**
 * Cohort conversion metrics with time progression
 */
export interface CohortConversionMetrics {
  totalClients: number;
  convertedClients: number;
  conversionRate: number;
  averageTimeToConversion: number; // in days
  conversionByTimeStage: TimeStageConversion[];
  statisticalSignificance: number; // p-value
  confidenceLevel: 'high' | 'medium' | 'low';
  
  // Advanced metrics
  conversionVelocity: number; // conversions per day
  conversionAcceleration: number; // change in velocity over time
  benchmarkComparison: BenchmarkComparison;
}

/**
 * Time-staged conversion analysis
 */
export interface TimeStageConversion {
  timeStage: '7days' | '14days' | '30days' | '60days' | '90days' | '180days';
  cumulativeConversionRate: number;
  incrementalConversionRate: number;
  clientsConverted: number;
  confidenceInterval: [number, number];
  
  // Trend analysis
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number; // 0-1
  seasonalityFactor: number; // 0-1
}

/**
 * Benchmark comparison data
 */
export interface BenchmarkComparison {
  industryBenchmark: number;
  historicalBenchmark: number;
  peerCohortBenchmark: number;
  relativePerformance: 'above' | 'at' | 'below';
  percentilRank: number; // 0-100
}

/**
 * Hypothesis effectiveness scoring
 */
export interface HypothesisEffectiveness {
  hypothesisId: string;
  hypothesisType: string;
  clientSegment: string;
  industryType?: string;
  effectivenessScore: number; // 0-1 scale
  conversionRate: number;
  averageTimeToConvert: number;
  clientSatisfactionScore?: number;
  retentionRate: number;
  lifetimeValue: number;
  sampleSize: number;
  confidenceInterval: [number, number];
  statisticalSignificance: number;
  ranking: number; // relative to other hypothesis types
  
  // Multi-dimensional scoring breakdown
  scoringDimensions: EffectivenessDimensions;
  
  // Predictive insights
  successProbability: number; // 0-1
  riskFactors: RiskFactor[];
  optimizationOpportunities: OptimizationOpportunity[];
}

/**
 * Multi-dimensional effectiveness scoring
 */
export interface EffectivenessDimensions {
  conversionEffectiveness: number; // 0-1
  timeEfficiency: number; // 0-1
  retentionStrength: number; // 0-1
  lifetimeValueImpact: number; // 0-1
  consistencyScore: number; // 0-1 across different contexts
  scalabilityScore: number; // 0-1 potential for scaling
}

/**
 * Risk factors for hypothesis effectiveness
 */
export interface RiskFactor {
  factor: string;
  riskLevel: 'low' | 'medium' | 'high';
  impact: number; // 0-1
  probability: number; // 0-1
  mitigationStrategies: string[];
}

/**
 * Optimization opportunities
 */
export interface OptimizationOpportunity {
  opportunity: string;
  potentialImpact: number; // 0-1
  effortRequired: 'low' | 'medium' | 'high';
  timeToImplement: number; // days
  confidenceLevel: number; // 0-1
  prerequisites: string[];
}

/**
 * Predictive model configuration
 */
export interface PredictiveModel {
  modelId: string;
  modelType: 'hypothesis_success' | 'conversion_probability' | 'retention_risk' | 'lifetime_value';
  clientCharacteristics: string[]; // features used in model
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  featureImportance: FeatureImportance[];
  trainingData: ModelTrainingData;
  validationResults: ModelValidationResults;
  lastUpdated: Date;
  
  // Model metadata
  algorithmType: 'logistic_regression' | 'random_forest' | 'gradient_boosting' | 'neural_network';
  hyperparameters: Record<string, any>;
  crossValidationScores: number[];
  
  // Performance tracking
  realWorldPerformance: RealWorldPerformance;
  modelDrift: ModelDrift;
}

/**
 * Feature importance analysis
 */
export interface FeatureImportance {
  featureName: string;
  importance: number; // 0-1
  confidenceInterval: [number, number];
  featureType: 'demographic' | 'behavioral' | 'temporal' | 'contextual';
  interpretability: string; // Human-readable explanation
}

/**
 * Model training data structure
 */
export interface ModelTrainingData {
  clients: ClientRecord[];
  features: FeatureVector[];
  outcomes: OutcomeVector[];
  trainingSize: number;
  validationSize: number;
  testSize: number;
  dataQuality: DataQuality;
  featureEngineering: FeatureEngineering;
}

/**
 * Feature vector for ML model
 */
export interface FeatureVector {
  clientId: string;
  features: Record<string, number | string | boolean>;
  featureHash: string; // For feature versioning
  extractedAt: Date;
}

/**
 * Outcome vector for ML model
 */
export interface OutcomeVector {
  clientId: string;
  outcome: boolean; // success/failure
  outcomeValue?: number; // regression target
  outcomeTimestamp: Date;
  contextualFactors: Record<string, any>;
}

/**
 * Data quality assessment
 */
export interface DataQuality {
  completenessScore: number; // 0-1
  accuracyScore: number; // 0-1
  consistencyScore: number; // 0-1
  timelinessScore: number; // 0-1
  missingDataPercentage: number;
  outlierPercentage: number;
  dataValidationErrors: string[];
}

/**
 * Feature engineering metadata
 */
export interface FeatureEngineering {
  transformations: FeatureTransformation[];
  scalingMethods: ScalingMethod[];
  dimensionalityReduction?: DimensionalityReduction;
  featureSelection: FeatureSelection;
}

/**
 * Feature transformation details
 */
export interface FeatureTransformation {
  featureName: string;
  transformationType: 'normalization' | 'standardization' | 'log' | 'categorical_encoding' | 'binning';
  parameters: Record<string, any>;
  reversible: boolean;
}

/**
 * Scaling method configuration
 */
export interface ScalingMethod {
  methodType: 'min_max' | 'standard' | 'robust' | 'quantile';
  appliedFeatures: string[];
  parameters: Record<string, any>;
}

/**
 * Dimensionality reduction configuration
 */
export interface DimensionalityReduction {
  method: 'pca' | 'lda' | 'tsne' | 'umap';
  originalDimensions: number;
  reducedDimensions: number;
  varianceExplained: number; // 0-1
  components: Component[];
}

/**
 * Principal component or similar
 */
export interface Component {
  componentId: string;
  varianceExplained: number;
  loadings: Record<string, number>; // Feature loadings
  interpretation: string;
}

/**
 * Feature selection methodology
 */
export interface FeatureSelection {
  method: 'correlation' | 'mutual_information' | 'chi_square' | 'recursive_elimination';
  selectedFeatures: string[];
  featureScores: Record<string, number>;
  selectionThreshold: number;
}

/**
 * Model validation results
 */
export interface ModelValidationResults {
  crossValidationScores: ValidationScore[];
  holdoutTestResults: TestResults;
  temporalValidation: TemporalValidation;
  fairnessMetrics: FairnessMetrics;
  robustnessTests: RobustnessTest[];
}

/**
 * Cross-validation score details
 */
export interface ValidationScore {
  fold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  logLoss: number;
}

/**
 * Holdout test results
 */
export interface TestResults {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  rocCurve: ROCPoint[];
  precisionRecallCurve: PRPoint[];
  calibrationCurve: CalibrationPoint[];
}

/**
 * ROC curve point
 */
export interface ROCPoint {
  falsePositiveRate: number;
  truePositiveRate: number;
  threshold: number;
}

/**
 * Precision-Recall curve point
 */
export interface PRPoint {
  recall: number;
  precision: number;
  threshold: number;
}

/**
 * Calibration curve point
 */
export interface CalibrationPoint {
  meanPredictedProbability: number;
  fractionOfPositives: number;
  binCount: number;
}

/**
 * Temporal validation for time-based data
 */
export interface TemporalValidation {
  timeSeriesSplit: TimeSeriesSplit[];
  temporalStability: number; // 0-1
  conceptDriftDetection: ConceptDriftResult;
  forecastAccuracy: ForecastAccuracy;
}

/**
 * Time series split for validation
 */
export interface TimeSeriesSplit {
  splitId: string;
  trainStartDate: Date;
  trainEndDate: Date;
  testStartDate: Date;
  testEndDate: Date;
  performance: ValidationScore;
}

/**
 * Concept drift detection results
 */
export interface ConceptDriftResult {
  driftDetected: boolean;
  driftType: 'gradual' | 'sudden' | 'none';
  driftMagnitude: number; // 0-1
  affectedFeatures: string[];
  detectionMethod: string;
  confidence: number; // 0-1
}

/**
 * Forecast accuracy metrics
 */
export interface ForecastAccuracy {
  mae: number; // Mean Absolute Error
  mse: number; // Mean Squared Error
  rmse: number; // Root Mean Squared Error
  mape: number; // Mean Absolute Percentage Error
  smape: number; // Symmetric Mean Absolute Percentage Error
}

/**
 * Fairness metrics for model bias detection
 */
export interface FairnessMetrics {
  demographicParity: number;
  equalizedOdds: number;
  equalOpportunity: number;
  calibrationByGroup: Record<string, number>;
  disparateImpact: number;
  biasDetected: boolean;
  affectedGroups: string[];
}

/**
 * Robustness test results
 */
export interface RobustnessTest {
  testType: 'adversarial' | 'noise_injection' | 'feature_perturbation' | 'outlier_injection';
  perturbationLevel: number;
  performanceDegradation: number; // 0-1
  robustnessScore: number; // 0-1
  vulnerableFeatures: string[];
}

/**
 * Real-world performance tracking
 */
export interface RealWorldPerformance {
  deploymentDate: Date;
  realWorldAccuracy: number;
  predictionVolume: number;
  averageResponseTime: number; // milliseconds
  errorRate: number;
  userFeedback: UserFeedback[];
  businessImpact: BusinessImpact;
}

/**
 * User feedback on predictions
 */
export interface UserFeedback {
  feedbackId: string;
  predictionId: string;
  actualOutcome: boolean;
  feedbackType: 'correction' | 'validation' | 'clarification';
  feedbackText?: string;
  feedbackDate: Date;
  userConfidence: number; // 0-1
}

/**
 * Business impact measurement
 */
export interface BusinessImpact {
  revenueImpact: number;
  conversionRateImprovement: number;
  costSavings: number;
  timeToDecisionImprovement: number; // days
  userSatisfactionScore: number; // 0-10
  adoptionRate: number; // 0-1
}

/**
 * Model drift detection
 */
export interface ModelDrift {
  dataDrift: DataDriftMetrics;
  conceptDrift: ConceptDriftMetrics;
  performanceDrift: PerformanceDriftMetrics;
  overallDriftScore: number; // 0-1
  retrainingRecommended: boolean;
  lastDriftCheck: Date;
}

/**
 * Data drift metrics
 */
export interface DataDriftMetrics {
  featureDrifts: FeatureDrift[];
  overallDataDrift: number; // 0-1
  significantDrifts: number;
  driftDirection: 'positive' | 'negative' | 'mixed';
}

/**
 * Individual feature drift
 */
export interface FeatureDrift {
  featureName: string;
  driftMagnitude: number; // 0-1
  driftType: 'mean_shift' | 'variance_shift' | 'distribution_shift';
  statisticalTest: string;
  pValue: number;
  effectSize: number;
}

/**
 * Concept drift metrics
 */
export interface ConceptDriftMetrics {
  conceptChangeDetected: boolean;
  changePoint?: Date;
  beforePerformance: number;
  afterPerformance: number;
  performanceChange: number;
  adaptationRequired: boolean;
}

/**
 * Performance drift metrics
 */
export interface PerformanceDriftMetrics {
  accuracyDrift: number;
  precisionDrift: number;
  recallDrift: number;
  f1Drift: number;
  overallPerformanceDrift: number;
  performanceStability: number; // 0-1
}

/**
 * Client prediction with comprehensive analysis
 */
export interface ClientPrediction {
  clientId: string;
  predictionId: string;
  predictedOutcome: boolean;
  confidenceScore: number; // 0-1 probability
  contributingFactors: PredictionFactor[];
  recommendedHypothesis: string;
  alternativeHypotheses: AlternativeHypothesis[];
  uncertaintyQuantification: UncertaintyMeasures;
  
  // Prediction metadata
  modelVersion: string;
  predictionTimestamp: Date;
  contextualFactors: Record<string, any>;
  predictionExplanation: PredictionExplanation;
  
  // Business recommendations
  actionRecommendations: ActionRecommendation[];
  riskAssessment: PredictionRiskAssessment;
}

/**
 * Prediction factor contribution
 */
export interface PredictionFactor {
  factorName: string;
  contribution: number; // -1 to 1 (negative reduces probability, positive increases)
  importance: number; // 0-1
  confidence: number; // 0-1
  factorType: 'demographic' | 'behavioral' | 'temporal' | 'contextual';
  humanInterpretation: string;
}

/**
 * Alternative hypothesis recommendation
 */
export interface AlternativeHypothesis {
  hypothesis: string;
  successProbability: number;
  confidenceScore: number;
  rationale: string;
  tradeoffs: string[];
  implementationComplexity: 'low' | 'medium' | 'high';
}

/**
 * Uncertainty quantification
 */
export interface UncertaintyMeasures {
  epistemic: number; // Model uncertainty (0-1)
  aleatoric: number; // Data uncertainty (0-1)
  total: number; // Combined uncertainty (0-1)
  confidenceBounds: [number, number];
  predictionInterval: [number, number];
  uncertaintySources: UncertaintySource[];
}

/**
 * Sources of uncertainty in prediction
 */
export interface UncertaintySource {
  source: string;
  type: 'epistemic' | 'aleatoric';
  magnitude: number; // 0-1
  description: string;
  mitigation: string[];
}

/**
 * Prediction explanation for interpretability
 */
export interface PredictionExplanation {
  globalExplanation: string; // Overall model behavior
  localExplanation: string; // This specific prediction
  featureImportances: Record<string, number>;
  shapeValues: Record<string, number>; // SHAP values
  counterfactualExamples: CounterfactualExample[];
  visualExplanations: VisualExplanation[];
}

/**
 * Counterfactual example for explanation
 */
export interface CounterfactualExample {
  description: string;
  changedFeatures: Record<string, any>;
  resultingProbability: number;
  feasibility: number; // 0-1
  actionability: number; // 0-1
}

/**
 * Visual explanation component
 */
export interface VisualExplanation {
  type: 'feature_importance' | 'partial_dependence' | 'shap_waterfall' | 'lime_explanation';
  imageUrl?: string;
  svgContent?: string;
  interactiveConfig?: Record<string, any>;
  description: string;
}

/**
 * Action recommendation based on prediction
 */
export interface ActionRecommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: number; // 0-1
  confidence: number; // 0-1
  timeline: string;
  resources: string[];
  successMetrics: string[];
  riskMitigation: string[];
}

/**
 * Risk assessment for prediction
 */
export interface PredictionRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: PredictionRiskFactor[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
  monitoringRecommendations: string[];
}

/**
 * Individual prediction risk factor
 */
export interface PredictionRiskFactor {
  factor: string;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number; // 0-1
  impact: number; // 0-1
  mitigation: string[];
}

/**
 * Retention data point for cohort analysis
 */
export interface RetentionDataPoint {
  timePoint: string; // '30days', '60days', '90days', etc.
  retainedClients: number;
  totalClients: number;
  retentionRate: number;
  confidenceInterval: [number, number];
  churnReasons: ChurnReason[];
  retentionDrivers: RetentionDriver[];
}

/**
 * Churn reason analysis
 */
export interface ChurnReason {
  reason: string;
  frequency: number;
  impact: number; // 0-1
  preventability: number; // 0-1
  category: 'product' | 'pricing' | 'support' | 'competition' | 'timing';
}

/**
 * Retention driver analysis
 */
export interface RetentionDriver {
  driver: string;
  effectiveness: number; // 0-1
  frequency: number;
  category: 'engagement' | 'value_delivery' | 'relationship' | 'product_fit';
  scalability: number; // 0-1
}

/**
 * Lifetime value projection
 */
export interface LifetimeValueData {
  projectedValue: number;
  projectionPeriod: number; // months
  confidenceInterval: [number, number];
  valueDrivers: ValueDriver[];
  riskFactors: LTVRiskFactor[];
  
  // Detailed projections
  monthlyProjections: MonthlyValueProjection[];
  churnProbability: ChurnProbabilityProject ion[];
  upsellProbability: UpsellProbability[];
}

/**
 * Value driver for LTV calculation
 */
export interface ValueDriver {
  driver: string;
  valueContribution: number;
  probability: number; // 0-1
  timeline: string;
  dependencies: string[];
}

/**
 * LTV-specific risk factor
 */
export interface LTVRiskFactor {
  factor: string;
  impact: number; // negative value impact
  probability: number; // 0-1
  timeline: string;
  mitigation: string[];
}

/**
 * Monthly value projection
 */
export interface MonthlyValueProjection {
  month: number;
  projectedValue: number;
  confidenceInterval: [number, number];
  cumulativeValue: number;
  riskAdjustedValue: number;
}

/**
 * Churn probability over time
 */
export interface ChurnProbabilityProjection {
  timePoint: string;
  churnProbability: number;
  confidenceInterval: [number, number];
  riskFactors: string[];
  preventionStrategies: string[];
}

/**
 * Upsell probability analysis
 */
export interface UpsellProbability {
  timePoint: string;
  upsellProbability: number;
  projectedUpsellValue: number;
  confidenceInterval: [number, number];
  triggers: string[];
  barriers: string[];
}

/**
 * Client record for cohort analysis
 */
export interface ClientRecord {
  id: string;
  company: string;
  contact: string;
  email: string;
  
  // Journey data
  activationToken: string;
  currentVersionId?: string;
  status: 'pending' | 'active' | 'paid' | 'failed';
  conversionStatus: 'converted' | 'in_progress' | 'dropped_off';
  
  // Cohort assignment
  cohortMemberships: CohortMembership[];
  clientCharacteristics: ClientCharacteristic[];
  
  // Performance metrics
  conversionDate?: Date;
  timeToConversion?: number; // days
  lifetimeValue: number;
  retentionStatus: 'retained' | 'churned' | 'at_risk';
  
  // Temporal data
  createdAt: Date;
  lastActivityAt: Date;
  
  // Context
  hypothesesTested: string[];
  contentVersionsExperienced: string[];
  journeySessions: string[]; // References to JourneySession records
}

/**
 * Cohort membership tracking
 */
export interface CohortMembership {
  cohortId: string;
  assignedAt: Date;
  assignmentReason: string;
  active: boolean;
  membershipMetadata: Record<string, any>;
}

/**
 * Export all interfaces for use throughout the application
 */
export type {
  // Core cohort types
  CohortDefinition,
  SegmentationCriteria,
  ClientCharacteristic,
  DateRange,
  
  // Conversion metrics
  CohortConversionMetrics,
  TimeStageConversion,
  BenchmarkComparison,
  
  // Effectiveness scoring
  HypothesisEffectiveness,
  EffectivenessDimensions,
  RiskFactor,
  OptimizationOpportunity,
  
  // Predictive modeling
  PredictiveModel,
  FeatureImportance,
  ModelTrainingData,
  FeatureVector,
  OutcomeVector,
  DataQuality,
  FeatureEngineering,
  
  // Model validation
  ModelValidationResults,
  ValidationScore,
  TestResults,
  ROCPoint,
  PRPoint,
  CalibrationPoint,
  TemporalValidation,
  FairnessMetrics,
  
  // Predictions
  ClientPrediction,
  PredictionFactor,
  AlternativeHypothesis,
  UncertaintyMeasures,
  PredictionExplanation,
  ActionRecommendation,
  
  // Retention and LTV
  RetentionDataPoint,
  ChurnReason,
  RetentionDriver,
  LifetimeValueData,
  ValueDriver,
  LTVRiskFactor,
  
  // Drift and performance
  ModelDrift,
  DataDriftMetrics,
  ConceptDriftMetrics,
  RealWorldPerformance,
  BusinessImpact,
  
  // Client records
  ClientRecord,
  CohortMembership
};