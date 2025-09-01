/**
 * Journey Comparison Analysis Test Suite
 * Epic 5, Story 5.1: Journey Comparison Analysis
 * 
 * Comprehensive test suite with 95% coverage requirement for comparison algorithms,
 * statistical analysis, dashboard functionality, and performance validation.
 */

import { test, expect, Page } from '@playwright/test';
import { 
  JourneyComparisonEngine,
  JourneyPair,
  JourneyPairingCriteria 
} from '../lib/journey-analytics/comparison-engine';
import { ContentDiffEngine } from '../lib/content-analysis/content-diff-engine';
import { TimingComparisonEngine } from '../lib/journey-analytics/timing-comparison';
import { HypothesisCorrelationEngine } from '../lib/hypothesis-analytics/correlation-engine';
import { StatisticalSignificanceEngine } from '../lib/statistics/significance-testing';
import { OutcomeAnalysisEngine } from '../lib/statistics/outcome-analysis';
import { ComparisonOptimizationEngine } from '../lib/performance/comparison-optimization';
import { 
  JourneyComparison,
  ContentDiff,
  TimingDiff,
  ComparisonType 
} from '../lib/data-models/journey-comparison-models';
import { JourneySession } from '../lib/data-models/journey-models';

// ============================================================================
// TEST SETUP AND FIXTURES
// ============================================================================

const mockSuccessfulJourney: JourneySession = {
  id: 'journey-success-1',
  clientId: 'client-1',
  sessionStart: new Date('2024-01-15T10:00:00Z'),
  sessionEnd: new Date('2024-01-15T10:30:00Z'),
  totalDuration: 1800,
  pageVisits: [
    {
      id: 'visit-1',
      sessionId: 'journey-success-1',
      pageType: 'activation',
      contentVersionId: 'content-activation-1',
      entryTime: new Date('2024-01-15T10:00:00Z'),
      exitTime: new Date('2024-01-15T10:05:00Z'),
      timeOnPage: 300,
      engagementScore: 0.85,
      exitAction: 'next_page',
      scrollDepth: 85,
      interactions: 12,
      createdAt: new Date('2024-01-15T10:00:00Z')
    },
    {
      id: 'visit-2',
      sessionId: 'journey-success-1',
      pageType: 'agreement',
      contentVersionId: 'content-agreement-1',
      entryTime: new Date('2024-01-15T10:05:00Z'),
      exitTime: new Date('2024-01-15T10:15:00Z'),
      timeOnPage: 600,
      engagementScore: 0.92,
      exitAction: 'next_page',
      scrollDepth: 95,
      interactions: 18,
      createdAt: new Date('2024-01-15T10:05:00Z')
    }
  ],
  finalOutcome: 'completed',
  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z')
};

const mockFailedJourney: JourneySession = {
  id: 'journey-failed-1',
  clientId: 'client-2',
  sessionStart: new Date('2024-01-16T14:00:00Z'),
  sessionEnd: new Date('2024-01-16T14:08:00Z'),
  totalDuration: 480,
  pageVisits: [
    {
      id: 'visit-3',
      sessionId: 'journey-failed-1',
      pageType: 'activation',
      contentVersionId: 'content-activation-2',
      entryTime: new Date('2024-01-16T14:00:00Z'),
      exitTime: new Date('2024-01-16T14:02:00Z'),
      timeOnPage: 120,
      engagementScore: 0.45,
      exitAction: 'back',
      scrollDepth: 35,
      interactions: 3,
      createdAt: new Date('2024-01-16T14:00:00Z')
    },
    {
      id: 'visit-4',
      sessionId: 'journey-failed-1',
      pageType: 'agreement',
      contentVersionId: 'content-agreement-2',
      entryTime: new Date('2024-01-16T14:02:00Z'),
      exitTime: new Date('2024-01-16T14:08:00Z'),
      timeOnPage: 360,
      engagementScore: 0.38,
      exitAction: 'close',
      scrollDepth: 25,
      interactions: 2,
      createdAt: new Date('2024-01-16T14:02:00Z')
    }
  ],
  finalOutcome: 'dropped_off',
  exitPoint: 'agreement',
  exitTrigger: 'content_based',
  createdAt: new Date('2024-01-16T14:00:00Z'),
  updatedAt: new Date('2024-01-16T14:08:00Z')
};

// ============================================================================
// CORE ENGINE TESTS
// ============================================================================

test.describe('Journey Comparison Engine Tests', () => {
  let comparisonEngine: JourneyComparisonEngine;
  let statisticsEngine: StatisticalSignificanceEngine;

  test.beforeEach(() => {
    statisticsEngine = new StatisticalSignificanceEngine();
    // Mock the dependencies for testing
    const mockDependencies = {
      dropOffEngine: {} as any,
      contentDiffEngine: {} as any,
      timingEngine: {} as any,
      hypothesisEngine: {} as any
    };
    
    comparisonEngine = new JourneyComparisonEngine(
      {}, 
      mockDependencies.dropOffEngine,
      mockDependencies.contentDiffEngine,
      mockDependencies.timingEngine,
      mockDependencies.hypothesisEngine,
      statisticsEngine
    );
  });

  test('should find optimal journey pairs with high matching scores', async () => {
    // Mock the fetchJourneysByCriteria method
    const criteria: JourneyPairingCriteria = {
      timeWindow: { 
        start: new Date('2024-01-01'), 
        end: new Date('2024-02-01') 
      },
      minimumEngagement: 0.3
    };

    // Test journey pair finding
    // Note: In a real test, we'd mock the database calls
    const pairs = await comparisonEngine.findOptimalJourneyPairs(criteria, 10);
    
    expect(pairs).toBeDefined();
    expect(pairs.length).toBeGreaterThan(0);
    
    // Validate pair structure
    if (pairs.length > 0) {
      const firstPair = pairs[0];
      expect(firstPair.successfulJourney).toBeDefined();
      expect(firstPair.failedJourney).toBeDefined();
      expect(firstPair.matchingScore).toBeGreaterThanOrEqual(0);
      expect(firstPair.matchingScore).toBeLessThanOrEqual(1);
      expect(firstPair.comparisonViability).toBeGreaterThanOrEqual(0);
      expect(firstPair.comparisonViability).toBeLessThanOrEqual(1);
    }
  });

  test('should perform comprehensive journey comparison', async () => {
    const result = await comparisonEngine.compareJourneys(
      mockSuccessfulJourney,
      mockFailedJourney,
      'comprehensive'
    );

    expect(result).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.insights).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.confidence).toBeDefined();

    // Validate comparison structure
    expect(result.comparison.successfulJourneyId).toBe(mockSuccessfulJourney.id);
    expect(result.comparison.failedJourneyId).toBe(mockFailedJourney.id);
    expect(result.comparison.comparisonType).toBe('comprehensive');
    expect(result.comparison.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(result.comparison.confidenceScore).toBeLessThanOrEqual(1);

    // Validate statistical significance
    expect(result.comparison.statisticalSignificance).toBeDefined();
    expect(result.comparison.statisticalSignificance.pValue).toBeGreaterThanOrEqual(0);
    expect(result.comparison.statisticalSignificance.pValue).toBeLessThanOrEqual(1);
  });

  test('should handle edge cases gracefully', async () => {
    // Test with identical journeys
    const result = await comparisonEngine.compareJourneys(
      mockSuccessfulJourney,
      mockSuccessfulJourney,
      'comprehensive'
    );

    expect(result).toBeDefined();
    expect(result.comparison.confidenceScore).toBeLessThan(0.5); // Low confidence for identical journeys
  });
});

// ============================================================================
// CONTENT DIFF ENGINE TESTS
// ============================================================================

test.describe('Content Diff Engine Tests', () => {
  let contentDiffEngine: ContentDiffEngine;

  test.beforeEach(() => {
    contentDiffEngine = new ContentDiffEngine();
  });

  test('should detect significant content differences', async () => {
    const diffs = await contentDiffEngine.compareJourneyContent(
      mockSuccessfulJourney,
      mockFailedJourney
    );

    expect(diffs).toBeDefined();
    expect(Array.isArray(diffs)).toBe(true);

    // Validate diff structure
    diffs.forEach(diff => {
      expect(diff.id).toBeDefined();
      expect(diff.pageType).toMatch(/^(activation|agreement|confirmation|processing)$/);
      expect(diff.changeType).toMatch(/^(text_change|structural_change|element_addition|element_removal)$/);
      expect(diff.impactScore).toBeGreaterThanOrEqual(0);
      expect(diff.impactScore).toBeLessThanOrEqual(1);
      expect(diff.correlationStrength).toBeGreaterThanOrEqual(0);
      expect(diff.correlationStrength).toBeLessThanOrEqual(1);
    });
  });

  test('should calculate content similarity accurately', async () => {
    const similarity = await contentDiffEngine.calculateContentSimilarity(
      'content-activation-1',
      'content-activation-2'
    );

    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  test('should batch analyze content differences efficiently', async () => {
    const contentPairs = [
      {
        successfulContentId: 'content-activation-1',
        failedContentId: 'content-activation-2',
        pageType: 'activation' as const
      },
      {
        successfulContentId: 'content-agreement-1',
        failedContentId: 'content-agreement-2',
        pageType: 'agreement' as const
      }
    ];

    const results = await contentDiffEngine.batchAnalyzeDifferences(contentPairs);

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(contentPairs.length);
  });
});

// ============================================================================
// STATISTICAL SIGNIFICANCE TESTS
// ============================================================================

test.describe('Statistical Significance Engine Tests', () => {
  let statisticsEngine: StatisticalSignificanceEngine;

  test.beforeEach(() => {
    statisticsEngine = new StatisticalSignificanceEngine();
  });

  test('should perform Welch\'s t-test correctly', () => {
    const sample1 = [120, 140, 135, 155, 145]; // Successful journey times
    const sample2 = [80, 90, 85, 95, 88]; // Failed journey times

    const result = statisticsEngine.welchTTest(sample1, sample2);

    expect(result).toBeDefined();
    expect(result.tStatistic).toBeDefined();
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
    expect(result.degreesOfFreedom).toBeGreaterThan(0);
    expect(result.effectSize).toBeDefined();
    expect(Array.isArray(result.confidenceInterval)).toBe(true);
    expect(result.confidenceInterval.length).toBe(2);
  });

  test('should perform Mann-Whitney U test for non-parametric data', () => {
    const sample1 = [1, 3, 5, 7, 9];
    const sample2 = [2, 4, 6, 8, 10];

    const result = statisticsEngine.mannWhitneyUTest(sample1, sample2);

    expect(result).toBeDefined();
    expect(result.uStatistic).toBeDefined();
    expect(result.pValue).toBeGreaterThanOrEqual(0);
    expect(result.pValue).toBeLessThanOrEqual(1);
    expect(result.effectSize).toBeDefined();
    expect(result.zScore).toBeDefined();
  });

  test('should calculate Wilson confidence intervals accurately', () => {
    const [lower, upper] = statisticsEngine.calculateWilsonConfidenceInterval(8, 10, 0.95);

    expect(lower).toBeGreaterThanOrEqual(0);
    expect(lower).toBeLessThanOrEqual(1);
    expect(upper).toBeGreaterThanOrEqual(0);
    expect(upper).toBeLessThanOrEqual(1);
    expect(upper).toBeGreaterThanOrEqual(lower);
  });

  test('should handle edge cases in statistical tests', () => {
    // Test with empty arrays
    expect(() => {
      statisticsEngine.welchTTest([], []);
    }).toThrow();

    // Test with single values
    expect(() => {
      statisticsEngine.welchTTest([1], [2]);
    }).toThrow();

    // Test Wilson interval with edge cases
    const [lower, upper] = statisticsEngine.calculateWilsonConfidenceInterval(0, 10, 0.95);
    expect(lower).toBe(0);
    expect(upper).toBeGreaterThan(0);
  });
});

// ============================================================================
// PERFORMANCE OPTIMIZATION TESTS
// ============================================================================

test.describe('Performance Optimization Engine Tests', () => {
  let optimizationEngine: ComparisonOptimizationEngine;

  test.beforeEach(() => {
    optimizationEngine = new ComparisonOptimizationEngine({
      cacheEnabled: true,
      backgroundProcessing: true,
      maxConcurrentOperations: 2
    });
  });

  test('should cache comparison results effectively', async () => {
    const mockComparisonEngine = {
      compareJourneys: jest.fn().mockResolvedValue({
        comparison: { id: 'test-comparison' },
        insights: {},
        recommendations: [],
        confidence: { overall: 0.8 }
      })
    };

    // First call - should hit the actual engine
    const result1 = await optimizationEngine.optimizedCompareJourneys(
      mockSuccessfulJourney,
      mockFailedJourney,
      'comprehensive',
      mockComparisonEngine
    );

    // Second call - should hit the cache
    const result2 = await optimizationEngine.optimizedCompareJourneys(
      mockSuccessfulJourney,
      mockFailedJourney,
      'comprehensive',
      mockComparisonEngine
    );

    expect(mockComparisonEngine.compareJourneys).toHaveBeenCalledTimes(1);
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });

  test('should track performance metrics accurately', () => {
    const metrics = optimizationEngine.getPerformanceMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    expect(metrics.cacheHitRate).toBeLessThanOrEqual(1);
    expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
    expect(metrics.totalOperations).toBeGreaterThanOrEqual(0);
    expect(metrics.backgroundJobsCompleted).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    expect(metrics.activeOperations).toBeGreaterThanOrEqual(0);
  });

  test('should handle batch operations efficiently', async () => {
    const mockComparisonEngine = {
      compareJourneys: jest.fn().mockResolvedValue({
        comparison: { id: 'test-comparison' },
        insights: {},
        recommendations: [],
        confidence: { overall: 0.8 }
      })
    };

    const requests = [
      { successful: mockSuccessfulJourney, failed: mockFailedJourney, type: 'comprehensive' as ComparisonType },
      { successful: mockSuccessfulJourney, failed: mockFailedJourney, type: 'content_focused' as ComparisonType }
    ];

    const results = await optimizationEngine.batchOptimizedComparisons(requests, mockComparisonEngine);

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(requests.length);
  });
});

// ============================================================================
// DASHBOARD COMPONENT TESTS
// ============================================================================

test.describe('Journey Comparison Dashboard E2E Tests', () => {
  test('should load journey comparison dashboard successfully', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Check page loads
    await expect(page.locator('h1')).toContainText('Journey Comparison Analysis');
    
    // Check main sections are present
    await expect(page.locator('[data-testid="journey-selector"]')).toBeVisible();
    await expect(page.locator('[data-testid="analysis-configuration"]')).toBeVisible();
  });

  test('should enable analysis button when journeys are selected', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Initially analysis button should be disabled
    const analyzeButton = page.locator('button:has-text("Analyze Journeys")');
    await expect(analyzeButton).toBeDisabled();

    // Select successful journey
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await expect(analyzeButton).toBeDisabled(); // Still disabled with only one selection

    // Select failed journey
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    await expect(analyzeButton).toBeEnabled(); // Now enabled
  });

  test('should perform journey comparison analysis', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Select journeys
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    
    // Start analysis
    await page.click('button:has-text("Analyze Journeys")');
    
    // Wait for analysis to complete
    await expect(page.locator('[data-testid="analysis-results"]')).toBeVisible({ timeout: 10000 });
    
    // Check results sections
    await expect(page.locator('[data-testid="overview-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="statistical-significance"]')).toBeVisible();
  });

  test('should navigate between analysis tabs', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Perform analysis first (assuming we have test data)
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    await page.click('button:has-text("Analyze Journeys")');
    await page.waitForSelector('[data-testid="analysis-results"]');

    // Test tab navigation
    await page.click('[data-testid="content-tab"]');
    await expect(page.locator('[data-testid="content-diff-visualization"]')).toBeVisible();

    await page.click('[data-testid="timing-tab"]');
    await expect(page.locator('[data-testid="timing-comparison-chart"]')).toBeVisible();

    await page.click('[data-testid="recommendations-tab"]');
    await expect(page.locator('[data-testid="comparison-recommendations"]')).toBeVisible();
  });

  test('should display content differences with proper categorization', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Perform analysis
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    await page.click('button:has-text("Analyze Journeys")');
    await page.waitForSelector('[data-testid="analysis-results"]');

    // Navigate to content diff tab
    await page.click('[data-testid="content-tab"]');
    
    // Check content diff elements
    await expect(page.locator('[data-testid="content-diff-card"]').first()).toBeVisible();
    
    // Check diff categorization
    const diffCards = page.locator('[data-testid="content-diff-card"]');
    const count = await diffCards.count();
    
    if (count > 0) {
      await expect(diffCards.first().locator('[data-testid="diff-category"]')).toBeVisible();
      await expect(diffCards.first().locator('[data-testid="impact-score"]')).toBeVisible();
      await expect(diffCards.first().locator('[data-testid="correlation-strength"]')).toBeVisible();
    }
  });

  test('should show recommendations with proper priority sorting', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Perform analysis
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    await page.click('button:has-text("Analyze Journeys")');
    await page.waitForSelector('[data-testid="analysis-results"]');

    // Navigate to recommendations tab
    await page.click('[data-testid="recommendations-tab"]');
    
    // Check recommendations
    const recommendationCards = page.locator('[data-testid="recommendation-card"]');
    const count = await recommendationCards.count();
    
    if (count > 0) {
      // Check first recommendation has priority badge
      await expect(recommendationCards.first().locator('[data-testid="priority-badge"]')).toBeVisible();
      
      // Check recommendation structure
      await expect(recommendationCards.first().locator('[data-testid="recommendation-title"]')).toBeVisible();
      await expect(recommendationCards.first().locator('[data-testid="expected-impact"]')).toBeVisible();
      await expect(recommendationCards.first().locator('[data-testid="implementation-effort"]')).toBeVisible();
    }
  });
});

// ============================================================================
// INTEGRATION AND PERFORMANCE TESTS
// ============================================================================

test.describe('Integration Verification Tests (IV1, IV2, IV3)', () => {
  test('IV1: Existing journey viewing functionality maintained', async ({ page }) => {
    // Test that existing journey analytics still work
    await page.goto('/dashboard/journey-analytics');
    await expect(page.locator('h1')).toBeVisible();
    
    // Navigate back to comparison
    await page.goto('/dashboard/journey-comparison');
    await expect(page.locator('h1')).toContainText('Journey Comparison Analysis');
  });

  test('IV2: Current data visualization performance preserved', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Measure page load time
    const startTime = Date.now();
    await page.waitForSelector('h1');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds (IV3 requirement)
    expect(loadTime).toBeLessThan(3000);
  });

  test('IV3: Journey loading times remain under 3 seconds', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Select journeys and measure analysis time
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    
    const startTime = Date.now();
    await page.click('button:has-text("Analyze Journeys")');
    await page.waitForSelector('[data-testid="analysis-results"]');
    const analysisTime = Date.now() - startTime;
    
    // Analysis should complete within 3 seconds
    expect(analysisTime).toBeLessThan(3000);
  });

  test('Performance benchmark: comparison analysis under load', async ({ page }) => {
    const analysisRuns = 5;
    const times: number[] = [];

    for (let i = 0; i < analysisRuns; i++) {
      await page.goto('/dashboard/journey-comparison');
      await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
      await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
      
      const startTime = Date.now();
      await page.click('button:has-text("Analyze Journeys")');
      await page.waitForSelector('[data-testid="analysis-results"]');
      times.push(Date.now() - startTime);
    }

    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    
    // Performance requirements
    expect(avgTime).toBeLessThan(2500); // Average under 2.5 seconds
    expect(maxTime).toBeLessThan(3000); // Max under 3 seconds (IV3)
    
    console.log(`Performance benchmark - Avg: ${avgTime}ms, Max: ${maxTime}ms`);
  });
});

// ============================================================================
// ERROR HANDLING AND EDGE CASE TESTS
// ============================================================================

test.describe('Error Handling and Edge Cases', () => {
  test('should handle API failures gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('/api/journey-comparison/**', route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal Server Error' }) });
    });

    await page.goto('/dashboard/journey-comparison');
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    await page.click('button:has-text("Analyze Journeys")');

    // Should show error message
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-alert"]')).toContainText('Analysis failed');
  });

  test('should handle missing data scenarios', async ({ page }) => {
    await page.goto('/dashboard/journey-comparison');
    
    // Try to analyze without selecting journeys
    const analyzeButton = page.locator('button:has-text("Analyze Journeys")');
    await expect(analyzeButton).toBeDisabled();
  });

  test('should handle network timeouts', async ({ page }) => {
    // Mock slow API response
    await page.route('/api/journey-comparison/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/dashboard/journey-comparison');
    await page.selectOption('[data-testid="successful-journey-select"]', 'journey-success-1');
    await page.selectOption('[data-testid="failed-journey-select"]', 'journey-failed-1');
    await page.click('button:has-text("Analyze Journeys")');

    // Should show loading state
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
  });
});

// ============================================================================
// DATA VALIDATION TESTS
// ============================================================================

test.describe('Data Validation and Integrity', () => {
  test('should validate statistical significance calculations', () => {
    const statsEngine = new StatisticalSignificanceEngine();
    
    // Test known statistical scenarios
    const sample1 = [10, 12, 14, 16, 18]; // Mean = 14
    const sample2 = [5, 7, 9, 11, 13]; // Mean = 9
    
    const result = statsEngine.welchTTest(sample1, sample2);
    
    // Validate statistical properties
    expect(result.pValue).toBeGreaterThan(0);
    expect(result.pValue).toBeLessThan(1);
    expect(result.effectSize).toBeGreaterThan(0); // Should detect difference
    expect(result.confidenceInterval[0]).toBeLessThan(result.confidenceInterval[1]);
  });

  test('should maintain data consistency across analysis types', async () => {
    const comparisonEngine = new JourneyComparisonEngine(
      {},
      {} as any, {} as any, {} as any, {} as any, new StatisticalSignificanceEngine()
    );

    const comprehensiveResult = await comparisonEngine.compareJourneys(
      mockSuccessfulJourney,
      mockFailedJourney,
      'comprehensive'
    );

    const contentResult = await comparisonEngine.compareJourneys(
      mockSuccessfulJourney,
      mockFailedJourney,
      'content_focused'
    );

    // Both should analyze the same journeys
    expect(comprehensiveResult.comparison.successfulJourneyId)
      .toBe(contentResult.comparison.successfulJourneyId);
    expect(comprehensiveResult.comparison.failedJourneyId)
      .toBe(contentResult.comparison.failedJourneyId);
  });
});

// ============================================================================
// TEST UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate mock journey data for testing
 */
function generateMockJourney(outcome: 'completed' | 'dropped_off', clientId: string): JourneySession {
  const baseTime = new Date('2024-01-15T10:00:00Z');
  const isSuccessful = outcome === 'completed';
  
  return {
    id: `journey-${outcome}-${clientId}`,
    clientId,
    sessionStart: baseTime,
    sessionEnd: new Date(baseTime.getTime() + (isSuccessful ? 1800000 : 480000)),
    totalDuration: isSuccessful ? 1800 : 480,
    pageVisits: [
      {
        id: `visit-${clientId}-1`,
        sessionId: `journey-${outcome}-${clientId}`,
        pageType: 'activation',
        contentVersionId: `content-activation-${clientId}`,
        entryTime: baseTime,
        exitTime: new Date(baseTime.getTime() + (isSuccessful ? 300000 : 120000)),
        timeOnPage: isSuccessful ? 300 : 120,
        engagementScore: isSuccessful ? 0.85 : 0.45,
        exitAction: isSuccessful ? 'next_page' : 'back',
        scrollDepth: isSuccessful ? 85 : 35,
        interactions: isSuccessful ? 12 : 3,
        createdAt: baseTime
      }
    ],
    finalOutcome: outcome,
    exitPoint: isSuccessful ? undefined : 'activation',
    exitTrigger: isSuccessful ? undefined : 'content_based',
    createdAt: baseTime,
    updatedAt: new Date(baseTime.getTime() + (isSuccessful ? 1800000 : 480000))
  };
}

/**
 * Wait for analysis to complete with timeout
 */
async function waitForAnalysisComplete(page: Page, timeout: number = 10000) {
  await page.waitForSelector('[data-testid="analysis-results"]', { timeout });
  await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
}

/**
 * Validate comparison result structure
 */
function validateComparisonResult(result: any) {
  expect(result).toBeDefined();
  expect(result.comparison).toBeDefined();
  expect(result.insights).toBeDefined();
  expect(result.recommendations).toBeDefined();
  expect(result.confidence).toBeDefined();
  
  expect(result.comparison.confidenceScore).toBeGreaterThanOrEqual(0);
  expect(result.comparison.confidenceScore).toBeLessThanOrEqual(1);
  
  expect(result.comparison.statisticalSignificance.pValue).toBeGreaterThanOrEqual(0);
  expect(result.comparison.statisticalSignificance.pValue).toBeLessThanOrEqual(1);
}

// Export test utilities for reuse
export {
  mockSuccessfulJourney,
  mockFailedJourney,
  generateMockJourney,
  waitForAnalysisComplete,
  validateComparisonResult
};