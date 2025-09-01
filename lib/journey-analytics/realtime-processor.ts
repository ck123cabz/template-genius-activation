/**
 * Real-time Journey Analytics Processor
 * Epic 4, Story 4.2: Drop-off Point Analysis
 * 
 * Background processing system for real-time journey analytics, alerts, and monitoring.
 */

import { randomUUID } from 'crypto';
import {
  JourneySession,
  JourneyEvent,
  JourneyAlert,
  RealTimeMetrics,
  DropOffEvent,
  JourneyPageType
} from '../data-models/journey-models';

export interface AlertThreshold {
  id: string;
  type: 'drop_off_rate' | 'conversion_rate' | 'session_duration' | 'error_rate';
  pageType?: JourneyPageType;
  threshold: number;
  timeWindow: number; // minutes
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

export interface ProcessingMetrics {
  eventsProcessed: number;
  alertsGenerated: number;
  processingTime: number;
  lastProcessedAt: Date;
}

export class RealtimeJourneyProcessor {
  private eventQueue: JourneyEvent[] = [];
  private alertThresholds: AlertThreshold[] = [];
  private activeAlerts: JourneyAlert[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private metrics: ProcessingMetrics = {
    eventsProcessed: 0,
    alertsGenerated: 0,
    processingTime: 0,
    lastProcessedAt: new Date()
  };

  constructor() {
    this.initializeDefaultThresholds();
    this.startProcessing();
  }

  /**
   * Add journey event to processing queue
   */
  async addEvent(event: JourneyEvent): Promise<void> {
    this.eventQueue.push({
      ...event,
      id: event.id || randomUUID(),
      timestamp: event.timestamp || new Date(),
      processed: false
    });
  }

  /**
   * Process events in the queue and generate alerts
   */
  async processEvents(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const unprocessedEvents = this.eventQueue.filter(event => !event.processed);
      
      for (const event of unprocessedEvents) {
        await this.processIndividualEvent(event);
        event.processed = true;
        this.metrics.eventsProcessed++;
      }

      // Check for threshold violations
      await this.checkAlertThresholds();

      // Clean up old processed events (older than 1 hour)
      this.cleanupOldEvents();

      this.metrics.processingTime = Date.now() - startTime;
      this.metrics.lastProcessedAt = new Date();

    } catch (error) {
      console.error('Error processing journey events:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get current real-time metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Calculate active sessions (sessions with events in last 30 minutes)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const recentEvents = this.eventQueue.filter(event => 
      event.timestamp >= thirtyMinutesAgo
    );
    const activeSessions = new Set(recentEvents.map(event => event.sessionId)).size;

    // Get recent drop-offs
    const recentDropOffs = this.getRecentDropOffs(oneHourAgo);

    // Calculate live conversion rate (approximate)
    const liveConversionRate = this.calculateLiveConversionRate();

    // Get current hour metrics
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const currentHourEvents = this.eventQueue.filter(event => 
      event.timestamp >= currentHour
    );

    const currentHourSessions = new Set(currentHourEvents.map(e => e.sessionId)).size;
    const currentHourCompletions = currentHourEvents.filter(e => 
      e.eventType === 'page_exit' && e.pageType === 'processing'
    ).length;
    const currentHourDropOffs = recentDropOffs.filter(d => 
      d.timestamp >= currentHour
    ).length;

    return {
      activeSessions,
      recentDropOffs,
      liveConversionRate,
      currentHourMetrics: {
        sessions: currentHourSessions,
        completions: currentHourCompletions,
        dropOffs: currentHourDropOffs
      },
      alerts: this.getActiveAlerts()
    };
  }

  /**
   * Add or update alert threshold
   */
  setAlertThreshold(threshold: AlertThreshold): void {
    const existingIndex = this.alertThresholds.findIndex(t => t.id === threshold.id);
    
    if (existingIndex >= 0) {
      this.alertThresholds[existingIndex] = threshold;
    } else {
      this.alertThresholds.push(threshold);
    }
  }

  /**
   * Remove alert threshold
   */
  removeAlertThreshold(thresholdId: string): void {
    this.alertThresholds = this.alertThresholds.filter(t => t.id !== thresholdId);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): JourneyAlert[] {
    return this.activeAlerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): void {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      if (acknowledgedBy) {
        alert.acknowledgedBy = acknowledgedBy;
      }
    }
  }

  /**
   * Get processing metrics
   */
  getProcessingMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Start the processing loop
   */
  private startProcessing(): void {
    // Process events every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processEvents();
    }, 30 * 1000);
  }

  /**
   * Stop the processing loop
   */
  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Process individual journey event
   */
  private async processIndividualEvent(event: JourneyEvent): Promise<void> {
    // Update session tracking if needed
    // This would typically interface with the session manager

    // Check for immediate alerts (e.g., errors)
    if (event.eventType === 'error') {
      await this.generateImmediateAlert(event);
    }

    // Log event for analytics (in production, this would go to database)
    console.log(`Processed event: ${event.eventType} on ${event.pageType} for session ${event.sessionId}`);
  }

  /**
   * Check alert thresholds and generate alerts
   */
  private async checkAlertThresholds(): Promise<void> {
    for (const threshold of this.alertThresholds.filter(t => t.isActive)) {
      const violationValue = await this.checkThresholdViolation(threshold);
      
      if (violationValue !== null && violationValue > threshold.threshold) {
        await this.generateAlert(threshold, violationValue);
      }
    }
  }

  /**
   * Check if a threshold is violated
   */
  private async checkThresholdViolation(threshold: AlertThreshold): Promise<number | null> {
    const timeWindow = new Date(Date.now() - threshold.timeWindow * 60 * 1000);
    const recentEvents = this.eventQueue.filter(event => event.timestamp >= timeWindow);

    switch (threshold.type) {
      case 'drop_off_rate':
        return this.calculateDropOffRate(recentEvents, threshold.pageType);
      
      case 'conversion_rate':
        return this.calculateConversionRate(recentEvents, threshold.pageType);
      
      case 'session_duration':
        return this.calculateAvgSessionDuration(recentEvents);
      
      case 'error_rate':
        return this.calculateErrorRate(recentEvents, threshold.pageType);
      
      default:
        return null;
    }
  }

  /**
   * Calculate drop-off rate for recent events
   */
  private calculateDropOffRate(events: JourneyEvent[], pageType?: JourneyPageType): number {
    const pageEvents = pageType 
      ? events.filter(e => e.pageType === pageType)
      : events;

    const pageExits = pageEvents.filter(e => e.eventType === 'page_exit');
    const dropOffs = pageExits.filter(e => 
      e.metadata?.exitAction === 'close' || 
      e.metadata?.exitAction === 'back' ||
      e.metadata?.exitAction === 'timeout'
    );

    return pageExits.length > 0 ? (dropOffs.length / pageExits.length) * 100 : 0;
  }

  /**
   * Calculate conversion rate for recent events
   */
  private calculateConversionRate(events: JourneyEvent[], pageType?: JourneyPageType): number {
    // This is a simplified calculation
    const sessions = new Set(events.map(e => e.sessionId));
    const completedSessions = new Set(
      events
        .filter(e => e.eventType === 'page_exit' && e.pageType === 'processing')
        .map(e => e.sessionId)
    );

    return sessions.size > 0 ? (completedSessions.size / sessions.size) * 100 : 0;
  }

  /**
   * Calculate average session duration
   */
  private calculateAvgSessionDuration(events: JourneyEvent[]): number {
    const sessionDurations = new Map<string, number>();
    
    // Group events by session and calculate duration
    events.forEach(event => {
      if (!sessionDurations.has(event.sessionId)) {
        sessionDurations.set(event.sessionId, 0);
      }
      
      if (event.metadata?.duration) {
        sessionDurations.set(event.sessionId, event.metadata.duration);
      }
    });

    const durations = Array.from(sessionDurations.values());
    return durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
  }

  /**
   * Calculate error rate for recent events
   */
  private calculateErrorRate(events: JourneyEvent[], pageType?: JourneyPageType): number {
    const relevantEvents = pageType 
      ? events.filter(e => e.pageType === pageType)
      : events;

    const errorEvents = relevantEvents.filter(e => e.eventType === 'error');
    
    return relevantEvents.length > 0 
      ? (errorEvents.length / relevantEvents.length) * 100 
      : 0;
  }

  /**
   * Generate immediate alert for critical events
   */
  private async generateImmediateAlert(event: JourneyEvent): Promise<void> {
    const alert: JourneyAlert = {
      id: randomUUID(),
      type: 'technical_issue',
      severity: 'high',
      message: `Technical error detected on ${event.pageType} page`,
      affectedPage: event.pageType,
      threshold: 0,
      currentValue: 1,
      timestamp: new Date(),
      acknowledged: false
    };

    this.activeAlerts.push(alert);
    this.metrics.alertsGenerated++;
  }

  /**
   * Generate alert based on threshold violation
   */
  private async generateAlert(threshold: AlertThreshold, violationValue: number): Promise<void> {
    // Check if similar alert exists recently (avoid spam)
    const recentAlerts = this.activeAlerts.filter(alert => 
      alert.affectedPage === threshold.pageType &&
      alert.timestamp > new Date(Date.now() - 15 * 60 * 1000) // 15 minutes
    );

    if (recentAlerts.length > 0) {
      return; // Don't generate duplicate alerts
    }

    const alertTypeMap = {
      drop_off_rate: 'high_drop_off' as const,
      conversion_rate: 'low_engagement' as const,
      session_duration: 'low_engagement' as const,
      error_rate: 'technical_issue' as const
    };

    const alert: JourneyAlert = {
      id: randomUUID(),
      type: alertTypeMap[threshold.type],
      severity: threshold.severity,
      message: this.generateAlertMessage(threshold, violationValue),
      affectedPage: threshold.pageType || 'unknown',
      threshold: threshold.threshold,
      currentValue: violationValue,
      timestamp: new Date(),
      acknowledged: false
    };

    this.activeAlerts.push(alert);
    this.metrics.alertsGenerated++;
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(threshold: AlertThreshold, violationValue: number): string {
    const pageText = threshold.pageType ? ` on ${threshold.pageType} page` : '';
    
    switch (threshold.type) {
      case 'drop_off_rate':
        return `High drop-off rate detected${pageText}: ${violationValue.toFixed(1)}% (threshold: ${threshold.threshold}%)`;
      
      case 'conversion_rate':
        return `Low conversion rate detected${pageText}: ${violationValue.toFixed(1)}% (threshold: ${threshold.threshold}%)`;
      
      case 'session_duration':
        return `Short session duration detected${pageText}: ${violationValue.toFixed(0)}s (threshold: ${threshold.threshold}s)`;
      
      case 'error_rate':
        return `High error rate detected${pageText}: ${violationValue.toFixed(1)}% (threshold: ${threshold.threshold}%)`;
      
      default:
        return `Threshold violation detected${pageText}`;
    }
  }

  /**
   * Get recent drop-off events
   */
  private getRecentDropOffs(since: Date): DropOffEvent[] {
    const dropOffEvents = this.eventQueue.filter(event => 
      event.eventType === 'page_exit' && 
      event.timestamp >= since &&
      (event.metadata?.exitAction === 'close' || 
       event.metadata?.exitAction === 'back' ||
       event.metadata?.exitAction === 'timeout')
    );

    return dropOffEvents.map(event => ({
      sessionId: event.sessionId,
      clientId: event.metadata?.clientId || 'unknown',
      pageType: event.pageType,
      exitTrigger: this.mapExitActionToTrigger(event.metadata?.exitAction),
      timeOnPage: event.metadata?.timeOnPage || 0,
      timestamp: event.timestamp
    }));
  }

  /**
   * Map exit action to trigger type
   */
  private mapExitActionToTrigger(exitAction: string): string {
    switch (exitAction) {
      case 'close':
      case 'back':
        return 'content_based';
      case 'timeout':
        return 'time_based';
      default:
        return 'unknown';
    }
  }

  /**
   * Calculate live conversion rate (approximation)
   */
  private calculateLiveConversionRate(): number {
    const recentEvents = this.eventQueue.filter(event => 
      event.timestamp >= new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    return this.calculateConversionRate(recentEvents);
  }

  /**
   * Clean up old processed events
   */
  private cleanupOldEvents(): void {
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    this.eventQueue = this.eventQueue.filter(event => 
      !event.processed || event.timestamp >= cutoffTime
    );
  }

  /**
   * Initialize default alert thresholds
   */
  private initializeDefaultThresholds(): void {
    this.alertThresholds = [
      {
        id: 'high-drop-off-activation',
        type: 'drop_off_rate',
        pageType: 'activation',
        threshold: 20, // 20%
        timeWindow: 30, // 30 minutes
        severity: 'high',
        isActive: true
      },
      {
        id: 'high-drop-off-agreement',
        type: 'drop_off_rate',
        pageType: 'agreement',
        threshold: 15, // 15%
        timeWindow: 30,
        severity: 'high',
        isActive: true
      },
      {
        id: 'low-conversion-overall',
        type: 'conversion_rate',
        threshold: 50, // Below 50%
        timeWindow: 60, // 1 hour
        severity: 'medium',
        isActive: true
      },
      {
        id: 'high-error-rate',
        type: 'error_rate',
        threshold: 5, // 5%
        timeWindow: 15, // 15 minutes
        severity: 'critical',
        isActive: true
      }
    ];
  }
}

// Export singleton instance and utility functions
export const realtimeJourneyProcessor = new RealtimeJourneyProcessor();

export async function addJourneyEvent(event: JourneyEvent): Promise<void> {
  return realtimeJourneyProcessor.addEvent(event);
}

export async function getCurrentMetrics(): Promise<RealTimeMetrics> {
  return realtimeJourneyProcessor.getRealTimeMetrics();
}

export function setJourneyAlertThreshold(threshold: AlertThreshold): void {
  realtimeJourneyProcessor.setAlertThreshold(threshold);
}

export function acknowledgeJourneyAlert(alertId: string, acknowledgedBy?: string): void {
  realtimeJourneyProcessor.acknowledgeAlert(alertId, acknowledgedBy);
}