/**
 * Real-time Conversion Rate Tracking
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Live conversion rate tracking with trend indicators and statistical analysis.
 * Implements AC 4: Real-time conversion rate updates with trend indicators.
 */

import { EventEmitter } from 'events';
import { ConversionMetrics } from '../real-time/dashboard-updates';

/**
 * Conversion data point for time-series analysis
 */
export interface ConversionDataPoint {
  timestamp: Date;
  conversions: number;
  totalAttempts: number;
  conversionRate: number;
  pageType: string;
  clientSegment?: string;
}

/**
 * Conversion trend analysis result
 */
export interface ConversionTrend {
  direction: 'up' | 'down' | 'stable';
  magnitude: number;           // Percentage change
  confidence: number;          // Statistical confidence in trend (0-1)
  timeframe: string;          // e.g., "last_hour", "last_24h"
  dataPoints: number;         // Number of data points used
  statisticalSignificance: number; // P-value for trend test
}

/**
 * Real-time conversion analytics
 */
export interface ConversionAnalytics {
  currentRate: number;
  hourlyRate: number;
  dailyRate: number;
  weeklyRate: number;
  trend: ConversionTrend;
  projectedDailyConversions: number;
  confidence: {
    lower: number;
    upper: number;
    level: number;
  };
  segments: {
    [segment: string]: {
      rate: number;
      trend: 'up' | 'down' | 'stable';
      sample: number;
    };
  };
}

/**
 * Time window configuration for different analysis periods
 */
interface TimeWindow {
  label: string;
  durationMs: number;
  minDataPoints: number;
  updateIntervalMs: number;
}

// Optimized time windows for real-time analysis
const TIME_WINDOWS: { [key: string]: TimeWindow } = {
  realtime: { label: 'Real-time', durationMs: 300000, minDataPoints: 3, updateIntervalMs: 10000 },    // 5 minutes
  hourly: { label: 'Hourly', durationMs: 3600000, minDataPoints: 5, updateIntervalMs: 60000 },       // 1 hour
  daily: { label: 'Daily', durationMs: 86400000, minDataPoints: 10, updateIntervalMs: 300000 },      // 24 hours  
  weekly: { label: 'Weekly', durationMs: 604800000, minDataPoints: 20, updateIntervalMs: 1800000 }   // 7 days
};

/**
 * Real-time Conversion Tracker
 * Tracks conversion rates with sophisticated statistical analysis
 */
export class RealTimeConversionTracker extends EventEmitter {
  private conversionHistory: ConversionDataPoint[] = [];
  private segmentHistory: Map<string, ConversionDataPoint[]> = new Map();
  private currentMetrics: ConversionMetrics | null = null;
  private updateTimers: Map<string, NodeJS.Timeout> = new Map();
  private isTracking: boolean = false;

  // Performance metrics
  private trackingMetrics = {
    totalConversions: 0,
    totalAttempts: 0,
    trackingStartTime: new Date(),
    lastUpdateTime: new Date(),
    updateCount: 0
  };

  constructor() {
    super();
    this.initializeTracking();
  }

  /**
   * Start real-time conversion tracking
   */
  start(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.trackingMetrics.trackingStartTime = new Date();
    
    // Start update timers for different time windows
    for (const [windowName, config] of Object.entries(TIME_WINDOWS)) {
      const timer = setInterval(() => {
        this.updateConversionAnalytics(windowName);
      }, config.updateIntervalMs);
      
      this.updateTimers.set(windowName, timer);
    }

    console.log('Real-time conversion tracking started');
    this.emit('tracking_started', { timestamp: new Date() });
  }

  /**
   * Stop real-time conversion tracking
   */
  stop(): void {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    
    // Clear all timers
    for (const timer of this.updateTimers.values()) {
      clearInterval(timer);
    }
    this.updateTimers.clear();

    console.log('Real-time conversion tracking stopped');
    this.emit('tracking_stopped', { timestamp: new Date() });
  }

  /**
   * Track new conversion event
   * Main method for recording conversion data points
   */
  trackConversion(
    outcome: 'success' | 'failure',
    pageType: string = 'unknown',
    clientSegment: string = 'default',
    metadata?: any
  ): void {
    if (!this.isTracking) return;

    const timestamp = new Date();
    const conversions = outcome === 'success' ? 1 : 0;
    
    // Update tracking metrics
    this.trackingMetrics.totalConversions += conversions;
    this.trackingMetrics.totalAttempts += 1;
    this.trackingMetrics.lastUpdateTime = timestamp;
    this.trackingMetrics.updateCount++;

    // Create data point
    const dataPoint: ConversionDataPoint = {
      timestamp,
      conversions,
      totalAttempts: 1,
      conversionRate: conversions,
      pageType,
      clientSegment
    };

    // Add to history
    this.addToHistory(dataPoint);
    this.addToSegmentHistory(clientSegment, dataPoint);

    // Trigger immediate analytics update for high-frequency events
    if (this.trackingMetrics.updateCount % 5 === 0) { // Every 5 events
      setImmediate(() => this.updateConversionAnalytics('realtime'));
    }

    // Emit conversion event
    this.emit('conversion_tracked', {
      outcome,
      pageType,
      clientSegment,
      timestamp,
      cumulativeRate: this.trackingMetrics.totalConversions / this.trackingMetrics.totalAttempts,
      metadata
    });
  }

  /**
   * Get current real-time conversion metrics
   */
  getCurrentMetrics(): ConversionMetrics {
    if (!this.currentMetrics) {
      return this.calculateDefaultMetrics();
    }
    return { ...this.currentMetrics, lastUpdated: new Date() };
  }

  /**
   * Get detailed conversion analytics for time window
   */
  getConversionAnalytics(timeWindow: string = 'hourly'): ConversionAnalytics {
    const window = TIME_WINDOWS[timeWindow] || TIME_WINDOWS.hourly;
    const windowData = this.getDataForTimeWindow(window);
    
    if (windowData.length < window.minDataPoints) {
      return this.getDefaultAnalytics();
    }

    // Calculate current rates
    const totalConversions = windowData.reduce((sum, dp) => sum + dp.conversions, 0);
    const totalAttempts = windowData.reduce((sum, dp) => sum + dp.totalAttempts, 0);
    const currentRate = totalAttempts > 0 ? (totalConversions / totalAttempts) * 100 : 0;

    // Calculate trend
    const trend = this.calculateTrend(windowData, timeWindow);

    // Calculate confidence interval
    const confidence = this.calculateConfidenceInterval(totalConversions, totalAttempts);

    // Calculate segment performance
    const segments = this.calculateSegmentPerformance(window);

    // Project daily conversions
    const projectedDailyConversions = this.projectDailyConversions(windowData, window);

    return {
      currentRate,
      hourlyRate: this.calculateRateForWindow(TIME_WINDOWS.hourly),
      dailyRate: this.calculateRateForWindow(TIME_WINDOWS.daily),
      weeklyRate: this.calculateRateForWindow(TIME_WINDOWS.weekly),
      trend,
      projectedDailyConversions,
      confidence,
      segments
    };
  }

  /**
   * Calculate conversion trend with statistical significance
   */
  private calculateTrend(
    data: ConversionDataPoint[], 
    timeframe: string
  ): ConversionTrend {
    
    if (data.length < 3) {
      return {
        direction: 'stable',
        magnitude: 0,
        confidence: 0,
        timeframe,
        dataPoints: data.length,
        statisticalSignificance: 1.0
      };
    }

    // Aggregate data into time buckets for trend analysis
    const buckets = this.aggregateIntoBuckets(data, 6); // 6 time buckets
    
    if (buckets.length < 3) {
      return {
        direction: 'stable',
        magnitude: 0,
        confidence: 0,
        timeframe,
        dataPoints: data.length,
        statisticalSignificance: 1.0
      };
    }

    // Calculate linear trend
    const rates = buckets.map(bucket => bucket.conversionRate * 100);
    const trend = this.calculateLinearTrend(rates);
    
    // Determine direction and magnitude
    let direction: 'up' | 'down' | 'stable' = 'stable';
    const magnitude = Math.abs(trend.slope);
    
    if (trend.slope > 0.5) { // 0.5% threshold
      direction = 'up';
    } else if (trend.slope < -0.5) {
      direction = 'down';
    }

    // Calculate statistical significance
    const significance = this.calculateTrendSignificance(rates, trend.slope);

    return {
      direction,
      magnitude,
      confidence: Math.max(0, Math.min(1, trend.rSquared)),
      timeframe,
      dataPoints: data.length,
      statisticalSignificance: significance.pValue
    };
  }

  /**
   * Calculate linear trend in conversion rates
   */
  private calculateLinearTrend(values: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
  } {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = values.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const residualSumSquares = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(val - predicted, 2);
    }, 0);
    
    const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

    return { slope, intercept, rSquared };
  }

  /**
   * Calculate statistical significance of trend
   */
  private calculateTrendSignificance(
    values: number[], 
    slope: number
  ): { pValue: number; tStatistic: number } {
    const n = values.length;
    if (n < 3) return { pValue: 1.0, tStatistic: 0 };

    // Calculate standard error (simplified)
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const standardError = Math.sqrt(variance / n);
    
    if (standardError === 0) return { pValue: 1.0, tStatistic: 0 };
    
    const tStatistic = slope / standardError;
    const degreesOfFreedom = n - 2;
    
    // Simplified p-value calculation (would use proper t-distribution in production)
    const pValue = Math.min(1.0, 2 * (1 - this.normalCDF(Math.abs(tStatistic))));
    
    return { pValue, tStatistic };
  }

  /**
   * Simplified normal CDF approximation
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private erf(x: number): number {
    // Abramowitz and Stegun approximation
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

  /**
   * Update conversion analytics for specific time window
   */
  private updateConversionAnalytics(windowName: string): void {
    if (!this.isTracking) return;

    try {
      const analytics = this.getConversionAnalytics(windowName);
      
      // Update current metrics
      this.currentMetrics = {
        currentConversionRate: analytics.currentRate,
        todayConversions: this.getTodayConversions(),
        activeJourneys: this.getActiveJourneys(),
        newPatternsToday: this.getNewPatternsToday(),
        trend: analytics.trend.direction,
        trendPercentage: analytics.trend.magnitude,
        lastUpdated: new Date()
      };

      // Emit analytics update
      this.emit('analytics_updated', {
        windowName,
        analytics,
        metrics: this.currentMetrics,
        timestamp: new Date()
      });

    } catch (error) {
      console.error(`Error updating conversion analytics for ${windowName}:`, error);
    }
  }

  /**
   * Helper methods
   */
  private addToHistory(dataPoint: ConversionDataPoint): void {
    this.conversionHistory.push(dataPoint);
    
    // Keep last 24 hours of data for performance
    const cutoffTime = Date.now() - TIME_WINDOWS.daily.durationMs;
    this.conversionHistory = this.conversionHistory.filter(dp => 
      dp.timestamp.getTime() > cutoffTime
    );
  }

  private addToSegmentHistory(segment: string, dataPoint: ConversionDataPoint): void {
    const segmentHistory = this.segmentHistory.get(segment) || [];
    segmentHistory.push(dataPoint);
    
    // Keep last 1000 entries per segment
    if (segmentHistory.length > 1000) {
      segmentHistory.shift();
    }
    
    this.segmentHistory.set(segment, segmentHistory);
  }

  private getDataForTimeWindow(window: TimeWindow): ConversionDataPoint[] {
    const cutoffTime = Date.now() - window.durationMs;
    return this.conversionHistory.filter(dp => dp.timestamp.getTime() > cutoffTime);
  }

  private aggregateIntoBuckets(data: ConversionDataPoint[], numBuckets: number): ConversionDataPoint[] {
    if (data.length === 0) return [];
    
    const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const bucketSize = Math.ceil(sortedData.length / numBuckets);
    const buckets: ConversionDataPoint[] = [];
    
    for (let i = 0; i < sortedData.length; i += bucketSize) {
      const bucketData = sortedData.slice(i, i + bucketSize);
      const totalConversions = bucketData.reduce((sum, dp) => sum + dp.conversions, 0);
      const totalAttempts = bucketData.reduce((sum, dp) => sum + dp.totalAttempts, 0);
      
      buckets.push({
        timestamp: bucketData[0].timestamp,
        conversions: totalConversions,
        totalAttempts,
        conversionRate: totalAttempts > 0 ? totalConversions / totalAttempts : 0,
        pageType: 'aggregated',
        clientSegment: 'all'
      });
    }
    
    return buckets;
  }

  private calculateRateForWindow(window: TimeWindow): number {
    const windowData = this.getDataForTimeWindow(window);
    if (windowData.length === 0) return 0;
    
    const totalConversions = windowData.reduce((sum, dp) => sum + dp.conversions, 0);
    const totalAttempts = windowData.reduce((sum, dp) => sum + dp.totalAttempts, 0);
    
    return totalAttempts > 0 ? (totalConversions / totalAttempts) * 100 : 0;
  }

  private calculateConfidenceInterval(conversions: number, attempts: number) {
    if (attempts === 0) return { lower: 0, upper: 0, level: 0.95 };
    
    const rate = conversions / attempts;
    const z = 1.96; // 95% confidence level
    const margin = z * Math.sqrt((rate * (1 - rate)) / attempts);
    
    return {
      lower: Math.max(0, (rate - margin) * 100),
      upper: Math.min(100, (rate + margin) * 100),
      level: 0.95
    };
  }

  private calculateSegmentPerformance(window: TimeWindow): { [segment: string]: any } {
    const segments: { [segment: string]: any } = {};
    
    for (const [segment, history] of this.segmentHistory.entries()) {
      const cutoffTime = Date.now() - window.durationMs;
      const segmentData = history.filter(dp => dp.timestamp.getTime() > cutoffTime);
      
      if (segmentData.length > 0) {
        const totalConversions = segmentData.reduce((sum, dp) => sum + dp.conversions, 0);
        const totalAttempts = segmentData.reduce((sum, dp) => sum + dp.totalAttempts, 0);
        const rate = totalAttempts > 0 ? (totalConversions / totalAttempts) * 100 : 0;
        
        // Simple trend for segment
        const trend = segmentData.length > 2 
          ? this.calculateSimpleTrend(segmentData)
          : 'stable';
        
        segments[segment] = {
          rate,
          trend,
          sample: totalAttempts
        };
      }
    }
    
    return segments;
  }

  private calculateSimpleTrend(data: ConversionDataPoint[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';
    
    const recent = data.slice(-3).map(dp => dp.conversionRate);
    const earlier = data.slice(0, Math.max(1, data.length - 3)).map(dp => dp.conversionRate);
    
    const recentAvg = recent.reduce((sum, rate) => sum + rate, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, rate) => sum + rate, 0) / earlier.length;
    
    const diff = recentAvg - earlierAvg;
    const threshold = 0.05; // 5% threshold
    
    if (diff > threshold) return 'up';
    if (diff < -threshold) return 'down';
    return 'stable';
  }

  private projectDailyConversions(data: ConversionDataPoint[], window: TimeWindow): number {
    if (data.length === 0) return 0;
    
    const totalConversions = data.reduce((sum, dp) => sum + dp.conversions, 0);
    const windowHours = window.durationMs / 3600000;
    const conversionRate = totalConversions / windowHours; // Conversions per hour
    
    return Math.round(conversionRate * 24); // Project to 24 hours
  }

  private getTodayConversions(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.conversionHistory
      .filter(dp => dp.timestamp >= today)
      .reduce((sum, dp) => sum + dp.conversions, 0);
  }

  private getActiveJourneys(): number {
    // This would connect to journey tracking system
    // For now, return estimated active journeys
    return Math.round(this.trackingMetrics.totalAttempts * 0.1); // 10% estimated active
  }

  private getNewPatternsToday(): number {
    // This would connect to pattern detection system
    // For now, return estimated new patterns
    return Math.round(this.getTodayConversions() / 10); // 1 pattern per 10 conversions
  }

  private calculateDefaultMetrics(): ConversionMetrics {
    return {
      currentConversionRate: 0,
      todayConversions: 0,
      activeJourneys: 0,
      newPatternsToday: 0,
      trend: 'stable',
      trendPercentage: 0,
      lastUpdated: new Date()
    };
  }

  private getDefaultAnalytics(): ConversionAnalytics {
    return {
      currentRate: 0,
      hourlyRate: 0,
      dailyRate: 0,
      weeklyRate: 0,
      trend: {
        direction: 'stable',
        magnitude: 0,
        confidence: 0,
        timeframe: 'hourly',
        dataPoints: 0,
        statisticalSignificance: 1.0
      },
      projectedDailyConversions: 0,
      confidence: { lower: 0, upper: 0, level: 0.95 },
      segments: {}
    };
  }

  private initializeTracking(): void {
    // Initialize with some sample data for development
    // In production, this would load recent historical data
  }

  /**
   * Public API methods
   */
  getTrackingMetrics() {
    return {
      ...this.trackingMetrics,
      currentRate: this.trackingMetrics.totalConversions / Math.max(1, this.trackingMetrics.totalAttempts),
      uptimeMs: Date.now() - this.trackingMetrics.trackingStartTime.getTime(),
      isTracking: this.isTracking,
      historySize: this.conversionHistory.length
    };
  }

  dispose(): void {
    this.stop();
    this.conversionHistory = [];
    this.segmentHistory.clear();
    this.removeAllListeners();
  }
}

/**
 * Singleton instance for application-wide use
 */
export const realtimeConversionTracker = new RealTimeConversionTracker();

/**
 * Utility functions
 */
export function trackConversion(
  outcome: 'success' | 'failure',
  pageType?: string,
  clientSegment?: string,
  metadata?: any
): void {
  realtimeConversionTracker.trackConversion(outcome, pageType, clientSegment, metadata);
}

export function getCurrentConversionMetrics(): ConversionMetrics {
  return realtimeConversionTracker.getCurrentMetrics();
}

export function getConversionAnalytics(timeWindow?: string): ConversionAnalytics {
  return realtimeConversionTracker.getConversionAnalytics(timeWindow);
}