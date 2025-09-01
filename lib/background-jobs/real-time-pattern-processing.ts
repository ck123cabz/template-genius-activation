/**
 * Real-time Background Pattern Processing
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Non-blocking background processing with priority queues and resource throttling.
 * Implements IV3: Background processing maintains system performance during pattern updates.
 */

import { EventEmitter } from 'events';
import { Worker } from 'worker_threads';
import {
  PatternEvent,
  PatternUpdateResult
} from '../real-time/pattern-events';
import {
  SuccessPattern,
  PatternProcessingJob,
  JobType,
  JobStatus
} from '../data-models/pattern-models';

/**
 * Job priority levels for queue processing
 */
export type JobPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Background processing configuration
 */
export interface BackgroundProcessingConfig {
  maxConcurrentJobs: number;        // Maximum parallel jobs
  priorityQueueSizes: {             // Queue size limits by priority
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  processingTimeouts: {             // Timeout limits by job type (ms)
    'pattern-detection': number;
    'confidence-recalc': number;
    'recommendation-generation': number;
    'similarity-analysis': number;
  };
  resourceThrottling: {
    cpuThresholdPercent: number;    // CPU usage threshold
    memoryThresholdMB: number;      // Memory usage threshold
    pauseOnHighLoad: boolean;       // Pause processing on high load
  };
  retryConfig: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelayMs: number;
  };
}

// Optimized configuration for real-time performance
const DEFAULT_CONFIG: BackgroundProcessingConfig = {
  maxConcurrentJobs: 4,
  priorityQueueSizes: {
    critical: 100,
    high: 200,
    medium: 500,
    low: 1000
  },
  processingTimeouts: {
    'pattern-detection': 15000,      // 15 seconds
    'confidence-recalc': 5000,       // 5 seconds
    'recommendation-generation': 10000, // 10 seconds
    'similarity-analysis': 20000     // 20 seconds
  },
  resourceThrottling: {
    cpuThresholdPercent: 80,
    memoryThresholdMB: 512,
    pauseOnHighLoad: true
  },
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelayMs: 1000
  }
};

/**
 * Processing job with enhanced metadata
 */
export interface BackgroundJob extends PatternProcessingJob {
  enqueuedAt: Date;
  processingStartedAt?: Date;
  lastRetryAt?: Date;
  processingTimeMs?: number;
  resourceUsage?: {
    cpuPercent: number;
    memoryMB: number;
  };
  dependencies?: string[];          // Job IDs this job depends on
  batchId?: string;                // For batch processing
}

/**
 * Priority queue for job scheduling
 */
class PriorityJobQueue {
  private queues: Map<JobPriority, BackgroundJob[]> = new Map();
  private priorityOrder: JobPriority[] = ['critical', 'high', 'medium', 'low'];
  private maxSizes: Map<JobPriority, number>;

  constructor(maxSizes: BackgroundProcessingConfig['priorityQueueSizes']) {
    this.maxSizes = new Map(Object.entries(maxSizes) as [JobPriority, number][]);
    this.priorityOrder.forEach(priority => {
      this.queues.set(priority, []);
    });
  }

  /**
   * Add job to appropriate priority queue
   */
  enqueue(job: BackgroundJob, priority: JobPriority = 'medium'): boolean {
    const queue = this.queues.get(priority);
    const maxSize = this.maxSizes.get(priority);
    
    if (!queue || !maxSize) return false;
    
    // Check queue capacity
    if (queue.length >= maxSize) {
      // Try to dequeue oldest low-priority job if this is higher priority
      if (priority !== 'low') {
        const lowQueue = this.queues.get('low');
        if (lowQueue && lowQueue.length > 0) {
          lowQueue.shift(); // Remove oldest low priority job
        } else {
          return false; // Can't add job
        }
      } else {
        return false; // Low priority queue full
      }
    }

    // Add job with enqueue timestamp
    job.enqueuedAt = new Date();
    queue.push(job);
    
    // Sort by creation time for FIFO within priority
    queue.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return true;
  }

  /**
   * Get next job from highest priority non-empty queue
   */
  dequeue(): BackgroundJob | null {
    for (const priority of this.priorityOrder) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        const job = queue.shift()!;
        job.processingStartedAt = new Date();
        return job;
      }
    }
    return null;
  }

  /**
   * Get queue status
   */
  getStatus(): {
    totalJobs: number;
    queueSizes: { [key in JobPriority]: number };
    oldestJobAge: number;
  } {
    let totalJobs = 0;
    let oldestJobTime = Date.now();
    
    const queueSizes = {} as { [key in JobPriority]: number };
    
    this.priorityOrder.forEach(priority => {
      const queue = this.queues.get(priority) || [];
      queueSizes[priority] = queue.length;
      totalJobs += queue.length;
      
      if (queue.length > 0) {
        const oldestInQueue = Math.min(...queue.map(job => job.createdAt.getTime()));
        oldestJobTime = Math.min(oldestJobTime, oldestInQueue);
      }
    });

    return {
      totalJobs,
      queueSizes,
      oldestJobAge: totalJobs > 0 ? Date.now() - oldestJobTime : 0
    };
  }

  /**
   * Clear jobs by criteria
   */
  clear(criteria?: { priority?: JobPriority; olderThan?: Date }): number {
    let clearedCount = 0;
    
    for (const [priority, queue] of this.queues) {
      if (criteria?.priority && criteria.priority !== priority) continue;
      
      if (criteria?.olderThan) {
        const originalLength = queue.length;
        this.queues.set(priority, queue.filter(job => job.createdAt >= criteria.olderThan!));
        clearedCount += originalLength - queue.length;
      } else {
        clearedCount += queue.length;
        queue.length = 0;
      }
    }
    
    return clearedCount;
  }
}

/**
 * Resource monitor for throttling
 */
class ResourceMonitor {
  private cpuUsage: number = 0;
  private memoryUsageMB: number = 0;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMonitoring();
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateResourceUsage();
    }, 1000); // Update every second
  }

  private updateResourceUsage(): void {
    // In a real implementation, this would use system monitoring
    // For now, simulate resource usage
    const process = globalThis.process;
    if (process?.memoryUsage) {
      const memUsage = process.memoryUsage();
      this.memoryUsageMB = memUsage.heapUsed / 1024 / 1024;
    }
    
    // Simulate CPU usage (would use actual system monitoring)
    this.cpuUsage = Math.random() * 100;
  }

  getCurrentUsage(): { cpuPercent: number; memoryMB: number } {
    return {
      cpuPercent: this.cpuUsage,
      memoryMB: this.memoryUsageMB
    };
  }

  isHighLoad(thresholds: BackgroundProcessingConfig['resourceThrottling']): boolean {
    return this.cpuUsage > thresholds.cpuThresholdPercent ||
           this.memoryUsageMB > thresholds.memoryThresholdMB;
  }

  dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}

/**
 * Main Background Processing Engine
 * Handles non-blocking pattern processing with intelligent resource management
 */
export class RealTimePatternProcessor extends EventEmitter {
  private config: BackgroundProcessingConfig;
  private jobQueue: PriorityJobQueue;
  private resourceMonitor: ResourceMonitor;
  private activeJobs: Map<string, BackgroundJob> = new Map();
  private completedJobs: Map<string, BackgroundJob> = new Map();
  private workerPool: Worker[] = [];
  
  private isProcessing: boolean = false;
  private isPaused: boolean = false;
  private processingIntervals: NodeJS.Timeout[] = [];
  
  // Performance metrics
  private metrics = {
    jobsProcessed: 0,
    jobsFailed: 0,
    averageProcessingTime: 0,
    queueWaitTime: 0,
    resourceThrottleCount: 0,
    lastProcessedTime: new Date(),
    startTime: new Date()
  };

  constructor(config?: Partial<BackgroundProcessingConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.jobQueue = new PriorityJobQueue(this.config.priorityQueueSizes);
    this.resourceMonitor = new ResourceMonitor();
  }

  /**
   * Start background processing
   */
  start(): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.isPaused = false;
    this.metrics.startTime = new Date();

    // Start multiple processing loops for different priorities
    this.startProcessingLoop('critical', 500);   // 500ms interval for critical
    this.startProcessingLoop('high', 1000);      // 1s interval for high
    this.startProcessingLoop('medium', 2000);    // 2s interval for medium
    this.startProcessingLoop('low', 5000);       // 5s interval for low

    // Start cleanup and monitoring
    this.startMaintenanceTasks();

    console.log('Real-time pattern processor started');
    this.emit('processor_started', { timestamp: new Date() });
  }

  /**
   * Stop background processing
   */
  stop(): void {
    if (!this.isProcessing) return;
    
    this.isProcessing = false;
    
    // Clear all intervals
    this.processingIntervals.forEach(interval => clearInterval(interval));
    this.processingIntervals = [];
    
    // Wait for active jobs to complete
    this.waitForActiveJobsCompletion();
    
    console.log('Real-time pattern processor stopped');
    this.emit('processor_stopped', { timestamp: new Date() });
  }

  /**
   * Add job to processing queue
   */
  addJob(
    jobData: Omit<BackgroundJob, 'id' | 'createdAt' | 'enqueuedAt' | 'status'>, 
    priority: JobPriority = 'medium'
  ): string {
    const job: BackgroundJob = {
      ...jobData,
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      enqueuedAt: new Date()
    };

    const queued = this.jobQueue.enqueue(job, priority);
    
    if (queued) {
      this.emit('job_queued', { job, priority });
      return job.id;
    } else {
      // Queue full - either process immediately or reject
      if (priority === 'critical') {
        setImmediate(() => this.processJob(job));
        return job.id;
      } else {
        throw new Error(`Cannot queue job: ${priority} queue is full`);
      }
    }
  }

  /**
   * Process pattern event (main entry point)
   */
  async processPatternEvent(
    event: PatternEvent,
    priority: JobPriority = 'high'
  ): Promise<string> {
    const job: Omit<BackgroundJob, 'id' | 'createdAt' | 'enqueuedAt' | 'status'> = {
      jobType: 'pattern-detection',
      jobData: {
        clientId: event.clientId,
        outcomeData: event.data,
        parameters: {
          minSampleSize: 3,
          confidenceThreshold: 0.6,
          analysisDepth: priority === 'critical' ? 'comprehensive' : 'standard'
        }
      },
      priority: this.mapPriorityToNumber(priority),
      retryCount: 0,
      maxRetries: this.config.retryConfig.maxRetries
    };

    return this.addJob(job, priority);
  }

  /**
   * Pause processing (for high system load)
   */
  pause(): void {
    this.isPaused = true;
    this.emit('processor_paused', { timestamp: new Date() });
  }

  /**
   * Resume processing
   */
  resume(): void {
    this.isPaused = false;
    this.emit('processor_resumed', { timestamp: new Date() });
  }

  /**
   * Start processing loop for specific priority
   */
  private startProcessingLoop(priority: JobPriority, intervalMs: number): void {
    const interval = setInterval(async () => {
      if (!this.isProcessing || this.isPaused) return;
      
      // Check resource usage
      if (this.config.resourceThrottling.pauseOnHighLoad &&
          this.resourceMonitor.isHighLoad(this.config.resourceThrottling)) {
        this.metrics.resourceThrottleCount++;
        return; // Skip this cycle due to high resource usage
      }

      // Check if we can process more jobs
      if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
        return; // Too many active jobs
      }

      // Get next job from queue
      const job = this.jobQueue.dequeue();
      if (job) {
        this.processJobAsync(job);
      }
    }, intervalMs);

    this.processingIntervals.push(interval);
  }

  /**
   * Process job asynchronously
   */
  private async processJobAsync(job: BackgroundJob): Promise<void> {
    this.activeJobs.set(job.id, job);
    
    try {
      await this.processJob(job);
    } catch (error) {
      await this.handleJobError(job, error as Error);
    } finally {
      this.activeJobs.delete(job.id);
      this.completedJobs.set(job.id, job);
    }
  }

  /**
   * Core job processing logic
   */
  private async processJob(job: BackgroundJob): Promise<void> {
    const startTime = Date.now();
    const timeout = this.config.processingTimeouts[job.jobType] || 10000;
    
    job.status = 'processing';
    job.processingStartedAt = new Date();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), timeout);
      });

      // Process job with timeout
      const result = await Promise.race([
        this.executeJob(job),
        timeoutPromise
      ]);

      // Job completed successfully
      job.status = 'completed';
      job.completedAt = new Date();
      job.processingTimeMs = Date.now() - startTime;
      job.resourceUsage = this.resourceMonitor.getCurrentUsage();

      // Update metrics
      this.updateSuccessMetrics(job);
      
      // Emit completion event
      this.emit('job_completed', { job, result });

    } catch (error) {
      await this.handleJobError(job, error as Error);
    }
  }

  /**
   * Execute specific job type
   */
  private async executeJob(job: BackgroundJob): Promise<any> {
    switch (job.jobType) {
      case 'pattern-detection':
        return await this.executePatternDetection(job);
      case 'confidence-recalc':
        return await this.executeConfidenceRecalculation(job);
      case 'recommendation-generation':
        return await this.executeRecommendationGeneration(job);
      case 'similarity-analysis':
        return await this.executeSimilarityAnalysis(job);
      default:
        throw new Error(`Unknown job type: ${job.jobType}`);
    }
  }

  /**
   * Execute pattern detection job
   */
  private async executePatternDetection(job: BackgroundJob): Promise<PatternUpdateResult> {
    // Simulate pattern detection processing
    // In production, this would use the actual PatternDetectionEngine
    
    const { clientId, outcomeData } = job.jobData;
    
    // Simulate processing time based on analysis depth
    const processingTime = job.jobData.parameters?.analysisDepth === 'comprehensive' ? 2000 : 500;
    await this.delay(processingTime);

    // Mock pattern update result
    const result: PatternUpdateResult = {
      updatedPatterns: [],
      newPatterns: [],
      alerts: [],
      recommendations: [],
      processingTime: Date.now() - job.processingStartedAt!.getTime(),
      affectedClients: [clientId || 'unknown']
    };

    return result;
  }

  /**
   * Handle job errors and retries
   */
  private async handleJobError(job: BackgroundJob, error: Error): Promise<void> {
    job.errorMessage = error.message;
    job.retryCount++;

    if (job.retryCount <= job.maxRetries) {
      // Calculate backoff delay
      const delay = this.config.retryConfig.initialDelayMs * 
                   Math.pow(this.config.retryConfig.backoffMultiplier, job.retryCount - 1);
      
      job.status = 'pending';
      job.lastRetryAt = new Date();
      
      // Re-queue job after delay
      setTimeout(() => {
        const priority = this.mapNumberToPriority(job.priority);
        this.jobQueue.enqueue(job, priority);
      }, delay);

      this.emit('job_retry', { job, delay, error: error.message });
      
    } else {
      // Max retries exceeded
      job.status = 'failed';
      job.completedAt = new Date();
      
      this.metrics.jobsFailed++;
      this.emit('job_failed', { job, error: error.message });
    }
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    // Clean up completed jobs every 5 minutes
    const cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, 300000);

    // Resource monitoring every 30 seconds
    const resourceInterval = setInterval(() => {
      const usage = this.resourceMonitor.getCurrentUsage();
      this.emit('resource_update', usage);
      
      // Auto-pause on high load if configured
      if (this.config.resourceThrottling.pauseOnHighLoad &&
          this.resourceMonitor.isHighLoad(this.config.resourceThrottling) &&
          !this.isPaused) {
        this.pause();
        setTimeout(() => this.resume(), 10000); // Resume after 10 seconds
      }
    }, 30000);

    this.processingIntervals.push(cleanupInterval, resourceInterval);
  }

  /**
   * Cleanup completed jobs to prevent memory leaks
   */
  private cleanupCompletedJobs(): void {
    const cutoffTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
    let cleaned = 0;

    for (const [jobId, job] of this.completedJobs) {
      if (job.completedAt && job.completedAt.getTime() < cutoffTime) {
        this.completedJobs.delete(jobId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.emit('jobs_cleaned', { count: cleaned });
    }
  }

  /**
   * Wait for all active jobs to complete
   */
  private async waitForActiveJobsCompletion(timeoutMs: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeoutMs) {
      await this.delay(100);
    }

    if (this.activeJobs.size > 0) {
      console.warn(`${this.activeJobs.size} jobs still active after timeout`);
    }
  }

  /**
   * Helper methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private mapPriorityToNumber(priority: JobPriority): number {
    const priorityMap = { critical: 10, high: 7, medium: 5, low: 2 };
    return priorityMap[priority];
  }

  private mapNumberToPriority(num: number): JobPriority {
    if (num >= 10) return 'critical';
    if (num >= 7) return 'high';
    if (num >= 5) return 'medium';
    return 'low';
  }

  private updateSuccessMetrics(job: BackgroundJob): void {
    this.metrics.jobsProcessed++;
    this.metrics.lastProcessedTime = new Date();
    
    if (job.processingTimeMs) {
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime + job.processingTimeMs) / 2;
    }
    
    const queueTime = job.processingStartedAt!.getTime() - job.enqueuedAt.getTime();
    this.metrics.queueWaitTime = (this.metrics.queueWaitTime + queueTime) / 2;
  }

  // Placeholder methods for other job types
  private async executeConfidenceRecalculation(job: BackgroundJob): Promise<any> {
    await this.delay(200); // Simulate processing
    return { success: true };
  }

  private async executeRecommendationGeneration(job: BackgroundJob): Promise<any> {
    await this.delay(500); // Simulate processing
    return { recommendations: [] };
  }

  private async executeSimilarityAnalysis(job: BackgroundJob): Promise<any> {
    await this.delay(1000); // Simulate processing
    return { similarities: [] };
  }

  /**
   * Public API methods
   */
  getStatus(): {
    isProcessing: boolean;
    isPaused: boolean;
    activeJobs: number;
    queueStatus: any;
    metrics: typeof this.metrics;
    resourceUsage: { cpuPercent: number; memoryMB: number };
  } {
    return {
      isProcessing: this.isProcessing,
      isPaused: this.isPaused,
      activeJobs: this.activeJobs.size,
      queueStatus: this.jobQueue.getStatus(),
      metrics: { ...this.metrics },
      resourceUsage: this.resourceMonitor.getCurrentUsage()
    };
  }

  getJob(jobId: string): BackgroundJob | null {
    return this.activeJobs.get(jobId) || this.completedJobs.get(jobId) || null;
  }

  clearQueues(): number {
    return this.jobQueue.clear();
  }

  dispose(): void {
    this.stop();
    this.resourceMonitor.dispose();
    this.activeJobs.clear();
    this.completedJobs.clear();
    this.removeAllListeners();
  }
}

/**
 * Singleton instance for application-wide use
 */
export const realtimePatternProcessor = new RealTimePatternProcessor();

/**
 * Utility functions
 */
export function processPatternEvent(event: PatternEvent, priority: JobPriority = 'high'): Promise<string> {
  return realtimePatternProcessor.processPatternEvent(event, priority);
}

export function getProcessorStatus() {
  return realtimePatternProcessor.getStatus();
}