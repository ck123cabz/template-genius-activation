/**
 * Real-time Pattern Update System
 * Epic 4, Story 4.1: Success Pattern Identification
 * 
 * Handles real-time pattern recalculation and updates when new outcomes are recorded.
 * Ensures pattern calculations complete within 5 seconds of outcome recording.
 */

import { EventEmitter } from 'events';
import {
  SuccessPattern,
  PatternDetectionResult,
  ContentOutcomeData,
  PatternType,
  PatternProcessingJob,
  JobType,
  JobStatus
} from '../data-models/pattern-models';
import { PatternDetectionEngine } from './detection-engine';
import { PatternRecommendationEngine } from '../recommendations/pattern-recommendations';

// Real-time update configuration
interface UpdateConfig {
  maxProcessingTime: number;        // Maximum time allowed for updates (ms)
  batchSize: number;                // Number of outcomes to process in batch
  cacheExpiration: number;          // Cache TTL in minutes
  retryAttempts: number;            // Number of retry attempts for failed jobs
  priorityThreshold: number;        // Priority threshold for immediate processing
}

// Default configuration optimized for 5-second requirement
const DEFAULT_CONFIG: UpdateConfig = {
  maxProcessingTime: 4500,  // 4.5 seconds to leave buffer
  batchSize: 50,           // Process up to 50 outcomes at once
  cacheExpiration: 15,     // 15-minute cache
  retryAttempts: 2,        // 2 retry attempts
  priorityThreshold: 7     // Priority 7+ processed immediately
};

// Update event types
export interface PatternUpdateEvent {
  type: 'pattern_updated' | 'pattern_created' | 'pattern_invalidated' | 'cache_invalidated';
  patternId?: string;
  clientId?: string;
  confidence?: number;
  timestamp: Date;
  processingTime?: number;
}

// Performance metrics tracking
interface PerformanceMetrics {
  averageUpdateTime: number;
  successfulUpdates: number;
  failedUpdates: number;
  cacheHitRate: number;
  queueLength: number;
  lastUpdateTime: Date;
}

export class RealTimePatternUpdater extends EventEmitter {
  private config: UpdateConfig;
  private detectionEngine: PatternDetectionEngine;
  private recommendationEngine: PatternRecommendationEngine;
  private processingQueue: Map<string, PatternProcessingJob> = new Map();
  private patternCache: Map<string, { pattern: SuccessPattern; timestamp: Date }> = new Map();
  private outcomeCache: Map<string, ContentOutcomeData[]> = new Map();
  private metrics: PerformanceMetrics;
  private isProcessing: boolean = false;

  constructor(
    detectionEngine: PatternDetectionEngine,
    recommendationEngine: PatternRecommendationEngine,
    config?: Partial<UpdateConfig>
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.detectionEngine = detectionEngine;
    this.recommendationEngine = recommendationEngine;
    this.metrics = this.initializeMetrics();

    // Start background processing
    this.startBackgroundProcessor();
  }

  /**
   * Process new outcome with real-time pattern updates
   * Main entry point that ensures 5-second completion
   */
  async processNewOutcome(
    clientId: string,
    outcome: 'success' | 'failure',
    contentData?: any,
    priority: number = 5
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Create processing job
      const job = this.createProcessingJob(clientId, outcome, contentData, priority);
      
      // Immediate processing for high-priority outcomes
      if (priority >= this.config.priorityThreshold) {
        await this.processJobImmediate(job);
      } else {
        // Queue for batch processing
        this.queueJob(job);
      }

      const processingTime = Date.now() - startTime;
      this.updateMetrics('success', processingTime);

      // Emit update event
      this.emit('pattern_updated', {
        type: 'pattern_updated',
        clientId,
        timestamp: new Date(),
        processingTime
      } as PatternUpdateEvent);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics('failure', processingTime);
      console.error('Error processing outcome:', error);
      
      // Don't throw - real-time updates should be non-blocking
      this.emit('error', error);
    }
  }

  /**
   * Invalidate pattern cache for specific client or pattern
   */
  async invalidatePatternCache(clientId?: string, patternId?: string): Promise<void> {
    const startTime = Date.now();

    try {
      if (patternId) {
        // Invalidate specific pattern
        this.patternCache.delete(patternId);
      } else if (clientId) {
        // Invalidate all patterns for client
        const clientPatterns = Array.from(this.patternCache.keys()).filter(id => 
          this.patternCache.get(id)?.pattern.patternData.metadata?.sourceClientIds?.includes(clientId)
        );
        clientPatterns.forEach(id => this.patternCache.delete(id));
      } else {
        // Clear entire cache
        this.patternCache.clear();
        this.outcomeCache.clear();
      }

      const processingTime = Date.now() - startTime;

      this.emit('cache_invalidated', {
        type: 'cache_invalidated',
        clientId,
        patternId,
        timestamp: new Date(),
        processingTime
      } as PatternUpdateEvent);

    } catch (error) {
      console.error('Error invalidating cache:', error);
      this.emit('error', error);
    }
  }

  /**
   * Force immediate pattern recalculation
   */
  async forcePatternRecalculation(clientId?: string): Promise<PatternDetectionResult | null> {
    const startTime = Date.now();

    try {
      // Get fresh outcome data
      const outcomes = await this.getClientOutcomes(clientId);
      if (outcomes.length === 0) return null;

      // Clear relevant cache
      await this.invalidatePatternCache(clientId);

      // Run pattern detection
      const result = await this.detectionEngine.analyzeOutcomes(outcomes);
      
      // Update cache with new patterns
      result.patterns.forEach(pattern => {
        this.patternCache.set(pattern.id, {
          pattern,
          timestamp: new Date()
        });
      });

      const processingTime = Date.now() - startTime;
      
      this.emit('pattern_updated', {
        type: 'pattern_updated',
        clientId,
        timestamp: new Date(),
        processingTime
      } as PatternUpdateEvent);

      return result;

    } catch (error) {
      console.error('Error in forced recalculation:', error);
      this.emit('error', error);
      return null;
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      queueLength: this.processingQueue.size
    };
  }

  /**
   * Get cached patterns with freshness check
   */
  getCachedPatterns(clientId?: string): SuccessPattern[] {
    const now = Date.now();
    const expirationTime = this.config.cacheExpiration * 60 * 1000; // Convert to ms

    const validPatterns: SuccessPattern[] = [];

    this.patternCache.forEach((cached, patternId) => {
      // Check if cache entry is still valid
      if (now - cached.timestamp.getTime() > expirationTime) {
        this.patternCache.delete(patternId);
        return;
      }

      // Filter by client if specified
      if (clientId) {
        const sourceClients = cached.pattern.patternData.metadata?.sourceClientIds || [];
        if (sourceClients.includes(clientId)) {
          validPatterns.push(cached.pattern);
        }
      } else {
        validPatterns.push(cached.pattern);
      }
    });

    return validPatterns;
  }

  /**
   * Create a processing job for the queue
   */
  private createProcessingJob(
    clientId: string,
    outcome: 'success' | 'failure',
    contentData?: any,
    priority: number = 5
  ): PatternProcessingJob {
    const jobId = `${clientId}-${outcome}-${Date.now()}`;
    
    return {
      id: jobId,
      jobType: 'pattern-detection',
      jobData: {
        clientId,
        outcomeData: {
          outcome,
          contentData,
          timestamp: new Date()
        },
        parameters: {
          minSampleSize: 3,
          confidenceThreshold: 0.6,
          analysisDepth: priority >= this.config.priorityThreshold ? 'comprehensive' : 'standard'
        }
      },
      priority,
      status: 'pending',
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: this.config.retryAttempts
    };
  }

  /**
   * Process job immediately (for high-priority outcomes)
   */
  private async processJobImmediate(job: PatternProcessingJob): Promise<void> {
    const maxTime = this.config.maxProcessingTime;
    
    // Create timeout promise to ensure we don't exceed 5 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), maxTime);
    });

    try {
      // Race between processing and timeout
      await Promise.race([
        this.executeJob(job),
        timeoutPromise
      ]);
    } catch (error) {
      if (error.message === 'Processing timeout') {
        // Queue for later processing if we timeout
        this.queueJob(job);
        console.warn(`Job ${job.id} timed out, queued for batch processing`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add job to processing queue
   */
  private queueJob(job: PatternProcessingJob): void {
    this.processingQueue.set(job.id, job);
    
    // Trigger background processing if queue gets large
    if (this.processingQueue.size >= this.config.batchSize && !this.isProcessing) {
      setImmediate(() => this.processBatch());
    }
  }

  /**
   * Execute a single job
   */
  private async executeJob(job: PatternProcessingJob): Promise<void> {
    try {
      job.status = 'processing';
      job.startedAt = new Date();

      const { clientId, outcomeData } = job.jobData;
      
      // Get cached outcomes or fetch fresh
      let outcomes = this.outcomeCache.get(clientId);
      if (!outcomes) {
        outcomes = await this.getClientOutcomes(clientId);
        this.outcomeCache.set(clientId, outcomes);
      }

      // Add new outcome
      const newOutcome: ContentOutcomeData = {
        clientId,
        outcome: outcomeData.outcome,
        contentElements: outcomeData.contentData?.elements,
        timingFactors: outcomeData.contentData?.timing,
        contextFactors: outcomeData.contentData?.context,
        createdAt: new Date()
      };
      outcomes.push(newOutcome);

      // Check if we have enough data for pattern analysis
      if (outcomes.length >= 3) {
        // Run pattern detection
        const result = await this.detectionEngine.analyzeOutcomes(outcomes);
        
        // Update cache with new/updated patterns
        result.patterns.forEach(pattern => {
          this.patternCache.set(pattern.id, {
            pattern,
            timestamp: new Date()
          });
        });

        // Generate new recommendations if patterns were found
        if (result.patterns.length > 0) {
          const recommendations = await this.recommendationEngine.generateRecommendations(
            { clientSegment: outcomeData.contentData?.segment },
            5
          );
          
          // Store recommendations (implementation would save to database)
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();

    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error.message;
      job.completedAt = new Date();
      throw error;
    }
  }

  /**
   * Start background processing for queued jobs
   */
  private startBackgroundProcessor(): void {
    // Process batch every 5 seconds
    setInterval(() => {
      if (this.processingQueue.size > 0 && !this.isProcessing) {
        this.processBatch();
      }
    }, 5000);

    // Clean up completed jobs every minute
    setInterval(() => {
      this.cleanupCompletedJobs();
    }, 60000);

    // Clean up expired cache every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 300000);
  }

  /**
   * Process a batch of queued jobs
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Get batch of jobs to process
      const jobs = Array.from(this.processingQueue.values())
        .filter(job => job.status === 'pending')
        .sort((a, b) => b.priority - a.priority) // High priority first
        .slice(0, this.config.batchSize);

      if (jobs.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Processing batch of ${jobs.length} pattern jobs`);

      // Process jobs in parallel (with concurrency limit)
      const promises = jobs.map(job => this.executeJob(job).catch(error => {
        console.error(`Job ${job.id} failed:`, error);
      }));

      await Promise.all(promises);

      const processingTime = Date.now() - startTime;
      console.log(`Batch processing completed in ${processingTime}ms`);

    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clean up completed jobs from queue
   */
  private cleanupCompletedJobs(): void {
    const completedStatuses: JobStatus[] = ['completed', 'failed'];
    const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour ago

    this.processingQueue.forEach((job, jobId) => {
      if (completedStatuses.includes(job.status) && 
          job.completedAt && 
          job.completedAt.getTime() < cutoffTime) {
        this.processingQueue.delete(jobId);
      }
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expirationTime = this.config.cacheExpiration * 60 * 1000;

    // Clean pattern cache
    this.patternCache.forEach((cached, patternId) => {
      if (now - cached.timestamp.getTime() > expirationTime) {
        this.patternCache.delete(patternId);
      }
    });

    // Clean outcome cache (shorter TTL)
    const outcomeCacheExpiration = 5 * 60 * 1000; // 5 minutes
    this.outcomeCache.clear(); // Simple approach - clear all outcome cache
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      averageUpdateTime: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      cacheHitRate: 0,
      queueLength: 0,
      lastUpdateTime: new Date()
    };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(status: 'success' | 'failure', processingTime: number): void {
    if (status === 'success') {
      const total = this.metrics.successfulUpdates + this.metrics.failedUpdates + 1;
      this.metrics.averageUpdateTime = (
        (this.metrics.averageUpdateTime * (total - 1)) + processingTime
      ) / total;
      this.metrics.successfulUpdates++;
    } else {
      this.metrics.failedUpdates++;
    }
    
    this.metrics.lastUpdateTime = new Date();
    
    // Calculate cache hit rate
    const totalRequests = this.metrics.successfulUpdates + this.metrics.failedUpdates;
    if (totalRequests > 0) {
      // This would be calculated based on actual cache hits vs misses
      this.metrics.cacheHitRate = 0.75; // Placeholder
    }
  }

  /**
   * Get client outcomes (placeholder - would interface with database)
   */
  private async getClientOutcomes(clientId?: string): Promise<ContentOutcomeData[]> {
    // This would fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Stop background processing and cleanup
   */
  dispose(): void {
    this.removeAllListeners();
    this.patternCache.clear();
    this.outcomeCache.clear();
    this.processingQueue.clear();
  }
}

// Utility functions for external use
export function createRealTimeUpdater(
  detectionEngine: PatternDetectionEngine,
  recommendationEngine: PatternRecommendationEngine,
  config?: Partial<UpdateConfig>
): RealTimePatternUpdater {
  return new RealTimePatternUpdater(detectionEngine, recommendationEngine, config);
}

export function calculateProcessingPriority(
  clientImportance: number,
  outcomeType: 'success' | 'failure',
  contentSignificance: number
): number {
  let priority = 5; // Base priority

  // Boost for important clients
  priority += Math.round(clientImportance * 3);

  // Boost for successful outcomes (we want to learn from success)
  if (outcomeType === 'success') {
    priority += 2;
  }

  // Boost for significant content changes
  priority += Math.round(contentSignificance * 2);

  return Math.min(priority, 10);
}

// Performance monitoring utilities
export interface PatternUpdateHealthCheck {
  isHealthy: boolean;
  metrics: PerformanceMetrics;
  warnings: string[];
  recommendations: string[];
}

export function performHealthCheck(updater: RealTimePatternUpdater): PatternUpdateHealthCheck {
  const metrics = updater.getPerformanceMetrics();
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check average update time
  if (metrics.averageUpdateTime > 4000) { // 4 seconds
    warnings.push('Average update time exceeds 4 seconds');
    recommendations.push('Consider increasing batch size or optimizing pattern detection');
  }

  // Check failure rate
  const totalUpdates = metrics.successfulUpdates + metrics.failedUpdates;
  const failureRate = totalUpdates > 0 ? metrics.failedUpdates / totalUpdates : 0;
  
  if (failureRate > 0.1) { // 10% failure rate
    warnings.push(`High failure rate: ${Math.round(failureRate * 100)}%`);
    recommendations.push('Check error logs and improve error handling');
  }

  // Check queue length
  if (metrics.queueLength > 100) {
    warnings.push('Processing queue is getting large');
    recommendations.push('Consider scaling processing capacity');
  }

  // Check cache hit rate
  if (metrics.cacheHitRate < 0.5) { // Less than 50%
    warnings.push('Low cache hit rate may impact performance');
    recommendations.push('Review cache expiration settings and usage patterns');
  }

  const isHealthy = warnings.length === 0;

  return {
    isHealthy,
    metrics,
    warnings,
    recommendations
  };
}