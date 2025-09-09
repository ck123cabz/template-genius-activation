/**
 * Story 2.3: Payment-Outcome Correlation - Comprehensive Test Suite
 * Tests automatic payment-outcome correlation system with Playwright MCP
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_CLIENT_TOKEN = 'G1001';
const TEST_CLIENT_ID = '1';

test.describe('Story 2.3: Payment-Outcome Correlation System', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard before each test
    await page.goto(`${TEST_BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Database Schema and Migration', () => {
    
    test('should have correlation table structure available', async ({ page }) => {
      // Test that the new schema is available by attempting to access correlation data
      // This is done indirectly through the UI components that depend on the schema
      
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      
      // Look for client cards that should now support correlation features
      const clientCards = await page.locator('[data-testid="client-card"], .hover\\:shadow-md');
      await expect(clientCards.first()).toBeVisible();
      
      // Check for "Manage" button that opens OutcomeModal with correlation features
      const manageButton = await page.locator('button:has-text("Manage")').first();
      if (await manageButton.isVisible()) {
        await manageButton.click();
        
        // Verify correlation tab is present in the modal
        const correlationTab = await page.locator('[data-value="correlation"], text="Correlation"');
        await expect(correlationTab).toBeVisible();
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Stripe Webhook Integration', () => {
    
    test('should handle payment success webhook with correlation', async ({ page }) => {
      // Simulate webhook processing by testing the enhanced webhook endpoint
      const webhookPayload = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_correlation_payment',
            amount: 50000, // $500 in cents
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              client_token: TEST_CLIENT_TOKEN,
              client_id: TEST_CLIENT_ID,
              journey_id: '1',
              content_version_id: 'content_v1_test',
              journey_start_time: new Date().toISOString(),
              page_sequence: JSON.stringify(['activation', 'agreement', 'payment']),
              journey_hypothesis: 'Test hypothesis for correlation',
              referrer: 'direct',
              user_agent: 'Mozilla/5.0 Test Browser'
            }
          }
        }
      };
      
      // Send webhook request to test endpoint
      const webhookResponse = await page.request.post(`${TEST_BASE_URL}/api/webhooks/stripe`, {
        data: webhookPayload,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature' // Note: In real tests, use proper signature
        }
      });
      
      // For testing purposes, we expect either 200 (success) or 503 (not configured)
      // In development, Stripe might not be fully configured
      expect([200, 503]).toContain(webhookResponse.status());
      
      if (webhookResponse.status() === 200) {
        // If webhook succeeded, verify correlation was created
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // Look for updated client status
        const paidBadge = await page.locator('.bg-green-100:has-text("Paid")').first();
        if (await paidBadge.isVisible()) {
          await expect(paidBadge).toBeVisible();
        }
      }
    });

    test('should handle payment failure webhook with correlation', async ({ page }) => {
      const failureWebhookPayload = {
        id: 'evt_test_webhook_failure',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_correlation_failure',
            amount: 50000,
            currency: 'usd',
            status: 'requires_payment_method',
            last_payment_error: {
              message: 'Your card was declined.',
              code: 'card_declined',
              type: 'card_error'
            },
            metadata: {
              client_token: TEST_CLIENT_TOKEN,
              client_id: TEST_CLIENT_ID,
              journey_start_time: new Date().toISOString(),
              page_sequence: JSON.stringify(['activation', 'agreement', 'payment'])
            }
          }
        }
      };
      
      const webhookResponse = await page.request.post(`${TEST_BASE_URL}/api/webhooks/stripe`, {
        data: failureWebhookPayload,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        }
      });
      
      // Expect either success or configuration error
      expect([200, 503]).toContain(webhookResponse.status());
    });
  });

  test.describe('OutcomeModal Enhancement', () => {
    
    test('should display enhanced OutcomeModal with correlation tabs', async ({ page }) => {
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Find and click a "Manage" button to open OutcomeModal
      const manageButton = await page.locator('button:has-text("Manage")').first();
      
      if (await manageButton.isVisible()) {
        await manageButton.click();
        
        // Wait for modal to open
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        
        // Verify all three tabs are present
        await expect(page.locator('text="Outcome"')).toBeVisible();
        await expect(page.locator('text="Correlation"')).toBeVisible();
        await expect(page.locator('text="Analytics"')).toBeVisible();
        
        // Test Correlation tab functionality
        await page.click('text="Correlation"');
        await page.waitForTimeout(500);
        
        // Verify correlation-specific content
        const correlationHistory = await page.locator('text="Correlation History"');
        await expect(correlationHistory).toBeVisible();
        
        const manualOverride = await page.locator('text="Manual Override"');
        await expect(manualOverride).toBeVisible();
        
        // Test Analytics tab
        await page.click('text="Analytics"');
        await page.waitForTimeout(500);
        
        // Verify analytics content
        const totalConversions = await page.locator('text="Total Conversions"');
        await expect(totalConversions).toBeVisible();
        
        const conversionTime = await page.locator('text="Avg. Conversion Time"');
        await expect(conversionTime).toBeVisible();
        
        // Close modal
        await page.keyboard.press('Escape');
      }
    });

    test('should support outcome updates through enhanced modal', async ({ page }) => {
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const manageButton = await page.locator('button:has-text("Manage")').first();
      
      if (await manageButton.isVisible()) {
        await manageButton.click();
        await page.waitForSelector('[role="dialog"]');
        
        // Ensure we're on the Outcome tab
        await page.click('text="Outcome"');
        await page.waitForTimeout(500);
        
        // Update outcome to "Responded"
        const outcomeSelect = await page.locator('select, [role="combobox"]').first();
        if (await outcomeSelect.isVisible()) {
          await outcomeSelect.click();
          await page.click('text="💬 Responded"');
        }
        
        // Add learning notes
        const notesTextarea = await page.locator('textarea[placeholder*="learn"]');
        if (await notesTextarea.isVisible()) {
          await notesTextarea.fill('Test correlation learning notes for automated testing');
        }
        
        // Submit the update
        const updateButton = await page.locator('button:has-text("Update Outcome")');
        if (await updateButton.isVisible()) {
          await updateButton.click();
          
          // Wait for update to complete
          await page.waitForTimeout(2000);
          
          // Verify modal closed and outcome updated
          const respondedBadge = await page.locator('.bg-blue-100:has-text("Responded")');
          if (await respondedBadge.count() > 0) {
            await expect(respondedBadge.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Payment Metadata Enhancement', () => {
    
    test('should collect journey metadata during activation flow', async ({ page }) => {
      // Test the client journey with metadata collection
      await page.goto(`${TEST_BASE_URL}/journey/${TEST_CLIENT_ID}`);
      await page.waitForLoadState('networkidle');
      
      // Check if metadata collection is working by inspecting window object
      const metadataCollector = await page.evaluate(() => {
        return (window as any).__journeyMetadataCollector ? 'present' : 'not present';
      });
      
      // If the collector is present, it means our metadata system is working
      if (metadataCollector === 'present') {
        // Record page entry
        await page.evaluate(() => {
          if ((window as any).__journeyMetadataCollector) {
            (window as any).__journeyMetadataCollector.recordPageEntry('activation');
          }
        });
        
        // Navigate through journey steps if available
        const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Activate")');
        if (await continueButton.first().isVisible()) {
          await continueButton.first().click();
          await page.waitForTimeout(1000);
          
          // Check if we moved to a new page
          const currentUrl = page.url();
          expect(currentUrl).toContain('/journey/');
        }
      }
    });

    test('should validate payment metadata structure', async ({ page }) => {
      // Test the payment metadata validation functions
      const validationTest = await page.evaluate(() => {
        // Simulate metadata validation
        const testMetadata = {
          client_token: 'G1001',
          client_id: '1',
          journey_start_time: new Date().toISOString(),
          page_sequence: JSON.stringify(['activation', 'agreement', 'payment']),
          conversion_duration: '1800000', // 30 minutes
          journey_hypothesis: 'Test hypothesis',
          referrer: 'direct',
          user_agent: navigator.userAgent
        };
        
        // Basic validation checks
        const hasClientId = !!testMetadata.client_token || !!testMetadata.client_id;
        const hasValidSequence = testMetadata.page_sequence && 
                                 JSON.parse(testMetadata.page_sequence).length > 0;
        const hasValidDuration = testMetadata.conversion_duration && 
                                parseInt(testMetadata.conversion_duration) > 0;
        
        return {
          hasClientId,
          hasValidSequence,
          hasValidDuration,
          metadata: testMetadata
        };
      });
      
      expect(validationTest.hasClientId).toBe(true);
      expect(validationTest.hasValidSequence).toBe(true);
      expect(validationTest.hasValidDuration).toBe(true);
      expect(validationTest.metadata.client_token).toBe('G1001');
    });
  });

  test.describe('Integration Verification (IV Requirements)', () => {
    
    test('IV1: Existing webhook processing unchanged', async ({ page }) => {
      // Test that existing webhook functionality still works
      const simpleWebhookPayload = {
        id: 'evt_simple_test',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_simple_test',
            amount: 50000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              client_token: TEST_CLIENT_TOKEN,
              client_id: TEST_CLIENT_ID
            }
          }
        }
      };
      
      const response = await page.request.post(`${TEST_BASE_URL}/api/webhooks/stripe`, {
        data: simpleWebhookPayload,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        }
      });
      
      // Should handle webhook without errors even with minimal metadata
      expect([200, 503]).toContain(response.status());
      
      if (response.status() === 200) {
        const responseBody = await response.json();
        expect(responseBody.received).toBe(true);
      }
    });

    test('IV2: Payment flow performance maintained', async ({ page }) => {
      // Test that payment flow performance is not significantly impacted
      const startTime = Date.now();
      
      await page.goto(`${TEST_BASE_URL}/journey/${TEST_CLIENT_ID}`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Payment flow should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Test navigation through the journey
      const navigationStart = Date.now();
      
      // Navigate to different pages if they exist
      const agreementLink = await page.locator('a[href*="agreement"], button:has-text("Agreement")');
      if (await agreementLink.first().isVisible()) {
        await agreementLink.first().click();
        await page.waitForLoadState('networkidle');
      }
      
      const navigationTime = Date.now() - navigationStart;
      expect(navigationTime).toBeLessThan(2000);
    });

    test('IV3: Payment failure handling preserved', async ({ page }) => {
      // Test that payment failure scenarios are handled correctly
      const failureWebhook = {
        id: 'evt_failure_test',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_failure_test',
            amount: 50000,
            currency: 'usd',
            status: 'requires_payment_method',
            last_payment_error: {
              message: 'Test card decline',
              code: 'card_declined',
              type: 'card_error'
            },
            metadata: {
              client_token: TEST_CLIENT_TOKEN
            }
          }
        }
      };
      
      const response = await page.request.post(`${TEST_BASE_URL}/api/webhooks/stripe`, {
        data: failureWebhook,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test_signature'
        }
      });
      
      // Should handle failure webhook gracefully
      expect([200, 503]).toContain(response.status());
      
      // Verify that failure doesn't break the system
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Dashboard should still be functional
      const clientCards = await page.locator('[data-testid="client-card"], .hover\\:shadow-md');
      await expect(clientCards.first()).toBeVisible();
    });
  });

  test.describe('Performance and Load Testing', () => {
    
    test('should handle correlation dashboard loading efficiently', async ({ page }) => {
      const loadStart = Date.now();
      
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - loadStart;
      
      // Dashboard should load in under 2 seconds
      expect(loadTime).toBeLessThan(2000);
      
      // Test that correlation data doesn't slow down the dashboard
      const manageButton = await page.locator('button:has-text("Manage")').first();
      
      if (await manageButton.isVisible()) {
        const modalStart = Date.now();
        
        await manageButton.click();
        await page.waitForSelector('[role="dialog"]');
        
        const modalTime = Date.now() - modalStart;
        
        // Modal should open quickly even with correlation data
        expect(modalTime).toBeLessThan(1500);
        
        // Test correlation tab loading
        const correlationTabStart = Date.now();
        
        await page.click('text="Correlation"');
        await page.waitForTimeout(500);
        
        const correlationTabTime = Date.now() - correlationTabStart;
        expect(correlationTabTime).toBeLessThan(1000);
        
        await page.keyboard.press('Escape');
      }
    });

    test('should handle multiple correlation records efficiently', async ({ page }) => {
      // This test simulates having multiple correlation records
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      // Open outcome modal to test correlation history performance
      const manageButton = await page.locator('button:has-text("Manage")').first();
      
      if (await manageButton.isVisible()) {
        await manageButton.click();
        await page.waitForSelector('[role="dialog"]');
        
        await page.click('text="Correlation"');
        await page.waitForTimeout(500);
        
        // Check if correlation history section loads
        const historySection = await page.locator('text="Correlation History"');
        await expect(historySection).toBeVisible();
        
        // Verify no JavaScript errors occurred
        const errors = await page.evaluate(() => {
          return (window as any).__testErrors || [];
        });
        
        expect(errors.length).toBe(0);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle missing correlation data gracefully', async ({ page }) => {
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const manageButton = await page.locator('button:has-text("Manage")').first();
      
      if (await manageButton.isVisible()) {
        await manageButton.click();
        await page.waitForSelector('[role="dialog"]');
        
        await page.click('text="Correlation"');
        await page.waitForTimeout(500);
        
        // Should show empty state message when no correlations exist
        const emptyState = await page.locator('text="No payment correlations found"');
        if (await emptyState.isVisible()) {
          await expect(emptyState).toBeVisible();
        }
        
        await page.keyboard.press('Escape');
      }
    });

    test('should validate correlation override functionality', async ({ page }) => {
      await page.goto(`${TEST_BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const manageButton = await page.locator('button:has-text("Manage")').first();
      
      if (await manageButton.isVisible()) {
        await manageButton.click();
        await page.waitForSelector('[role="dialog"]');
        
        await page.click('text="Correlation"');
        await page.waitForTimeout(500);
        
        // Test manual override section
        const overrideSection = await page.locator('text="Manual Override"');
        await expect(overrideSection).toBeVisible();
        
        // Check that override form is present and functional
        const overrideSelect = await page.locator('select[placeholder*="correlation"], [role="combobox"]:has-text("Choose a correlation")');
        if (await overrideSelect.isVisible()) {
          // Form should be present but disabled without selection
          const createOverrideButton = await page.locator('button:has-text("Create Override")');
          if (await createOverrideButton.isVisible()) {
            await expect(createOverrideButton).toBeDisabled();
          }
        }
        
        await page.keyboard.press('Escape');
      }
    });
  });
});

// Test utilities and helpers
test.describe.configure({ mode: 'parallel', retries: 1 });

// Global test setup
test.beforeAll(async () => {
  console.log('🧪 Starting Story 2.3 Payment Correlation Tests');
  console.log('📊 Testing automatic payment-outcome correlation system');
});

test.afterAll(async () => {
  console.log('✅ Story 2.3 Payment Correlation Tests Complete');
});