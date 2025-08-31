# Webhook Endpoints Setup Guide

## 🎯 Overview

This guide configures webhook endpoints to enable automatic payment-outcome correlation in your Revenue Intelligence Engine. Webhooks allow Stripe to notify your system instantly when payment events occur, enabling real-time learning capture.

## ⚡ Quick Setup (10 minutes)

### Step 1: Access Stripe Dashboard

1. **Navigate to Webhooks**
   - Log into [Stripe Dashboard](https://dashboard.stripe.com)
   - Go to "Developers" → "Webhooks"
   - Click "Add endpoint"

### Step 2: Configure Your Webhook Endpoint

**Development Configuration**:
```
Endpoint URL: http://localhost:3000/api/webhooks/stripe
Description: Template Genius Revenue Intelligence - Development
```

**Production Configuration**:
```
Endpoint URL: https://yourdomain.com/api/webhooks/stripe
Description: Template Genius Revenue Intelligence - Production
```

### Step 3: Select Events to Listen For

Your Revenue Intelligence Engine needs these specific events:

**Required Events** (check these boxes):
- ✅ `payment_intent.succeeded` - When payment is completed successfully
- ✅ `payment_intent.payment_failed` - When payment fails
- ✅ `checkout.session.completed` - When checkout session completes

**Optional Events** (recommended for enhanced tracking):
- ✅ `payment_intent.created` - When payment intent is created
- ✅ `payment_intent.canceled` - When payment is canceled
- ✅ `checkout.session.async_payment_succeeded` - For delayed payments
- ✅ `checkout.session.async_payment_failed` - For delayed payment failures

### Step 4: Get Your Webhook Secret

1. **After Creating the Webhook**
   - Click on your newly created webhook
   - In the "Signing secret" section, click "Reveal"
   - Copy the secret starting with `whsec_`

2. **Add to Environment Variables**
   ```bash
   # Add this to your .env.local
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

## 🔧 Advanced Configuration

### Multiple Environment Setup

For professional deployment, set up separate webhooks for each environment:

**Development Webhook**:
```
URL: https://your-dev-branch.vercel.app/api/webhooks/stripe
Events: All payment events
Description: Development Environment
```

**Staging Webhook**:
```
URL: https://your-staging.vercel.app/api/webhooks/stripe  
Events: All payment events
Description: Staging Environment
```

**Production Webhook**:
```
URL: https://yourdomain.com/api/webhooks/stripe
Events: All payment events  
Description: Production Environment
```

### Webhook Metadata Requirements

Your Revenue Intelligence Engine expects specific metadata in payment events:

**Required Metadata Fields**:
```json
{
  "client_id": "123",              // Your client's database ID
  "client_token": "G1001",         // Your G[4-digit] token
  "journey_type": "template_genius_activation"
}
```

**Optional Metadata Fields**:
```json
{
  "journey_id": "456",             // Specific journey page ID
  "page_type": "activation",       // Which page type triggered payment
  "hypothesis": "Urgency messaging", // Current hypothesis being tested
  "created_at": "2024-01-15T10:30:00Z"
}
```

### Testing with Local Development

**Option 1: Using ngrok (Recommended)**

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **In Another Terminal, Start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Use ngrok URL in Stripe**
   ```
   # ngrok will show something like:
   https://abc123.ngrok.io -> http://localhost:3000
   
   # Use in Stripe webhook configuration:
   https://abc123.ngrok.io/api/webhooks/stripe
   ```

**Option 2: Using Stripe CLI**

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows
   scoop install stripe
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward Events to Local Development**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

## 🧪 Testing Your Webhooks

### Test Event Processing

1. **Using Stripe Dashboard**
   - Go to "Developers" → "Events"
   - Click "Send test webhook"
   - Select your webhook endpoint
   - Choose event: `payment_intent.succeeded`
   - Add test metadata:
   ```json
   {
     "client_id": "1",
     "client_token": "G1001",
     "journey_type": "template_genius_activation"
   }
   ```

2. **Check Your Application**
   - Go to your dashboard: `http://localhost:3000/dashboard`
   - Look for client with token "G1001"
   - Verify outcome status changed to "Paid"
   - Check outcome notes for payment details

### Test with Stripe CLI

```bash
# Send test payment success event
stripe trigger payment_intent.succeeded

# Send test payment failure event  
stripe trigger payment_intent.payment_failed

# Send test checkout completion
stripe trigger checkout.session.completed
```

### Monitor Webhook Delivery

1. **In Stripe Dashboard**
   - Go to your webhook endpoint
   - Click "Events" tab
   - Monitor delivery attempts and responses

2. **Expected Response Codes**
   - `200`: Webhook processed successfully
   - `400`: Invalid signature or malformed request
   - `503`: Stripe not configured (missing environment variables)

## 🔍 Webhook Security

### Signature Verification

Your system automatically verifies webhook signatures using:

```typescript
// This is handled automatically in your webhook handler
const signature = headers().get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### Security Best Practices

1. **Always Verify Signatures**
   - Never process unverified webhooks
   - Your system rejects webhooks with invalid signatures

2. **Use HTTPS in Production**
   - Stripe requires HTTPS for production webhooks
   - Local development can use HTTP via ngrok

3. **Handle Idempotency**
   - Your system processes each event only once
   - Duplicate events are safely ignored

4. **Validate Metadata**
   - Ensure required fields are present
   - Validate client_id and client_token exist

## 📊 Event Processing Logic

### Payment Success Flow

```
1. Stripe sends payment_intent.succeeded
2. System extracts client metadata
3. System finds client by ID or token  
4. System updates client outcome to "paid"
5. System records payment amount and timestamp
6. System adds outcome notes with payment details
7. Dashboard automatically refreshes to show update
```

### Payment Failure Flow

```
1. Stripe sends payment_intent.payment_failed
2. System extracts client metadata
3. System finds client by ID or token
4. System updates outcome notes with failure reason
5. System keeps outcome as "pending" (payment may be retried)
6. Admin can manually update outcome if needed
```

## 🔍 Troubleshooting

### Common Issues

**Issue**: Webhook returns 503 Service Unavailable
```json
{"error":"Stripe not configured - check STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET"}
```
**Solution**: Verify environment variables are set and restart server

**Issue**: Webhook returns 400 Bad Request  
```json
{"error":"Invalid signature"}
```
**Solution**: 
1. Check webhook secret matches Stripe dashboard
2. Ensure you're copying the full secret including `whsec_` prefix
3. Verify webhook URL is correct

**Issue**: Events processed but client not updated
```
Client not found for payment: {clientId: "123", clientToken: undefined}
```
**Solution**: Ensure payment metadata includes valid `client_id` or `client_token`

**Issue**: Webhook timeout (no response)
```
Webhook delivery attempt timed out
```
**Solution**:
1. Check if your server is running and accessible
2. For local development, ensure ngrok is running
3. Verify webhook endpoint URL is correct

### Debug Mode

Enable detailed webhook logging:

```bash
# Add to your .env.local
DEBUG_STRIPE_WEBHOOKS=true
```

This logs:
- All incoming webhook events
- Client lookup attempts
- Database update operations
- Error details

### Testing Specific Scenarios

**Test Client Not Found**:
```bash
# Send event with non-existent client
stripe trigger payment_intent.succeeded --add metadata:client_id=99999
```

**Test Missing Metadata**:
```bash
# Send event without required metadata
stripe trigger payment_intent.succeeded
```

**Test Network Issues**:
```bash
# Test webhook retries (Stripe retries failed deliveries)
# Temporarily stop your server, then restart it
```

## 📋 Verification Checklist

Before proceeding to the next step:

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Correct events selected (payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed)
- [ ] Webhook secret copied to environment variables
- [ ] Development server restarts without Stripe warnings
- [ ] Test webhook event processes successfully
- [ ] Client outcome updates in dashboard
- [ ] Payment details are recorded correctly
- [ ] Webhook delivery shows 200 response in Stripe Dashboard

## 🎯 What You've Unlocked

With webhooks configured, your Revenue Intelligence Engine now:

✅ **Learns Automatically**: Payment events instantly teach your system what works
✅ **Tracks Revenue in Real-Time**: Know immediately when clients pay
✅ **Correlates Content to Outcomes**: Connect hypothesis changes to payment results
✅ **Builds Pattern Recognition Data**: Foundation for systematic optimization
✅ **Reduces Manual Work**: No need to manually mark clients as paid

## 🚀 Next Steps

1. **Optional Database**: [Set up Supabase Database](./supabase-setup.md)
2. **Deploy to Production**: [Production Deployment Guide](./production-deployment.md)
3. **Begin Epic 3**: Payment Intelligence Integration (ready to start!)

---

**🎉 Webhook Success!** Your Revenue Intelligence Engine now automatically learns from every payment event. Each successful payment becomes systematic intelligence that improves your conversion optimization over time.