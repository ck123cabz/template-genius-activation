/**
 * Pattern Cache Manager with Real-time Invalidation
 * Epic 4, Story 4.3: Real-time Pattern Updates
 * 
 * Efficient caching system with real-time cache invalidation and multi-level storage.
 * Ensures optimal performance for real-time pattern updates.
 */

import { EventEmitter } from 'events';
import { SuccessPattern } from '../data-models/pattern-models';
import { PatternEvent, PatternUpdateResult } from '../real-time/pattern-events';
import { PatternAlert } from '../real-time/pattern-events';

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  ttl: number; // Time to live in milliseconds
  tags: string[]; // For tag-based invalidation
  size: number; // Memory footprint estimate
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalMemoryMB: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  invalidationCount: number;
  oldestEntryAge: number;
  averageAccessCount: number;
  hitsByPriority: { [key: string]: number };
  missByPriority: { [key: string]: number };
}

/**
 * Cache invalidation strategies
 */
export type InvalidationStrategy = 
  | 'immediate'        // Invalidate immediately 
  | 'batch'           // Batch invalidations
  | 'lazy'            // Invalidate on next access
  | 'ttl_based'       // Use TTL expiration only
  | 'pattern_based';  // Invalidate based on pattern matching

/**
 * Multi-level cache configuration
 */
export interface CacheConfig {
  maxMemoryMB: number;              // Maximum memory usage
  maxEntries: number;               // Maximum number of entries
  defaultTTL: number;               // Default TTL in milliseconds
  cleanupInterval: number;          // Cleanup interval in milliseconds
  invalidationStrategy: InvalidationStrategy;
  evictionPolicy: 'lru' | 'lfu' | 'priority'; // Eviction policy
  batchInvalidationSize: number;    // Batch size for batch invalidation
  compressionEnabled: boolean;      // Enable value compression
  persistToDisk: boolean;          // Persist cache to disk
  diskCacheSize: number;           // Disk cache size limit
}

// Optimized configuration for real-time pattern caching
const DEFAULT_CONFIG: CacheConfig = {
  maxMemoryMB: 128,
  maxEntries: 10000,
  defaultTTL: 900000,              // 15 minutes
  cleanupInterval: 60000,          // 1 minute
  invalidationStrategy: 'immediate',
  evictionPolicy: 'lru',
  batchInvalidationSize: 50,
  compressionEnabled: false,        // Disabled for speed
  persistToDisk: false,            // Memory-only for real-time
  diskCacheSize: 256
};

/**
 * LRU (Least Recently Used) Cache implementation
 */
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = []; // Track access order
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Update access tracking
    entry.lastAccessed = new Date();
    entry.accessCount++;
    
    // Move to end of access order (most recently used)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);

    return entry;
  }

  set(key: string, entry: CacheEntry<T>): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    
    // Update access order
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return deleted;
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.delete(lruKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  values(): CacheEntry<T>[] {
    return Array.from(this.cache.values());
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Pattern Cache Manager
 * Handles caching of patterns, alerts, and recommendations with real-time invalidation
 */
export class PatternCacheManager extends EventEmitter {
  private config: CacheConfig;
  
  // Multi-level caches for different data types
  private patternCache: LRUCache<SuccessPattern>;
  private alertCache: LRUCache<PatternAlert[]>;
  private recommendationCache: LRUCache<any>;
  private queryResultCache: LRUCache<any>;
  
  // Cache statistics
  private stats: CacheStats;
  
  // Invalidation tracking
  private pendingInvalidations: Set<string> = new Set();
  private invalidationBatch: string[] = [];
  private invalidationTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize caches
    this.patternCache = new LRUCache(Math.floor(this.config.maxEntries * 0.6)); // 60% for patterns
    this.alertCache = new LRUCache(Math.floor(this.config.maxEntries * 0.2));   // 20% for alerts  
    this.recommendationCache = new LRUCache(Math.floor(this.config.maxEntries * 0.15)); // 15% for recommendations
    this.queryResultCache = new LRUCache(Math.floor(this.config.maxEntries * 0.05));   // 5% for query results

    // Initialize stats
    this.stats = this.initializeStats();
    
    // Start maintenance tasks
    this.startCleanupTimer();
    
    console.log('Pattern cache manager initialized');
  }

  /**
   * Cache a pattern with automatic tagging
   */
  cachePattern(
    pattern: SuccessPattern, 
    ttl?: number, 
    priority: CacheEntry<any>['priority'] = 'medium'
  ): void {
    const key = `pattern:${pattern.id}`;
    const tags = this.generatePatternTags(pattern);
    
    const entry: CacheEntry<SuccessPattern> = {
      key,
      value: pattern,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      ttl: ttl || this.config.defaultTTL,
      tags,
      size: this.estimatePatternSize(pattern),
      priority
    };

    this.patternCache.set(key, entry);
    this.updateStats('set', 'pattern');
    
    this.emit('pattern_cached', { patternId: pattern.id, key, tags });
  }

  /**
   * Get pattern from cache
   */
  getPattern(patternId: string): SuccessPattern | null {
    const key = `pattern:${patternId}`;
    const entry = this.patternCache.get(key);
    
    if (!entry) {
      this.updateStats('miss', 'pattern');
      return null;
    }

    // Check TTL expiration
    if (this.isExpired(entry)) {
      this.patternCache.delete(key);
      this.updateStats('expired', 'pattern');
      return null;
    }

    this.updateStats('hit', 'pattern');
    return entry.value;
  }

  /**
   * Cache alerts with client grouping
   */
  cacheAlerts(
    clientId: string, 
    alerts: PatternAlert[], 
    ttl?: number
  ): void {
    const key = `alerts:${clientId}`;
    const tags = [`client:${clientId}`, 'alerts'];
    
    const entry: CacheEntry<PatternAlert[]> = {
      key,
      value: alerts,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      ttl: ttl || 300000, // 5 minutes for alerts
      tags,
      size: this.estimateAlertsSize(alerts),
      priority: 'high'
    };

    this.alertCache.set(key, entry);
    this.updateStats('set', 'alert');
  }

  /**
   * Get alerts from cache
   */
  getAlerts(clientId: string): PatternAlert[] | null {
    const key = `alerts:${clientId}`;
    const entry = this.alertCache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      if (entry) this.alertCache.delete(key);
      this.updateStats('miss', 'alert');
      return null;
    }

    this.updateStats('hit', 'alert');
    return entry.value;
  }

  /**
   * Cache query results with automatic key generation
   */
  cacheQueryResult(
    query: string, 
    params: any, 
    result: any, 
    ttl?: number
  ): string {
    const key = this.generateQueryKey(query, params);
    const tags = this.extractQueryTags(query, params);
    
    const entry: CacheEntry<any> = {
      key,
      value: result,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      ttl: ttl || 600000, // 10 minutes for query results
      tags,
      size: this.estimateObjectSize(result),
      priority: 'low'
    };

    this.queryResultCache.set(key, entry);
    this.updateStats('set', 'query');
    
    return key;
  }

  /**
   * Get query result from cache
   */
  getQueryResult(query: string, params: any): any | null {
    const key = this.generateQueryKey(query, params);
    const entry = this.queryResultCache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      if (entry) this.queryResultCache.delete(key);
      this.updateStats('miss', 'query');
      return null;
    }

    this.updateStats('hit', 'query');
    return entry.value;
  }

  /**
   * Real-time cache invalidation based on pattern updates
   */
  async invalidateOnPatternUpdate(updateResult: PatternUpdateResult): Promise<void> {
    const invalidationKeys: string[] = [];
    
    // Invalidate updated patterns
    updateResult.updatedPatterns.forEach(pattern => {
      invalidationKeys.push(`pattern:${pattern.id}`);
    });
    
    // Invalidate new patterns (clear related caches)
    updateResult.newPatterns.forEach(pattern => {
      invalidationKeys.push(`pattern:${pattern.id}`);
    });
    
    // Invalidate affected client alerts
    updateResult.affectedClients.forEach(clientId => {
      invalidationKeys.push(`alerts:${clientId}`);
    });

    // Invalidate related query results
    const relatedQueryKeys = this.findRelatedQueryKeys(updateResult);
    invalidationKeys.push(...relatedQueryKeys);

    await this.invalidateKeys(invalidationKeys);
    
    this.emit('cache_invalidated', { 
      reason: 'pattern_update',
      keysInvalidated: invalidationKeys.length,
      updateResult 
    });
  }

  /**
   * Invalidate cache based on pattern events
   */
  async invalidateOnPatternEvent(event: PatternEvent): Promise<void> {
    const invalidationKeys: string[] = [];
    
    // Invalidate pattern if it exists
    if (event.patternId) {
      invalidationKeys.push(`pattern:${event.patternId}`);
    }
    
    // Invalidate client-specific caches
    invalidationKeys.push(`alerts:${event.clientId}`);
    
    // Invalidate query caches related to this client/pattern
    const queryKeys = this.findQueryKeysByTags([
      `client:${event.clientId}`,
      event.patternId ? `pattern:${event.patternId}` : null
    ].filter(Boolean) as string[]);
    
    invalidationKeys.push(...queryKeys);

    await this.invalidateKeys(invalidationKeys);
    
    this.emit('cache_invalidated', { 
      reason: 'pattern_event',
      keysInvalidated: invalidationKeys.length,
      event 
    });
  }

  /**
   * Tag-based cache invalidation
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    const keysToInvalidate: string[] = [];
    
    // Find keys with matching tags across all caches
    const allEntries = [
      ...this.patternCache.values(),
      ...this.alertCache.values(),
      ...this.recommendationCache.values(),
      ...this.queryResultCache.values()
    ];

    allEntries.forEach(entry => {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keysToInvalidate.push(entry.key);
      }
    });

    await this.invalidateKeys(keysToInvalidate);
    
    this.emit('cache_invalidated', { 
      reason: 'tags',
      tags,
      keysInvalidated: keysToInvalidate.length 
    });

    return keysToInvalidate.length;
  }

  /**
   * Batch invalidation of cache keys
   */
  private async invalidateKeys(keys: string[]): Promise<void> {
    if (this.config.invalidationStrategy === 'immediate') {
      keys.forEach(key => this.invalidateKey(key));
    } else if (this.config.invalidationStrategy === 'batch') {
      this.invalidationBatch.push(...keys);
      this.scheduleBatchInvalidation();
    } else if (this.config.invalidationStrategy === 'lazy') {
      keys.forEach(key => this.pendingInvalidations.add(key));
    }
  }

  /**
   * Invalidate single cache key
   */
  private invalidateKey(key: string): boolean {
    let invalidated = false;
    
    // Try each cache
    if (this.patternCache.delete(key)) invalidated = true;
    if (this.alertCache.delete(key)) invalidated = true;
    if (this.recommendationCache.delete(key)) invalidated = true;
    if (this.queryResultCache.delete(key)) invalidated = true;
    
    if (invalidated) {
      this.stats.invalidationCount++;
    }
    
    return invalidated;
  }

  /**
   * Schedule batch invalidation
   */
  private scheduleBatchInvalidation(): void {
    if (this.invalidationTimer) return; // Already scheduled
    
    this.invalidationTimer = setTimeout(() => {
      const batch = [...this.invalidationBatch];
      this.invalidationBatch = [];
      this.invalidationTimer = null;
      
      batch.forEach(key => this.invalidateKey(key));
      
      this.emit('batch_invalidated', { keysInvalidated: batch.length });
    }, 1000); // 1 second batch delay
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    // Cleanup each cache
    cleaned += this.cleanupCache(this.patternCache, now);
    cleaned += this.cleanupCache(this.alertCache, now);
    cleaned += this.cleanupCache(this.recommendationCache, now);
    cleaned += this.cleanupCache(this.queryResultCache, now);
    
    if (cleaned > 0) {
      this.emit('cache_cleaned', { entriesRemoved: cleaned });
    }
  }

  /**
   * Cleanup specific cache
   */
  private cleanupCache<T>(cache: LRUCache<T>, now: number): number {
    let cleaned = 0;
    const keysToDelete: string[] = [];
    
    cache.values().forEach(entry => {
      if (now - entry.createdAt.getTime() > entry.ttl) {
        keysToDelete.push(entry.key);
      }
    });
    
    keysToDelete.forEach(key => {
      if (cache.delete(key)) cleaned++;
    });
    
    return cleaned;
  }

  /**
   * Helper methods for cache key and tag generation
   */
  private generatePatternTags(pattern: SuccessPattern): string[] {
    const tags = [
      `pattern:${pattern.id}`,
      `type:${pattern.patternType}`,
      `confidence:${Math.floor(pattern.confidenceScore * 10)}` // Group by confidence decile
    ];

    // Add client tags
    if (pattern.patternData.metadata?.sourceClientIds) {
      pattern.patternData.metadata.sourceClientIds.forEach(clientId => {
        tags.push(`client:${clientId}`);
      });
    }

    return tags;
  }

  private generateQueryKey(query: string, params: any): string {
    const paramStr = JSON.stringify(params, Object.keys(params).sort());
    const hash = this.simpleHash(query + paramStr);
    return `query:${hash}`;
  }

  private extractQueryTags(query: string, params: any): string[] {
    const tags = ['query'];
    
    // Extract client IDs from params
    if (params.clientId) tags.push(`client:${params.clientId}`);
    if (params.patternId) tags.push(`pattern:${params.patternId}`);
    if (params.patternType) tags.push(`type:${params.patternType}`);
    
    return tags;
  }

  private findRelatedQueryKeys(updateResult: PatternUpdateResult): string[] {
    const relatedKeys: string[] = [];
    const affectedTags = new Set<string>();
    
    // Build affected tags
    updateResult.updatedPatterns.forEach(pattern => {
      affectedTags.add(`pattern:${pattern.id}`);
      affectedTags.add(`type:${pattern.patternType}`);
    });
    
    updateResult.affectedClients.forEach(clientId => {
      affectedTags.add(`client:${clientId}`);
    });
    
    // Find query cache entries with matching tags
    this.queryResultCache.values().forEach(entry => {
      if (entry.tags.some(tag => affectedTags.has(tag))) {
        relatedKeys.push(entry.key);
      }
    });
    
    return relatedKeys;
  }

  private findQueryKeysByTags(tags: string[]): string[] {
    const keys: string[] = [];
    
    this.queryResultCache.values().forEach(entry => {
      if (entry.tags.some(tag => tags.includes(tag))) {
        keys.push(entry.key);
      }
    });
    
    return keys;
  }

  /**
   * Utility methods
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.createdAt.getTime();
    return age > entry.ttl;
  }

  private estimatePatternSize(pattern: SuccessPattern): number {
    // Rough size estimation in bytes
    const jsonStr = JSON.stringify(pattern);
    return jsonStr.length * 2; // Approximate UTF-16 size
  }

  private estimateAlertsSize(alerts: PatternAlert[]): number {
    const jsonStr = JSON.stringify(alerts);
    return jsonStr.length * 2;
  }

  private estimateObjectSize(obj: any): number {
    const jsonStr = JSON.stringify(obj);
    return jsonStr.length * 2;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private initializeStats(): CacheStats {
    return {
      totalEntries: 0,
      totalMemoryMB: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      invalidationCount: 0,
      oldestEntryAge: 0,
      averageAccessCount: 0,
      hitsByPriority: {},
      missByPriority: {}
    };
  }

  private updateStats(operation: 'hit' | 'miss' | 'set' | 'expired', type: string): void {
    // Update basic stats
    if (operation === 'hit') {
      this.stats.hitRate = (this.stats.hitRate + 1) / 2; // Simplified rolling average
    } else if (operation === 'miss') {
      this.stats.missRate = (this.stats.missRate + 1) / 2;
    }
    
    // Update total entries
    this.stats.totalEntries = 
      this.patternCache.size() + 
      this.alertCache.size() + 
      this.recommendationCache.size() + 
      this.queryResultCache.size();
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Public API methods
   */
  getStats(): CacheStats {
    // Calculate current stats
    const allEntries = [
      ...this.patternCache.values(),
      ...this.alertCache.values(),
      ...this.recommendationCache.values(),
      ...this.queryResultCache.values()
    ];

    const now = Date.now();
    const totalSize = allEntries.reduce((sum, entry) => sum + entry.size, 0);
    const oldestEntry = allEntries.reduce((oldest, entry) => 
      entry.createdAt.getTime() < oldest.createdAt.getTime() ? entry : oldest,
      allEntries[0] || { createdAt: new Date() }
    );
    
    return {
      ...this.stats,
      totalEntries: allEntries.length,
      totalMemoryMB: totalSize / 1024 / 1024,
      oldestEntryAge: allEntries.length > 0 ? now - oldestEntry.createdAt.getTime() : 0,
      averageAccessCount: allEntries.length > 0 
        ? allEntries.reduce((sum, entry) => sum + entry.accessCount, 0) / allEntries.length 
        : 0
    };
  }

  clearAll(): void {
    this.patternCache.clear();
    this.alertCache.clear();
    this.recommendationCache.clear();
    this.queryResultCache.clear();
    
    this.stats.invalidationCount += this.stats.totalEntries;
    this.stats.totalEntries = 0;
    
    this.emit('cache_cleared');
  }

  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.invalidationTimer) {
      clearTimeout(this.invalidationTimer);
    }
    
    this.clearAll();
    this.removeAllListeners();
  }
}

/**
 * Singleton instance for application-wide use
 */
export const patternCacheManager = new PatternCacheManager();

/**
 * Utility functions
 */
export function cachePattern(pattern: SuccessPattern, ttl?: number): void {
  patternCacheManager.cachePattern(pattern, ttl);
}

export function getPattern(patternId: string): SuccessPattern | null {
  return patternCacheManager.getPattern(patternId);
}

export function invalidateOnPatternUpdate(updateResult: PatternUpdateResult): Promise<void> {
  return patternCacheManager.invalidateOnPatternUpdate(updateResult);
}

export function getCacheStats(): CacheStats {
  return patternCacheManager.getStats();
}