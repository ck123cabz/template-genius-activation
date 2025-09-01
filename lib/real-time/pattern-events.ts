/**
 * Real-time Pattern Event System
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Handles real-time processing of pattern update events with statistical rigor,
 * event buffering, and immediate confidence recalculation.
 * Extends Epic 4.1 PatternDetectionEngine with continuous real-time processing.
 */

import { EventEmitter } from 'events';
import {
  SuccessPattern,
  PatternDetectionResult,
  PatternType,
  calculatePatternConfidence,
  calculateStatisticalSignificance
} from '../data-models/pattern-models';
import { PatternDetectionEngine } from '../pattern-recognition/detection-engine';

// Real-time pattern event types for Story 4.3
export type PatternEventType = 
  | 'outcome_recorded'        // New client outcome recorded
  | 'pattern_detected'        // New pattern identified
  | 'confidence_updated'      // Pattern confidence recalculated 
  | 'alert_triggered'         // Pattern alert generated
  | 'pattern_invalidated'     // Pattern no longer valid
  | 'batch_processed';        // Batch of events processed

/**
 * Real-time Pattern Event Structure
 * Captures all data needed for immediate pattern processing
 */
export interface PatternEvent {
  id: string;
  type: PatternEventType;
  clientId: string;
  versionId?: string;
  patternId?: string;
  timestamp: Date;
  data: {
    outcome?: 'success' | 'failure';
    oldConfidence?: number;
    newConfidence?: number;
    contentData?: any;
    hypothesis?: string;
    alertData?: PatternAlert;
    batchSize?: number;
    processingTimeMs?: number;
  };
  priority: number;           // 1-10, higher = more urgent
  retryCount: number;
  maxRetries: number;
  processed: boolean;
}

/**
 * Pattern Alert Structure for Story 4.3 Task 2
 */
export interface PatternAlert {
  id: string;
  type: 'new_pattern' | 'confidence_increase' | 'confidence_decrease' | 'statistical_significance';
  patternId: string;
  message: string;
  significance: 'low' | 'medium' | 'high';
  confidence: number;
  previousConfidence?: number;
  sampleSize: number;
  recommendedAction: string;
  createdAt: Date;
}

/**
 * Pattern Update Result for real-time processing
 */
export interface PatternUpdateResult {
  updatedPatterns: SuccessPattern[];
  newPatterns: SuccessPattern[];
  alerts: PatternAlert[];
  recommendations: any[];
  processingTime: number;
  affectedClients: string[];
}

/**
 * Event Buffer Configuration for 50 events/batch requirement
 */
interface EventBufferConfig {
  maxBufferSize: number;       // 50 events per batch (Story requirement)
  flushIntervalMs: number;     // 2000ms for <5s processing requirement
  priorityThreshold: number;   // 7+ processed immediately
  maxProcessingTime: number;   // 2000ms for sub-2-second requirement
}

// Optimized configuration for Story 4.3 performance requirements
const DEFAULT_BUFFER_CONFIG: EventBufferConfig = {
  maxBufferSize: 50,          // Exactly 50 events as specified
  flushIntervalMs: 2000,      // 2s interval for sub-5s total processing
  priorityThreshold: 7,       // High priority events processed immediately
  maxProcessingTime: 2000     // Sub-2-second pattern updates requirement
};

/**
 * Real-time Pattern Event Processor
 * Core system that processes pattern events with sub-2-second performance
 */
export class PatternEventProcessor extends EventEmitter {
  private config: EventBufferConfig;
  private detectionEngine: PatternDetectionEngine;
  private eventBuffer: Map<string, PatternEvent[]> = new Map(); // Keyed by clientId
  private processingQueue: PatternEvent[] = [];
  private isProcessing: boolean = false;
  private flushTimer: NodeJS.Timeout | null = null;
  
  // Performance tracking for Story 4.3 requirements
  private metrics = {
    eventsProcessed: 0,
    averageProcessingTime: 0,
    alertsGenerated: 0,
    patternsUpdated: 0,
    confidenceUpdates: 0,
    lastFlushTime: 0,
    errorCount: 0
  };

  // Pattern cache for incremental updates
  private patternCache: Map<string, SuccessPattern> = new Map();
  private confidenceHistory: Map<string, number[]> = new Map();

  constructor(
    detectionEngine: PatternDetectionEngine,
    config?: Partial<EventBufferConfig>
  ) {
    super();
    this.config = { ...DEFAULT_BUFFER_CONFIG, ...config };
    this.detectionEngine = detectionEngine;
    this.startBufferProcessor();
  }

  /**
   * Main entry point: Process new outcome event in real-time
   * Ensures sub-2-second pattern updates as required by AC 1, 3, 4
   */
  async processOutcomeEvent(
    clientId: string,
    outcome: 'success' | 'failure',
    contentData?: any,
    priority: number = 5
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Create pattern event
      const event: PatternEvent = {
        id: this.generateEventId(),
        type: 'outcome_recorded',
        clientId,
        versionId: contentData?.versionId,
        timestamp: new Date(),
        data: {
          outcome,
          contentData,
          hypothesis: contentData?.hypothesis
        },
        priority,
        retryCount: 0,
        maxRetries: 2,
        processed: false
      };

      // High priority events processed immediately (AC 1)
      if (priority >= this.config.priorityThreshold) {
        await this.processEventImmediate(event);
      } else {
        // Buffer for batch processing (50 events/batch requirement)
        this.addToBuffer(event);
      }

      // Emit event for WebSocket propagation (Task 1)
      this.emit('pattern_event', event);

    } catch (error) {
      console.error('Error processing outcome event:', error);
      this.metrics.errorCount++;
      this.emit('error', error);
    }
  }

  /**
   * Process high-priority events immediately for <2s requirement
   */
  private async processEventImmediate(event: PatternEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create timeout promise for performance requirement
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), this.config.maxProcessingTime);
      });

      // Race between processing and timeout
      const result = await Promise.race([
        this.executePatternUpdate(event),
        timeoutPromise
      ]) as PatternUpdateResult;

      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime, result);

      // Emit immediate results for real-time dashboard (AC 1, 4)
      this.emit('pattern_updated', {
        type: 'pattern_updated',
        clientId: event.clientId,
        patterns: result.updatedPatterns,
        alerts: result.alerts,
        processingTime,
        timestamp: new Date()
      });

    } catch (error) {
      if (error.message === 'Processing timeout') {
        // Queue for batch processing if timeout
        this.addToBuffer(event);
        console.warn(`Event ${event.id} timed out, queued for batch processing`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Execute incremental pattern update for real-time processing
   * Core algorithm for AC 3: Dynamic Confidence Score Updates
   */
  private async executePatternUpdate(event: PatternEvent): Promise<PatternUpdateResult> {
    const { clientId, data } = event;
    const result: PatternUpdateResult = {
      updatedPatterns: [],
      newPatterns: [],
      alerts: [],
      recommendations: [],
      processingTime: 0,
      affectedClients: [clientId]
    };

    // Step 1: Get cached patterns affected by this client
    const affectedPatterns = this.getAffectedPatterns(clientId);
    
    // Step 2: Incremental confidence updates (not full recalculation)
    for (const pattern of affectedPatterns) {
      const oldConfidence = pattern.confidenceScore;
      const updatedPattern = await this.updatePatternConfidenceIncremental(pattern, event);
      
      if (updatedPattern) {
        result.updatedPatterns.push(updatedPattern);
        this.patternCache.set(pattern.id, updatedPattern);
        
        // Track confidence history for trend analysis
        const history = this.confidenceHistory.get(pattern.id) || [];
        history.push(updatedPattern.confidenceScore);
        if (history.length > 10) history.shift(); // Keep last 10 values
        this.confidenceHistory.set(pattern.id, history);

        // Step 3: Generate alerts for significant changes (AC 2)
        const alerts = await this.detectSignificantChanges(pattern, updatedPattern);
        result.alerts.push(...alerts);
      }
    }

    // Step 4: Check for new patterns if this is a successful outcome
    if (data.outcome === 'success') {
      const newPatterns = await this.detectNewPatterns(clientId, data);
      result.newPatterns.push(...newPatterns);
      
      // Cache new patterns
      newPatterns.forEach(pattern => {
        this.patternCache.set(pattern.id, pattern);
      });
    }

    return result;
  }

  /**
   * Incremental confidence update for real-time processing
   * Enhanced Wilson confidence interval calculation (AC 3)
   */
  private async updatePatternConfidenceIncremental(
    pattern: SuccessPattern,
    event: PatternEvent
  ): Promise<SuccessPattern | null> {
    
    // Check if this outcome is relevant to the pattern
    const isRelevant = await this.isOutcomeRelevantToPattern(pattern, event);
    if (!isRelevant) return null;

    // Incremental update: add new data point without full recalculation
    const newSampleSize = pattern.sampleSize + 1;
    const newSuccessCount = event.data.outcome === 'success' 
      ? Math.round(pattern.successRate * pattern.sampleSize) + 1
      : Math.round(pattern.successRate * pattern.sampleSize);
    
    const newSuccessRate = newSuccessCount / newSampleSize;

    // Recalculate confidence with new data point
    const consistencyScore = this.calculateConsistencyScore(pattern.id, newSuccessRate);
    const recencyFactor = 1.0; // New data gets full weight
    
    const confidenceCalc = calculatePatternConfidence(
      newSuccessCount,
      newSampleSize,
      consistencyScore,
      recencyFactor
    );

    // Update statistical significance
    const stats = calculateStatisticalSignificance(newSuccessCount, newSampleSize);

    return {
      ...pattern,
      sampleSize: newSampleSize,
      successRate: newSuccessRate,
      confidenceScore: confidenceCalc.finalConfidence,
      statisticalSignificance: stats.pValue,
      lastValidated: new Date()
    };
  }

  /**
   * Detect significant pattern changes for alert generation (AC 2)
   * Statistical significance testing for alerts
   */
  private async detectSignificantChanges(
    oldPattern: SuccessPattern,
    newPattern: SuccessPattern
  ): Promise<PatternAlert[]> {
    const alerts: PatternAlert[] = [];
    const confidenceChange = newPattern.confidenceScore - oldPattern.confidenceScore;

    // Alert for significant confidence increase (10%+ change)
    if (confidenceChange > 0.1) {
      alerts.push({
        id: this.generateEventId(),
        type: 'confidence_increase',
        patternId: newPattern.id,
        message: `Pattern confidence increased by ${Math.round(confidenceChange * 100)}% (${Math.round(oldPattern.confidenceScore * 100)}% → ${Math.round(newPattern.confidenceScore * 100)}%)`,
        significance: confidenceChange > 0.2 ? 'high' : 'medium',
        confidence: newPattern.confidenceScore,
        previousConfidence: oldPattern.confidenceScore,
        sampleSize: newPattern.sampleSize,
        recommendedAction: newPattern.confidenceScore > 0.8 
          ? 'Consider applying this pattern to new clients'
          : 'Monitor pattern for further validation',
        createdAt: new Date()
      });
    }

    // Alert for crossing statistical significance threshold
    if (newPattern.statisticalSignificance <= 0.05 && 
        oldPattern.statisticalSignificance > 0.05 &&
        newPattern.sampleSize >= 10) {
      alerts.push({
        id: this.generateEventId(),
        type: 'statistical_significance',
        patternId: newPattern.id,
        message: `Pattern achieved statistical significance (p=${newPattern.statisticalSignificance.toFixed(4)})`,
        significance: 'high',
        confidence: newPattern.confidenceScore,
        sampleSize: newPattern.sampleSize,
        recommendedAction: 'Pattern is statistically valid - recommend for systematic use',
        createdAt: new Date()
      });
    }

    // Alert for high confidence patterns (>80%)
    if (newPattern.confidenceScore > 0.8 && 
        oldPattern.confidenceScore <= 0.8 && 
        newPattern.sampleSize >= 5) {
      alerts.push({
        id: this.generateEventId(),
        type: 'new_pattern',
        patternId: newPattern.id,
        message: `High-confidence pattern identified (${Math.round(newPattern.confidenceScore * 100)}% confidence, ${newPattern.sampleSize} samples)`,
        significance: 'high',
        confidence: newPattern.confidenceScore,
        sampleSize: newPattern.sampleSize,
        recommendedAction: 'Implement this pattern for new similar clients',
        createdAt: new Date()
      });
    }

    return alerts;
  }

  /**
   * Add event to buffer for batch processing (50 events/batch)
   */
  private addToBuffer(event: PatternEvent): void {
    const clientBuffer = this.eventBuffer.get(event.clientId) || [];
    clientBuffer.push(event);
    this.eventBuffer.set(event.clientId, clientBuffer);

    // Check if any client buffer has reached max size
    let totalBufferSize = 0;
    for (const buffer of this.eventBuffer.values()) {
      totalBufferSize += buffer.length;
    }

    if (totalBufferSize >= this.config.maxBufferSize) {
      setImmediate(() => this.flushBuffer());
    }
  }

  /**
   * Process buffered events in batches of 50 (Story requirement)
   */
  private async flushBuffer(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Collect up to 50 events from all client buffers
      const eventsToProcess: PatternEvent[] = [];
      const processedClients: string[] = [];

      for (const [clientId, buffer] of this.eventBuffer.entries()) {
        if (eventsToProcess.length >= this.config.maxBufferSize) break;
        
        const clientEvents = buffer.splice(0, this.config.maxBufferSize - eventsToProcess.length);
        eventsToProcess.push(...clientEvents);
        processedClients.push(clientId);
        
        if (buffer.length === 0) {
          this.eventBuffer.delete(clientId);
        }
      }

      if (eventsToProcess.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing batch of ${eventsToProcess.length} pattern events`);

      // Process events in parallel with concurrency limit
      const batchResults = await this.processBatchEvents(eventsToProcess);
      
      // Consolidate results
      const consolidatedResult = this.consolidateBatchResults(batchResults);
      
      const processingTime = Date.now() - startTime;
      this.updatePerformanceMetrics(processingTime, consolidatedResult);

      // Emit batch completion event
      this.emit('batch_processed', {
        type: 'batch_processed',
        eventsProcessed: eventsToProcess.length,
        patternsUpdated: consolidatedResult.updatedPatterns.length,
        alertsGenerated: consolidatedResult.alerts.length,
        processingTime,
        timestamp: new Date()
      });

      this.metrics.lastFlushTime = Date.now();

    } catch (error) {
      console.error('Error flushing event buffer:', error);
      this.metrics.errorCount++;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process batch of events with parallel processing
   */
  private async processBatchEvents(events: PatternEvent[]): Promise<PatternUpdateResult[]> {
    const promises = events.map(event => this.executePatternUpdate(event).catch(error => {
      console.error(`Error processing event ${event.id}:`, error);
      return {
        updatedPatterns: [],
        newPatterns: [],
        alerts: [],
        recommendations: [],
        processingTime: 0,
        affectedClients: []
      };
    }));

    return Promise.all(promises);
  }

  /**
   * Start automatic buffer flushing
   */
  private startBufferProcessor(): void {
    this.flushTimer = setInterval(() => {
      if (!this.isProcessing && this.getTotalBufferSize() > 0) {
        this.flushBuffer();
      }
    }, this.config.flushIntervalMs);
  }

  /**
   * Helper methods
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTotalBufferSize(): number {
    let total = 0;
    for (const buffer of this.eventBuffer.values()) {
      total += buffer.length;
    }
    return total;
  }

  private getAffectedPatterns(clientId: string): SuccessPattern[] {
    const affected: SuccessPattern[] = [];
    for (const pattern of this.patternCache.values()) {
      const sourceClients = pattern.patternData.metadata?.sourceClientIds || [];
      if (sourceClients.includes(clientId)) {
        affected.push(pattern);
      }
    }
    return affected;
  }

  private calculateConsistencyScore(patternId: string, newSuccessRate: number): number {
    const history = this.confidenceHistory.get(patternId) || [];
    if (history.length < 2) return 0.5;

    // Calculate variation in recent success rates
    const avgRate = history.reduce((sum, rate) => sum + rate, 0) / history.length;
    const variance = history.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (stdDev * 2)); // Scale to 0-1
  }

  private async isOutcomeRelevantToPattern(pattern: SuccessPattern, event: PatternEvent): Promise<boolean> {
    // Check if the event's content/hypothesis matches the pattern
    // This would involve more sophisticated matching in production
    return true; // Simplified for now
  }

  private async detectNewPatterns(clientId: string, eventData: any): Promise<SuccessPattern[]> {
    // This would use the existing PatternDetectionEngine to identify new patterns
    // For now, return empty array
    return [];
  }

  private consolidateBatchResults(results: PatternUpdateResult[]): PatternUpdateResult {
    return {
      updatedPatterns: results.flatMap(r => r.updatedPatterns),
      newPatterns: results.flatMap(r => r.newPatterns),
      alerts: results.flatMap(r => r.alerts),
      recommendations: results.flatMap(r => r.recommendations),
      processingTime: Math.max(...results.map(r => r.processingTime)),
      affectedClients: [...new Set(results.flatMap(r => r.affectedClients))]
    };
  }

  private updatePerformanceMetrics(processingTime: number, result: PatternUpdateResult): void {
    this.metrics.eventsProcessed++;
    this.metrics.averageProcessingTime = 
      (this.metrics.averageProcessingTime + processingTime) / 2;
    this.metrics.alertsGenerated += result.alerts.length;
    this.metrics.patternsUpdated += result.updatedPatterns.length;
    this.metrics.confidenceUpdates += result.updatedPatterns.length;
  }

  /**
   * Public API methods
   */
  getPerformanceMetrics() {
    return {
      ...this.metrics,
      bufferSize: this.getTotalBufferSize(),
      cacheSize: this.patternCache.size,
      isProcessing: this.isProcessing
    };
  }

  getCachedPatterns(): SuccessPattern[] {
    return Array.from(this.patternCache.values());
  }

  async forceFlush(): Promise<void> {
    await this.flushBuffer();
  }

  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.removeAllListeners();
    this.eventBuffer.clear();
    this.patternCache.clear();
    this.confidenceHistory.clear();
  }
}

/**
 * Factory function for creating pattern event processor
 */
export function createPatternEventProcessor(
  detectionEngine: PatternDetectionEngine,
  config?: Partial<EventBufferConfig>
): PatternEventProcessor {
  return new PatternEventProcessor(detectionEngine, config);
}

/**
 * Utility function to calculate processing priority
 * Higher priority = processed immediately vs batched
 */
export function calculateEventPriority(
  outcome: 'success' | 'failure',
  clientImportance: number = 5, // 1-10 scale
  contentSignificance: number = 5, // 1-10 scale
  isFirstSuccess: boolean = false
): number {
  let priority = 5; // Base priority

  // Success outcomes get higher priority (we learn more from success)
  if (outcome === 'success') {
    priority += 2;
  }

  // Important clients get higher priority
  priority += Math.round(clientImportance * 0.3);

  // Significant content changes get higher priority
  priority += Math.round(contentSignificance * 0.2);

  // First successful outcome for a client gets highest priority
  if (isFirstSuccess) {
    priority += 3;
  }

  return Math.min(priority, 10);
}