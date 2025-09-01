/**
 * Journey Comparison Performance Optimization
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Performance optimization utilities for journey comparison operations
 * with caching, background processing, and progressive loading.
 */

import { 
  JourneyComparison, 
  JourneyComparisonResult,
  ComparisonType 
} from '../data-models/journey-comparison-models';
import { JourneySession } from '../data-models/journey-models';

/**
 * Performance optimization configuration
 */
export interface OptimizationConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  maxCacheSize: number; // number of entries
  backgroundProcessing: boolean;
  progressiveLoading: boolean;
  batchSize: number;
  maxConcurrentOperations: number;
  queryOptimization: boolean;
  preloadThreshold: number; // preload when queue reaches this size
}

const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  maxCacheSize: 100,
  backgroundProcessing: true,
  progressiveLoading: true,
  batchSize: 5,
  maxConcurrentOperations: 3,
  queryOptimization: true,
  preloadThreshold: 10
};

/**
 * Cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: Date;
  ttl: number;
  size: number; // approximate memory usage
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  cacheHitRate: number;
  averageProcessingTime: number;
  totalOperations: number;
  backgroundJobsCompleted: number;
  memoryUsage: number;
  queueSize: number;
  activeOperations: number;
}

/**
 * Background job definition
 */
interface BackgroundJob {
  id: string;
  type: 'comparison' | 'preload' | 'optimization';
  priority: number;
  data: any;
  createdAt: Date;
  estimatedDuration: number;
}

/**
 * Main performance optimization engine
 */
export class ComparisonOptimizationEngine {
  private config: OptimizationConfig;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private backgroundQueue: BackgroundJob[] = [];
  private activeOperations: Set<string> = new Set();
  private performanceMetrics: PerformanceMetrics;
  private processingHistory: Array<{ duration: number; timestamp: Date }> = [];

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.performanceMetrics = {
      cacheHitRate: 0,
      averageProcessingTime: 0,
      totalOperations: 0,
      backgroundJobsCompleted: 0,
      memoryUsage: 0,
      queueSize: 0,
      activeOperations: 0
    };

    // Start background processing if enabled
    if (this.config.backgroundProcessing) {
      this.startBackgroundProcessor();
    }

    // Start cache maintenance
    if (this.config.cacheEnabled) {
      this.startCacheMaintenance();
    }
  }

  /**
   * Optimized journey comparison with caching and background processing
   */
  async optimizedCompareJourneys(
    successful: JourneySession,
    failed: JourneySession,
    type: ComparisonType = 'comprehensive',
    comparisonEngine: any
  ): Promise<JourneyComparisonResult> {
    const startTime = Date.now();
    const operationId = this.generateOperationId(successful.id, failed.id, type);
    
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getCachedResult<JourneyComparisonResult>(operationId);
      if (cached) {
        this.updateMetrics(Date.now() - startTime, true);
        return cached;
      }
    }

    // Check if operation is already in progress
    if (this.activeOperations.has(operationId)) {
      return this.waitForOperation(operationId);
    }

    this.activeOperations.add(operationId);
    this.performanceMetrics.activeOperations = this.activeOperations.size;

    try {
      let result: JourneyComparisonResult;

      // Use progressive loading if enabled and analysis is complex
      if (this.config.progressiveLoading && type === 'comprehensive') {
        result = await this.progressiveComparison(successful, failed, comparisonEngine);
      } else {
        result = await comparisonEngine.compareJourneys(successful, failed, type);
      }

      // Cache the result
      if (this.config.cacheEnabled) {
        this.cacheResult(operationId, result);
      }

      this.updateMetrics(Date.now() - startTime, false);
      return result;

    } finally {
      this.activeOperations.delete(operationId);
      this.performanceMetrics.activeOperations = this.activeOperations.size;
    }
  }

  /**
   * Batch optimize multiple comparisons
   */
  async batchOptimizedComparisons(
    requests: Array<{
      successful: JourneySession;
      failed: JourneySession;
      type: ComparisonType;
    }>,
    comparisonEngine: any
  ): Promise<JourneyComparisonResult[]> {
    // Group requests for optimal batch processing
    const batches = this.groupRequestsIntoOptimalBatches(requests);
    const results: JourneyComparisonResult[] = [];

    for (const batch of batches) {
      if (this.config.backgroundProcessing) {
        // Process batch in background if queue is not full
        const batchResults = await this.processBatchWithBackgroundOptimization(batch, comparisonEngine);
        results.push(...batchResults);
      } else {
        // Process batch directly
        const batchPromises = batch.map(req => 
          this.optimizedCompareJourneys(req.successful, req.failed, req.type, comparisonEngine)
        );
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
    }

    return results;
  }

  /**
   * Preload commonly accessed comparisons
   */
  async preloadCommonComparisons(
    commonPairs: Array<{ successful: JourneySession; failed: JourneySession }>,
    comparisonEngine: any
  ): Promise<void> {
    if (!this.config.backgroundProcessing) return;

    for (const pair of commonPairs) {
      const job: BackgroundJob = {
        id: this.generateOperationId(pair.successful.id, pair.failed.id, 'comprehensive'),
        type: 'preload',
        priority: 3,
        data: { successful: pair.successful, failed: pair.failed, comparisonEngine },
        createdAt: new Date(),
        estimatedDuration: 2000 // 2 seconds estimated
      };

      this.addBackgroundJob(job);
    }
  }

  /**
   * Optimize query patterns for better performance
   */
  async optimizeJourneyQueries(
    queryPatterns: Array<{
      criteria: any;
      frequency: number;
      avgResponseTime: number;
    }>
  ): Promise<{
    recommendations: Array<{
      type: 'indexing' | 'caching' | 'query_optimization';
      description: string;
      expectedImprovement: number;
    }>;
    optimizedQueries: any[];
  }> {
    const recommendations = [];
    const optimizedQueries = [];

    // Analyze query patterns
    for (const pattern of queryPatterns) {
      // Recommend indexing for frequent slow queries
      if (pattern.frequency > 10 && pattern.avgResponseTime > 1000) {
        recommendations.push({
          type: 'indexing',
          description: `Add index for frequently accessed criteria: ${JSON.stringify(pattern.criteria)}`,
          expectedImprovement: 0.6 // 60% improvement expected
        });
      }

      // Recommend caching for very frequent queries
      if (pattern.frequency > 50) {
        recommendations.push({
          type: 'caching',
          description: `Cache results for high-frequency query pattern`,
          expectedImprovement: 0.8 // 80% improvement for cached results
        });
      }

      // Optimize query structure
      const optimizedQuery = this.optimizeQueryStructure(pattern.criteria);
      if (optimizedQuery) {
        optimizedQueries.push(optimizedQuery);
        recommendations.push({
          type: 'query_optimization',
          description: 'Optimized query structure for better performance',
          expectedImprovement: 0.3 // 30% improvement
        });
      }
    }

    return { recommendations, optimizedQueries };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.performanceMetrics,
      memoryUsage: this.calculateMemoryUsage(),
      queueSize: this.backgroundQueue.length
    };
  }

  /**
   * Clear cache and reset performance metrics
   */
  reset(): void {
    this.cache.clear();
    this.backgroundQueue = [];
    this.activeOperations.clear();
    this.processingHistory = [];
    this.performanceMetrics = {
      cacheHitRate: 0,
      averageProcessingTime: 0,
      totalOperations: 0,
      backgroundJobsCompleted: 0,
      memoryUsage: 0,
      queueSize: 0,
      activeOperations: 0
    };
  }

  // ============================================================================
  // PRIVATE OPTIMIZATION METHODS
  // ============================================================================

  private async progressiveComparison(
    successful: JourneySession,
    failed: JourneySession,
    comparisonEngine: any
  ): Promise<JourneyComparisonResult> {
    // Start with basic comparison
    let result = await comparisonEngine.compareJourneys(successful, failed, 'content_focused');

    // Progressively add more analysis
    const timingResults = await comparisonEngine.compareJourneys(successful, failed, 'timing_focused');
    result = this.mergeComparisonResults(result, timingResults);

    const engagementResults = await comparisonEngine.compareJourneys(successful, failed, 'engagement_focused');
    result = this.mergeComparisonResults(result, engagementResults);

    // Complete with comprehensive analysis
    const comprehensiveResults = await comparisonEngine.compareJourneys(successful, failed, 'comprehensive');
    result = this.mergeComparisonResults(result, comprehensiveResults);

    return result;
  }

  private groupRequestsIntoOptimalBatches(
    requests: Array<{
      successful: JourneySession;
      failed: JourneySession;
      type: ComparisonType;
    }>
  ): Array<typeof requests> {
    const batches: Array<typeof requests> = [];
    
    // Group by analysis type for optimal resource usage
    const typeGroups = requests.reduce((groups, req) => {
      if (!groups[req.type]) groups[req.type] = [];
      groups[req.type].push(req);
      return groups;
    }, {} as Record<ComparisonType, typeof requests>);

    // Create batches within each type group
    for (const [type, typeRequests] of Object.entries(typeGroups)) {
      for (let i = 0; i < typeRequests.length; i += this.config.batchSize) {
        batches.push(typeRequests.slice(i, i + this.config.batchSize));
      }
    }

    return batches;
  }

  private async processBatchWithBackgroundOptimization(
    batch: Array<{
      successful: JourneySession;
      failed: JourneySession;
      type: ComparisonType;
    }>,
    comparisonEngine: any
  ): Promise<JourneyComparisonResult[]> {
    // Check if we can process immediately or need to queue
    if (this.activeOperations.size < this.config.maxConcurrentOperations) {
      return Promise.all(
        batch.map(req => 
          this.optimizedCompareJourneys(req.successful, req.failed, req.type, comparisonEngine)
        )
      );
    } else {
      // Queue for background processing
      const job: BackgroundJob = {
        id: `batch-${Date.now()}`,
        type: 'comparison',
        priority: 2,
        data: { batch, comparisonEngine },
        createdAt: new Date(),
        estimatedDuration: batch.length * 1000 // 1 second per comparison
      };

      this.addBackgroundJob(job);
      
      // Return promise that resolves when background job completes
      return this.waitForBackgroundJob(job.id);
    }
  }

  private mergeComparisonResults(
    base: JourneyComparisonResult,
    additional: JourneyComparisonResult
  ): JourneyComparisonResult {
    return {
      ...base,
      comparison: {
        ...base.comparison,
        contentDifferences: [
          ...base.comparison.contentDifferences,
          ...additional.comparison.contentDifferences
        ],
        timingDifferences: [
          ...base.comparison.timingDifferences,
          ...additional.comparison.timingDifferences
        ],
        engagementDifferences: [
          ...base.comparison.engagementDifferences,
          ...additional.comparison.engagementDifferences
        ]
      }
    };
  }

  // Cache management methods
  private getCachedResult<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < entry.ttl) {
      entry.accessCount++;
      entry.lastAccessed = new Date();
      return entry.data;
    }
    return null;
  }

  private cacheResult<T>(key: string, data: T): void {
    if (this.cache.size >= this.config.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    const size = this.estimateSize(data);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: new Date(),
      ttl: this.config.cacheTTL,
      size
    });
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Background processing methods
  private startBackgroundProcessor(): void {
    setInterval(() => {
      this.processBackgroundQueue();
    }, 1000); // Process queue every second
  }

  private async processBackgroundQueue(): Promise<void> {
    if (this.backgroundQueue.length === 0 || 
        this.activeOperations.size >= this.config.maxConcurrentOperations) {
      return;
    }

    // Sort queue by priority
    this.backgroundQueue.sort((a, b) => b.priority - a.priority);

    const job = this.backgroundQueue.shift();
    if (!job) return;

    this.activeOperations.add(job.id);
    
    try {
      await this.executeBackgroundJob(job);
      this.performanceMetrics.backgroundJobsCompleted++;
    } catch (error) {
      console.error(`Background job ${job.id} failed:`, error);
    } finally {
      this.activeOperations.delete(job.id);
    }
  }

  private async executeBackgroundJob(job: BackgroundJob): Promise<void> {
    switch (job.type) {
      case 'comparison':
        // Execute batch comparison
        const { batch, comparisonEngine } = job.data;
        await Promise.all(
          batch.map((req: any) => 
            comparisonEngine.compareJourneys(req.successful, req.failed, req.type)
          )
        );
        break;
      
      case 'preload':
        // Preload comparison
        const { successful, failed, comparisonEngine: engine } = job.data;
        const result = await engine.compareJourneys(successful, failed, 'comprehensive');
        this.cacheResult(job.id, result);
        break;
        
      case 'optimization':
        // Run optimization tasks
        await this.runOptimizationTasks(job.data);
        break;
    }
  }

  private addBackgroundJob(job: BackgroundJob): void {
    this.backgroundQueue.push(job);
  }

  // Cache maintenance
  private startCacheMaintenance(): void {
    setInterval(() => {
      this.cleanExpiredCache();
    }, 60000); // Clean every minute
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Utility methods
  private generateOperationId(successfulId: string, failedId: string, type: ComparisonType): string {
    return `${successfulId}-${failedId}-${type}`;
  }

  private updateMetrics(duration: number, cacheHit: boolean): void {
    this.performanceMetrics.totalOperations++;
    
    if (cacheHit) {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalOperations - 1) + 1) / 
        this.performanceMetrics.totalOperations;
    } else {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalOperations - 1)) / 
        this.performanceMetrics.totalOperations;
    }

    this.processingHistory.push({ duration, timestamp: new Date() });
    
    // Keep only last 100 operations for average calculation
    if (this.processingHistory.length > 100) {
      this.processingHistory.shift();
    }

    this.performanceMetrics.averageProcessingTime = 
      this.processingHistory.reduce((sum, op) => sum + op.duration, 0) / this.processingHistory.length;
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private estimateSize(obj: any): number {
    // Rough estimation of object size in bytes
    return JSON.stringify(obj).length * 2;
  }

  private optimizeQueryStructure(criteria: any): any {
    // Implement query optimization logic
    return null; // Placeholder
  }

  private async runOptimizationTasks(data: any): Promise<void> {
    // Run various optimization tasks
  }

  // Async operation management
  private async waitForOperation(operationId: string): Promise<any> {
    // Implementation would poll or use events to wait for operation completion
    throw new Error('Operation waiting not implemented');
  }

  private async waitForBackgroundJob(jobId: string): Promise<any> {
    // Implementation would wait for background job completion
    throw new Error('Background job waiting not implemented');
  }
}

export type {
  OptimizationConfig,
  PerformanceMetrics
};