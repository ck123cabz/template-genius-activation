/**
 * Drop-off Detection Engine
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Analyzes journey patterns to identify drop-off points, exit triggers, and provide
 * statistical analysis of conversion patterns. Extends Epic 4.1 PatternDetectionEngine.
 */

import { randomUUID } from 'crypto';
import {
  JourneySession,
  JourneyPageVisit,
  DropOffPattern,
  JourneyPageType,
  ExitTrigger,
  JourneyStatistics,
  TimeAnalytics,
  JourneyComparison,
  DropOffTrigger,
  PageConversionRate
} from '../data-models/journey-models';
import {
  calculateStatisticalSignificance,
  PatternDetectionEngine
} from '../pattern-recognition/detection-engine';

export interface DropOffAnalysis {
  dropOffPatterns: DropOffPattern[];
  conversionRates: PageConversionRate[];
  exitTriggerAnalysis: DropOffTrigger[];
  timeBasedPatterns: TimeAnalytics[];
  statisticalSummary: JourneyStatistics;
  recommendations: DropOffRecommendation[];
}

export interface DropOffRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'content' | 'timing' | 'technical' | 'ux';
  title: string;
  description: string;
  targetPage: JourneyPageType;
  expectedImprovement: number;
  confidenceScore: number;
  basedOnPattern: string;
  implementationSteps: string[];
}

export class DropOffDetectionEngine {
  private patternDetectionEngine: PatternDetectionEngine;
  private minSampleSize: number = 5;
  private confidenceThreshold: number = 0.7;
  private significanceLevel: number = 0.05;

  constructor(options?: {
    minSampleSize?: number;
    confidenceThreshold?: number;
    significanceLevel?: number;
  }) {
    this.patternDetectionEngine = new PatternDetectionEngine();
    
    if (options?.minSampleSize) this.minSampleSize = options.minSampleSize;
    if (options?.confidenceThreshold) this.confidenceThreshold = options.confidenceThreshold;
    if (options?.significanceLevel) this.significanceLevel = options.significanceLevel;
  }

  /**
   * Main analysis method - identifies drop-off patterns from journey data
   */
  async analyzeDropOffPatterns(journeySessions: JourneySession[]): Promise<DropOffAnalysis> {
    const startTime = Date.now();

    try {
      // Filter for dropped-off sessions
      const droppedOffSessions = journeySessions.filter(s => s.finalOutcome === 'dropped_off');
      const completedSessions = journeySessions.filter(s => s.finalOutcome === 'completed');

      if (droppedOffSessions.length < this.minSampleSize) {
        return this.createEmptyAnalysis(Date.now() - startTime);
      }

      // 1. Identify drop-off patterns by page and trigger
      const dropOffPatterns = await this.identifyDropOffPatterns(droppedOffSessions);

      // 2. Calculate page-level conversion rates
      const conversionRates = await this.calculatePageConversionRates(journeySessions);

      // 3. Analyze exit triggers
      const exitTriggerAnalysis = await this.analyzeExitTriggers(droppedOffSessions);

      // 4. Perform time-based analysis
      const timeBasedPatterns = await this.analyzeTimingPatterns(droppedOffSessions);

      // 5. Statistical analysis comparing successful vs dropped-off journeys
      const statisticalSummary = await this.performStatisticalAnalysis(
        completedSessions,
        droppedOffSessions
      );

      // 6. Generate recommendations based on patterns
      const recommendations = await this.generateDropOffRecommendations(
        dropOffPatterns,
        conversionRates,
        exitTriggerAnalysis
      );

      const processingTime = Date.now() - startTime;

      return {
        dropOffPatterns,
        conversionRates,
        exitTriggerAnalysis,
        timeBasedPatterns,
        statisticalSummary,
        recommendations
      };
    } catch (error) {
      console.error('Drop-off analysis failed:', error);
      return this.createEmptyAnalysis(Date.now() - startTime);
    }
  }

  /**
   * Identify drop-off patterns by clustering similar exit behaviors
   */
  private async identifyDropOffPatterns(droppedOffSessions: JourneySession[]): Promise<DropOffPattern[]> {
    const patterns: DropOffPattern[] = [];

    // Group sessions by exit point and trigger
    const exitGroups = new Map<string, JourneySession[]>();

    droppedOffSessions.forEach(session => {
      const key = `${session.exitPoint || 'unknown'}-${session.exitTrigger || 'unknown'}`;
      if (!exitGroups.has(key)) {
        exitGroups.set(key, []);
      }
      exitGroups.get(key)!.push(session);
    });

    // Analyze each group for patterns
    for (const [key, sessions] of exitGroups.entries()) {
      if (sessions.length < this.minSampleSize) continue;

      const [exitPoint, exitTrigger] = key.split('-');
      const pattern = await this.createDropOffPattern(exitPoint, exitTrigger, sessions);
      
      if (pattern && pattern.confidenceScore >= this.confidenceThreshold) {
        patterns.push(pattern);
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Create a drop-off pattern from grouped sessions
   */
  private async createDropOffPattern(
    exitPoint: string,
    exitTrigger: string,
    sessions: JourneySession[]
  ): Promise<DropOffPattern | null> {
    const frequency = sessions.length;
    
    // Calculate average time before exit
    const avgTimeBeforeExit = this.calculateAverageTimeBeforeExit(sessions);
    
    // Extract associated content elements
    const associatedContent = await this.extractAssociatedContent(sessions);
    
    // Calculate confidence score based on frequency and consistency
    const confidenceScore = this.calculatePatternConfidence(sessions, frequency);
    
    // Generate initial recommendations
    const recommendations = await this.generatePatternRecommendations(
      exitPoint,
      exitTrigger,
      sessions
    );

    return {
      id: randomUUID(),
      pageType: exitPoint,
      exitTrigger,
      frequency,
      avgTimeBeforeExit,
      confidenceScore,
      associatedContent,
      recommendations,
      identifiedAt: new Date(),
      lastUpdated: new Date(),
      isActive: true
    };
  }

  /**
   * Calculate page-level conversion rates
   */
  private async calculatePageConversionRates(sessions: JourneySession[]): Promise<PageConversionRate[]> {
    const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];
    const conversionRates: PageConversionRate[] = [];

    for (const pageType of pageTypes) {
      const pageVisits = sessions.flatMap(s => s.pageVisits.filter(pv => pv.pageType === pageType));
      const completedSessions = sessions.filter(s => 
        s.finalOutcome === 'completed' && 
        s.pageVisits.some(pv => pv.pageType === pageType)
      );

      const visits = pageVisits.length;
      const conversions = completedSessions.length;
      const conversionRate = visits > 0 ? conversions / visits : 0;
      
      // Calculate average time on page
      const avgTimeOnPage = pageVisits.length > 0 
        ? pageVisits.reduce((sum, pv) => sum + pv.timeOnPage, 0) / pageVisits.length
        : 0;

      // Calculate bounce rate (exits without progression)
      const bounces = pageVisits.filter(pv => 
        pv.exitAction === 'close' || pv.exitAction === 'back' || pv.exitAction === 'timeout'
      ).length;
      const bounceRate = visits > 0 ? bounces / visits : 0;

      conversionRates.push({
        pageType,
        visits,
        conversions,
        conversionRate,
        avgTimeOnPage,
        bounceRate
      });
    }

    return conversionRates.sort((a, b) => a.conversionRate - b.conversionRate);
  }

  /**
   * Analyze exit triggers and their patterns
   */
  private async analyzeExitTriggers(droppedOffSessions: JourneySession[]): Promise<DropOffTrigger[]> {
    const triggerGroups = new Map<ExitTrigger, JourneySession[]>();

    // Group by exit trigger
    droppedOffSessions.forEach(session => {
      const trigger = session.exitTrigger || 'unknown';
      if (!triggerGroups.has(trigger as ExitTrigger)) {
        triggerGroups.set(trigger as ExitTrigger, []);
      }
      triggerGroups.get(trigger as ExitTrigger)!.push(session);
    });

    const triggers: DropOffTrigger[] = [];

    for (const [trigger, sessions] of triggerGroups.entries()) {
      const frequency = sessions.length;
      const averageTime = this.calculateAverageTimeBeforeExit(sessions);
      const pages = [...new Set(sessions.map(s => s.exitPoint).filter(Boolean))];

      triggers.push({
        trigger,
        frequency,
        averageTime,
        pages
      });
    }

    return triggers.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Analyze timing patterns in drop-offs
   */
  private async analyzeTimingPatterns(droppedOffSessions: JourneySession[]): Promise<TimeAnalytics[]> {
    const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];
    const timeAnalytics: TimeAnalytics[] = [];

    for (const pageType of pageTypes) {
      const pageVisits = droppedOffSessions
        .flatMap(s => s.pageVisits.filter(pv => pv.pageType === pageType))
        .filter(pv => pv.timeOnPage > 0);

      if (pageVisits.length < this.minSampleSize) continue;

      const times = pageVisits.map(pv => pv.timeOnPage).sort((a, b) => a - b);
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const medianTime = times[Math.floor(times.length / 2)];

      const percentiles = {
        p25: times[Math.floor(times.length * 0.25)],
        p50: medianTime,
        p75: times[Math.floor(times.length * 0.75)],
        p90: times[Math.floor(times.length * 0.90)],
        p95: times[Math.floor(times.length * 0.95)]
      };

      timeAnalytics.push({
        pageType,
        avgTimeOnPage: avgTime,
        medianTimeOnPage: medianTime,
        percentiles,
        dropOffTimeThreshold: percentiles.p75, // 75th percentile as drop-off threshold
        engagementTimeThreshold: percentiles.p25 // 25th percentile as minimum engagement
      });
    }

    return timeAnalytics;
  }

  /**
   * Perform statistical analysis comparing successful vs dropped-off journeys
   */
  private async performStatisticalAnalysis(
    completedSessions: JourneySession[],
    droppedOffSessions: JourneySession[]
  ): Promise<JourneyStatistics> {
    const totalSessions = completedSessions.length + droppedOffSessions.length;
    const completedCount = completedSessions.length;
    
    if (totalSessions < this.minSampleSize) {
      return {
        sampleSize: totalSessions,
        confidenceInterval: { lower: 0, upper: 1 },
        pValue: 1.0,
        effectSize: 0,
        statisticalPower: 0
      };
    }

    // Use Wilson confidence interval for proportion
    const stats = calculateStatisticalSignificance(completedCount, totalSessions, 0.5);

    return {
      sampleSize: totalSessions,
      confidenceInterval: stats.confidenceInterval,
      pValue: stats.pValue,
      effectSize: stats.effectSize,
      statisticalPower: stats.powerAnalysis.power
    };
  }

  /**
   * Generate recommendations based on identified patterns
   */
  private async generateDropOffRecommendations(
    dropOffPatterns: DropOffPattern[],
    conversionRates: PageConversionRate[],
    exitTriggers: DropOffTrigger[]
  ): Promise<DropOffRecommendation[]> {
    const recommendations: DropOffRecommendation[] = [];

    // Generate recommendations for each high-frequency drop-off pattern
    for (const pattern of dropOffPatterns.slice(0, 5)) { // Top 5 patterns
      const recommendation = await this.createRecommendationFromPattern(
        pattern,
        conversionRates,
        exitTriggers
      );
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Generate recommendations for low conversion pages
    const lowConversionPages = conversionRates.filter(cr => cr.conversionRate < 0.3);
    for (const page of lowConversionPages) {
      const recommendation = await this.createRecommendationFromConversion(page);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    return recommendations.sort((a, b) => {
      // Sort by priority and confidence
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriorityValue = priorityOrder[a.priority];
      const bPriorityValue = priorityOrder[b.priority];
      
      if (aPriorityValue !== bPriorityValue) {
        return bPriorityValue - aPriorityValue;
      }
      
      return b.confidenceScore - a.confidenceScore;
    });
  }

  /**
   * Create recommendation from drop-off pattern
   */
  private async createRecommendationFromPattern(
    pattern: DropOffPattern,
    conversionRates: PageConversionRate[],
    exitTriggers: DropOffTrigger[]
  ): Promise<DropOffRecommendation | null> {
    const pageConversion = conversionRates.find(cr => cr.pageType === pattern.pageType);
    if (!pageConversion) return null;

    let recommendation: DropOffRecommendation;

    switch (pattern.exitTrigger) {
      case 'content_based':
        recommendation = {
          id: randomUUID(),
          priority: pattern.frequency > 10 ? 'high' : 'medium',
          type: 'content',
          title: `Improve ${pattern.pageType} page content`,
          description: `${pattern.frequency} users are dropping off from ${pattern.pageType} page due to content issues. Average time before exit: ${Math.round(pattern.avgTimeBeforeExit)} seconds.`,
          targetPage: pattern.pageType as JourneyPageType,
          expectedImprovement: this.calculateExpectedImprovement(pattern, pageConversion),
          confidenceScore: pattern.confidenceScore,
          basedOnPattern: pattern.id,
          implementationSteps: [
            'Review content clarity and relevance',
            'Simplify complex sections',
            'Add compelling value propositions',
            'Include social proof elements',
            'A/B test content variations'
          ]
        };
        break;

      case 'time_based':
        recommendation = {
          id: randomUUID(),
          priority: 'medium',
          type: 'timing',
          title: `Optimize ${pattern.pageType} page loading and engagement`,
          description: `Users are spending too much time (avg: ${Math.round(pattern.avgTimeBeforeExit)} seconds) before dropping off from ${pattern.pageType} page.`,
          targetPage: pattern.pageType as JourneyPageType,
          expectedImprovement: this.calculateExpectedImprovement(pattern, pageConversion),
          confidenceScore: pattern.confidenceScore,
          basedOnPattern: pattern.id,
          implementationSteps: [
            'Optimize page loading speed',
            'Implement progressive loading',
            'Add engagement elements (videos, interactions)',
            'Reduce information overload',
            'Add progress indicators'
          ]
        };
        break;

      case 'technical':
        recommendation = {
          id: randomUUID(),
          priority: 'high',
          type: 'technical',
          title: `Fix technical issues on ${pattern.pageType} page`,
          description: `Technical issues are causing ${pattern.frequency} users to drop off from ${pattern.pageType} page.`,
          targetPage: pattern.pageType as JourneyPageType,
          expectedImprovement: this.calculateExpectedImprovement(pattern, pageConversion),
          confidenceScore: pattern.confidenceScore,
          basedOnPattern: pattern.id,
          implementationSteps: [
            'Investigate error logs',
            'Fix JavaScript errors',
            'Optimize mobile compatibility',
            'Test cross-browser functionality',
            'Implement error monitoring'
          ]
        };
        break;

      default:
        recommendation = {
          id: randomUUID(),
          priority: 'low',
          type: 'ux',
          title: `General UX improvements for ${pattern.pageType} page`,
          description: `${pattern.frequency} users are dropping off from ${pattern.pageType} page for unknown reasons.`,
          targetPage: pattern.pageType as JourneyPageType,
          expectedImprovement: this.calculateExpectedImprovement(pattern, pageConversion),
          confidenceScore: pattern.confidenceScore * 0.7, // Lower confidence for unknown triggers
          basedOnPattern: pattern.id,
          implementationSteps: [
            'Conduct user interviews',
            'Analyze user recordings',
            'Implement heatmap tracking',
            'Test different UI variations',
            'Gather user feedback'
          ]
        };
    }

    return recommendation;
  }

  /**
   * Create recommendation from low conversion rate
   */
  private async createRecommendationFromConversion(
    pageConversion: PageConversionRate
  ): Promise<DropOffRecommendation> {
    return {
      id: randomUUID(),
      priority: pageConversion.conversionRate < 0.1 ? 'high' : 'medium',
      type: 'content',
      title: `Improve conversion rate for ${pageConversion.pageType} page`,
      description: `${pageConversion.pageType} page has low conversion rate (${Math.round(pageConversion.conversionRate * 100)}%) with high bounce rate (${Math.round(pageConversion.bounceRate * 100)}%).`,
      targetPage: pageConversion.pageType as JourneyPageType,
      expectedImprovement: Math.min(50, (0.5 - pageConversion.conversionRate) * 100),
      confidenceScore: pageConversion.visits > 20 ? 0.8 : 0.6,
      basedOnPattern: 'conversion-analysis',
      implementationSteps: [
        'Analyze successful journey patterns',
        'Simplify the conversion process',
        'Add trust signals and testimonials',
        'Optimize call-to-action placement',
        'Reduce form complexity',
        'Test different value propositions'
      ]
    };
  }

  // Helper methods

  private calculateAverageTimeBeforeExit(sessions: JourneySession[]): number {
    const times = sessions.map(s => {
      const lastPageVisit = s.pageVisits[s.pageVisits.length - 1];
      return lastPageVisit ? lastPageVisit.timeOnPage : 0;
    }).filter(t => t > 0);

    return times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0;
  }

  private async extractAssociatedContent(sessions: JourneySession[]): Promise<string[]> {
    // Extract content elements from sessions
    const contentElements = new Set<string>();
    
    sessions.forEach(session => {
      session.pageVisits.forEach(visit => {
        if (visit.contentVersionId) {
          contentElements.add(visit.contentVersionId);
        }
      });
    });

    return Array.from(contentElements);
  }

  private calculatePatternConfidence(sessions: JourneySession[], frequency: number): number {
    if (sessions.length < this.minSampleSize) return 0;

    // Base confidence on frequency and consistency
    const frequencyScore = Math.min(1, frequency / 20); // Max at 20 occurrences
    
    // Calculate consistency based on similar timing patterns
    const timeVariance = this.calculateTimeVariance(sessions);
    const consistencyScore = Math.max(0, 1 - timeVariance / 300); // Normalize by 5 minutes
    
    return Math.round((frequencyScore * 0.6 + consistencyScore * 0.4) * 100) / 100;
  }

  private calculateTimeVariance(sessions: JourneySession[]): number {
    const times = sessions.map(s => {
      const lastPageVisit = s.pageVisits[s.pageVisits.length - 1];
      return lastPageVisit ? lastPageVisit.timeOnPage : 0;
    }).filter(t => t > 0);

    if (times.length < 2) return 0;

    const avg = times.reduce((sum, t) => sum + t, 0) / times.length;
    const variance = times.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / times.length;
    
    return Math.sqrt(variance);
  }

  private calculateExpectedImprovement(
    pattern: DropOffPattern,
    pageConversion: PageConversionRate
  ): number {
    // Calculate expected improvement based on pattern frequency and current conversion rate
    const impactFactor = pattern.frequency / 100; // Normalize frequency
    const conversionGap = 0.8 - pageConversion.conversionRate; // Assume 80% is ideal
    
    return Math.min(50, Math.round(impactFactor * conversionGap * 100));
  }

  private async generatePatternRecommendations(
    exitPoint: string,
    exitTrigger: string,
    sessions: JourneySession[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    switch (exitTrigger) {
      case 'content_based':
        recommendations.push('Review and improve content clarity');
        recommendations.push('Add compelling value propositions');
        recommendations.push('Include social proof elements');
        break;
      case 'time_based':
        recommendations.push('Optimize page loading speed');
        recommendations.push('Reduce information overload');
        recommendations.push('Add engagement elements');
        break;
      case 'technical':
        recommendations.push('Fix technical errors');
        recommendations.push('Improve mobile compatibility');
        recommendations.push('Optimize cross-browser support');
        break;
      default:
        recommendations.push('Conduct user research');
        recommendations.push('Analyze user behavior patterns');
        recommendations.push('Test UI improvements');
    }

    return recommendations;
  }

  private createEmptyAnalysis(processingTime: number): DropOffAnalysis {
    return {
      dropOffPatterns: [],
      conversionRates: [],
      exitTriggerAnalysis: [],
      timeBasedPatterns: [],
      statisticalSummary: {
        sampleSize: 0,
        confidenceInterval: { lower: 0, upper: 1 },
        pValue: 1.0,
        effectSize: 0,
        statisticalPower: 0
      },
      recommendations: []
    };
  }

  /**
   * Compare successful vs dropped-off journeys
   */
  async compareJourneys(
    successfulSessions: JourneySession[],
    droppedOffSessions: JourneySession[]
  ): Promise<JourneyComparison> {
    // Time comparison
    const successfulTimeAnalytics = await this.calculateTimeAnalyticsForSessions(successfulSessions);
    const droppedOffTimeAnalytics = await this.calculateTimeAnalyticsForSessions(droppedOffSessions);
    
    // Engagement comparison
    const successfulEngagement = this.calculateAverageEngagement(successfulSessions);
    const droppedOffEngagement = this.calculateAverageEngagement(droppedOffSessions);
    
    // Content comparison
    const successfulContent = this.extractContentElements(successfulSessions);
    const droppedOffContent = this.extractContentElements(droppedOffSessions);

    return {
      successfulJourneys: successfulSessions,
      droppedOffJourneys: droppedOffSessions,
      keyDifferences: {
        timeOnPage: {
          successful: successfulTimeAnalytics,
          droppedOff: droppedOffTimeAnalytics,
          significantDifferences: this.identifyTimeSignificantDifferences(
            successfulTimeAnalytics,
            droppedOffTimeAnalytics
          )
        },
        engagementScore: {
          successfulAvg: successfulEngagement,
          droppedOffAvg: droppedOffEngagement,
          significantDifference: Math.abs(successfulEngagement - droppedOffEngagement) > 0.1,
          pValue: this.calculateEngagementPValue(successfulSessions, droppedOffSessions)
        },
        contentElements: {
          successfulContent,
          droppedOffContent,
          significantElements: this.identifySignificantContentElements(
            successfulContent,
            droppedOffContent
          ),
          correlationScore: this.calculateContentCorrelation(successfulContent, droppedOffContent)
        }
      },
      recommendations: []
    };
  }

  private async calculateTimeAnalyticsForSessions(sessions: JourneySession[]): Promise<TimeAnalytics[]> {
    const pageTypes: JourneyPageType[] = ['activation', 'agreement', 'confirmation', 'processing'];
    const analytics: TimeAnalytics[] = [];

    for (const pageType of pageTypes) {
      const pageVisits = sessions.flatMap(s => 
        s.pageVisits.filter(pv => pv.pageType === pageType && pv.timeOnPage > 0)
      );

      if (pageVisits.length === 0) continue;

      const times = pageVisits.map(pv => pv.timeOnPage).sort((a, b) => a - b);
      const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
      const medianTime = times[Math.floor(times.length / 2)];

      analytics.push({
        pageType,
        avgTimeOnPage: avgTime,
        medianTimeOnPage: medianTime,
        percentiles: {
          p25: times[Math.floor(times.length * 0.25)],
          p50: medianTime,
          p75: times[Math.floor(times.length * 0.75)],
          p90: times[Math.floor(times.length * 0.90)],
          p95: times[Math.floor(times.length * 0.95)]
        },
        dropOffTimeThreshold: 0,
        engagementTimeThreshold: 0
      });
    }

    return analytics;
  }

  private calculateAverageEngagement(sessions: JourneySession[]): number {
    const allPageVisits = sessions.flatMap(s => s.pageVisits);
    if (allPageVisits.length === 0) return 0;

    return allPageVisits.reduce((sum, pv) => sum + pv.engagementScore, 0) / allPageVisits.length;
  }

  private extractContentElements(sessions: JourneySession[]): string[] {
    const contentElements = new Set<string>();
    sessions.forEach(session => {
      session.pageVisits.forEach(visit => {
        if (visit.contentVersionId) {
          contentElements.add(visit.contentVersionId);
        }
      });
    });
    return Array.from(contentElements);
  }

  private identifyTimeSignificantDifferences(
    successful: TimeAnalytics[],
    droppedOff: TimeAnalytics[]
  ): string[] {
    const differences: string[] = [];
    
    successful.forEach(successfulAnalytic => {
      const droppedOffAnalytic = droppedOff.find(d => d.pageType === successfulAnalytic.pageType);
      if (droppedOffAnalytic) {
        const timeDiff = Math.abs(successfulAnalytic.avgTimeOnPage - droppedOffAnalytic.avgTimeOnPage);
        if (timeDiff > 30) { // 30 seconds significant difference
          differences.push(`${successfulAnalytic.pageType}: ${Math.round(timeDiff)} second difference`);
        }
      }
    });

    return differences;
  }

  private calculateEngagementPValue(
    successfulSessions: JourneySession[],
    droppedOffSessions: JourneySession[]
  ): number {
    // Simplified p-value calculation for engagement difference
    const successfulEngagement = this.calculateAverageEngagement(successfulSessions);
    const droppedOffEngagement = this.calculateAverageEngagement(droppedOffSessions);
    
    const diff = Math.abs(successfulEngagement - droppedOffEngagement);
    
    // Simple approximation: larger differences have lower p-values
    return Math.max(0.001, Math.min(1, 1 - (diff * 2)));
  }

  private identifySignificantContentElements(
    successfulContent: string[],
    droppedOffContent: string[]
  ): string[] {
    const significantElements: string[] = [];
    
    // Find elements that appear more frequently in successful journeys
    const successfulSet = new Set(successfulContent);
    const droppedOffSet = new Set(droppedOffContent);
    
    successfulSet.forEach(element => {
      const successfulFreq = successfulContent.filter(e => e === element).length;
      const droppedOffFreq = droppedOffContent.filter(e => e === element).length;
      
      if (successfulFreq > droppedOffFreq * 1.5) { // 50% more frequent
        significantElements.push(element);
      }
    });

    return significantElements;
  }

  private calculateContentCorrelation(
    successfulContent: string[],
    droppedOffContent: string[]
  ): number {
    if (successfulContent.length === 0 && droppedOffContent.length === 0) return 1;
    if (successfulContent.length === 0 || droppedOffContent.length === 0) return 0;

    const successfulSet = new Set(successfulContent);
    const droppedOffSet = new Set(droppedOffContent);
    
    const intersection = new Set([...successfulSet].filter(x => droppedOffSet.has(x)));
    const union = new Set([...successfulSet, ...droppedOffSet]);
    
    return intersection.size / union.size;
  }
}

// Export singleton instance and utility functions
export const dropOffDetectionEngine = new DropOffDetectionEngine();

export async function analyzeJourneyDropOffs(
  journeySessions: JourneySession[]
): Promise<DropOffAnalysis> {
  return dropOffDetectionEngine.analyzeDropOffPatterns(journeySessions);
}

export async function compareJourneyOutcomes(
  successfulSessions: JourneySession[],
  droppedOffSessions: JourneySession[]
): Promise<JourneyComparison> {
  return dropOffDetectionEngine.compareJourneys(successfulSessions, droppedOffSessions);
}