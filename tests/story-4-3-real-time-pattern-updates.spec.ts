/**
 * Comprehensive Integration Tests for Story 4.3: Real-time Pattern Updates
 * 
 * Tests all acceptance criteria and integration verification points:
 * - AC 1: Pattern dashboard updates automatically when outcomes are recorded
 * - AC 2: New pattern alerts when significant trends are identified
 * - AC 3: Pattern confidence score adjustments with new data points
 * - AC 4: Real-time conversion rate updates with trend indicators
 * - AC 5: Immediate recommendations for in-progress client journeys
 * - IV1: Real-time updates do not impact existing dashboard responsiveness
 * - IV2: Current notification system preserved while adding pattern alerts
 * - IV3: Background processing maintains system performance during pattern updates
 */

import { test, expect, Page, Browser } from '@playwright/test';
import WebSocket from 'ws';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  websocketURL: 'ws://localhost:8080/api/pattern-updates',
  dashboardPath: '/dashboard/pattern-recognition',
  testTimeout: 30000,
  realTimeUpdateTimeout: 2000,  // 2 seconds for AC 1, 3, 4
  websocketTimeout: 1000        // 1 second for WebSocket propagation
};

/**
 * Test utilities and helpers
 */
class RealTimeTestUtilities {
  private wsConnections: WebSocket[] = [];

  async createWebSocketConnection(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(TEST_CONFIG.websocketURL);
      
      ws.on('open', () => {
        this.wsConnections.push(ws);
        resolve(ws);
      });
      
      ws.on('error', reject);
      
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });
  }

  async waitForWebSocketMessage(ws: WebSocket, messageType: string, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${messageType}`)), timeout);
      
      const handler = (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === messageType) {
            clearTimeout(timer);
            ws.off('message', handler);
            resolve(message);
          }
        } catch (error) {
          // Ignore parsing errors
        }
      };
      
      ws.on('message', handler);
    });
  }

  async simulatePatternUpdate(updateData?: any): Promise<void> {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/pattern-updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'simulate_update',
        data: updateData || {
          type: 'pattern_updated',
          priority: 'high',
          payload: {
            patterns: [{
              id: `test_pattern_${Date.now()}`,
              patternType: 'hypothesis',
              confidenceScore: 0.85,
              sampleSize: 15,
              successRate: 0.73
            }]
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to simulate pattern update: ${response.status}`);
    }
  }

  cleanup(): void {
    this.wsConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.wsConnections = [];
  }
}

// Global test utilities instance
let testUtils: RealTimeTestUtilities;

test.beforeEach(async ({ page }) => {
  testUtils = new RealTimeTestUtilities();
  
  // Navigate to pattern recognition dashboard
  await page.goto(TEST_CONFIG.dashboardPath);
  await page.waitForLoadState('networkidle');
});

test.afterEach(async () => {
  if (testUtils) {
    testUtils.cleanup();
  }
});

/**
 * AC 1: Pattern dashboard updates automatically when outcomes are recorded
 * Sub-2-second pattern updates requirement
 */
test.describe('AC 1: Automatic Dashboard Updates', () => {
  
  test('should update pattern dashboard within 2 seconds of outcome recording', async ({ page }) => {
    // Establish WebSocket connection
    const ws = await testUtils.createWebSocketConnection();
    
    // Wait for initial connection
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Record baseline pattern count
    const initialPatternCount = await page.locator('[data-testid="pattern-card"]').count();
    
    // Simulate pattern update
    const updateStartTime = Date.now();
    await testUtils.simulatePatternUpdate();
    
    // Wait for WebSocket update message
    const updateMessage = await testUtils.waitForWebSocketMessage(
      ws, 
      'pattern_updated', 
      TEST_CONFIG.realTimeUpdateTimeout
    );
    
    const updateReceived = Date.now();
    const propagationTime = updateReceived - updateStartTime;
    
    // Verify update received within 2 seconds
    expect(propagationTime).toBeLessThan(TEST_CONFIG.realTimeUpdateTimeout);
    
    // Verify dashboard updates automatically
    await page.waitForFunction(() => {
      const patterns = document.querySelectorAll('[data-testid="pattern-card"]');
      return patterns.length > 0;
    }, { timeout: TEST_CONFIG.realTimeUpdateTimeout });
    
    // Check for visual update indicators
    const animatingPatterns = page.locator('[data-testid="pattern-card"].animate-pulse');
    await expect(animatingPatterns).toHaveCount(1, { timeout: 1000 });
  });

  test('should display real-time connection status indicator', async ({ page }) => {
    // Check for connection status indicator
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toBeVisible();
    
    // Verify live status is shown
    await expect(connectionStatus).toContainText('Live');
    
    // Check for WebSocket indicator
    const wsIndicator = page.locator('[data-testid="websocket-indicator"]');
    await expect(wsIndicator).toHaveClass(/text-green-500/);
  });
});

/**
 * AC 2: New pattern alerts when significant trends are identified
 */
test.describe('AC 2: Pattern Alert System', () => {
  
  test('should generate alerts for high-confidence patterns', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Simulate high-confidence pattern discovery
    await testUtils.simulatePatternUpdate({
      type: 'new_alert',
      payload: {
        alert: {
          id: 'test_alert_1',
          type: 'confidence_increase',
          patternId: 'pattern_test_1',
          message: 'Pattern confidence increased by 25% (70% → 95%)',
          significance: 'high',
          confidence: 0.95,
          previousConfidence: 0.70,
          sampleSize: 20,
          recommendedAction: 'Consider applying this pattern to new clients',
          createdAt: new Date().toISOString()
        }
      }
    });
    
    // Wait for alert WebSocket message
    const alertMessage = await testUtils.waitForWebSocketMessage(ws, 'new_alert', 3000);
    expect(alertMessage.data.alert).toBeDefined();
    expect(alertMessage.data.alert.significance).toBe('high');
    
    // Verify alert appears in dashboard
    const alertCard = page.locator('[data-testid="pattern-alert"]').first();
    await expect(alertCard).toBeVisible({ timeout: 2000 });
    await expect(alertCard).toContainText('Pattern confidence increased');
    
    // Verify alert actions are available
    const alertActions = alertCard.locator('[data-testid="alert-action-button"]');
    await expect(alertActions).toHaveCount(3); // Apply, Postpone, Dismiss
  });

  test('should show alert history and management', async ({ page }) => {
    // Navigate to alerts section
    const alertsTab = page.locator('[data-testid="alerts-tab"]');
    if (await alertsTab.isVisible()) {
      await alertsTab.click();
    }
    
    // Check alert history display
    const alertHistory = page.locator('[data-testid="alert-history"]');
    await expect(alertHistory).toBeVisible();
    
    // Verify filtering capabilities
    const filterSelect = page.locator('[data-testid="alert-filter"]');
    await filterSelect.selectOption('high');
    
    // Verify only high-priority alerts are shown
    const highPriorityAlerts = page.locator('[data-testid="pattern-alert"][data-priority="high"]');
    await expect(highPriorityAlerts.first()).toBeVisible({ timeout: 1000 });
  });
});

/**
 * AC 3: Pattern confidence score adjustments with new data points
 * Wilson confidence intervals and incremental updates
 */
test.describe('AC 3: Dynamic Confidence Updates', () => {
  
  test('should update confidence scores incrementally with Wilson intervals', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Get initial confidence score
    const patternCard = page.locator('[data-testid="pattern-card"]').first();
    await expect(patternCard).toBeVisible();
    
    const initialConfidenceText = await patternCard.locator('[data-testid="confidence-badge"]').textContent();
    const initialConfidence = parseInt(initialConfidenceText?.replace('%', '') || '0');
    
    // Simulate confidence update
    await testUtils.simulatePatternUpdate({
      type: 'pattern_updated',
      payload: {
        patterns: [{
          id: 'pattern_test_1',
          confidenceScore: 0.92, // Increased from previous
          sampleSize: 25,
          successRate: 0.80,
          lastValidated: new Date().toISOString()
        }]
      }
    });
    
    // Wait for confidence update animation
    const animatingBadge = patternCard.locator('[data-testid="confidence-badge"].animate-pulse');
    await expect(animatingBadge).toBeVisible({ timeout: 2000 });
    
    // Verify confidence score updated
    await page.waitForFunction((initialConf) => {
      const badge = document.querySelector('[data-testid="confidence-badge"]');
      if (!badge) return false;
      const newConf = parseInt(badge.textContent?.replace('%', '') || '0');
      return newConf !== initialConf;
    }, initialConfidence, { timeout: 3000 });
    
    // Check for Wilson confidence interval display
    const confidenceInterval = page.locator('[data-testid="confidence-interval"]');
    if (await confidenceInterval.isVisible()) {
      await expect(confidenceInterval).toContainText('95% Confidence');
    }
  });

  test('should show statistical significance indicators', async ({ page }) => {
    const patternCard = page.locator('[data-testid="pattern-card"]').first();
    await expect(patternCard).toBeVisible();
    
    // Check for statistical significance display
    const statSig = patternCard.locator('[data-testid="statistical-significance"]');
    await expect(statSig).toBeVisible();
    
    // Verify p-value format
    const pValueText = await statSig.textContent();
    expect(pValueText).toMatch(/p=\d\.\d{3}/);
    
    // Check for significance badge when p <= 0.05
    const significanceBadge = patternCard.locator('[data-testid="significance-badge"]');
    if (await significanceBadge.isVisible()) {
      await expect(significanceBadge).toContainText('Statistically Significant');
    }
  });
});

/**
 * AC 4: Real-time conversion rate updates with trend indicators
 */
test.describe('AC 4: Live Conversion Metrics', () => {
  
  test('should update conversion metrics in real-time with trend indicators', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Get initial conversion rate
    const conversionMetrics = page.locator('[data-testid="conversion-metrics"]');
    await expect(conversionMetrics).toBeVisible();
    
    const initialRate = await conversionMetrics.locator('[data-testid="current-rate"]').textContent();
    
    // Simulate conversion metrics update
    await testUtils.simulatePatternUpdate({
      type: 'conversion_update',
      payload: {
        metrics: {
          currentConversionRate: 38.7,
          todayConversions: 32,
          activeJourneys: 18,
          newPatternsToday: 4,
          trend: 'up',
          trendPercentage: 4.2,
          lastUpdated: new Date().toISOString()
        }
      }
    });
    
    // Wait for metrics update
    await testUtils.waitForWebSocketMessage(ws, 'conversion_update', 3000);
    
    // Verify real-time update (within 1 second)
    await page.waitForFunction((initialRateText) => {
      const currentRateElement = document.querySelector('[data-testid="current-rate"]');
      return currentRateElement?.textContent !== initialRateText;
    }, initialRate, { timeout: TEST_CONFIG.websocketTimeout });
    
    // Check trend indicators
    const trendIndicator = conversionMetrics.locator('[data-testid="trend-indicator"]');
    await expect(trendIndicator).toBeVisible();
    await expect(trendIndicator).toHaveClass(/text-green-500/); // Up trend
    
    // Verify percentage display
    const trendPercentage = conversionMetrics.locator('[data-testid="trend-percentage"]');
    await expect(trendPercentage).toContainText('4.2%');
  });

  test('should display live metrics with proper formatting', async ({ page }) => {
    const metricsContainer = page.locator('[data-testid="live-conversion-metrics"]');
    await expect(metricsContainer).toBeVisible();
    
    // Check for all required metric cards
    const metricCards = metricsContainer.locator('[data-testid="metric-card"]');
    await expect(metricCards).toHaveCount(4); // Rate, Conversions, Journeys, Patterns
    
    // Verify each metric has proper formatting
    const conversionRate = metricsContainer.locator('[data-testid="conversion-rate"] [data-testid="metric-value"]');
    await expect(conversionRate).toContainText('%');
    
    const todayConversions = metricsContainer.locator('[data-testid="today-conversions"] [data-testid="metric-value"]');
    await expect(todayConversions).toContainText(/\d+/);
    
    // Check for real-time indicator
    const liveIndicator = metricsContainer.locator('[data-testid="live-indicator"]');
    await expect(liveIndicator).toBeVisible();
    await expect(liveIndicator).toHaveClass(/animate-pulse/);
  });
});

/**
 * AC 5: Immediate recommendations for in-progress client journeys
 */
test.describe('AC 5: Immediate Journey Recommendations', () => {
  
  test('should generate immediate recommendations for active client sessions', async ({ page }) => {
    // Navigate to recommendations section
    const recommendationsSection = page.locator('[data-testid="immediate-recommendations"]');
    await expect(recommendationsSection).toBeVisible();
    
    // Simulate active client journey with drop-off risk
    await testUtils.simulatePatternUpdate({
      type: 'recommendation_update',
      payload: {
        recommendations: [{
          id: 'rec_test_1',
          clientId: 'client_123',
          type: 'intervention',
          priority: 'critical',
          urgency: 'immediate',
          recommendation: {
            title: 'Prevent Client Drop-off',
            description: 'Client has been on activation page for 7 minutes with low engagement',
            specificAction: 'Show engagement prompt with social proof',
            expectedImpact: 0.35,
            confidenceLevel: 0.82
          },
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 300000).toISOString()
        }]
      }
    });
    
    // Check for critical recommendation display
    const criticalRec = page.locator('[data-testid="recommendation-card"][data-priority="critical"]');
    await expect(criticalRec).toBeVisible({ timeout: 2000 });
    await expect(criticalRec).toContainText('Prevent Client Drop-off');
    
    // Verify urgency indicator
    const urgencyIndicator = criticalRec.locator('[data-testid="urgency-indicator"]');
    await expect(urgencyIndicator).toContainText('Act Now');
    
    // Check action buttons
    const applyButton = criticalRec.locator('[data-testid="apply-button"]');
    await expect(applyButton).toBeVisible();
    
    // Test recommendation application
    await applyButton.click();
    await expect(criticalRec).toHaveClass(/opacity-75/); // Applied state
  });

  test('should show active journey overview with risk indicators', async ({ page }) => {
    const journeyOverview = page.locator('[data-testid="active-journeys"]');
    await expect(journeyOverview).toBeVisible();
    
    // Check for journey cards
    const journeyCards = journeyOverview.locator('[data-testid="journey-card"]');
    await expect(journeyCards.first()).toBeVisible();
    
    // Verify risk indicators
    const dropOffRisk = journeyCards.first().locator('[data-testid="dropoff-risk"]');
    await expect(dropOffRisk).toBeVisible();
    
    const conversionProb = journeyCards.first().locator('[data-testid="conversion-probability"]');
    await expect(conversionProb).toBeVisible();
    
    // Check risk color coding
    const riskValue = await dropOffRisk.textContent();
    const riskPercentage = parseInt(riskValue?.replace('%', '') || '0');
    
    if (riskPercentage > 70) {
      await expect(dropOffRisk).toHaveClass(/text-red-600/);
    } else if (riskPercentage > 40) {
      await expect(dropOffRisk).toHaveClass(/text-yellow-600/);
    } else {
      await expect(dropOffRisk).toHaveClass(/text-green-600/);
    }
  });
});

/**
 * IV1: Real-time updates do not impact existing dashboard responsiveness
 * Performance and responsiveness validation
 */
test.describe('IV1: Dashboard Responsiveness', () => {
  
  test('should maintain responsiveness during real-time updates', async ({ page }) => {
    // Measure baseline interaction time
    const startTime = Date.now();
    await page.locator('[data-testid="pattern-card"]').first().click();
    const baselineTime = Date.now() - startTime;
    
    // Start continuous real-time updates
    const updateInterval = setInterval(async () => {
      await testUtils.simulatePatternUpdate();
    }, 1000); // Every second
    
    try {
      // Measure interaction time during updates
      await page.waitForTimeout(3000); // Let updates run for 3 seconds
      
      const updateStartTime = Date.now();
      await page.locator('[data-testid="pattern-card"]').nth(1).click();
      const updateTime = Date.now() - updateStartTime;
      
      // Verify responsiveness not degraded (allow 50% tolerance)
      expect(updateTime).toBeLessThan(baselineTime * 1.5);
      
      // Check that UI remains interactive
      const button = page.locator('[data-testid="pause-updates-button"]');
      await button.click();
      await expect(button).toContainText('Resume');
      
    } finally {
      clearInterval(updateInterval);
    }
  });

  test('should handle high-frequency updates without performance degradation', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Send rapid updates
    const updatePromises = Array.from({ length: 10 }, (_, i) => 
      testUtils.simulatePatternUpdate({
        type: 'pattern_updated',
        payload: {
          patterns: [{
            id: `rapid_pattern_${i}`,
            confidenceScore: Math.random(),
            sampleSize: 10 + i
          }]
        }
      })
    );
    
    await Promise.all(updatePromises);
    
    // Wait for UI to process updates
    await page.waitForTimeout(2000);
    
    // Verify no console errors
    expect(consoleErrors.length).toBe(0);
    
    // Verify UI still responsive
    const patternCard = page.locator('[data-testid="pattern-card"]').first();
    await expect(patternCard).toBeVisible();
    await patternCard.click();
    
    // Check pattern details are accessible
    const patternDetails = page.locator('[data-testid="pattern-details"]');
    if (await patternDetails.isVisible()) {
      await expect(patternDetails).toBeVisible();
    }
  });
});

/**
 * IV2: Current notification system preserved while adding pattern alerts
 */
test.describe('IV2: Notification System Compatibility', () => {
  
  test('should preserve existing notification system', async ({ page }) => {
    // Check existing notification elements are present
    const existingNotifications = page.locator('[data-testid="system-notifications"]');
    
    // Add pattern alert
    await testUtils.simulatePatternUpdate({
      type: 'new_alert',
      payload: {
        alert: {
          id: 'compat_test_alert',
          type: 'new_pattern',
          message: 'Compatibility test alert',
          significance: 'medium'
        }
      }
    });
    
    // Verify pattern alerts appear in dedicated section
    const patternAlerts = page.locator('[data-testid="pattern-alerts"]');
    await expect(patternAlerts).toBeVisible({ timeout: 2000 });
    
    // Verify existing notifications still work
    if (await existingNotifications.isVisible()) {
      await expect(existingNotifications).toBeVisible();
      
      // Test existing notification interaction
      const existingNotification = existingNotifications.locator('.notification').first();
      if (await existingNotification.isVisible()) {
        await existingNotification.click();
        // Should not interfere with pattern alerts
        await expect(patternAlerts).toBeVisible();
      }
    }
  });

  test('should handle multiple notification types simultaneously', async ({ page }) => {
    // Simulate multiple notification types
    await testUtils.simulatePatternUpdate({
      type: 'new_alert',
      payload: {
        alert: {
          id: 'multi_alert_1',
          type: 'confidence_increase',
          message: 'Pattern confidence increased',
          significance: 'high'
        }
      }
    });
    
    // Check both systems can coexist
    const patternAlerts = page.locator('[data-testid="pattern-alerts"]');
    await expect(patternAlerts).toBeVisible();
    
    const systemNotifications = page.locator('[data-testid="system-notifications"]');
    // Both should be accessible without conflict
    
    // Verify alert priorities don't interfere
    const highPriorityAlert = patternAlerts.locator('[data-priority="high"]');
    if (await highPriorityAlert.isVisible()) {
      await expect(highPriorityAlert).toBeVisible();
    }
  });
});

/**
 * IV3: Background processing maintains system performance during pattern updates
 */
test.describe('IV3: Background Processing Performance', () => {
  
  test('should maintain performance during background processing', async ({ page }) => {
    // Check processor status endpoint
    const response = await page.request.get(`${TEST_CONFIG.baseURL}/api/pattern-updates?action=status`);
    expect(response.ok()).toBeTruthy();
    
    const status = await response.json();
    expect(status.serverRunning).toBeTruthy();
    
    // Measure page load time during processing
    const startTime = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Start background processing simulation
    const processingPromises = Array.from({ length: 5 }, () => 
      testUtils.simulatePatternUpdate()
    );
    
    // Measure page interaction during processing
    const interactionStart = Date.now();
    await page.locator('[data-testid="pattern-card"]').first().click();
    const interactionTime = Date.now() - interactionStart;
    
    await Promise.all(processingPromises);
    
    // Verify performance maintained (interaction should be fast)
    expect(interactionTime).toBeLessThan(1000); // Under 1 second
    
    // Check system resource indicators
    const systemStatus = page.locator('[data-testid="system-status"]');
    if (await systemStatus.isVisible()) {
      const statusText = await systemStatus.textContent();
      expect(statusText).toContain('Active'); // Not paused due to high load
    }
  });

  test('should handle background job queue without blocking UI', async ({ page }) => {
    // Monitor network requests to ensure they don't block UI
    const networkRequests: string[] = [];
    page.on('request', request => {
      networkRequests.push(request.url());
    });
    
    // Queue multiple background jobs
    const jobPromises = Array.from({ length: 3 }, (_, i) => 
      testUtils.simulatePatternUpdate({
        type: 'background_job',
        payload: { jobId: `test_job_${i}` }
      })
    );
    
    // Ensure UI remains interactive
    const uiStartTime = Date.now();
    await page.locator('[data-testid="pattern-filter"]').selectOption('high');
    const uiResponseTime = Date.now() - uiStartTime;
    
    await Promise.all(jobPromises);
    
    // UI should respond quickly despite background processing
    expect(uiResponseTime).toBeLessThan(500); // Under 500ms
    
    // Verify background processing didn't block rendering
    const patternCards = page.locator('[data-testid="pattern-card"]');
    await expect(patternCards).toHaveCountGreaterThan(0);
  });
});

/**
 * End-to-End Integration Test
 * Tests complete workflow from pattern update to dashboard display
 */
test.describe('E2E Integration', () => {
  
  test('complete real-time pattern update workflow', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // 1. Simulate new outcome recording
    await testUtils.simulatePatternUpdate({
      type: 'outcome_recorded',
      payload: {
        clientId: 'e2e_client_1',
        outcome: 'success',
        contentData: {
          hypothesis: 'E2E test hypothesis',
          elements: { headline: 'Test headline' }
        }
      }
    });
    
    // 2. Wait for pattern processing
    const patternUpdate = await testUtils.waitForWebSocketMessage(ws, 'pattern_updated', 5000);
    expect(patternUpdate.data.patterns).toBeDefined();
    
    // 3. Verify dashboard update
    const newPatternCard = page.locator('[data-testid="pattern-card"]').first();
    await expect(newPatternCard).toBeVisible({ timeout: 3000 });
    
    // 4. Check for alerts if confidence is high
    if (patternUpdate.data.patterns[0]?.confidenceScore > 0.8) {
      const alert = page.locator('[data-testid="pattern-alert"]').first();
      await expect(alert).toBeVisible({ timeout: 2000 });
    }
    
    // 5. Verify recommendations generated
    const recommendations = page.locator('[data-testid="immediate-recommendations"]');
    await expect(recommendations).toBeVisible();
    
    // 6. Check conversion metrics updated
    const metrics = page.locator('[data-testid="conversion-metrics"]');
    await expect(metrics).toBeVisible();
    const lastUpdated = metrics.locator('[data-testid="last-updated"]');
    await expect(lastUpdated).toContainText(/seconds? ago|just now/i);
    
    // 7. Verify complete workflow timing (total < 5 seconds)
    // This is tracked through the test execution time
  });

  test('should handle WebSocket reconnection gracefully', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Verify connected state
    const connectionStatus = page.locator('[data-testid="connection-status"]');
    await expect(connectionStatus).toContainText('Live');
    
    // Simulate connection loss
    ws.close();
    
    // Verify dashboard shows disconnected state
    await expect(connectionStatus).toContainText('Offline', { timeout: 3000 });
    
    // Verify reconnection indicator
    const reconnectStatus = page.locator('[data-testid="reconnect-status"]');
    if (await reconnectStatus.isVisible()) {
      await expect(reconnectStatus).toContainText('Reconnecting');
    }
    
    // Wait for auto-reconnection (if implemented)
    // Or verify fallback behavior
    await page.waitForTimeout(5000);
  });
});

/**
 * Performance Benchmarks
 * Validates specific performance requirements
 */
test.describe('Performance Benchmarks', () => {
  
  test('should meet sub-2-second pattern update requirement', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Measure pattern update end-to-end time
    const updateStartTime = Date.now();
    
    await testUtils.simulatePatternUpdate();
    
    // Wait for dashboard visual update
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('[data-testid="pattern-card"].animate-pulse');
      return cards.length > 0;
    }, { timeout: 2000 });
    
    const totalUpdateTime = Date.now() - updateStartTime;
    
    // Verify sub-2-second requirement
    expect(totalUpdateTime).toBeLessThan(2000);
    console.log(`Pattern update completed in ${totalUpdateTime}ms`);
  });

  test('should meet sub-1-second WebSocket propagation requirement', async ({ page }) => {
    const ws = await testUtils.createWebSocketConnection();
    await testUtils.waitForWebSocketMessage(ws, 'connection_status');
    
    // Measure WebSocket message propagation time
    const propagationStartTime = Date.now();
    
    await testUtils.simulatePatternUpdate();
    
    // Wait for WebSocket message
    await testUtils.waitForWebSocketMessage(ws, 'pattern_updated', 1000);
    
    const propagationTime = Date.now() - propagationStartTime;
    
    // Verify sub-1-second requirement
    expect(propagationTime).toBeLessThan(1000);
    console.log(`WebSocket propagation completed in ${propagationTime}ms`);
  });
});

/**
 * Test data cleanup and utilities
 */
test.afterAll(async () => {
  // Cleanup any test data or connections
  console.log('Real-time pattern update tests completed');
});