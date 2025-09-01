/**
 * Conversion Tracking Analytics
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Statistical analysis and conversion rate calculations for journey analytics.
 * Provides detailed metrics on page-level conversions and funnel analysis.
 */

import {
  JourneySession,
  JourneyPageVisit,
  JourneyPageType,
  PageConversionRate,
  JourneyStatistics,
  TimeAnalytics
} from '../data-models/journey-models';
import { calculateStatisticalSignificance } from '../pattern-recognition/detection-engine';

export interface ConversionFunnel {
  pageType: JourneyPageType;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
  avgTimeOnPage: number;
  previousStepConversionRate?: number;
}

export interface ConversionTrends {
  daily: DailyConversionMetric[];
  weekly: WeeklyConversionMetric[];
  overall: OverallConversionTrend;
}

export interface DailyConversionMetric {
  date: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  avgSessionDuration: number;
}

export interface WeeklyConversionMetric {
  weekStart: string;
  weekEnd: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  trendDirection: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface OverallConversionTrend {
  totalSessions: number;
  totalConversions: number;
  overallConversionRate: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  statisticalSignificance: JourneyStatistics;
}

export interface SegmentedConversion {
  segmentName: string;
  segmentCriteria: string;
  sessions: number;
  conversions: number;
  conversionRate: number;
  significantDifference: boolean;
  pValue: number;
}

export interface ConversionHeatmap {
  pageType: JourneyPageType;
  timeSlots: TimeSlotMetric[];
  peakConversionHours: number[];
  lowPerformanceHours: number[];
}

export interface TimeSlotMetric {
  hour: number;
  sessions: number;
  conversions: number;
  conversionRate: number;
  avgEngagementScore: number;
}

export class ConversionTrackingEngine {
  /**
   * Calculate comprehensive conversion funnel analysis
   */
  async calculateConversionFunnel(sessions: JourneySession[]): Promise<ConversionFunnel[]> {
    const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];
    const funnel: ConversionFunnel[] = [];
    let previousStepVisitors = 0;

    for (let i = 0; i < pageTypes.length; i++) {
      const pageType = pageTypes[i];
      
      // Get sessions that reached this page
      const sessionsReachingPage = sessions.filter(s => 
        s.pageVisits.some(pv => pv.pageType === pageType)
      );
      
      // Get sessions that completed this page and progressed
      const sessionsCompletingPage = sessions.filter(s => {
        const hasCurrentPage = s.pageVisits.some(pv => pv.pageType === pageType);
        
        if (i === pageTypes.length - 1) {
          // Last page - completion means successful outcome
          return hasCurrentPage && s.finalOutcome === 'completed';
        } else {
          // Intermediate page - completion means has next page
          const nextPageType = pageTypes[i + 1];
          return hasCurrentPage && s.pageVisits.some(pv => pv.pageType === nextPageType);
        }
      });

      const visitors = sessionsReachingPage.length;
      const conversions = sessionsCompletingPage.length;
      const conversionRate = visitors > 0 ? conversions / visitors : 0;
      const dropOffRate = 1 - conversionRate;
      
      // Calculate average time on page
      const pageVisits = sessionsReachingPage.flatMap(s => 
        s.pageVisits.filter(pv => pv.pageType === pageType)
      );
      const avgTimeOnPage = pageVisits.length > 0 
        ? pageVisits.reduce((sum, pv) => sum + pv.timeOnPage, 0) / pageVisits.length
        : 0;

      // Calculate previous step conversion rate
      const previousStepConversionRate = i > 0 && previousStepVisitors > 0
        ? visitors / previousStepVisitors
        : undefined;

      funnel.push({
        pageType,
        visitors,
        conversions,
        conversionRate,
        dropOffRate,
        avgTimeOnPage,
        previousStepConversionRate
      });

      previousStepVisitors = visitors;
    }

    return funnel;
  }

  /**
   * Calculate conversion trends over time
   */
  async calculateConversionTrends(sessions: JourneySession[], days: number = 30): Promise<ConversionTrends> {
    const now = new Date();
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

    // Filter sessions within date range
    const recentSessions = sessions.filter(s => 
      new Date(s.sessionStart) >= startDate
    );

    // Calculate daily metrics
    const dailyMetrics = await this.calculateDailyMetrics(recentSessions);
    
    // Calculate weekly metrics
    const weeklyMetrics = await this.calculateWeeklyMetrics(recentSessions);
    
    // Calculate overall trend
    const overallTrend = await this.calculateOverallTrend(recentSessions);

    return {
      daily: dailyMetrics,
      weekly: weeklyMetrics,
      overall: overallTrend
    };
  }

  /**
   * Segment conversions by different criteria
   */
  async calculateSegmentedConversions(
    sessions: JourneySession[],
    segmentationCriteria: Array<{
      name: string;
      criteria: string;
      filter: (session: JourneySession) => boolean;
    }>
  ): Promise<SegmentedConversion[]> {
    const segmentedConversions: SegmentedConversion[] = [];

    for (const segment of segmentationCriteria) {
      const segmentSessions = sessions.filter(segment.filter);
      const conversions = segmentSessions.filter(s => s.finalOutcome === 'completed').length;
      const conversionRate = segmentSessions.length > 0 
        ? conversions / segmentSessions.length 
        : 0;

      // Calculate statistical significance vs overall population
      const overallConversions = sessions.filter(s => s.finalOutcome === 'completed').length;
      const overallConversionRate = sessions.length > 0 
        ? overallConversions / sessions.length 
        : 0;

      const stats = calculateStatisticalSignificance(
        conversions,
        segmentSessions.length,
        overallConversionRate
      );

      segmentedConversions.push({
        segmentName: segment.name,
        segmentCriteria: segment.criteria,
        sessions: segmentSessions.length,
        conversions,
        conversionRate,
        significantDifference: stats.pValue < 0.05,
        pValue: stats.pValue
      });
    }

    return segmentedConversions.sort((a, b) => b.conversionRate - a.conversionRate);
  }

  /**
   * Generate conversion heatmap by time of day
   */
  async generateConversionHeatmap(sessions: JourneySession[]): Promise<ConversionHeatmap[]> {
    const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];
    const heatmaps: ConversionHeatmap[] = [];

    for (const pageType of pageTypes) {
      const pageHeatmap = await this.calculatePageHeatmap(sessions, pageType);
      heatmaps.push(pageHeatmap);
    }

    return heatmaps;
  }

  /**
   * Calculate statistical confidence for conversion rates
   */
  async calculateConversionConfidence(
    conversions: number,
    visitors: number,
    comparisonRate?: number
  ): Promise<JourneyStatistics> {
    if (visitors < 5) {
      return {
        sampleSize: visitors,
        confidenceInterval: { lower: 0, upper: 1 },
        pValue: 1.0,
        effectSize: 0,
        statisticalPower: 0
      };
    }

    const baselineRate = comparisonRate || 0.5;
    const stats = calculateStatisticalSignificance(conversions, visitors, baselineRate);

    return {
      sampleSize: visitors,
      confidenceInterval: stats.confidenceInterval,
      pValue: stats.pValue,
      effectSize: stats.effectSize,
      statisticalPower: stats.powerAnalysis.power
    };
  }

  /**
   * Analyze conversion rate optimization opportunities
   */
  async identifyOptimizationOpportunities(
    funnelData: ConversionFunnel[],
    benchmarkRates?: Partial<Record<JourneyPageType, number>>
  ): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    for (const step of funnelData) {
      const benchmark = benchmarkRates?.[step.pageType] || 0.7; // Default 70% conversion benchmark
      
      if (step.conversionRate < benchmark) {
        const potentialImprovement = (benchmark - step.conversionRate) * step.visitors;
        
        opportunities.push({
          pageType: step.pageType,
          currentConversionRate: step.conversionRate,
          benchmarkRate: benchmark,
          conversionGap: benchmark - step.conversionRate,
          affectedVisitors: step.visitors,
          potentialAdditionalConversions: Math.floor(potentialImprovement),
          priority: this.calculateOptimizationPriority(step, potentialImprovement),
          recommendedActions: this.generateOptimizationActions(step)
        });
      }
    }

    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Private helper methods

  private async calculateDailyMetrics(sessions: JourneySession[]): Promise<DailyConversionMetric[]> {
    const dailyGroups = new Map<string, JourneySession[]>();

    // Group sessions by day
    sessions.forEach(session => {
      const date = new Date(session.sessionStart).toISOString().split('T')[0];
      if (!dailyGroups.has(date)) {
        dailyGroups.set(date, []);
      }
      dailyGroups.get(date)!.push(session);
    });

    const dailyMetrics: DailyConversionMetric[] = [];

    for (const [date, daySessions] of dailyGroups.entries()) {
      const conversions = daySessions.filter(s => s.finalOutcome === 'completed').length;
      const conversionRate = daySessions.length > 0 ? conversions / daySessions.length : 0;
      const avgSessionDuration = daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + s.totalDuration, 0) / daySessions.length
        : 0;

      dailyMetrics.push({
        date,
        sessions: daySessions.length,
        conversions,
        conversionRate,
        avgSessionDuration
      });
    }

    return dailyMetrics.sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateWeeklyMetrics(sessions: JourneySession[]): Promise<WeeklyConversionMetric[]> {
    const weeklyGroups = new Map<string, JourneySession[]>();

    // Group sessions by week
    sessions.forEach(session => {
      const date = new Date(session.sessionStart);
      const weekStart = this.getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, []);
      }
      weeklyGroups.get(weekKey)!.push(session);
    });

    const weeklyMetrics: WeeklyConversionMetric[] = [];
    const sortedWeeks = Array.from(weeklyGroups.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (let i = 0; i < sortedWeeks.length; i++) {
      const [weekStart, weekSessions] = sortedWeeks[i];
      const conversions = weekSessions.filter(s => s.finalOutcome === 'completed').length;
      const conversionRate = weekSessions.length > 0 ? conversions / weekSessions.length : 0;

      // Calculate trend vs previous week
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      let percentChange = 0;

      if (i > 0) {
        const [, prevWeekSessions] = sortedWeeks[i - 1];
        const prevConversions = prevWeekSessions.filter(s => s.finalOutcome === 'completed').length;
        const prevConversionRate = prevWeekSessions.length > 0 ? prevConversions / prevWeekSessions.length : 0;
        
        if (prevConversionRate > 0) {
          percentChange = ((conversionRate - prevConversionRate) / prevConversionRate) * 100;
          
          if (Math.abs(percentChange) > 5) { // 5% threshold for significance
            trendDirection = percentChange > 0 ? 'up' : 'down';
          }
        }
      }

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      weeklyMetrics.push({
        weekStart,
        weekEnd: weekEnd.toISOString().split('T')[0],
        sessions: weekSessions.length,
        conversions,
        conversionRate,
        trendDirection,
        percentChange: Math.round(percentChange * 100) / 100
      });
    }

    return weeklyMetrics;
  }

  private async calculateOverallTrend(sessions: JourneySession[]): Promise<OverallConversionTrend> {
    const totalConversions = sessions.filter(s => s.finalOutcome === 'completed').length;
    const overallConversionRate = sessions.length > 0 ? totalConversions / sessions.length : 0;

    // Calculate trend direction based on first half vs second half of period
    const sortedSessions = sessions.sort((a, b) => 
      new Date(a.sessionStart).getTime() - new Date(b.sessionStart).getTime()
    );
    
    const midpoint = Math.floor(sortedSessions.length / 2);
    const firstHalf = sortedSessions.slice(0, midpoint);
    const secondHalf = sortedSessions.slice(midpoint);

    const firstHalfConversions = firstHalf.filter(s => s.finalOutcome === 'completed').length;
    const secondHalfConversions = secondHalf.filter(s => s.finalOutcome === 'completed').length;

    const firstHalfRate = firstHalf.length > 0 ? firstHalfConversions / firstHalf.length : 0;
    const secondHalfRate = secondHalf.length > 0 ? secondHalfConversions / secondHalf.length : 0;

    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    const rateDifference = secondHalfRate - firstHalfRate;
    
    if (Math.abs(rateDifference) > 0.05) { // 5% threshold
      trendDirection = rateDifference > 0 ? 'improving' : 'declining';
    }

    // Calculate statistical significance
    const statisticalSignificance = await this.calculateConversionConfidence(
      totalConversions,
      sessions.length
    );

    return {
      totalSessions: sessions.length,
      totalConversions,
      overallConversionRate,
      trendDirection,
      statisticalSignificance
    };
  }

  private async calculatePageHeatmap(
    sessions: JourneySession[],
    pageType: JourneyPageType
  ): Promise<ConversionHeatmap> {
    const timeSlots: TimeSlotMetric[] = [];

    // Initialize 24 hourly slots
    for (let hour = 0; hour < 24; hour++) {
      const hourSessions = sessions.filter(session => {
        const sessionHour = new Date(session.sessionStart).getHours();
        return sessionHour === hour && session.pageVisits.some(pv => pv.pageType === pageType);
      });

      const conversions = hourSessions.filter(s => {
        // For this page, conversion means progressing to next step or completing journey
        if (pageType === 'processing') {
          return s.finalOutcome === 'completed';
        } else {
          const pageOrder = ['activation', 'agreement', 'confirmation', 'processing'];
          const currentIndex = pageOrder.indexOf(pageType);
          const nextPageType = pageOrder[currentIndex + 1] as JourneyPageType;
          return s.pageVisits.some(pv => pv.pageType === nextPageType);
        }
      }).length;

      const conversionRate = hourSessions.length > 0 ? conversions / hourSessions.length : 0;

      // Calculate average engagement score for this hour
      const pageVisits = hourSessions.flatMap(s => 
        s.pageVisits.filter(pv => pv.pageType === pageType)
      );
      const avgEngagementScore = pageVisits.length > 0
        ? pageVisits.reduce((sum, pv) => sum + pv.engagementScore, 0) / pageVisits.length
        : 0;

      timeSlots.push({
        hour,
        sessions: hourSessions.length,
        conversions,
        conversionRate,
        avgEngagementScore
      });
    }

    // Identify peak and low performance hours
    const sortedByConversion = [...timeSlots].sort((a, b) => b.conversionRate - a.conversionRate);
    const peakConversionHours = sortedByConversion
      .slice(0, 3)
      .filter(slot => slot.sessions > 0)
      .map(slot => slot.hour);
    
    const lowPerformanceHours = sortedByConversion
      .slice(-3)
      .filter(slot => slot.sessions > 0 && slot.conversionRate < 0.3)
      .map(slot => slot.hour);

    return {
      pageType,
      timeSlots,
      peakConversionHours,
      lowPerformanceHours
    };
  }

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day; // Adjust to start from Sunday
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private calculateOptimizationPriority(
    step: ConversionFunnel,
    potentialImprovement: number
  ): 'high' | 'medium' | 'low' {
    // High priority: Low conversion rate + high traffic + significant improvement potential
    if (step.conversionRate < 0.3 && step.visitors > 100 && potentialImprovement > 50) {
      return 'high';
    }
    
    // Medium priority: Moderate issues with decent traffic
    if (step.conversionRate < 0.5 && step.visitors > 50 && potentialImprovement > 20) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateOptimizationActions(step: ConversionFunnel): string[] {
    const actions: string[] = [];

    // Time-based recommendations
    if (step.avgTimeOnPage < 30) {
      actions.push('Investigate quick exits - content may not be engaging');
    } else if (step.avgTimeOnPage > 300) {
      actions.push('Optimize page loading and reduce information overload');
    }

    // Conversion rate based recommendations
    if (step.conversionRate < 0.2) {
      actions.push('Critical: Complete page redesign and user experience review');
      actions.push('Conduct user interviews to identify major barriers');
    } else if (step.conversionRate < 0.5) {
      actions.push('A/B test different content variations');
      actions.push('Optimize call-to-action placement and messaging');
    }

    // Page-specific recommendations
    switch (step.pageType) {
      case 'activation':
        actions.push('Strengthen value proposition and first impression');
        actions.push('Simplify initial user experience');
        break;
      case 'agreement':
        actions.push('Clarify terms and reduce friction');
        actions.push('Add trust signals and security badges');
        break;
      case 'confirmation':
        actions.push('Streamline confirmation process');
        actions.push('Provide clear next steps');
        break;
      case 'processing':
        actions.push('Optimize payment flow and reduce abandonment');
        actions.push('Add progress indicators and reassurance');
        break;
    }

    return actions;
  }
}

export interface OptimizationOpportunity {
  pageType: JourneyPageType;
  currentConversionRate: number;
  benchmarkRate: number;
  conversionGap: number;
  affectedVisitors: number;
  potentialAdditionalConversions: number;
  priority: 'high' | 'medium' | 'low';
  recommendedActions: string[];
}

// Export singleton instance and utility functions
export const conversionTrackingEngine = new ConversionTrackingEngine();

export async function calculateJourneyFunnel(
  sessions: JourneySession[]
): Promise<ConversionFunnel[]> {
  return conversionTrackingEngine.calculateConversionFunnel(sessions);
}

export async function analyzeConversionTrends(
  sessions: JourneySession[],
  days?: number
): Promise<ConversionTrends> {
  return conversionTrackingEngine.calculateConversionTrends(sessions, days);
}

export async function segmentConversions(
  sessions: JourneySession[],
  segments: Array<{
    name: string;
    criteria: string;
    filter: (session: JourneySession) => boolean;
  }>
): Promise<SegmentedConversion[]> {
  return conversionTrackingEngine.calculateSegmentedConversions(sessions, segments);
}

export async function generateTimeHeatmap(
  sessions: JourneySession[]
): Promise<ConversionHeatmap[]> {
  return conversionTrackingEngine.generateConversionHeatmap(sessions);
}