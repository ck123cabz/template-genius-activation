# Testing Procedures Guide

## 🎯 Overview

This guide provides comprehensive testing procedures to validate your Revenue Intelligence Engine functionality before and after deployment. Follow these tests to ensure system reliability and business value delivery.

## ⚡ Quick Validation (15 minutes)

### Core System Test

1. **Start Development Server**
   ```bash
   npm run dev
   # Verify: Server starts without errors
   # Verify: No Stripe configuration warnings (if configured)
   ```

2. **Dashboard Access Test**
   ```bash
   # Open browser to: http://localhost:3000/dashboard
   # Expected: Dashboard loads with client management interface
   # Expected: Statistics cards display (Total, Activated, Pending, etc.)
   # Expected: At least one test client visible (TechCorp Solutions)
   ```

3. **Client Creation Test**
   - Click "Create Client" button
   - Fill required fields including "Journey Hypothesis"
   - Submit form
   - **Expected**: New client appears in dashboard
   - **Expected**: Client has G[4-digit] token generated

4. **Journey Navigation Test**
   ```bash
   # Use test token: http://localhost:3000/journey/G1001
   # Expected: 4-page journey navigation works
   # Expected: All pages (activation → agreement → confirmation → processing) load
   ```

## 🧪 Comprehensive Testing

### Epic 1 Features - Journey Infrastructure

**Test 1.1: Client Creation with Hypothesis**
```bash
Scenario: Admin creates new client
Given: Admin accesses dashboard
When: Admin clicks "Create Client"
And: Admin fills all required fields including hypothesis
Then: Client is created with unique G[4-digit] token
And: 4 journey pages are automatically generated
And: Client appears in dashboard list
```

**Test 1.2: Multi-Page Journey Navigation**
```bash
Scenario: Client accesses their journey
Given: Client has token G1001
When: Client visits /journey/G1001
Then: Journey overview loads with progress indicators
When: Client navigates between pages
Then: Each page (activation, agreement, confirmation, processing) loads correctly
And: Navigation maintains context and progress
```

**Test 1.3: Admin Content Management**
```bash
Scenario: Admin edits journey content
Given: Admin accesses /dashboard/journey/1
When: Admin clicks on any page tab
And: Admin edits content and adds page hypothesis
Then: Content saves with hypothesis metadata
And: Content history shows previous versions
And: Changes reflect on client-facing pages
```

**Test 1.4: Journey Progress Tracking**
```bash
Scenario: Journey progress visualization
Given: Client with active journey
When: Admin views client in dashboard
Then: Journey progress shows current step
And: Progress percentage displays correctly
And: Status badges reflect current page states
```

### Epic 2 Features - Learning Capture System

**Test 2.1: Outcome Tracking UI**
```bash
Scenario: Admin marks journey outcome
Given: Client exists in dashboard
When: Admin clicks client dropdown menu
Then: Outcome options are visible (Mark Paid, Mark Responded, Mark Ghosted)
When: Admin selects "Mark Paid"
Then: Client outcome updates to "paid"
And: Outcome timestamp is recorded
And: Dashboard statistics update (+1 Paid Clients)
```

**Test 2.2: Bulk Outcome Operations**
```bash
Scenario: Admin updates multiple client outcomes
Given: Multiple clients exist
When: Admin selects multiple clients (if implemented)
And: Admin chooses bulk outcome action
Then: All selected clients update simultaneously
And: Statistics reflect bulk changes
```

**Test 2.3: Payment Webhook Processing**
```bash
Scenario: Stripe webhook updates client outcome
Given: Webhook endpoint is configured
When: Test payment webhook is sent:
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "stripe-signature: test" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "metadata": {
          "client_id": "1",
          "client_token": "G1001"
        },
        "amount": 50000
      }
    }
  }'

Then: Client automatically marked as "paid"
And: Payment amount recorded ($500.00)
And: Outcome notes include payment details
```

## 🔍 Integration Testing

### Stripe Integration Tests

**Test: Webhook Endpoint Accessibility**
```bash
# Test webhook endpoint responds
curl -X POST http://localhost:3000/api/webhooks/stripe

# Expected responses:
# - With Stripe configured: {"error":"Missing signature"}
# - Without Stripe: {"error":"Stripe not configured..."}
```

**Test: Environment Variable Handling**
```bash
# Test graceful degradation
# Remove STRIPE_SECRET_KEY from environment
# Restart server
# Expected: System works with mock data
# Expected: Clear warnings about missing configuration
```

**Test: Payment Metadata Correlation**
```bash
# Test payment utility functions
node -e "
const { createPaymentIntentWithMetadata } = require('./lib/stripe-utils');
// Should handle missing Stripe configuration gracefully
"
```

### Database Integration Tests

**Test: Mock Data Fallback**
```bash
# Test without database configuration
# Remove SUPABASE_URL from environment
# Restart server
# Expected: System uses mock data seamlessly
# Expected: All functionality works
```

**Test: Database Operations** (if Supabase configured)
```bash
# Test database connectivity
# Create new client through UI
# Verify data appears in Supabase Table Editor
# Delete client through UI
# Verify data removed from Supabase
```

## 🚀 Production Testing

### Pre-Deployment Tests

**Build Test**
```bash
npm run build
# Expected: Build completes without errors
# Expected: All TypeScript compilation succeeds
# Expected: No missing dependencies
```

**Production Start Test**
```bash
npm start
# Expected: Production server starts
# Expected: All routes accessible
# Expected: Environment variables load correctly
```

**Bundle Analysis**
```bash
# Optional: Analyze bundle size
npx @next/bundle-analyzer
# Expected: Reasonable bundle sizes
# Expected: No unnecessary dependencies
```

### Post-Deployment Tests

**Accessibility Test**
```bash
# Test production URL
curl https://yourdomain.com/dashboard
# Expected: Returns HTML (200 status)
# Expected: No 500 errors in logs
```

**HTTPS Test**
```bash
# Verify SSL certificate
curl -I https://yourdomain.com
# Expected: Valid SSL certificate
# Expected: Proper security headers
```

**Webhook Endpoint Test**
```bash
# Test production webhook
curl -X POST https://yourdomain.com/api/webhooks/stripe
# Expected: {"error":"Missing signature"}
# Expected: Endpoint accessible from Stripe
```

## 🔧 Error Scenario Testing

### Graceful Failure Tests

**Test: Database Unavailable**
```bash
# Scenario: Database connection fails
# Set invalid SUPABASE_URL
# Expected: System falls back to mock data
# Expected: User sees warning but system works
# Expected: No crashes or 500 errors
```

**Test: Stripe Unavailable**
```bash
# Scenario: Stripe service down
# Set invalid STRIPE_SECRET_KEY
# Expected: Webhooks return 503 with clear message
# Expected: System continues operating
# Expected: Admin can still mark outcomes manually
```

**Test: Invalid Webhook Signature**
```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "stripe-signature: invalid" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 Bad Request
# Expected: {"error":"Invalid signature"}
# Expected: No processing of invalid webhooks
```

### Edge Case Testing

**Test: Duplicate Token Generation**
```bash
# Create multiple clients rapidly
# Expected: All receive unique G[4-digit] tokens
# Expected: No token collisions
# Expected: System handles collision detection
```

**Test: Large Data Sets**
```bash
# Create 100+ test clients (if using database)
# Expected: Dashboard loads performantly
# Expected: Search functionality works
# Expected: No timeout errors
```

## 📊 Performance Testing

### Load Testing (Optional)

**Basic Load Test**
```bash
# Using Apache Bench (if available)
ab -n 100 -c 10 http://localhost:3000/dashboard

# Expected: Average response time < 2 seconds
# Expected: No failed requests
# Expected: Memory usage stable
```

**Webhook Performance Test**
```bash
# Test multiple webhook deliveries
# Send 10 webhook events rapidly
# Expected: All process successfully
# Expected: No queue buildup
# Expected: Database updates complete
```

## 🎯 User Experience Testing

### Admin Workflow Testing

**Complete Admin Journey**
```bash
1. Admin logs into dashboard
2. Admin creates new client with hypothesis
3. Admin navigates to client journey editor
4. Admin updates content on each page with hypotheses
5. Admin marks client outcome as "responded"
6. Admin views outcome statistics
7. Admin creates another client
8. Admin marks second client as "paid"
9. Admin reviews updated statistics showing learning

Expected: Smooth workflow with clear feedback
Expected: All data persists correctly
Expected: Statistics update in real-time
```

### Client Experience Testing

**Complete Client Journey**
```bash
1. Client receives G[4-digit] token
2. Client visits /journey/G1001
3. Client navigates through all 4 pages
4. Client completes activation step
5. Client reviews agreement
6. Client confirms project details
7. Client sees processing status

Expected: Professional, seamless experience
Expected: Clear navigation between steps
Expected: Responsive design on mobile
Expected: Fast page loads
```

## 📋 Testing Checklist

### Pre-Deployment Checklist
- [ ] All Epic 1 features tested and working
- [ ] All Epic 2 features tested and working
- [ ] Webhook integration tested
- [ ] Database fallback tested
- [ ] Error scenarios handled gracefully
- [ ] Build completes without errors
- [ ] Environment variables validated

### Post-Deployment Checklist
- [ ] Production URL accessible
- [ ] HTTPS working correctly
- [ ] Webhook endpoint reachable by Stripe
- [ ] Database connections working (if configured)
- [ ] All admin workflows functional
- [ ] All client workflows functional
- [ ] Performance acceptable (< 3s page loads)
- [ ] Error monitoring configured

### Business Value Validation
- [ ] Client creation captures hypotheses
- [ ] Content changes require hypothesis entry
- [ ] Journey outcomes trackable
- [ ] Payment events automatically correlate
- [ ] Statistics provide business insights
- [ ] Admin efficiency improved
- [ ] Learning capture systematic

## 🔍 Troubleshooting Test Failures

### Common Test Failures

**Dashboard doesn't load**
1. Check console for JavaScript errors
2. Verify environment variables
3. Check server logs for errors
4. Ensure all dependencies installed

**Webhook tests fail**
1. Verify STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
2. Check webhook endpoint URL
3. Ensure server is running
4. Test with simplified curl command

**Client creation fails**
1. Check form validation
2. Verify database connection (if using Supabase)
3. Check server action implementation
4. Review network tab for failed requests

## 🚀 Success Criteria

Your testing is successful when:

✅ **Core Functionality**: All admin and client workflows complete successfully  
✅ **Integration**: Stripe webhooks process payment events automatically  
✅ **Reliability**: System handles failures gracefully with clear messaging  
✅ **Performance**: Page loads < 3 seconds, webhook processing < 1 second  
✅ **Business Value**: Hypothesis capture, outcome tracking, and learning correlation work end-to-end  

---

**🧪 Testing Complete!** Your Revenue Intelligence Engine has been thoroughly validated and is ready for production deployment. These testing procedures ensure reliable operation and deliver the expected business value of systematic conversion intelligence.