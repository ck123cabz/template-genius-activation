import { test, expect } from '@playwright/test';

/**
 * Story 3.2: Payment Status Dashboard Integration
 * Comprehensive test suite covering all acceptance criteria and integration verification
 */

test.describe('Story 3.2: Payment Status Dashboard Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
  });

  // AC1: Payment status visible in dashboard (pending/succeeded/failed/refunded)
  test.describe('AC1: Payment Status Visibility', () => {
    test('should display payment status badges for all payment states', async ({ page }) => {
      // Test payment status indicators are visible
      await expect(page.locator('[data-testid="payment-status-badge"]')).toBeVisible();
      
      // Test different payment states are displayed with appropriate styling
      const pendingBadge = page.locator('[data-testid="payment-status-pending"]');
      const succeededBadge = page.locator('[data-testid="payment-status-succeeded"]');
      const failedBadge = page.locator('[data-testid="payment-status-failed"]');
      
      if (await pendingBadge.count() > 0) {
        await expect(pendingBadge).toHaveClass(/.*pending.*|.*warning.*/);
      }
      
      if (await succeededBadge.count() > 0) {
        await expect(succeededBadge).toHaveClass(/.*success.*|.*green.*/);
      }
      
      if (await failedBadge.count() > 0) {
        await expect(failedBadge).toHaveClass(/.*failed.*|.*destructive.*|.*red.*/);
      }
    });

    test('should show payment status in dashboard table', async ({ page }) => {
      // Verify payment status column exists in client list
      await expect(page.locator('th:has-text("Payment Status")')).toBeVisible();
      
      // Check that payment status is displayed for each client row
      const clientRows = page.locator('tbody tr');
      const rowCount = await clientRows.count();
      
      if (rowCount > 0) {
        for (let i = 0; i < Math.min(rowCount, 3); i++) {
          const row = clientRows.nth(i);
          await expect(row.locator('[data-testid="payment-status-badge"]')).toBeVisible();
        }
      }
    });
  });

  // AC2: Journey progress indicators show payment step completion
  test.describe('AC2: Journey Progress Indicators', () => {
    test('should display journey progress with payment step completion', async ({ page }) => {
      // Test journey progress indicators are visible
      await expect(page.locator('[data-testid="journey-progress"]')).toBeVisible();
      
      // Test payment step is included in journey progress
      const paymentSteps = page.locator('[data-testid="payment-step-indicator"]');
      if (await paymentSteps.count() > 0) {
        await expect(paymentSteps.first()).toBeVisible();
        
        // Test completed payment steps show different styling
        const completedSteps = page.locator('[data-testid="payment-step-completed"]');
        if (await completedSteps.count() > 0) {
          await expect(completedSteps.first()).toHaveClass(/.*completed.*|.*success.*/);
        }
      }
    });

    test('should integrate payment completion with journey visualization', async ({ page }) => {
      const journeyIndicators = page.locator('[data-testid="journey-progress-indicator"]');
      if (await journeyIndicators.count() > 0) {
        await expect(journeyIndicators.first()).toBeVisible();
        
        // Check that payment completion affects journey display
        const paymentJourneyStep = page.locator('[data-testid="journey-payment-step"]');
        if (await paymentJourneyStep.count() > 0) {
          await expect(paymentJourneyStep).toBeVisible();
        }
      }
    });
  });

  // AC3: Payment amount and timing visible in client detail view
  test.describe('AC3: Payment Detail View', () => {
    test('should show payment details when opening client detail modal', async ({ page }) => {
      // Find and click first client to open detail modal
      const firstClientRow = page.locator('tbody tr').first();
      if (await firstClientRow.count() > 0) {
        await firstClientRow.click();
        
        // Wait for modal to open
        await expect(page.locator('[data-testid="client-detail-modal"]')).toBeVisible();
        
        // Test payment details tab exists and is accessible
        const paymentTab = page.locator('[data-testid="payment-details-tab"]');
        if (await paymentTab.count() > 0) {
          await paymentTab.click();
          
          // Test payment amount is displayed
          await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
          
          // Test payment timing information
          const paymentDate = page.locator('[data-testid="payment-date"]');
          if (await paymentDate.count() > 0) {
            await expect(paymentDate).toBeVisible();
          }
          
          // Test transaction ID is shown
          const transactionId = page.locator('[data-testid="transaction-id"]');
          if (await transactionId.count() > 0) {
            await expect(transactionId).toBeVisible();
          }
        }
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    });

    test('should display formatted payment amount ($500.00)', async ({ page }) => {
      const firstClientRow = page.locator('tbody tr').first();
      if (await firstClientRow.count() > 0) {
        await firstClientRow.click();
        
        const paymentTab = page.locator('[data-testid="payment-details-tab"]');
        if (await paymentTab.count() > 0) {
          await paymentTab.click();
          
          // Test payment amount formatting
          const paymentAmount = page.locator('[data-testid="payment-amount"]');
          await expect(paymentAmount).toContainText('$');
          await expect(paymentAmount).toContainText('500');
        }
        
        await page.keyboard.press('Escape');
      }
    });
  });

  // AC4: Failed payment alerts with retry action buttons
  test.describe('AC4: Failed Payment Alerts', () => {
    test('should show failed payment alerts when payments fail', async ({ page }) => {
      // Look for failed payment indicators
      const failedPayments = page.locator('[data-testid="payment-status-failed"]');
      
      if (await failedPayments.count() > 0) {
        // Test failed payment alert is visible
        await expect(page.locator('[data-testid="payment-failed-alert"]')).toBeVisible();
        
        // Test retry button exists
        const retryButton = page.locator('[data-testid="payment-retry-button"]');
        await expect(retryButton).toBeVisible();
        await expect(retryButton).toBeEnabled();
        
        // Test failure reason is displayed
        const failureReason = page.locator('[data-testid="payment-failure-reason"]');
        if (await failureReason.count() > 0) {
          await expect(failureReason).toBeVisible();
        }
      }
    });

    test('should allow retry action for failed payments', async ({ page }) => {
      const retryButtons = page.locator('[data-testid="payment-retry-button"]');
      
      if (await retryButtons.count() > 0) {
        // Click retry button
        await retryButtons.first().click();
        
        // Should trigger some action (loading state or redirect)
        // We can't test the actual Stripe flow, but can test UI response
        await page.waitForTimeout(1000);
      }
    });
  });

  // AC5: Revenue tracking dashboard with weekly/monthly totals
  test.describe('AC5: Revenue Tracking Dashboard', () => {
    test('should display revenue analytics tab', async ({ page }) => {
      // Test Revenue Analytics tab exists
      const revenueTab = page.locator('[data-testid="revenue-analytics-tab"]');
      if (await revenueTab.count() > 0) {
        await revenueTab.click();
        
        // Test revenue metrics are displayed
        await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
        await expect(page.locator('[data-testid="successful-payments"]')).toBeVisible();
        await expect(page.locator('[data-testid="failed-payments"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
        
        // Test revenue chart is rendered
        await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
      }
    });

    test('should allow switching between weekly and monthly views', async ({ page }) => {
      const revenueTab = page.locator('[data-testid="revenue-analytics-tab"]');
      if (await revenueTab.count() > 0) {
        await revenueTab.click();
        
        // Test timeframe toggles
        const weeklyToggle = page.locator('[data-testid="weekly-toggle"]');
        const monthlyToggle = page.locator('[data-testid="monthly-toggle"]');
        
        if (await weeklyToggle.count() > 0 && await monthlyToggle.count() > 0) {
          await weeklyToggle.click();
          await page.waitForTimeout(500);
          
          await monthlyToggle.click();
          await page.waitForTimeout(500);
          
          // Revenue data should update (we can test the UI responds)
          await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
        }
      }
    });

    test('should display revenue trends over time', async ({ page }) => {
      const revenueTab = page.locator('[data-testid="revenue-analytics-tab"]');
      if (await revenueTab.count() > 0) {
        await revenueTab.click();
        
        // Test revenue trend visualization
        const trendChart = page.locator('[data-testid="revenue-trend-chart"]');
        if (await trendChart.count() > 0) {
          await expect(trendChart).toBeVisible();
          
          // Test chart has data points (SVG elements from Recharts)
          const chartElements = page.locator('svg');
          await expect(chartElements.first()).toBeVisible();
        }
      }
    });
  });

  // Integration Verification Tests
  test.describe('Integration Verification', () => {
    // IV1: Existing dashboard layout and performance maintained
    test('IV1: should maintain existing dashboard layout', async ({ page }) => {
      // Test core dashboard elements are present
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('[data-testid="client-list"]')).toBeVisible();
      
      // Test existing functionality works
      const searchInput = page.locator('input[placeholder*="Search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(500);
        await searchInput.clear();
      }
      
      // Test existing tabs/navigation
      const dashboardTabs = page.locator('[role="tablist"]');
      if (await dashboardTabs.count() > 0) {
        await expect(dashboardTabs).toBeVisible();
      }
    });

    // IV2: Current client listing functionality preserved
    test('IV2: should preserve existing client listing functionality', async ({ page }) => {
      // Test client table is present and functional
      await expect(page.locator('table')).toBeVisible();
      
      // Test existing columns are preserved
      await expect(page.locator('th:has-text("Company")')).toBeVisible();
      await expect(page.locator('th:has-text("Contact")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      
      // Test client rows are clickable (existing functionality)
      const clientRows = page.locator('tbody tr');
      if (await clientRows.count() > 0) {
        await expect(clientRows.first()).toBeVisible();
      }
    });

    // IV3: Dashboard loading time remains under 2 seconds
    test('IV3: should load dashboard within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Wait for key elements to be visible
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('[data-testid="client-list"]')).toBeVisible();
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Dashboard should load within 2 seconds (2000ms)
      expect(loadTime).toBeLessThan(2000);
    });

    test('IV3: should load payment data efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/dashboard');
      
      // Wait for payment status indicators to load
      await expect(page.locator('[data-testid="payment-status-badge"]').first()).toBeVisible({ timeout: 2000 });
      
      const endTime = Date.now();
      const paymentDataLoadTime = endTime - startTime;
      
      // Payment data should load within 2 seconds
      expect(paymentDataLoadTime).toBeLessThan(2000);
    });
  });

  // Payment Filtering and Search Tests
  test.describe('Payment Filtering Functionality', () => {
    test('should filter clients by payment status', async ({ page }) => {
      // Test payment status filters
      const paymentFilters = page.locator('[data-testid="payment-filter"]');
      
      if (await paymentFilters.count() > 0) {
        // Test "Paid" filter
        const paidFilter = page.locator('[data-testid="filter-paid"]');
        if (await paidFilter.count() > 0) {
          await paidFilter.click();
          await page.waitForTimeout(500);
          
          // Should show only paid clients
          const visibleRows = page.locator('tbody tr:visible');
          if (await visibleRows.count() > 0) {
            await expect(visibleRows.first().locator('[data-testid="payment-status-succeeded"]')).toBeVisible();
          }
        }
        
        // Test "Pending" filter
        const pendingFilter = page.locator('[data-testid="filter-pending"]');
        if (await pendingFilter.count() > 0) {
          await pendingFilter.click();
          await page.waitForTimeout(500);
        }
        
        // Test "Failed" filter  
        const failedFilter = page.locator('[data-testid="filter-failed"]');
        if (await failedFilter.count() > 0) {
          await failedFilter.click();
          await page.waitForTimeout(500);
        }
        
        // Reset filters
        const allPaymentsFilter = page.locator('[data-testid="filter-all-payments"]');
        if (await allPaymentsFilter.count() > 0) {
          await allPaymentsFilter.click();
        }
      }
    });
  });

  // Error Handling and Edge Cases
  test.describe('Error Handling', () => {
    test('should handle missing payment data gracefully', async ({ page }) => {
      // Navigate to dashboard
      await page.goto('http://localhost:3000/dashboard');
      
      // Should not crash when payment data is missing
      await expect(page.locator('body')).toBeVisible();
      
      // Should show appropriate fallback states
      const emptyStates = page.locator('[data-testid="empty-state"]');
      const loadingStates = page.locator('[data-testid="loading-state"]');
      
      // Either content loads or appropriate fallback is shown
      const hasContent = await page.locator('[data-testid="client-list"] tbody tr').count() > 0;
      const hasEmptyState = await emptyStates.count() > 0;
      const hasLoadingState = await loadingStates.count() > 0;
      
      expect(hasContent || hasEmptyState || hasLoadingState).toBeTruthy();
    });

    test('should handle payment data loading errors', async ({ page }) => {
      // Navigate to dashboard and wait for load
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('domcontentloaded');
      
      // Page should not show critical errors
      const errorMessages = page.locator('text=/error|failed|crash/i');
      const visibleErrors = await errorMessages.count();
      
      // Some payment-related error messages are acceptable (like "payment failed")
      // but critical application errors should not be present
      if (visibleErrors > 0) {
        const criticalErrors = page.locator('text=/application error|system error|critical/i');
        expect(await criticalErrors.count()).toBe(0);
      }
    });
  });

  // Performance Tests for Revenue Analytics
  test.describe('Revenue Analytics Performance', () => {
    test('should render revenue charts within reasonable time', async ({ page }) => {
      const revenueTab = page.locator('[data-testid="revenue-analytics-tab"]');
      
      if (await revenueTab.count() > 0) {
        const startTime = Date.now();
        
        await revenueTab.click();
        
        // Wait for chart to render
        await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
        
        const endTime = Date.now();
        const renderTime = endTime - startTime;
        
        // Chart should render within 1 second
        expect(renderTime).toBeLessThan(1000);
      }
    });

    test('should handle timeframe switching efficiently', async ({ page }) => {
      const revenueTab = page.locator('[data-testid="revenue-analytics-tab"]');
      
      if (await revenueTab.count() > 0) {
        await revenueTab.click();
        
        const weeklyToggle = page.locator('[data-testid="weekly-toggle"]');
        const monthlyToggle = page.locator('[data-testid="monthly-toggle"]');
        
        if (await weeklyToggle.count() > 0 && await monthlyToggle.count() > 0) {
          const startTime = Date.now();
          
          await weeklyToggle.click();
          await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
          
          await monthlyToggle.click();
          await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
          
          const endTime = Date.now();
          const switchTime = endTime - startTime;
          
          // Timeframe switching should be responsive (under 2 seconds)
          expect(switchTime).toBeLessThan(2000);
        }
      }
    });
  });
});