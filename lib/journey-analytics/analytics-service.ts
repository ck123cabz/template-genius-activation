/**
 * Comprehensive Journey Analytics Service
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Main service that integrates all journey analytics components and provides
 * a unified API for analytics operations.
 */

import {
  JourneySession,
  JourneyPageVisit,
  JourneyPageType,
  JourneyOutcome,
  ExitTrigger,
  DropOffPattern,
  JourneyRecommendation,
  RealTimeMetrics
} from '../data-models/journey-models';

// Import analytics engines
import { journeySessionManager } from './session-tracking';
import { dropOffDetectionEngine, DropOffAnalysis } from './drop-off-engine';
import { conversionTrackingEngine, ConversionFunnel, ConversionTrends } from '../analytics/conversion-tracking';
import { journeyRecommendationEngine, RecommendationContext } from './recommendation-engine';
import { realtimeJourneyProcessor } from './realtime-processor';

export interface AnalyticsServiceConfig {
  minSampleSize?: number;
  confidenceThreshold?: number;
  realtimeEnabled?: boolean;
  autoRecommendations?: boolean;
}

export interface ComprehensiveAnalytics {
  overview: AnalyticsOverview;
  dropOffAnalysis: DropOffAnalysis;
  conversionFunnel: ConversionFunnel[];
  conversionTrends: ConversionTrends;
  recommendations: JourneyRecommendation[];
  realTimeMetrics: RealTimeMetrics;
  lastUpdated: Date;
}

export interface AnalyticsOverview {
  totalSessions: number;
  completedJourneys: number;
  overallConversionRate: number;
  avgSessionDuration: number;
  topDropOffPoint: string;
  improvementOpportunities: number;
  timeframe: string;
}

export class JourneyAnalyticsService {
  private config: AnalyticsServiceConfig;

  constructor(config: AnalyticsServiceConfig = {}) {
    this.config = {
      minSampleSize: 5,
      confidenceThreshold: 0.7,
      realtimeEnabled: true,
      autoRecommendations: true,
      ...config
    };
  }

  /**
   * Get comprehensive analytics for dashboard
   */
  async getComprehensiveAnalytics(timeframeDays: number = 30): Promise<ComprehensiveAnalytics> {
    // Get journey sessions (in production, this would query the database)
    const sessions = await this.getJourneySessions(timeframeDays);

    // Generate overview metrics
    const overview = this.calculateOverview(sessions, timeframeDays);

    // Run drop-off analysis
    const dropOffAnalysis = await dropOffDetectionEngine.analyzeDropOffPatterns(sessions);

    // Calculate conversion funnel
    const conversionFunnel = await conversionTrackingEngine.calculateConversionFunnel(sessions);

    // Get conversion trends
    const conversionTrends = await conversionTrackingEngine.calculateConversionTrends(sessions, timeframeDays);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(dropOffAnalysis, conversionFunnel);

    // Get real-time metrics
    const realTimeMetrics = await realtimeJourneyProcessor.getRealTimeMetrics();

    return {
      overview,
      dropOffAnalysis,
      conversionFunnel,
      conversionTrends,
      recommendations,
      realTimeMetrics,
      lastUpdated: new Date()
    };
  }

  /**
   * Track client journey session
   */
  async startJourneySession(clientId: string): Promise<string> {
    const session = await journeySessionManager.createSession(clientId);
    return session.id;
  }

  /**
   * Track page visit in journey
   */
  async trackPageVisit(
    sessionId: string,
    pageType: JourneyPageType,
    contentVersionId?: string
  ): Promise<void> {
    await journeySessionManager.trackPageVisit(sessionId, pageType, contentVersionId);
    
    // Add real-time event if enabled
    if (this.config.realtimeEnabled) {
      await realtimeJourneyProcessor.addEvent({
        id: '',
        sessionId,
        eventType: 'page_enter',
        pageType,
        timestamp: new Date(),
        metadata: { contentVersionId },
        processed: false
      });
    }
  }

  /**
   * Track page exit with engagement data
   */
  async trackPageExit(
    sessionId: string,
    pageVisitId: string,
    exitData: {
      exitAction: string;
      timeOnPage: number;
      scrollDepth: number;
      interactions: number;
    }
  ): Promise<void> {
    await journeySessionManager.endPageVisit(
      sessionId,
      pageVisitId,
      exitData.exitAction as any,
      {
        scrollDepth: exitData.scrollDepth,
        interactions: exitData.interactions
      }
    );

    // Add real-time event
    if (this.config.realtimeEnabled) {
      await realtimeJourneyProcessor.addEvent({
        id: '',
        sessionId,
        eventType: 'page_exit',
        pageType: 'unknown', // Would need to be passed or looked up
        timestamp: new Date(),
        metadata: exitData,
        processed: false
      });
    }
  }

  /**
   * Complete journey session
   */
  async completeJourneySession(
    sessionId: string,
    outcome: JourneyOutcome,
    exitTrigger?: ExitTrigger
  ): Promise<void> {
    await journeySessionManager.endSession(sessionId, exitTrigger, outcome);
  }

  /**
   * Get specific page analytics
   */
  async getPageAnalytics(
    pageType: JourneyPageType,
    timeframeDays: number = 30
  ): Promise<{
    conversionRate: number;
    dropOffPatterns: DropOffPattern[];
    recommendations: JourneyRecommendation[];
    timeAnalytics: {
      avgTimeOnPage: number;
      bounceRate: number;
      engagementScore: number;
    };
  }> {
    const sessions = await this.getJourneySessions(timeframeDays);
    
    // Get page-specific sessions
    const pageSessions = sessions.filter(s => 
      s.pageVisits.some(pv => pv.pageType === pageType)
    );

    // Calculate conversion rate
    const completedPageSessions = pageSessions.filter(s => s.finalOutcome === 'completed');
    const conversionRate = pageSessions.length > 0 ? completedPageSessions.length / pageSessions.length : 0;

    // Get drop-off patterns for this page
    const dropOffAnalysis = await dropOffDetectionEngine.analyzeDropOffPatterns(sessions);
    const dropOffPatterns = dropOffAnalysis.dropOffPatterns.filter(p => p.pageType === pageType);

    // Generate page-specific recommendations
    const recommendationContext: RecommendationContext = {
      dropOffPatterns,
      conversionRates: dropOffAnalysis.conversionRates,
      sessionData: sessions,
      timeframe: timeframeDays,
      minConfidence: this.config.confidenceThreshold || 0.7
    };

    const recommendations = await journeyRecommendationEngine.generatePageSpecificRecommendation(
      pageType,
      recommendationContext
    );

    // Calculate time analytics
    const pageVisits = pageSessions.flatMap(s => s.pageVisits.filter(pv => pv.pageType === pageType));
    const avgTimeOnPage = pageVisits.length > 0 
      ? pageVisits.reduce((sum, pv) => sum + pv.timeOnPage, 0) / pageVisits.length 
      : 0;

    const bounces = pageVisits.filter(pv => 
      pv.exitAction === 'close' || pv.exitAction === 'back' || pv.exitAction === 'timeout'
    );
    const bounceRate = pageVisits.length > 0 ? bounces.length / pageVisits.length : 0;

    const avgEngagementScore = pageVisits.length > 0
      ? pageVisits.reduce((sum, pv) => sum + pv.engagementScore, 0) / pageVisits.length
      : 0;

    return {
      conversionRate,
      dropOffPatterns,
      recommendations: recommendations ? [recommendations] : [],
      timeAnalytics: {
        avgTimeOnPage,
        bounceRate,
        engagementScore: avgEngagementScore
      }
    };
  }

  /**
   * Get real-time dashboard metrics
   */
  async getRealTimeDashboard(): Promise<{
    activeSessions: number;
    currentConversionRate: number;
    recentDropOffs: any[];
    systemAlerts: any[];
    processedEvents: number;
  }> {
    const metrics = await realtimeJourneyProcessor.getRealTimeMetrics();
    const processingMetrics = realtimeJourneyProcessor.getProcessingMetrics();

    return {
      activeSessions: metrics.activeSessions,
      currentConversionRate: metrics.liveConversionRate,
      recentDropOffs: metrics.recentDropOffs,
      systemAlerts: metrics.alerts,
      processedEvents: processingMetrics.eventsProcessed
    };
  }

  /**
   * Generate improvement recommendations
   */
  async getOptimizationRecommendations(
    timeframeDays: number = 30
  ): Promise<JourneyRecommendation[]> {
    const sessions = await this.getJourneySessions(timeframeDays);
    const dropOffAnalysis = await dropOffDetectionEngine.analyzeDropOffPatterns(sessions);
    const conversionFunnel = await conversionTrackingEngine.calculateConversionFunnel(sessions);

    return this.generateRecommendations(dropOffAnalysis, conversionFunnel);
  }

  /**
   * Export analytics data for reporting
   */
  async exportAnalyticsData(format: 'json' | 'csv' = 'json'): Promise<string> {
    const analytics = await this.getComprehensiveAnalytics();
    
    if (format === 'json') {
      return JSON.stringify(analytics, null, 2);
    } else {
      // Convert to CSV format (simplified)
      const csvData = this.convertToCSV(analytics);
      return csvData;
    }
  }

  /**
   * Get journey sessions (mock implementation)
   */
  private async getJourneySessions(timeframeDays: number): Promise<JourneySession[]> {
    // In production, this would query the database
    // For now, return mock data or use session manager
    return [];
  }

  /**
   * Calculate overview metrics
   */
  private calculateOverview(sessions: JourneySession[], timeframeDays: number): AnalyticsOverview {
    const completedJourneys = sessions.filter(s => s.finalOutcome === 'completed');
    const overallConversionRate = sessions.length > 0 ? completedJourneys.length / sessions.length : 0;
    
    const totalDuration = sessions.reduce((sum, s) => sum + s.totalDuration, 0);
    const avgSessionDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;

    // Find most common drop-off point
    const dropOffSessions = sessions.filter(s => s.finalOutcome === 'dropped_off');
    const dropOffPoints = dropOffSessions.map(s => s.exitPoint).filter(Boolean);
    const topDropOffPoint = this.getMostFrequent(dropOffPoints) || 'none';

    return {
      totalSessions: sessions.length,
      completedJourneys: completedJourneys.length,
      overallConversionRate,
      avgSessionDuration,
      topDropOffPoint,
      improvementOpportunities: 3, // Would be calculated based on patterns
      timeframe: `${timeframeDays} days`
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private async generateRecommendations(
    dropOffAnalysis: DropOffAnalysis,
    conversionFunnel: ConversionFunnel[]
  ): Promise<JourneyRecommendation[]> {
    if (!this.config.autoRecommendations) {
      return [];
    }

    const context: RecommendationContext = {
      dropOffPatterns: dropOffAnalysis.dropOffPatterns,
      conversionRates: dropOffAnalysis.conversionRates,
      sessionData: [], // Would be populated with actual data
      timeframe: 30,
      minConfidence: this.config.confidenceThreshold || 0.7
    };

    return journeyRecommendationEngine.generateRecommendations(context);
  }

  /**
   * Get most frequent item in array
   */
  private getMostFrequent<T>(items: T[]): T | null {
    if (items.length === 0) return null;
    
    const frequency = new Map<T, number>();
    items.forEach(item => {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    });

    let mostFrequent: T | null = null;
    let maxCount = 0;
    
    for (const [item, count] of frequency.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }

  /**
   * Convert analytics to CSV format (simplified)
   */
  private convertToCSV(analytics: ComprehensiveAnalytics): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Sessions', analytics.overview.totalSessions.toString()],
      ['Completed Journeys', analytics.overview.completedJourneys.toString()],
      ['Conversion Rate', `${(analytics.overview.overallConversionRate * 100).toFixed(2)}%`],
      ['Avg Session Duration', `${analytics.overview.avgSessionDuration}s`],
      ['Top Drop-off Point', analytics.overview.topDropOffPoint],
      ['Active Sessions', analytics.realTimeMetrics.activeSessions.toString()],
      ['Live Conversion Rate', `${analytics.realTimeMetrics.liveConversionRate.toFixed(2)}%`]
    ];

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return csvContent;
  }
}

// Export singleton instance and factory function
export const journeyAnalyticsService = new JourneyAnalyticsService();

export function createAnalyticsService(config?: AnalyticsServiceConfig): JourneyAnalyticsService {
  return new JourneyAnalyticsService(config);
}

// Utility functions for external use
export async function getJourneyAnalytics(timeframeDays?: number): Promise<ComprehensiveAnalytics> {
  return journeyAnalyticsService.getComprehensiveAnalytics(timeframeDays);
}

export async function trackJourneyInteraction(
  sessionId: string,
  pageType: JourneyPageType,
  interactionData?: any
): Promise<void> {
  // Implementation would depend on the type of interaction
  console.log(`Tracking interaction for session ${sessionId} on ${pageType} page`);
}