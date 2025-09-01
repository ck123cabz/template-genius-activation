/**
 * Journey Analytics Data Models
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * TypeScript interfaces for journey tracking, session management, and drop-off pattern analysis.
 */

export interface JourneySession {
  id: string;
  clientId: string;
  sessionStart: Date;
  sessionEnd?: Date;
  totalDuration: number; // in seconds
  pageVisits: JourneyPageVisit[];
  finalOutcome: 'completed' | 'dropped_off' | 'in_progress';
  exitPoint?: string; // Last page before drop-off
  exitTrigger?: 'time_based' | 'content_based' | 'technical' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyPageVisit {
  id: string;
  sessionId: string;
  pageType: 'activation' | 'agreement' | 'confirmation' | 'processing';
  contentVersionId?: string;
  entryTime: Date;
  exitTime?: Date;
  timeOnPage: number; // in seconds
  engagementScore: number; // 0.00 to 1.00
  exitAction: 'next_page' | 'back' | 'close' | 'timeout' | 'error';
  scrollDepth: number; // percentage of page scrolled
  interactions: number; // number of clicks/interactions
  createdAt: Date;
}

export interface DropOffPattern {
  id: string;
  pageType: string;
  exitTrigger: string;
  frequency: number;
  avgTimeBeforeExit: number; // in seconds
  confidenceScore: number; // 0.00 to 1.00
  associatedContent: string[];
  recommendations: string[];
  identifiedAt: Date;
  lastUpdated: Date;
  isActive: boolean;
}

export interface JourneyAnalytics {
  sessionId: string;
  totalSessions: number;
  completedJourneys: number;
  droppedOffJourneys: number;
  conversionRate: number;
  avgSessionDuration: number;
  mostCommonExitPoint: string;
  topDropOffTriggers: DropOffTrigger[];
  pageConversionRates: PageConversionRate[];
  engagementMetrics: EngagementMetrics;
  recommendedActions: JourneyRecommendation[];
}

export interface DropOffTrigger {
  trigger: string;
  frequency: number;
  averageTime: number;
  pages: string[];
}

export interface PageConversionRate {
  pageType: string;
  visits: number;
  conversions: number;
  conversionRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export interface EngagementMetrics {
  avgScrollDepth: number;
  avgInteractions: number;
  avgEngagementScore: number;
  highEngagementThreshold: number;
  engagementDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface JourneyRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'content' | 'timing' | 'technical' | 'ux';
  title: string;
  description: string;
  expectedImprovement: number; // percentage
  implementationEffort: 'low' | 'medium' | 'high';
  targetPage: string;
  basedOnPattern: string;
  createdAt: Date;
}

// Statistical analysis interfaces
export interface JourneyStatistics {
  sampleSize: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  pValue: number;
  effectSize: number;
  statisticalPower: number;
}

export interface TimeAnalytics {
  pageType: string;
  avgTimeOnPage: number;
  medianTimeOnPage: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
  };
  dropOffTimeThreshold: number;
  engagementTimeThreshold: number;
}

export interface JourneyComparison {
  successfulJourneys: JourneySession[];
  droppedOffJourneys: JourneySession[];
  keyDifferences: {
    timeOnPage: TimeComparison;
    engagementScore: EngagementComparison;
    contentElements: ContentComparison;
  };
  recommendations: string[];
}

export interface TimeComparison {
  successful: TimeAnalytics[];
  droppedOff: TimeAnalytics[];
  significantDifferences: string[];
}

export interface EngagementComparison {
  successfulAvg: number;
  droppedOffAvg: number;
  significantDifference: boolean;
  pValue: number;
}

export interface ContentComparison {
  successfulContent: string[];
  droppedOffContent: string[];
  significantElements: string[];
  correlationScore: number;
}

// Page transition tracking
export interface PageTransition {
  id: string;
  sessionId: string;
  fromPage: string;
  toPage: string;
  transitionTime: number; // in milliseconds
  transitionType: 'navigation' | 'back' | 'forward' | 'direct';
  timestamp: Date;
}

// Real-time tracking interfaces
export interface JourneyEvent {
  id: string;
  sessionId: string;
  eventType: 'page_enter' | 'page_exit' | 'interaction' | 'scroll' | 'error';
  pageType: string;
  timestamp: Date;
  metadata: Record<string, any>;
  processed: boolean;
}

export interface RealTimeMetrics {
  activeSessions: number;
  recentDropOffs: DropOffEvent[];
  liveConversionRate: number;
  currentHourMetrics: {
    sessions: number;
    completions: number;
    dropOffs: number;
  };
  alerts: JourneyAlert[];
}

export interface DropOffEvent {
  sessionId: string;
  clientId: string;
  pageType: string;
  exitTrigger: string;
  timeOnPage: number;
  timestamp: Date;
}

export interface JourneyAlert {
  id: string;
  type: 'high_drop_off' | 'low_engagement' | 'technical_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedPage: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

// Journey flow visualization data
export interface JourneyFlowData {
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  conversionRates: Record<string, number>;
  dropOffRates: Record<string, number>;
}

export interface JourneyNode {
  id: string;
  pageType: string;
  label: string;
  visitors: number;
  completions: number;
  dropOffs: number;
  avgTimeOnPage: number;
  position: { x: number; y: number };
}

export interface JourneyEdge {
  id: string;
  source: string;
  target: string;
  weight: number; // number of transitions
  conversionRate: number;
  avgTransitionTime: number;
}

// Export utility types
export type JourneyPageType = 'activation' | 'agreement' | 'confirmation' | 'processing';
export type JourneyOutcome = 'completed' | 'dropped_off' | 'in_progress';
export type ExitTrigger = 'time_based' | 'content_based' | 'technical' | 'unknown';
export type ExitAction = 'next_page' | 'back' | 'close' | 'timeout' | 'error';
export type RecommendationType = 'content' | 'timing' | 'technical' | 'ux';
export type RecommendationPriority = 'high' | 'medium' | 'low';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

// Database schema types for migration
export interface JourneySessionSchema {
  id: string;
  client_id: string;
  session_start: Date;
  session_end?: Date;
  total_duration: number;
  final_outcome: JourneyOutcome;
  exit_point?: string;
  exit_trigger?: ExitTrigger;
  created_at: Date;
  updated_at: Date;
}

export interface JourneyPageVisitSchema {
  id: string;
  session_id: string;
  page_type: JourneyPageType;
  content_version_id?: string;
  entry_time: Date;
  exit_time?: Date;
  time_on_page: number;
  engagement_score: number;
  exit_action: ExitAction;
  scroll_depth: number;
  interactions: number;
  created_at: Date;
}

export interface DropOffPatternSchema {
  id: string;
  page_type: string;
  exit_trigger: string;
  frequency: number;
  avg_time_before_exit: number;
  confidence_score: number;
  associated_content: string; // JSON string
  recommendations: string; // JSON string
  identified_at: Date;
  last_updated: Date;
  is_active: boolean;
}