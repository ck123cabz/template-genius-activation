/**
 * Real-time Journey Analytics System
 * 
 * Non-blocking journey data collection with background processing,
 * real-time dashboard updates, and optimized performance for live client sessions.
 */

import {
  JourneySession,
  JourneyPageVisit,
  JourneyEvent,
  JourneyAnalytics,
  CreateJourneySessionData,
  TrackPageVisitData
} from '../data-models/journey-models';
import { journeySessionManager } from './session-tracking';

/**
 * Real-time Event Types for journey analytics
 */
export type RealtimeEventType = 
  | 'session_started'
  | 'page_entered' 
  | 'page_exited'
  | 'engagement_updated'
  | 'session_completed'
  | 'session_dropped_off'
  | 'pattern_detected'
  | 'analytics_updated';

/**
 * Real-time Event Structure
 */
export interface RealtimeJourneyEvent {
  id: string;
  type: RealtimeEventType;
  sessionId: string;
  clientId: string;
  timestamp: Date;
  data: {
    pageType?: string;
    contentVersionId?: string;
    engagementScore?: number;
    timeOnPage?: number;
    exitTrigger?: string;
    analytics?: Partial<JourneyAnalytics>;
    [key: string]: any;
  };
  processed: boolean;
}

/**
 * Event Buffer for batching real-time events
 */
class EventBuffer {
  private buffer: RealtimeJourneyEvent[] = [];
  private maxBufferSize = 50;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private onFlush: (events: RealtimeJourneyEvent[]) => Promise<void>,
    maxSize?: number,
    intervalMs?: number
  ) {
    if (maxSize) this.maxBufferSize = maxSize;
    if (intervalMs) this.flushInterval = intervalMs;
    this.startFlushTimer();
  }

  /**
   * Add event to buffer
   */
  add(event: RealtimeJourneyEvent): void {
    this.buffer.push(event);
    
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Force flush buffer
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];
    
    try {
      await this.onFlush(events);
    } catch (error) {
      console.error('Error flushing event buffer:', error);
      // Re-add events to buffer for retry
      this.buffer.unshift(...events);
    }
  }

  /**
   * Start automatic flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop flush timer and clean up
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
  }

  /**
   * Get buffer status
   */
  getStatus(): {
    bufferSize: number;
    maxSize: number;
    flushInterval: number;
  } {
    return {
      bufferSize: this.buffer.length,
      maxSize: this.maxBufferSize,
      flushInterval: this.flushInterval
    };
  }
}

/**
 * Real-time Analytics Cache
 */
class AnalyticsCache {
  private cache = new Map<string, any>();
  private ttl = new Map<string, number>();
  private defaultTTL = 60000; // 1 minute

  /**
   * Set cache value with TTL
   */
  set(key: string, value: any, ttlMs?: number): void {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + (ttlMs || this.defaultTTL));
  }

  /**
   * Get cache value if not expired
   */
  get(key: string): any | null {
    const expiry = this.ttl.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  /**
   * Check if cache has valid entry
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    hitRate: number;
  } {
    let expiredCount = 0;
    const now = Date.now();
    
    for (const expiry of this.ttl.values()) {
      if (now > expiry) expiredCount++;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      hitRate: 0 // Would need hit tracking for accurate rate
    };
  }
}

/**
 * Real-time Journey Tracker
 */
export class RealtimeJourneyTracker {
  private eventBuffer: EventBuffer;
  private analyticsCache: AnalyticsCache;
  private subscribers: Map<string, (event: RealtimeJourneyEvent) => void> = new Map();
  private isActive = false;
  private performanceMetrics = {
    eventsProcessed: 0,
    avgProcessingTime: 0,
    errorCount: 0,
    lastFlushTime: 0
  };

  constructor() {
    this.eventBuffer = new EventBuffer(
      this.processEventBatch.bind(this),
      50,  // Max 50 events per batch
      5000 // Flush every 5 seconds
    );
    this.analyticsCache = new AnalyticsCache();
    this.startCacheCleanup();
  }

  /**
   * Start real-time tracking
   */
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('Real-time journey tracking started');
    
    // Subscribe to session manager events
    this.setupSessionManagerIntegration();
  }

  /**
   * Stop real-time tracking
   */
  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.eventBuffer.destroy();
    console.log('Real-time journey tracking stopped');
  }

  /**
   * Track journey event in real-time
   */
  trackEvent(event: Omit<RealtimeJourneyEvent, 'id' | 'timestamp' | 'processed'>): void {
    if (!this.isActive) return;

    const realtimeEvent: RealtimeJourneyEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      processed: false
    };

    // Add to buffer for batch processing
    this.eventBuffer.add(realtimeEvent);

    // Notify real-time subscribers immediately
    this.notifySubscribers(realtimeEvent);

    // Update cache for immediate dashboard updates
    this.updateRealtimeCache(realtimeEvent);
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(
    subscriberId: string, 
    callback: (event: RealtimeJourneyEvent) => void
  ): void {
    this.subscribers.set(subscriberId, callback);
  }

  /**
   * Unsubscribe from real-time events
   */
  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  /**
   * Get real-time analytics from cache
   */
  getRealtimeAnalytics(): JourneyAnalytics | null {
    return this.analyticsCache.get('current_analytics');
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    eventsProcessed: number;
    avgProcessingTime: number;
    errorCount: number;
    lastFlushTime: number;
    bufferStatus: any;
    cacheStats: any;
  } {
    return {
      ...this.performanceMetrics,
      bufferStatus: this.eventBuffer.getStatus(),
      cacheStats: this.analyticsCache.getStats()
    };
  }

  /**
   * Process batch of events in background
   */
  private async processEventBatch(events: RealtimeJourneyEvent[]): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Group events by type for efficient processing
      const eventGroups = this.groupEventsByType(events);
      
      // Process different event types
      await Promise.all([
        this.processSessionEvents(eventGroups.session || []),
        this.processPageEvents(eventGroups.page || []),
        this.processEngagementEvents(eventGroups.engagement || []),
        this.processAnalyticsEvents(eventGroups.analytics || [])
      ]);

      // Update analytics cache
      const updatedAnalytics = await this.calculateRealtimeAnalytics(events);
      this.analyticsCache.set('current_analytics', updatedAnalytics, 30000); // 30s TTL

      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(events.length, processingTime);

      // Mark events as processed
      events.forEach(event => event.processed = true);
      
      // Broadcast analytics update
      this.notifySubscribers({
        id: this.generateEventId(),
        type: 'analytics_updated',
        sessionId: 'system',
        clientId: 'system',
        timestamp: new Date(),
        data: { analytics: updatedAnalytics },
        processed: true
      });

    } catch (error) {
      console.error('Error processing event batch:', error);
      this.performanceMetrics.errorCount++;
    }
  }

  /**
   * Group events by type for batch processing
   */
  private groupEventsByType(events: RealtimeJourneyEvent[]): {
    [key: string]: RealtimeJourneyEvent[];
  } {
    return events.reduce((groups, event) => {
      const category = this.getEventCategory(event.type);
      if (!groups[category]) groups[category] = [];
      groups[category].push(event);
      return groups;
    }, {} as { [key: string]: RealtimeJourneyEvent[] });
  }

  /**
   * Get event category for grouping
   */
  private getEventCategory(eventType: RealtimeEventType): string {
    switch (eventType) {
      case 'session_started':
      case 'session_completed':
      case 'session_dropped_off':
        return 'session';
      case 'page_entered':
      case 'page_exited':
        return 'page';
      case 'engagement_updated':
        return 'engagement';
      case 'analytics_updated':
      case 'pattern_detected':
        return 'analytics';
      default:
        return 'other';
    }
  }

  /**
   * Process session-related events
   */
  private async processSessionEvents(events: RealtimeJourneyEvent[]): Promise<void> {
    for (const event of events) {
      switch (event.type) {
        case 'session_started':
          // Update session start metrics
          this.updateSessionMetrics('started', event);
          break;
        case 'session_completed':
          // Update completion metrics
          this.updateSessionMetrics('completed', event);
          break;
        case 'session_dropped_off':
          // Update drop-off metrics and trigger pattern detection
          this.updateSessionMetrics('dropped_off', event);
          await this.triggerDropOffAnalysis(event);
          break;
      }
    }
  }

  /**
   * Process page-related events
   */
  private async processPageEvents(events: RealtimeJourneyEvent[]): Promise<void> {
    for (const event of events) {
      if (event.type === 'page_entered') {
        this.updatePageMetrics('entered', event);
      } else if (event.type === 'page_exited') {
        this.updatePageMetrics('exited', event);
      }
    }
  }

  /**
   * Process engagement events
   */
  private async processEngagementEvents(events: RealtimeJourneyEvent[]): Promise<void> {
    // Batch update engagement metrics
    const engagementUpdates = events.map(event => ({
      sessionId: event.sessionId,
      pageType: event.data.pageType,
      engagementScore: event.data.engagementScore,
      timeOnPage: event.data.timeOnPage
    }));

    await this.batchUpdateEngagementMetrics(engagementUpdates);
  }

  /**
   * Process analytics events
   */
  private async processAnalyticsEvents(events: RealtimeJourneyEvent[]): Promise<void> {
    for (const event of events) {
      if (event.type === 'pattern_detected') {
        await this.handlePatternDetection(event);
      }
    }
  }

  /**
   * Calculate real-time analytics from recent events
   */
  private async calculateRealtimeAnalytics(
    events: RealtimeJourneyEvent[]
  ): Promise<JourneyAnalytics> {
    // This would normally query the database for recent data
    // For now, return a sample analytics object
    return {
      totalSessions: 1247,
      completedJourneys: 427,
      droppedOffJourneys: 820,
      averageCompletionTime: 1112,
      overallConversionRate: 34.2,
      funnelSteps: [
        { step: 1, pageType: 'activation', clients: 1247, conversionRate: 68.5, dropOffRate: 31.5, avgTimeOnPage: 142 },
        { step: 2, pageType: 'agreement', clients: 854, conversionRate: 47.2, dropOffRate: 52.8, avgTimeOnPage: 284 },
        { step: 3, pageType: 'confirmation', clients: 403, conversionRate: 89.3, dropOffRate: 10.7, avgTimeOnPage: 89 },
        { step: 4, pageType: 'processing', clients: 360, conversionRate: 94.4, dropOffRate: 5.6, avgTimeOnPage: 45 }
      ],
      topDropOffPoints: [],
      timeOnPageData: [],
      recommendations: []
    };
  }

  /**
   * Update real-time cache based on event
   */
  private updateRealtimeCache(event: RealtimeJourneyEvent): void {
    const key = `session_${event.sessionId}`;
    const existingData = this.analyticsCache.get(key) || {};
    
    // Update session data based on event type
    const updatedData = {
      ...existingData,
      lastEvent: event,
      lastUpdated: event.timestamp
    };

    this.analyticsCache.set(key, updatedData, 300000); // 5 minutes TTL
  }

  /**
   * Notify all subscribers of new event
   */
  private notifySubscribers(event: RealtimeJourneyEvent): void {
    for (const callback of this.subscribers.values()) {
      try {
        callback(event);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    }
  }

  /**
   * Setup integration with session manager
   */
  private setupSessionManagerIntegration(): void {
    // This would integrate with the journeySessionManager
    // to automatically track events as they occur
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(
    eventCount: number, 
    processingTime: number
  ): void {
    this.performanceMetrics.eventsProcessed += eventCount;
    this.performanceMetrics.avgProcessingTime = 
      (this.performanceMetrics.avgProcessingTime + processingTime) / 2;
    this.performanceMetrics.lastFlushTime = Date.now();
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(type: string, event: RealtimeJourneyEvent): void {
    const key = `session_metrics_${type}`;
    const current = this.analyticsCache.get(key) || { count: 0, hourly: {} };
    
    const hour = new Date(event.timestamp).getHours();
    current.count++;
    current.hourly[hour] = (current.hourly[hour] || 0) + 1;
    
    this.analyticsCache.set(key, current, 3600000); // 1 hour TTL
  }

  /**
   * Update page metrics
   */
  private updatePageMetrics(type: string, event: RealtimeJourneyEvent): void {
    const pageType = event.data.pageType;
    if (!pageType) return;

    const key = `page_metrics_${pageType}_${type}`;
    const current = this.analyticsCache.get(key) || { count: 0 };
    current.count++;
    
    this.analyticsCache.set(key, current, 3600000); // 1 hour TTL
  }

  /**
   * Batch update engagement metrics
   */
  private async batchUpdateEngagementMetrics(
    updates: Array<{
      sessionId: string;
      pageType?: string;
      engagementScore?: number;
      timeOnPage?: number;
    }>
  ): Promise<void> {
    // This would batch update engagement metrics in the database
    console.log(`Updating engagement metrics for ${updates.length} events`);
  }

  /**
   * Trigger drop-off analysis for pattern detection
   */
  private async triggerDropOffAnalysis(event: RealtimeJourneyEvent): Promise<void> {
    // This would trigger the drop-off detection engine
    // to analyze if this represents a new pattern
    console.log(`Analyzing drop-off pattern for session ${event.sessionId}`);
  }

  /**
   * Handle detected pattern
   */
  private async handlePatternDetection(event: RealtimeJourneyEvent): Promise<void> {
    // This would handle newly detected patterns
    console.log(`New pattern detected: ${JSON.stringify(event.data)}`);
  }

  /**
   * Start cache cleanup interval
   */
  private startCacheCleanup(): void {
    setInterval(() => {
      this.analyticsCache.cleanup();
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Dashboard Event Emitter for real-time updates
 */
export class DashboardEventEmitter {
  private connections: Map<string, any> = new Map(); // In real app, would be WebSocket connections
  
  /**
   * Connect dashboard for real-time updates
   */
  connect(dashboardId: string): void {
    // In a real implementation, this would establish WebSocket connection
    this.connections.set(dashboardId, { connected: true, lastPing: Date.now() });
  }

  /**
   * Disconnect dashboard
   */
  disconnect(dashboardId: string): void {
    this.connections.delete(dashboardId);
  }

  /**
   * Broadcast event to all connected dashboards
   */
  broadcast(event: RealtimeJourneyEvent): void {
    for (const [dashboardId] of this.connections) {
      this.send(dashboardId, event);
    }
  }

  /**
   * Send event to specific dashboard
   */
  send(dashboardId: string, event: RealtimeJourneyEvent): void {
    const connection = this.connections.get(dashboardId);
    if (connection) {
      // In real implementation, would send via WebSocket
      console.log(`Sending event to dashboard ${dashboardId}:`, event.type);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    totalConnections: number;
    activeConnections: number;
  } {
    return {
      totalConnections: this.connections.size,
      activeConnections: Array.from(this.connections.values()).filter(
        conn => Date.now() - conn.lastPing < 30000
      ).length
    };
  }
}

/**
 * Singleton instances
 */
export const realtimeJourneyTracker = new RealtimeJourneyTracker();
export const dashboardEventEmitter = new DashboardEventEmitter();

/**
 * Initialize real-time tracking
 */
export function initializeRealtimeTracking(): void {
  realtimeJourneyTracker.start();
  
  // Set up dashboard integration
  realtimeJourneyTracker.subscribe('dashboard_emitter', (event) => {
    dashboardEventEmitter.broadcast(event);
  });
}

/**
 * Utility function to track page visit in real-time
 */
export function trackRealtimePageVisit(
  sessionId: string,
  clientId: string,
  pageType: string,
  contentVersionId?: string
): void {
  realtimeJourneyTracker.trackEvent({
    type: 'page_entered',
    sessionId,
    clientId,
    data: {
      pageType,
      contentVersionId,
      timestamp: Date.now()
    }
  });
}

/**
 * Utility function to track engagement in real-time
 */
export function trackRealtimeEngagement(
  sessionId: string,
  clientId: string,
  pageType: string,
  engagementScore: number,
  timeOnPage: number
): void {
  realtimeJourneyTracker.trackEvent({
    type: 'engagement_updated',
    sessionId,
    clientId,
    data: {
      pageType,
      engagementScore,
      timeOnPage
    }
  });
}