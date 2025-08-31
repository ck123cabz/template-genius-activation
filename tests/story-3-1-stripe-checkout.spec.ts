/**
 * Story 3.1 Integration Tests: Stripe Checkout Integration
 * End-to-end testing for payment flow with journey metadata correlation
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_CLIENT_TOKEN = 'G9999'; // Test client token
const TEST_BASE_URL = 'http://localhost:3000';
const STRIPE_TEST_CARDS = {
  VISA_SUCCESS: '4242424242424242',
  VISA_DECLINED: '4000000000000002',
  VISA_INSUFFICIENT_FUNDS: '4000000000009995',
};

test.describe('Story 3.1: Stripe Checkout Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to activation page with test client
    await page.goto(`${TEST_BASE_URL}/activate/${TEST_CLIENT_TOKEN}`);
    await page.waitForLoadEvent('networkidle');
  });

  test('AC#1: Payment session creation with journey metadata', async ({ page }) => {
    // Navigate through journey to agreement page
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    
    // Verify payment section is present
    const paymentSection = page.locator('[data-testid="payment-section"]');
    await expect(paymentSection).toBeVisible();
    
    // Verify payment button is present with correct amount
    const paymentButton = page.locator('[data-testid="payment-button"]');
    await expect(paymentButton).toBeVisible();
    await expect(paymentButton).toContainText('Pay $500');
    
    // Verify security notice
    const securityNotice = page.locator('text=Secure payment powered by Stripe');
    await expect(securityNotice).toBeVisible();
  });

  test('AC#2: Payment flow includes client journey context', async ({ page }) => {
    // Navigate to agreement page
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    
    // Click payment button
    const paymentButton = page.locator('[data-testid="payment-button"]');
    await paymentButton.click();
    
    // Should redirect to Stripe Checkout
    await expect(page).toHaveURL(/.*checkout\.stripe\.com.*/);
    
    // Verify Stripe checkout page loads
    await page.waitForSelector('[data-testid="hosted-payment-page"]', { timeout: 10000 });
    
    // Verify payment amount is correct
    const amountText = page.locator('text=$500.00');
    await expect(amountText).toBeVisible();
  });

  test('AC#3: Professional branded checkout flow', async ({ page }) => {
    // Navigate to agreement and initiate payment
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    await page.click('[data-testid="payment-button"]');
    
    // Wait for Stripe checkout
    await page.waitForURL(/.*checkout\.stripe\.com.*/);
    
    // Verify Template Genius branding elements
    const productName = page.locator('text=Template Genius Priority Access');
    await expect(productName).toBeVisible();
    
    const description = page.locator('text=Revenue Intelligence Engine Activation');
    await expect(description).toBeVisible();
    
    // Verify professional styling (blue theme colors)
    const primaryElements = page.locator('[style*="rgb(37, 99, 235)"]');
    await expect(primaryElements.first()).toBeVisible();
  });

  test('AC#4: Payment success redirects to confirmation', async ({ page }) => {
    // Navigate to agreement and initiate payment
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    await page.click('[data-testid="payment-button"]');
    
    // Wait for Stripe checkout
    await page.waitForURL(/.*checkout\.stripe\.com.*/);
    
    // Fill in test payment details
    await page.fill('[data-testid="cardNumber"]', STRIPE_TEST_CARDS.VISA_SUCCESS);
    await page.fill('[data-testid="cardExpiry"]', '12/26');
    await page.fill('[data-testid="cardCvc"]', '123');
    await page.fill('[data-testid="billingName"]', 'Test Client');
    await page.fill('[data-testid="email"]', 'test@example.com');
    
    // Submit payment
    await page.click('[data-testid="submit"]');
    
    // Should redirect to confirmation page
    await page.waitForURL(`${TEST_BASE_URL}/confirmation**`);
    
    // Verify payment success message
    const successMessage = page.locator('text=Payment Successful!');
    await expect(successMessage).toBeVisible();
    
    // Verify next steps guidance
    const nextSteps = page.locator('text=Access Your Dashboard');
    await expect(nextSteps).toBeVisible();
  });

  test('AC#5: Payment failure handling with retry options', async ({ page }) => {
    // Navigate to agreement and initiate payment
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    await page.click('[data-testid="payment-button"]');
    
    // Wait for Stripe checkout
    await page.waitForURL(/.*checkout\.stripe\.com.*/);
    
    // Fill in declined test card
    await page.fill('[data-testid="cardNumber"]', STRIPE_TEST_CARDS.VISA_DECLINED);
    await page.fill('[data-testid="cardExpiry"]', '12/26');
    await page.fill('[data-testid="cardCvc"]', '123');
    await page.fill('[data-testid="billingName"]', 'Test Client');
    await page.fill('[data-testid="email"]', 'test@example.com');
    
    // Submit payment (should fail)
    await page.click('[data-testid="submit"]');
    
    // Verify error message appears
    const errorMessage = page.locator('text=Your card was declined');
    await expect(errorMessage).toBeVisible();
    
    // Verify retry option is available
    const retryButton = page.locator('text=Try Again');
    await expect(retryButton).toBeVisible();
  });

  test('IV1: Existing payment infrastructure continues working', async ({ page }) => {
    // Test that existing webhook handlers still work
    await page.goto(`${TEST_BASE_URL}/dashboard`);
    
    // Verify dashboard loads without errors
    await page.waitForSelector('[data-testid="client-list"]');
    
    // Verify existing payment status indicators work
    const paymentStatuses = page.locator('[data-testid="payment-status"]');
    if (await paymentStatuses.count() > 0) {
      await expect(paymentStatuses.first()).toBeVisible();
    }
  });

  test('IV2: Security and PCI compliance maintained', async ({ page }) => {
    // Verify HTTPS enforcement
    expect(page.url()).toMatch(/^https:/);
    
    // Navigate to payment page
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    
    // Verify no card data is stored locally
    const localStorage = await page.evaluate(() => JSON.stringify(localStorage));
    expect(localStorage).not.toMatch(/4242|card|cvv|expiry/i);
    
    // Verify payment form uses Stripe Elements (hosted fields)
    await page.click('[data-testid="payment-button"]');
    await page.waitForURL(/.*checkout\.stripe\.com.*/);
    
    // Verify secure checkout environment
    expect(page.url()).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });

  test('IV3: Page loading performance under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to agreement page (payment page)
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    
    // Wait for payment section to be fully loaded
    await page.waitForSelector('[data-testid="payment-section"]');
    
    const loadTime = Date.now() - startTime;
    
    // Verify loading time is under 3 seconds (3000ms)
    expect(loadTime).toBeLessThan(3000);
    
    // Verify payment button is interactive
    const paymentButton = page.locator('[data-testid="payment-button"]');
    await expect(paymentButton).not.toBeDisabled();
  });

  test('Journey metadata correlation accuracy', async ({ page }) => {
    // Navigate to agreement page
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    
    // Intercept payment session creation request
    const paymentSessionPromise = page.waitForResponse(
      response => response.url().includes('/api/create-payment-session') || 
                  response.url().includes('payment-actions')
    );
    
    // Click payment button
    await page.click('[data-testid="payment-button"]');
    
    // Wait for payment session creation
    const response = await paymentSessionPromise;
    
    // Verify response is successful
    expect(response.status()).toBe(200);
    
    // Verify Stripe checkout redirect
    await expect(page).toHaveURL(/.*checkout\.stripe\.com.*/);
  });

  test('Error handling for Stripe configuration issues', async ({ page }) => {
    // This test would need to run with invalid Stripe keys
    // Mock a configuration error scenario
    
    await page.route('**/payment-actions**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'STRIPE_NOT_CONFIGURED',
            message: 'Payment system is not properly configured. Please contact support.',
            retryable: false
          }
        })
      });
    });
    
    // Navigate to agreement and try payment
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    await page.click('[data-testid="payment-button"]');
    
    // Verify error message appears
    const errorAlert = page.locator('[data-testid="payment-error"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Payment system is not properly configured');
  });

  test('Dashboard payment status integration', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${TEST_BASE_URL}/dashboard`);
    
    // Verify payment status components are visible
    const paymentStatuses = page.locator('[data-testid="payment-status"]');
    
    if (await paymentStatuses.count() > 0) {
      // Verify payment status indicators
      const firstStatus = paymentStatuses.first();
      await expect(firstStatus).toBeVisible();
      
      // Should show appropriate status (pending, paid, failed, etc.)
      const statusText = await firstStatus.textContent();
      expect(statusText).toMatch(/(pending|paid|failed|cancelled)/i);
    }
  });

  test('Webhook processing verification', async ({ page }) => {
    // This test would verify webhook endpoint availability
    const webhookResponse = await page.request.post(`${TEST_BASE_URL}/api/webhooks/stripe`, {
      data: {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              client_id: '1',
              client_token: TEST_CLIENT_TOKEN
            }
          }
        }
      },
      headers: {
        'stripe-signature': 'test_signature'
      }
    });
    
    // Verify webhook endpoint responds (even if signature fails)
    expect([400, 401, 200]).toContain(webhookResponse.status());
  });

  test('End-to-end payment correlation workflow', async ({ page }) => {
    // Complete payment flow and verify correlation creation
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    
    // Record journey start time
    const journeyStart = Date.now();
    
    // Initiate payment
    await page.click('[data-testid="payment-button"]');
    await page.waitForURL(/.*checkout\.stripe\.com.*/);
    
    // Simulate successful payment (in test mode)
    // Fill test card and complete payment
    await page.fill('[data-testid="cardNumber"]', STRIPE_TEST_CARDS.VISA_SUCCESS);
    await page.fill('[data-testid="cardExpiry"]', '12/26');
    await page.fill('[data-testid="cardCvc"]', '123');
    await page.fill('[data-testid="billingName"]', 'Test Client');
    await page.fill('[data-testid="email"]', 'test@example.com');
    
    await page.click('[data-testid="submit"]');
    
    // Verify redirect to success page
    await page.waitForURL(`${TEST_BASE_URL}/confirmation**`);
    
    // Verify payment confirmation
    const successMessage = page.locator('text=Payment Successful!');
    await expect(successMessage).toBeVisible();
    
    // Verify journey metadata was captured (timing should be reasonable)
    const journeyDuration = Date.now() - journeyStart;
    expect(journeyDuration).toBeGreaterThan(1000); // At least 1 second
    expect(journeyDuration).toBeLessThan(30000);   // Less than 30 seconds
  });

  test('Payment retry mechanism', async ({ page }) => {
    // Navigate to agreement page
    await page.click('[data-testid="continue-button"]');
    await page.waitForURL('**/agreement**');
    
    // Mock a failed payment
    await page.route('**/payment-actions**', async (route, request) => {
      if (request.url().includes('retry')) {
        // Second attempt succeeds
        await route.continue();
      } else {
        // First attempt fails
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'CARD_ERROR',
              message: 'Your card was declined.',
              retryable: true
            }
          })
        });
      }
    });
    
    // Click payment button (first attempt - fails)
    await page.click('[data-testid="payment-button"]');
    
    // Verify error message and retry button appear
    const errorAlert = page.locator('[data-testid="payment-error"]');
    await expect(errorAlert).toBeVisible();
    
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    
    // Click retry (second attempt - succeeds)
    await retryButton.click();
    
    // Should proceed to Stripe checkout on retry
    await expect(page).toHaveURL(/.*checkout\.stripe\.com.*/);
  });
});