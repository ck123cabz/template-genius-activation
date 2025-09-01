/**
 * Pattern Alert System  
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Statistical significance detection and alert generation for pattern changes.
 * Implements AC 2: New pattern alerts when significant trends are identified.
 */

import { EventEmitter } from 'events';
import {
  SuccessPattern,
  PatternType,
  calculateStatisticalSignificance,
  calculatePatternConfidence
} from '../data-models/pattern-models';
import { PatternAlert } from '../real-time/pattern-events';

/**
 * Alert Configuration for tuning sensitivity
 */
export interface AlertConfig {
  minSampleSize: number;           // Minimum samples before alerts
  confidenceChangeThreshold: number; // Minimum confidence change (0-1)
  significanceLevel: number;       // P-value threshold for significance
  trendDetectionWindow: number;    // Number of data points for trend analysis
  alertCooldownMs: number;        // Minimum time between similar alerts
  highConfidenceThreshold: number; // Threshold for high-confidence alerts
}

// Optimized configuration for Story 4.3 requirements
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  minSampleSize: 5,               // Need 5+ samples for reliable alerts
  confidenceChangeThreshold: 0.1, // 10% confidence change triggers alert
  significanceLevel: 0.05,        // Standard 5% significance level
  trendDetectionWindow: 5,        // Look at last 5 data points
  alertCooldownMs: 300000,       // 5-minute cooldown between similar alerts
  highConfidenceThreshold: 0.8   // 80% confidence = high confidence
};

/**
 * Pattern Trend Analysis Data
 */
export interface PatternTrend {
  patternId: string;
  direction: 'improving' | 'declining' | 'stable';
  magnitude: number;              // How strong the trend is (0-1)
  confidence: number;             // Statistical confidence in trend
  dataPoints: number;            // Number of points in analysis
  timeSpan: number;              // Time span in milliseconds
  lastUpdated: Date;
}

/**
 * Alert History for tracking and preventing spam
 */
interface AlertHistory {
  patternId: string;
  alertType: PatternAlert['type'];
  lastTriggered: Date;
  triggerCount: number;
  suppressed: boolean;
}

/**
 * Statistical Pattern Analysis Engine
 * Performs sophisticated trend detection and significance testing
 */
export class PatternStatisticalAnalyzer {
  
  /**
   * Detect if pattern change is statistically significant
   */
  static analyzePatternSignificance(
    pattern: SuccessPattern,
    historicalData: Array<{ confidence: number; sampleSize: number; timestamp: Date }>
  ): {
    isSignificant: boolean;
    pValue: number;
    trendDirection: 'improving' | 'declining' | 'stable';
    effectSize: number;
  } {
    
    if (historicalData.length < 3) {
      return {
        isSignificant: false,
        pValue: 1.0,
        trendDirection: 'stable',
        effectSize: 0
      };
    }

    // Calculate trend using linear regression
    const trend = this.calculateTrend(historicalData.map(d => d.confidence));
    
    // Calculate statistical significance of the trend
    const significance = this.calculateTrendSignificance(
      historicalData.map(d => d.confidence),
      trend.slope
    );

    // Determine trend direction
    let direction: 'improving' | 'declining' | 'stable' = 'stable';
    if (Math.abs(trend.slope) > 0.05) { // 5% change threshold
      direction = trend.slope > 0 ? 'improving' : 'declining';
    }

    return {
      isSignificant: significance.pValue <= 0.05,
      pValue: significance.pValue,
      trendDirection: direction,
      effectSize: Math.abs(trend.slope)
    };
  }

  /**
   * Calculate linear trend in confidence scores
   */
  private static calculateTrend(values: number[]): {
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
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    return { slope, intercept, rSquared };
  }

  /**
   * Calculate statistical significance of a trend
   */
  private static calculateTrendSignificance(
    values: number[], 
    slope: number
  ): { pValue: number; tStatistic: number } {
    const n = values.length;
    if (n < 3) return { pValue: 1.0, tStatistic: 0 };

    // Calculate standard error of the slope
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = values.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate residuals
    const residuals = values.map((val, i) => {
      const predicted = slope * i + (yMean - slope * xMean);
      return val - predicted;
    });
    
    const residualSumSquares = residuals.reduce((sum, res) => sum + res * res, 0);
    const standardError = Math.sqrt(residualSumSquares / (n - 2));
    
    const sumSquaredDeviationsX = x.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0);
    const slopeStandardError = standardError / Math.sqrt(sumSquaredDeviationsX);
    
    // Calculate t-statistic
    const tStatistic = slope / slopeStandardError;
    
    // Approximate p-value using t-distribution (simplified)
    const degreesOfFreedom = n - 2;
    const pValue = this.tDistributionPValue(Math.abs(tStatistic), degreesOfFreedom);
    
    return { pValue: pValue * 2, tStatistic }; // Two-tailed test
  }

  /**
   * Simplified t-distribution p-value calculation
   */
  private static tDistributionPValue(t: number, df: number): number {
    // Simplified approximation - in production, use proper statistical library
    if (df > 30) {
      // Use normal approximation for large df
      return 0.5 * (1 - this.erf(t / Math.sqrt(2)));
    } else {
      // Very simplified approximation for small df
      const x = t / Math.sqrt(t * t + df);
      return 0.5 - 0.5 * this.erf(x * Math.sqrt(Math.PI / 2));
    }
  }

  private static erf(x: number): number {
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
   * Detect anomalies in pattern confidence scores
   */
  static detectAnomalies(
    confidenceHistory: number[],
    threshold: number = 2.0 // Standard deviations from mean
  ): {
    hasAnomaly: boolean;
    anomalyScore: number;
    latestValue: number;
    expectedRange: { min: number; max: number };
  } {
    if (confidenceHistory.length < 5) {
      return {
        hasAnomaly: false,
        anomalyScore: 0,
        latestValue: confidenceHistory[confidenceHistory.length - 1] || 0,
        expectedRange: { min: 0, max: 1 }
      };
    }

    const values = confidenceHistory.slice(0, -1); // All except latest
    const latestValue = confidenceHistory[confidenceHistory.length - 1];
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    const zScore = Math.abs(latestValue - mean) / stdDev;
    const hasAnomaly = zScore > threshold;
    
    return {
      hasAnomaly,
      anomalyScore: zScore,
      latestValue,
      expectedRange: {
        min: mean - threshold * stdDev,
        max: mean + threshold * stdDev
      }
    };
  }
}

/**
 * Main Pattern Alert Engine
 * Generates and manages pattern alerts with sophisticated analysis
 */
export class PatternAlertEngine extends EventEmitter {
  private config: AlertConfig;
  private alertHistory: Map<string, AlertHistory> = new Map();
  private patternHistories: Map<string, Array<{
    confidence: number;
    sampleSize: number;
    successRate: number;
    timestamp: Date;
  }>> = new Map();

  constructor(config?: Partial<AlertConfig>) {
    super();
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  /**
   * Analyze pattern and generate alerts if significant changes detected
   * Main method for AC 2: New pattern alerts when significant trends identified
   */
  async analyzePatternForAlerts(
    currentPattern: SuccessPattern,
    previousPattern?: SuccessPattern
  ): Promise<PatternAlert[]> {
    const alerts: PatternAlert[] = [];
    const patternHistory = this.getPatternHistory(currentPattern.id);

    // Skip if insufficient data
    if (currentPattern.sampleSize < this.config.minSampleSize) {
      return alerts;
    }

    // Add current pattern to history
    this.updatePatternHistory(currentPattern);

    // 1. Check for confidence threshold alerts
    const confidenceAlert = await this.checkConfidenceThreshold(currentPattern, previousPattern);
    if (confidenceAlert) alerts.push(confidenceAlert);

    // 2. Check for statistical significance alerts
    const significanceAlert = await this.checkStatisticalSignificance(currentPattern);
    if (significanceAlert) alerts.push(significanceAlert);

    // 3. Check for trend-based alerts
    const trendAlerts = await this.checkTrendAlerts(currentPattern, patternHistory);
    alerts.push(...trendAlerts);

    // 4. Check for anomaly alerts
    const anomalyAlert = await this.checkAnomalyAlert(currentPattern, patternHistory);
    if (anomalyAlert) alerts.push(anomalyAlert);

    // Filter alerts based on cooldown and history
    const filteredAlerts = this.filterAlertsByCooldown(alerts);

    // Update alert history
    filteredAlerts.forEach(alert => this.updateAlertHistory(alert));

    return filteredAlerts;
  }

  /**
   * Check for confidence threshold alerts (AC 2)
   */
  private async checkConfidenceThreshold(
    current: SuccessPattern,
    previous?: SuccessPattern
  ): Promise<PatternAlert | null> {
    
    if (!previous) return null;

    const confidenceChange = current.confidenceScore - previous.confidenceScore;
    const changeThreshold = this.config.confidenceChangeThreshold;

    // High confidence increase alert
    if (confidenceChange >= changeThreshold) {
      return {
        id: this.generateAlertId(),
        type: 'confidence_increase',
        patternId: current.id,
        message: `Pattern confidence increased by ${Math.round(confidenceChange * 100)}% (${Math.round(previous.confidenceScore * 100)}% → ${Math.round(current.confidenceScore * 100)}%)`,
        significance: this.determineSignificance(confidenceChange, current.sampleSize),
        confidence: current.confidenceScore,
        previousConfidence: previous.confidenceScore,
        sampleSize: current.sampleSize,
        recommendedAction: current.confidenceScore >= this.config.highConfidenceThreshold
          ? 'Consider applying this pattern to new clients'
          : 'Monitor pattern for further validation',
        createdAt: new Date()
      };
    }

    // Significant confidence decrease alert
    if (confidenceChange <= -changeThreshold) {
      return {
        id: this.generateAlertId(),
        type: 'confidence_decrease',
        patternId: current.id,
        message: `Pattern confidence decreased by ${Math.round(Math.abs(confidenceChange) * 100)}% (${Math.round(previous.confidenceScore * 100)}% → ${Math.round(current.confidenceScore * 100)}%)`,
        significance: this.determineSignificance(Math.abs(confidenceChange), current.sampleSize),
        confidence: current.confidenceScore,
        previousConfidence: previous.confidenceScore,
        sampleSize: current.sampleSize,
        recommendedAction: 'Investigate potential issues with this pattern',
        createdAt: new Date()
      };
    }

    return null;
  }

  /**
   * Check for statistical significance alerts
   */
  private async checkStatisticalSignificance(
    pattern: SuccessPattern
  ): Promise<PatternAlert | null> {
    
    // Check if pattern just achieved statistical significance
    if (pattern.statisticalSignificance <= this.config.significanceLevel &&
        pattern.sampleSize >= 10) {
      
      // Check if this is a new achievement (not previously significant)
      const history = this.alertHistory.get(`${pattern.id}_statistical_significance`);
      if (!history || 
          (Date.now() - history.lastTriggered.getTime()) > this.config.alertCooldownMs) {
        
        return {
          id: this.generateAlertId(),
          type: 'statistical_significance',
          patternId: pattern.id,
          message: `Pattern achieved statistical significance (p=${pattern.statisticalSignificance.toFixed(4)}, n=${pattern.sampleSize})`,
          significance: 'high',
          confidence: pattern.confidenceScore,
          sampleSize: pattern.sampleSize,
          recommendedAction: 'Pattern is statistically valid - recommend for systematic use',
          createdAt: new Date()
        };
      }
    }

    return null;
  }

  /**
   * Check for trend-based alerts using sophisticated analysis
   */
  private async checkTrendAlerts(
    pattern: SuccessPattern,
    history: Array<{ confidence: number; sampleSize: number; timestamp: Date }>
  ): Promise<PatternAlert[]> {
    
    if (history.length < this.config.trendDetectionWindow) {
      return [];
    }

    const recentHistory = history.slice(-this.config.trendDetectionWindow);
    const analysis = PatternStatisticalAnalyzer.analyzePatternSignificance(
      pattern,
      recentHistory
    );

    const alerts: PatternAlert[] = [];

    // Strong improving trend alert
    if (analysis.isSignificant && 
        analysis.trendDirection === 'improving' && 
        analysis.effectSize > 0.1) {
      
      alerts.push({
        id: this.generateAlertId(),
        type: 'confidence_increase',
        patternId: pattern.id,
        message: `Strong improving trend detected over ${recentHistory.length} data points (p=${analysis.pValue.toFixed(4)})`,
        significance: 'high',
        confidence: pattern.confidenceScore,
        sampleSize: pattern.sampleSize,
        recommendedAction: 'Pattern showing consistent improvement - consider prioritizing',
        createdAt: new Date()
      });
    }

    // Strong declining trend alert  
    if (analysis.isSignificant && 
        analysis.trendDirection === 'declining' && 
        analysis.effectSize > 0.1) {
      
      alerts.push({
        id: this.generateAlertId(),
        type: 'confidence_decrease',
        patternId: pattern.id,
        message: `Declining trend detected over ${recentHistory.length} data points (p=${analysis.pValue.toFixed(4)})`,
        significance: 'high',
        confidence: pattern.confidenceScore,
        sampleSize: pattern.sampleSize,
        recommendedAction: 'Pattern showing decline - investigate and consider revising',
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Check for anomaly-based alerts
   */
  private async checkAnomalyAlert(
    pattern: SuccessPattern,
    history: Array<{ confidence: number; timestamp: Date }>
  ): Promise<PatternAlert | null> {
    
    if (history.length < 5) return null;

    const confidenceValues = history.map(h => h.confidence);
    const anomalyAnalysis = PatternStatisticalAnalyzer.detectAnomalies(
      [...confidenceValues, pattern.confidenceScore],
      2.0 // 2 standard deviations
    );

    if (anomalyAnalysis.hasAnomaly && anomalyAnalysis.anomalyScore > 2.5) {
      return {
        id: this.generateAlertId(),
        type: pattern.confidenceScore > anomalyAnalysis.expectedRange.max 
          ? 'confidence_increase' 
          : 'confidence_decrease',
        patternId: pattern.id,
        message: `Unusual confidence change detected (${anomalyAnalysis.anomalyScore.toFixed(2)} standard deviations from normal)`,
        significance: anomalyAnalysis.anomalyScore > 3 ? 'high' : 'medium',
        confidence: pattern.confidenceScore,
        sampleSize: pattern.sampleSize,
        recommendedAction: 'Investigate unusual pattern behavior',
        createdAt: new Date()
      };
    }

    return null;
  }

  /**
   * Filter alerts based on cooldown periods
   */
  private filterAlertsByCooldown(alerts: PatternAlert[]): PatternAlert[] {
    return alerts.filter(alert => {
      const historyKey = `${alert.patternId}_${alert.type}`;
      const history = this.alertHistory.get(historyKey);
      
      if (!history) return true;
      
      const timeSinceLastAlert = Date.now() - history.lastTriggered.getTime();
      return timeSinceLastAlert >= this.config.alertCooldownMs;
    });
  }

  /**
   * Update pattern history for trend analysis
   */
  private updatePatternHistory(pattern: SuccessPattern): void {
    const history = this.patternHistories.get(pattern.id) || [];
    
    history.push({
      confidence: pattern.confidenceScore,
      sampleSize: pattern.sampleSize,
      successRate: pattern.successRate,
      timestamp: new Date()
    });

    // Keep last 20 entries for trend analysis
    if (history.length > 20) {
      history.shift();
    }

    this.patternHistories.set(pattern.id, history);
  }

  /**
   * Get pattern history for analysis
   */
  private getPatternHistory(patternId: string) {
    return this.patternHistories.get(patternId) || [];
  }

  /**
   * Update alert history to prevent spam
   */
  private updateAlertHistory(alert: PatternAlert): void {
    const historyKey = `${alert.patternId}_${alert.type}`;
    const existing = this.alertHistory.get(historyKey);
    
    this.alertHistory.set(historyKey, {
      patternId: alert.patternId,
      alertType: alert.type,
      lastTriggered: alert.createdAt,
      triggerCount: existing ? existing.triggerCount + 1 : 1,
      suppressed: false
    });
  }

  /**
   * Helper methods
   */
  private determineSignificance(
    changeAmount: number, 
    sampleSize: number
  ): PatternAlert['significance'] {
    if (changeAmount >= 0.2 || sampleSize >= 20) return 'high';
    if (changeAmount >= 0.1 || sampleSize >= 10) return 'medium';
    return 'low';
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API methods
   */
  getAlertHistory(patternId?: string): AlertHistory[] {
    if (patternId) {
      return Array.from(this.alertHistory.values())
        .filter(h => h.patternId === patternId);
    }
    return Array.from(this.alertHistory.values());
  }

  getPatternTrend(patternId: string): PatternTrend | null {
    const history = this.getPatternHistory(patternId);
    if (history.length < 3) return null;

    const confidenceValues = history.map(h => h.confidence);
    const analysis = PatternStatisticalAnalyzer.analyzePatternSignificance(
      { id: patternId } as SuccessPattern,
      history
    );

    return {
      patternId,
      direction: analysis.trendDirection,
      magnitude: analysis.effectSize,
      confidence: 1 - analysis.pValue,
      dataPoints: history.length,
      timeSpan: history[history.length - 1].timestamp.getTime() - history[0].timestamp.getTime(),
      lastUpdated: new Date()
    };
  }

  clearHistory(patternId?: string): void {
    if (patternId) {
      this.patternHistories.delete(patternId);
      for (const [key, history] of this.alertHistory.entries()) {
        if (history.patternId === patternId) {
          this.alertHistory.delete(key);
        }
      }
    } else {
      this.patternHistories.clear();
      this.alertHistory.clear();
    }
  }

  dispose(): void {
    this.patternHistories.clear();
    this.alertHistory.clear();
    this.removeAllListeners();
  }
}

/**
 * Factory function for creating pattern alert engine
 */
export function createPatternAlertEngine(config?: Partial<AlertConfig>): PatternAlertEngine {
  return new PatternAlertEngine(config);
}