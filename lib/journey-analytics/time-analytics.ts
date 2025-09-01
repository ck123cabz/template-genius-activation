/**
 * Time-on-Page Analysis and Engagement Scoring
 * 
 * Advanced algorithms for calculating time-based engagement metrics,
 * identifying optimal time thresholds, and detecting abandonment patterns.
 */

import {
  JourneySession,
  JourneyPageVisit,
  EngagementMetrics,
  TimeOnPageAnalysis
} from '../data-models/journey-models';

/**
 * Page-specific time expectations and scoring weights
 */
const PAGE_TIME_EXPECTATIONS = {
  activation: {
    minEffectiveTime: 45,      // seconds
    optimalTime: 120,          // 2 minutes
    maxReasonableTime: 600,    // 10 minutes
    timeoutThreshold: 1800,    // 30 minutes
    engagementWeight: {
      timeScore: 0.4,
      scrollScore: 0.3,
      interactionScore: 0.3
    }
  },
  agreement: {
    minEffectiveTime: 90,      // seconds
    optimalTime: 240,          // 4 minutes
    maxReasonableTime: 1200,   // 20 minutes
    timeoutThreshold: 2400,    // 40 minutes
    engagementWeight: {
      timeScore: 0.5,
      scrollScore: 0.3,
      interactionScore: 0.2
    }
  },
  confirmation: {
    minEffectiveTime: 20,      // seconds
    optimalTime: 60,           // 1 minute
    maxReasonableTime: 300,    // 5 minutes
    timeoutThreshold: 600,     // 10 minutes
    engagementWeight: {
      timeScore: 0.3,
      scrollScore: 0.2,
      interactionScore: 0.5
    }
  },
  processing: {
    minEffectiveTime: 5,       // seconds
    optimalTime: 30,           // 30 seconds
    maxReasonableTime: 120,    // 2 minutes
    timeoutThreshold: 300,     // 5 minutes
    engagementWeight: {
      timeScore: 0.2,
      scrollScore: 0.1,
      interactionScore: 0.7
    }
  }
} as const;

/**
 * Time-based Engagement Calculator
 */
export class TimeEngagementCalculator {
  /**
   * Calculate comprehensive engagement score for a page visit
   */
  calculateEngagementScore(visit: JourneyPageVisit): number {
    const pageType = visit.pageType;
    const expectations = PAGE_TIME_EXPECTATIONS[pageType];
    
    if (!expectations) return 0;

    // Time-based scoring
    const timeScore = this.calculateTimeScore(visit.timeOnPage, expectations);
    
    // Scroll-based scoring  
    const scrollScore = Math.min(visit.scrollDepth / 100, 1);
    
    // Interaction-based scoring
    const interactionScore = Math.min(visit.interactionCount / 10, 1);

    // Weighted final score
    const weights = expectations.engagementWeight;
    const finalScore = (
      timeScore * weights.timeScore +
      scrollScore * weights.scrollScore + 
      interactionScore * weights.interactionScore
    );

    return Math.round(finalScore * 100) / 100;
  }

  /**
   * Calculate time-based score with diminishing returns
   */
  private calculateTimeScore(timeOnPage: number, expectations: any): number {
    if (timeOnPage < expectations.minEffectiveTime) {
      // Too short - low engagement
      return timeOnPage / expectations.minEffectiveTime * 0.3;
    }
    
    if (timeOnPage <= expectations.optimalTime) {
      // Good time range - increasing engagement
      const progress = (timeOnPage - expectations.minEffectiveTime) / 
                      (expectations.optimalTime - expectations.minEffectiveTime);
      return 0.3 + (progress * 0.7); // 0.3 to 1.0
    }
    
    if (timeOnPage <= expectations.maxReasonableTime) {
      // Extended time - diminishing returns
      const overTime = timeOnPage - expectations.optimalTime;
      const maxOverTime = expectations.maxReasonableTime - expectations.optimalTime;
      const diminish = Math.max(0, 1 - (overTime / maxOverTime * 0.3));
      return Math.max(0.7, diminish); // 0.7 to 1.0, declining
    }
    
    // Excessive time - potential abandonment
    return 0.5;
  }

  /**
   * Detect time-based drop-off risk
   */
  assessDropOffRisk(visit: JourneyPageVisit): {
    risk: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    recommendedAction: string;
  } {
    const pageType = visit.pageType;
    const expectations = PAGE_TIME_EXPECTATIONS[pageType];
    const timeOnPage = visit.timeOnPage;
    
    if (timeOnPage < expectations.minEffectiveTime) {
      return {
        risk: 'high',
        reason: 'Very short time on page suggests quick abandonment',
        recommendedAction: 'Improve initial engagement and reduce friction'
      };
    }
    
    if (timeOnPage > expectations.maxReasonableTime) {
      return {
        risk: 'critical',
        reason: 'Excessive time suggests confusion or technical issues',
        recommendedAction: 'Simplify content and check for usability issues'
      };
    }
    
    if (visit.engagementScore < 0.3) {
      return {
        risk: 'high',
        reason: 'Low engagement despite reasonable time',
        recommendedAction: 'Improve content relevance and interactivity'
      };
    }
    
    if (visit.scrollDepth < 25) {
      return {
        risk: 'medium',
        reason: 'Limited scroll depth indicates shallow engagement',
        recommendedAction: 'Improve above-the-fold content and calls-to-action'
      };
    }

    return {
      risk: 'low',
      reason: 'Healthy engagement patterns observed',
      recommendedAction: 'Monitor and maintain current content strategy'
    };
  }

  /**
   * Calculate optimal time thresholds for a page type based on historical data
   */
  calculateOptimalThresholds(
    pageVisits: JourneyPageVisit[],
    pageType: string
  ): {
    minEffectiveTime: number;
    optimalTime: number;
    maxReasonableTime: number;
    confidenceInterval: { lower: number; upper: number };
  } {
    const successfulVisits = pageVisits.filter(v => 
      v.pageType === pageType && 
      v.exitAction === 'next_page' &&
      v.engagementScore > 0.5
    );

    if (successfulVisits.length < 10) {
      // Not enough data, return defaults
      const defaults = PAGE_TIME_EXPECTATIONS[pageType as keyof typeof PAGE_TIME_EXPECTATIONS];
      return {
        minEffectiveTime: defaults?.minEffectiveTime || 30,
        optimalTime: defaults?.optimalTime || 120,
        maxReasonableTime: defaults?.maxReasonableTime || 600,
        confidenceInterval: { lower: 0, upper: 0 }
      };
    }

    const times = successfulVisits.map(v => v.timeOnPage).sort((a, b) => a - b);
    
    const percentile = (arr: number[], p: number) => {
      const index = (p / 100) * (arr.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index % 1;
      
      return arr[lower] * (1 - weight) + arr[upper] * weight;
    };

    return {
      minEffectiveTime: Math.round(percentile(times, 10)),
      optimalTime: Math.round(percentile(times, 50)), // median
      maxReasonableTime: Math.round(percentile(times, 90)),
      confidenceInterval: {
        lower: Math.round(percentile(times, 25)),
        upper: Math.round(percentile(times, 75))
      }
    };
  }
}

/**
 * Journey Time Analyzer
 */
export class JourneyTimeAnalyzer {
  private timeCalculator = new TimeEngagementCalculator();

  /**
   * Analyze time patterns across journey sessions
   */
  analyzeJourneyTimePatterns(sessions: JourneySession[]): {
    overallPatterns: {
      avgTotalTime: number;
      medianTotalTime: number;
      completionTimeRange: { min: number; max: number };
      dropOffTimePatterns: { [page: string]: number };
    };
    pageAnalysis: TimeOnPageAnalysis[];
    recommendations: string[];
  } {
    const completedSessions = sessions.filter(s => s.finalOutcome === 'completed');
    const droppedSessions = sessions.filter(s => s.finalOutcome === 'dropped_off');
    
    // Overall time patterns
    const completionTimes = completedSessions.map(s => s.totalDuration);
    const avgTotalTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const medianTotalTime = this.calculateMedian(completionTimes);
    
    // Drop-off time patterns
    const dropOffTimePatterns: { [page: string]: number } = {};
    droppedSessions.forEach(session => {
      if (session.exitPoint) {
        const exitPageVisits = session.pageVisits.filter(v => v.pageType === session.exitPoint);
        if (exitPageVisits.length > 0) {
          const avgDropOffTime = exitPageVisits.reduce((sum, v) => sum + v.timeOnPage, 0) / exitPageVisits.length;
          dropOffTimePatterns[session.exitPoint] = avgDropOffTime;
        }
      }
    });

    // Page-level analysis
    const pageTypes = ['activation', 'agreement', 'confirmation', 'processing'] as const;
    const pageAnalysis: TimeOnPageAnalysis[] = pageTypes.map(pageType => {
      const pageVisits = sessions.flatMap(s => s.pageVisits.filter(v => v.pageType === pageType));
      
      return this.analyzePageTimePattern(pageType, pageVisits);
    });

    // Generate recommendations
    const recommendations = this.generateTimeBasedRecommendations(pageAnalysis, dropOffTimePatterns);

    return {
      overallPatterns: {
        avgTotalTime,
        medianTotalTime,
        completionTimeRange: {
          min: Math.min(...completionTimes),
          max: Math.max(...completionTimes)
        },
        dropOffTimePatterns
      },
      pageAnalysis,
      recommendations
    };
  }

  /**
   * Analyze time patterns for specific page
   */
  private analyzePageTimePattern(pageType: string, visits: JourneyPageVisit[]): TimeOnPageAnalysis {
    if (visits.length === 0) {
      return {
        page: pageType,
        avgTime: 0,
        dropOffTime: 0,
        engagementScore: 0,
        conversionRate: 0
      };
    }

    const totalTime = visits.reduce((sum, v) => sum + v.timeOnPage, 0);
    const avgTime = totalTime / visits.length;
    
    const dropOffVisits = visits.filter(v => v.exitAction !== 'next_page');
    const avgDropOffTime = dropOffVisits.length > 0 
      ? dropOffVisits.reduce((sum, v) => sum + v.timeOnPage, 0) / dropOffVisits.length
      : 0;

    const avgEngagement = visits.reduce((sum, v) => sum + v.engagementScore, 0) / visits.length;
    
    const conversions = visits.filter(v => v.exitAction === 'next_page').length;
    const conversionRate = (conversions / visits.length) * 100;

    return {
      page: pageType,
      avgTime: Math.round(avgTime),
      dropOffTime: Math.round(avgDropOffTime),
      engagementScore: Math.round(avgEngagement * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }

  /**
   * Generate time-based improvement recommendations
   */
  private generateTimeBasedRecommendations(
    pageAnalysis: TimeOnPageAnalysis[],
    dropOffPatterns: { [page: string]: number }
  ): string[] {
    const recommendations: string[] = [];

    pageAnalysis.forEach(analysis => {
      const expectations = PAGE_TIME_EXPECTATIONS[analysis.page as keyof typeof PAGE_TIME_EXPECTATIONS];
      if (!expectations) return;

      // Too short average time
      if (analysis.avgTime < expectations.minEffectiveTime) {
        recommendations.push(
          `${analysis.page} page: Average time (${analysis.avgTime}s) is below minimum effective threshold. ` +
          `Consider adding engagement elements to extend user attention.`
        );
      }

      // Too long average time
      if (analysis.avgTime > expectations.maxReasonableTime) {
        recommendations.push(
          `${analysis.page} page: Average time (${analysis.avgTime}s) exceeds reasonable threshold. ` +
          `Simplify content and improve clarity to reduce cognitive load.`
        );
      }

      // Low engagement despite good time
      if (analysis.avgTime >= expectations.minEffectiveTime && analysis.engagementScore < 0.4) {
        recommendations.push(
          `${analysis.page} page: Good time investment but low engagement score (${analysis.engagementScore}). ` +
          `Improve interactive elements and content relevance.`
        );
      }

      // High drop-off time pattern
      if (dropOffPatterns[analysis.page] && dropOffPatterns[analysis.page] < expectations.minEffectiveTime) {
        recommendations.push(
          `${analysis.page} page: Users dropping off quickly (${Math.round(dropOffPatterns[analysis.page])}s average). ` +
          `Focus on initial page impression and reduce early friction points.`
        );
      }

      // Low conversion rate
      if (analysis.conversionRate < 50) {
        recommendations.push(
          `${analysis.page} page: Low conversion rate (${analysis.conversionRate}%). ` +
          `Strengthen call-to-action and address potential objections.`
        );
      }
    });

    return recommendations;
  }

  /**
   * Calculate median value from array
   */
  private calculateMedian(numbers: number[]): number {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  /**
   * Identify time-based abandonment patterns
   */
  identifyAbandonmentPatterns(sessions: JourneySession[]): {
    quickExits: { page: string; avgTime: number; frequency: number }[];
    prolongedStalls: { page: string; avgTime: number; frequency: number }[];
    timeoutPatterns: { page: string; frequency: number }[];
  } {
    const droppedSessions = sessions.filter(s => s.finalOutcome === 'dropped_off');
    
    const quickExits: { [page: string]: { times: number[]; count: number } } = {};
    const prolongedStalls: { [page: string]: { times: number[]; count: number } } = {};
    const timeoutPatterns: { [page: string]: number } = {};

    droppedSessions.forEach(session => {
      if (!session.exitPoint) return;
      
      const exitVisits = session.pageVisits.filter(v => v.pageType === session.exitPoint);
      if (exitVisits.length === 0) return;
      
      const avgExitTime = exitVisits.reduce((sum, v) => sum + v.timeOnPage, 0) / exitVisits.length;
      const expectations = PAGE_TIME_EXPECTATIONS[session.exitPoint as keyof typeof PAGE_TIME_EXPECTATIONS];
      
      if (!expectations) return;

      // Quick exits (below minimum effective time)
      if (avgExitTime < expectations.minEffectiveTime) {
        if (!quickExits[session.exitPoint]) {
          quickExits[session.exitPoint] = { times: [], count: 0 };
        }
        quickExits[session.exitPoint].times.push(avgExitTime);
        quickExits[session.exitPoint].count++;
      }
      
      // Prolonged stalls (above reasonable time)
      if (avgExitTime > expectations.maxReasonableTime) {
        if (!prolongedStalls[session.exitPoint]) {
          prolongedStalls[session.exitPoint] = { times: [], count: 0 };
        }
        prolongedStalls[session.exitPoint].times.push(avgExitTime);
        prolongedStalls[session.exitPoint].count++;
      }

      // Timeout patterns
      if (session.exitTrigger === 'time_based') {
        timeoutPatterns[session.exitPoint] = (timeoutPatterns[session.exitPoint] || 0) + 1;
      }
    });

    return {
      quickExits: Object.entries(quickExits).map(([page, data]) => ({
        page,
        avgTime: Math.round(data.times.reduce((sum, time) => sum + time, 0) / data.times.length),
        frequency: data.count
      })),
      prolongedStalls: Object.entries(prolongedStalls).map(([page, data]) => ({
        page,
        avgTime: Math.round(data.times.reduce((sum, time) => sum + time, 0) / data.times.length),
        frequency: data.count
      })),
      timeoutPatterns: Object.entries(timeoutPatterns).map(([page, frequency]) => ({
        page,
        frequency
      }))
    };
  }
}

/**
 * Singleton instances
 */
export const timeEngagementCalculator = new TimeEngagementCalculator();
export const journeyTimeAnalyzer = new JourneyTimeAnalyzer();

/**
 * Utility functions for time analysis
 */

/**
 * Convert seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Calculate time percentiles from array of durations
 */
export function calculateTimePercentiles(durations: number[]): {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
} {
  const sorted = durations.sort((a, b) => a - b);
  const n = sorted.length;
  
  return {
    p10: sorted[Math.floor(n * 0.1)],
    p25: sorted[Math.floor(n * 0.25)],
    p50: sorted[Math.floor(n * 0.5)],
    p75: sorted[Math.floor(n * 0.75)],
    p90: sorted[Math.floor(n * 0.9)]
  };
}

/**
 * Detect unusual time patterns that might indicate issues
 */
export function detectTimeAnomalies(
  durations: number[],
  pageType: string
): {
  outliers: number[];
  suspiciouslyShort: number[];
  suspiciouslyLong: number[];
} {
  const expectations = PAGE_TIME_EXPECTATIONS[pageType as keyof typeof PAGE_TIME_EXPECTATIONS];
  if (!expectations) {
    return { outliers: [], suspiciouslyShort: [], suspiciouslyLong: [] };
  }

  const suspiciouslyShort = durations.filter(d => d < expectations.minEffectiveTime / 2);
  const suspiciouslyLong = durations.filter(d => d > expectations.timeoutThreshold);
  
  // Statistical outlier detection using IQR
  const sorted = durations.sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  const outliers = durations.filter(d => d < lowerBound || d > upperBound);

  return {
    outliers,
    suspiciouslyShort,
    suspiciouslyLong
  };
}