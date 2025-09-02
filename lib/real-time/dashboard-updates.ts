/**
 * Real-time Dashboard Updates System
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * WebSocket/SSE connections for live dashboard updates with sub-1-second propagation.
 * Ensures pattern updates reach dashboard in real-time without impacting responsiveness.
 */

import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { 
  PatternEvent, 
  PatternAlert, 
  PatternEventProcessor 
} from './pattern-events';
import { 
  SuccessPattern,
  PatternDetectionResult
} from '../data-models/pattern-models';

/**
 * Dashboard Update Event Types for real-time propagation
 */
export type DashboardUpdateType = 
  | 'pattern_updated'         // Pattern confidence/data changed
  | 'new_alert'              // New pattern alert generated
  | 'conversion_update'      // Live conversion metrics updated
  | 'pattern_created'        // New pattern detected
  | 'recommendation_update'  // New recommendations available
  | 'connection_status';     // Connection health status

/**
 * Dashboard Update Message Structure
 * Optimized for fast JSON serialization and minimal bandwidth
 */
export interface DashboardUpdateMessage {
  id: string;
  type: DashboardUpdateType;
  timestamp: Date;
  data: {
    patterns?: SuccessPattern[];
    alert?: PatternAlert;
    metrics?: ConversionMetrics;
    recommendations?: any[];
    patternId?: string;
    clientId?: string;
    connectionId?: string;
    status?: 'connected' | 'disconnected' | 'reconnecting';
  };
  priority: 'low' | 'medium' | 'high';
  targetDashboards?: string[]; // Specific dashboard IDs (optional)
}

/**
 * Real-time Conversion Metrics for live dashboard display
 */
export interface ConversionMetrics {
  currentConversionRate: number;
  todayConversions: number;
  activeJourneys: number;
  newPatternsToday: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastUpdated: Date;
}

/**
 * WebSocket Connection Management
 * Handles individual dashboard connections with health monitoring
 */
class DashboardConnection {
  id: string;
  ws: WebSocket;
  dashboardType: 'main' | 'analytics' | 'admin';
  lastPing: number;
  isAlive: boolean;
  subscriptions: Set<string>; // Pattern IDs or client IDs to watch

  constructor(id: string, ws: WebSocket, dashboardType: string = 'main') {
    this.id = id;
    this.ws = ws;
    this.dashboardType = dashboardType as any;
    this.lastPing = Date.now();
    this.isAlive = true;
    this.subscriptions = new Set();

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    // Handle ping/pong for connection health
    this.ws.on('pong', () => {
      this.isAlive = true;
      this.lastPing = Date.now();
    });

    // Handle incoming subscription messages
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleSubscriptionMessage(message);
      } catch (error) {
        console.error(`Error parsing message from dashboard ${this.id}:`, error);
      }
    });

    this.ws.on('close', () => {
      this.isAlive = false;
      console.log(`Dashboard ${this.id} disconnected`);
    });
  }

  private handleSubscriptionMessage(message: any): void {
    if (message.type === 'subscribe') {
      if (message.patternId) {
        this.subscriptions.add(`pattern:${message.patternId}`);
      }
      if (message.clientId) {
        this.subscriptions.add(`client:${message.clientId}`);
      }
    } else if (message.type === 'unsubscribe') {
      if (message.patternId) {
        this.subscriptions.delete(`pattern:${message.patternId}`);
      }
      if (message.clientId) {
        this.subscriptions.delete(`client:${message.clientId}`);
      }
    }
  }

  /**
   * Send update to dashboard with error handling
   */
  sendUpdate(message: DashboardUpdateMessage): boolean {
    if (!this.isAlive || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    // Check if dashboard is subscribed to this update
    if (!this.isInterestedInUpdate(message)) {
      return true; // Skip but don't mark as error
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending update to dashboard ${this.id}:`, error);
      this.isAlive = false;
      return false;
    }
  }

  private isInterestedInUpdate(message: DashboardUpdateMessage): boolean {
    // Always send high priority messages
    if (message.priority === 'high') return true;

    // Check specific subscriptions
    if (message.data.patternId && this.subscriptions.has(`pattern:${message.data.patternId}`)) {
      return true;
    }
    if (message.data.clientId && this.subscriptions.has(`client:${message.data.clientId}`)) {
      return true;
    }

    // Main dashboard gets all general updates
    if (this.dashboardType === 'main') {
      return ['pattern_updated', 'conversion_update', 'new_alert'].includes(message.type);
    }

    // Analytics dashboard gets pattern and metric updates
    if (this.dashboardType === 'analytics') {
      return ['pattern_updated', 'pattern_created', 'conversion_update'].includes(message.type);
    }

    return false;
  }

  ping(): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.ping();
    }
  }

  close(): void {
    this.isAlive = false;
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

/**
 * Real-time Dashboard Update Manager
 * Central hub for propagating pattern updates to all connected dashboards
 */
export class DashboardUpdateManager extends EventEmitter {
  private connections: Map<string, DashboardConnection> = new Map();
  private updateQueue: DashboardUpdateMessage[] = [];
  private isProcessingQueue: boolean = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private conversionMetrics: ConversionMetrics | null = null;

  // Performance metrics for monitoring
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    messagesSent: 0,
    averageLatency: 0,
    errorCount: 0,
    lastUpdate: new Date()
  };

  constructor() {
    super();
    this.startHealthChecking();
    this.startQueueProcessor();
  }

  /**
   * Add new dashboard connection
   */
  addConnection(connectionId: string, ws: WebSocket, dashboardType?: string): void {
    const connection = new DashboardConnection(connectionId, ws, dashboardType);
    this.connections.set(connectionId, connection);

    this.metrics.totalConnections++;
    this.metrics.activeConnections = this.getActiveConnectionCount();

    // Send initial connection status
    this.sendConnectionStatus(connectionId, 'connected');

    // Send current metrics if available
    if (this.conversionMetrics) {
      this.broadcastUpdate({
        id: this.generateUpdateId(),
        type: 'conversion_update',
        timestamp: new Date(),
        data: { metrics: this.conversionMetrics },
        priority: 'medium',
        targetDashboards: [connectionId]
      });
    }

    console.log(`Dashboard ${connectionId} connected (${dashboardType})`);
  }

  /**
   * Remove dashboard connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.close();
      this.connections.delete(connectionId);
      this.metrics.activeConnections = this.getActiveConnectionCount();
      
      this.sendConnectionStatus(connectionId, 'disconnected');
      console.log(`Dashboard ${connectionId} disconnected`);
    }
  }

  /**
   * Broadcast update to all relevant dashboards with <1s propagation
   */
  broadcastUpdate(message: DashboardUpdateMessage): void {
    // Add to queue for processing
    this.updateQueue.push(message);

    // Process immediately for high priority messages
    if (message.priority === 'high' && !this.isProcessingQueue) {
      setImmediate(() => this.processUpdateQueue());
    }
  }

  /**
   * Send update to specific dashboards
   */
  sendToSpecificDashboards(
    dashboardIds: string[], 
    message: DashboardUpdateMessage
  ): void {
    const startTime = Date.now();
    let successCount = 0;

    for (const dashboardId of dashboardIds) {
      const connection = this.connections.get(dashboardId);
      if (connection && connection.sendUpdate(message)) {
        successCount++;
      }
    }

    // Update metrics
    const latency = Date.now() - startTime;
    this.updatePerformanceMetrics(successCount, latency);
  }

  /**
   * Update conversion metrics and broadcast to dashboards
   */
  updateConversionMetrics(metrics: ConversionMetrics): void {
    this.conversionMetrics = metrics;

    this.broadcastUpdate({
      id: this.generateUpdateId(),
      type: 'conversion_update',
      timestamp: new Date(),
      data: { metrics },
      priority: 'medium'
    });
  }

  /**
   * Broadcast pattern update to dashboards
   */
  broadcastPatternUpdate(patterns: SuccessPattern[], clientId?: string): void {
    this.broadcastUpdate({
      id: this.generateUpdateId(),
      type: 'pattern_updated',
      timestamp: new Date(),
      data: { 
        patterns,
        clientId
      },
      priority: 'high'
    });
  }

  /**
   * Broadcast new alert to dashboards
   */
  broadcastAlert(alert: PatternAlert): void {
    this.broadcastUpdate({
      id: this.generateUpdateId(),
      type: 'new_alert',
      timestamp: new Date(),
      data: { alert },
      priority: alert.significance === 'high' ? 'high' : 'medium'
    });
  }

  /**
   * Process update queue with batch optimization
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessingQueue || this.updateQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const startTime = Date.now();

    try {
      // Process up to 20 updates at once to prevent flooding
      const batch = this.updateQueue.splice(0, 20);
      const activeConnections = Array.from(this.connections.values())
        .filter(conn => conn.isAlive);

      // Send updates in parallel for better performance
      const sendPromises = batch.map(message => this.sendUpdateToRelevantDashboards(message, activeConnections));
      await Promise.all(sendPromises);

      // Update performance metrics
      const processingTime = Date.now() - startTime;
      this.metrics.averageLatency = (this.metrics.averageLatency + processingTime) / 2;
      this.metrics.lastUpdate = new Date();

    } catch (error) {
      console.error('Error processing update queue:', error);
      this.metrics.errorCount++;
    } finally {
      this.isProcessingQueue = false;

      // Continue processing if more updates in queue
      if (this.updateQueue.length > 0) {
        setImmediate(() => this.processUpdateQueue());
      }
    }
  }

  /**
   * Send update to relevant dashboards based on targeting
   */
  private async sendUpdateToRelevantDashboards(
    message: DashboardUpdateMessage,
    connections: DashboardConnection[]
  ): Promise<void> {
    let successCount = 0;

    // Filter connections based on targeting
    const targetConnections = message.targetDashboards
      ? connections.filter(conn => message.targetDashboards!.includes(conn.id))
      : connections;

    // Send to all target connections
    for (const connection of targetConnections) {
      if (connection.sendUpdate(message)) {
        successCount++;
      }
    }

    this.metrics.messagesSent += successCount;
  }

  /**
   * Start health checking for connections
   */
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const staleConnections: string[] = [];

      for (const [id, connection] of this.connections.entries()) {
        // Check if connection is stale (no ping in 30 seconds)
        if (now - connection.lastPing > 30000) {
          staleConnections.push(id);
        } else {
          connection.ping();
        }
      }

      // Remove stale connections
      staleConnections.forEach(id => this.removeConnection(id));
      
      // Update active connection count
      this.metrics.activeConnections = this.getActiveConnectionCount();

    }, 15000); // Check every 15 seconds
  }

  /**
   * Start automatic queue processing
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue) {
        this.processUpdateQueue();
      }
    }, 500); // Process queue every 500ms for <1s requirement
  }

  /**
   * Helper methods
   */
  private getActiveConnectionCount(): number {
    return Array.from(this.connections.values())
      .filter(conn => conn.isAlive).length;
  }

  private sendConnectionStatus(connectionId: string, status: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.emit('connection_status', {
      connectionId,
      status,
      timestamp: new Date()
    });
  }

  private updatePerformanceMetrics(successCount: number, latency: number): void {
    this.metrics.messagesSent += successCount;
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
    this.metrics.lastUpdate = new Date();
  }

  private generateUpdateId(): string {
    return `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public API methods
   */
  getConnectionStatus(): {
    totalConnections: number;
    activeConnections: number;
    connectionIds: string[];
  } {
    return {
      totalConnections: this.connections.size,
      activeConnections: this.getActiveConnectionCount(),
      connectionIds: Array.from(this.connections.keys())
    };
  }

  getPerformanceMetrics() {
    return {
      ...this.metrics,
      queueSize: this.updateQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }

  /**
   * Integration with PatternEventProcessor
   */
  setupPatternEventIntegration(processor: PatternEventProcessor): void {
    // Listen for pattern events and broadcast to dashboards
    processor.on('pattern_updated', (event) => {
      this.broadcastPatternUpdate(event.patterns, event.clientId);
    });

    processor.on('batch_processed', (event) => {
      // Update conversion metrics based on batch processing
      // This would calculate real-time metrics from the processed events
      // For now, using sample metrics
      this.updateConversionMetrics({
        currentConversionRate: 34.2,
        todayConversions: event.patternsUpdated || 0,
        activeJourneys: 15,
        newPatternsToday: 3,
        trend: 'up',
        trendPercentage: 2.3,
        lastUpdated: new Date()
      });
    });

    // Listen for pattern alerts
    processor.on('pattern_event', (event: PatternEvent) => {
      if (event.data.alertData) {
        this.broadcastAlert(event.data.alertData);
      }
    });
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all connections
    for (const connection of this.connections.values()) {
      connection.close();
    }

    this.connections.clear();
    this.updateQueue = [];
    this.removeAllListeners();
  }
}

/**
 * Singleton instance for application-wide use
 */
export const dashboardUpdateManager = new DashboardUpdateManager();

/**
 * WebSocket endpoint handler for Next.js API routes
 */
export function handleWebSocketConnection(
  ws: WebSocket, 
  connectionId: string,
  dashboardType?: string
): void {
  dashboardUpdateManager.addConnection(connectionId, ws, dashboardType);

  ws.on('close', () => {
    dashboardUpdateManager.removeConnection(connectionId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for dashboard ${connectionId}:`, error);
    dashboardUpdateManager.removeConnection(connectionId);
  });
}

/**
 * Utility functions for real-time updates
 */
export function broadcastPatternUpdate(patterns: SuccessPattern[], clientId?: string): void {
  dashboardUpdateManager.broadcastPatternUpdate(patterns, clientId);
}

export function broadcastAlert(alert: PatternAlert): void {
  dashboardUpdateManager.broadcastAlert(alert);
}

export function updateLiveMetrics(metrics: ConversionMetrics): void {
  dashboardUpdateManager.updateConversionMetrics(metrics);
}