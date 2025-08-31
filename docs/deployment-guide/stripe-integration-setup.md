# Stripe Integration Setup Guide

## 🎯 Overview

This guide walks you through setting up Stripe integration to enable automatic payment-outcome correlation in your Revenue Intelligence Engine. This completes Epic 2 Story 2.3 and unlocks systematic learning from payment events.

## ⚡ Quick Setup (15 minutes)

### Step 1: Get Stripe API Keys

1. **Log into Stripe Dashboard**
   - Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Create account if you don't have one

2. **Navigate to API Keys**
   - Click "Developers" in left sidebar
   - Click "API keys"
   - You'll see your keys

3. **Copy Required Keys**
   ```bash
   # Test/Development Keys (use these first)
   STRIPE_PUBLISHABLE_KEY=pk_test_...  # Starts with pk_test_
   STRIPE_SECRET_KEY=sk_test_...       # Starts with sk_test_
   
   # Production Keys (use later)
   STRIPE_PUBLISHABLE_KEY=pk_live_...  # Starts with pk_live_
   STRIPE_SECRET_KEY=sk_live_...       # Starts with sk_live_
   ```

### Step 2: Add Environment Variables

1. **Create/Update .env.local**
   ```bash
   # In your project root directory
   # Add these lines to .env.local (create if it doesn't exist)
   
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

2. **For Production (.env.production)**
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_production_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   ```

### Step 3: Set Up Webhook Endpoint

1. **In Stripe Dashboard**
   - Go to "Developers" → "Webhooks"
   - Click "Add endpoint"

2. **Configure Endpoint**
   ```
   Endpoint URL: https://yourdomain.com/api/webhooks/stripe
   
   # For development testing:
   Endpoint URL: https://your-ngrok-url.ngrok.io/api/webhooks/stripe
   ```

3. **Select Events to Listen For**
   Select these specific events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed` 
   - ✅ `checkout.session.completed`

4. **Get Webhook Secret**
   - After creating the webhook, click on it
   - Click "Reveal" next to "Signing secret"
   - Copy the value starting with `whsec_`
   - Add this to your `STRIPE_WEBHOOK_SECRET` environment variable

### Step 4: Test the Integration

1. **Restart Your Development Server**
   ```bash
   npm run dev
   # or
   npx next dev
   ```

2. **Check for Success Messages**
   You should see:
   ```
   ✓ Ready in 1607ms
   # No more Stripe configuration warnings
   ```

3. **Test Webhook Endpoint**
   ```bash
   # Test that webhook endpoint responds
   curl -X POST http://localhost:3000/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -d '{}'
   
   # Should return: {"error":"Missing signature"}
   # This confirms the endpoint is working
   ```

## 🔧 Advanced Configuration

### Development Setup with ngrok (For Testing)

If you want to test webhooks locally:

1. **Install ngrok**
   ```bash
   npm install -g ngrok
   # or download from https://ngrok.com
   ```

2. **Start Your Dev Server**
   ```bash
   npm run dev
   ```

3. **In Another Terminal, Start ngrok**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL**
   ```
   ngrok will show something like:
   https://abc123.ngrok.io -> http://localhost:3000
   ```

5. **Use This URL in Stripe Webhook Configuration**
   ```
   Webhook URL: https://abc123.ngrok.io/api/webhooks/stripe
   ```

### Production Deployment Configuration

1. **Environment Variables in Your Hosting Platform**

   **Vercel**:
   ```bash
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   ```

   **Netlify**:
   - Go to Site Settings → Environment Variables
   - Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`

   **Railway/Render/etc**:
   - Add environment variables in your platform's dashboard

2. **Update Webhook URL to Production**
   ```
   Production Webhook URL: https://yourproductiondomain.com/api/webhooks/stripe
   ```

## 🧪 Testing Your Integration

### Test Payment Flow

1. **Create a Test Client**
   - Go to your dashboard at `http://localhost:3000/dashboard`
   - Click "Create Client"
   - Fill in test information

2. **Simulate Payment Event**
   
   **Option A: Using Stripe Dashboard**
   - Go to Stripe Dashboard → Events
   - Create test event: `payment_intent.succeeded`
   - Add metadata:
     ```json
     {
       "client_id": "1",
       "client_token": "G1001",
       "journey_type": "template_genius_activation"
     }
     ```

   **Option B: Using Stripe CLI**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   stripe trigger payment_intent.succeeded
   ```

3. **Check Your Dashboard**
   - Refresh your dashboard
   - Look for the client to be marked as "Paid"
   - Check outcome notes for payment confirmation

### Verify Webhook Processing

1. **Check Server Logs**
   Your development server should show:
   ```
   Processing Stripe webhook event: payment_intent.succeeded
   Client 1 (G1001) marked as paid: $5.00
   ```

2. **Check Database/Mock Data**
   - Client outcome should update to "paid"
   - Payment amount and timestamp should be recorded
   - Outcome notes should include payment details

## 🔍 Troubleshooting

### Common Issues

**Issue**: "Stripe not configured" error
```bash
Error: Stripe not configured - check STRIPE_SECRET_KEY environment variable
```
**Solution**: Ensure `STRIPE_SECRET_KEY` is in your `.env.local` and restart your server

**Issue**: "Invalid signature" in webhook
```bash
Webhook signature verification failed
```
**Solution**: 
1. Check that `STRIPE_WEBHOOK_SECRET` matches the value from Stripe Dashboard
2. Ensure webhook endpoint URL is correct
3. Verify you're sending the raw request body

**Issue**: Webhook endpoint returns 404
```bash
GET /api/webhooks/stripe 404
```
**Solution**: Webhooks must be sent via POST, not GET. Check Stripe webhook configuration.

**Issue**: Client not found for payment
```bash
Client not found for payment: {clientId: undefined, clientToken: undefined}
```
**Solution**: Ensure payment metadata includes `client_id` or `client_token` when creating payments

### Debug Mode

Enable debug logging by adding to your environment:
```bash
DEBUG_STRIPE_WEBHOOKS=true
```

This will log detailed webhook processing information.

## 📋 Verification Checklist

Before moving to the next step, verify:

- [ ] Stripe API keys are configured in environment variables
- [ ] Webhook endpoint is created in Stripe Dashboard  
- [ ] Webhook secret is configured in environment variables
- [ ] Development server starts without Stripe configuration warnings
- [ ] Webhook endpoint responds (even with signature errors)
- [ ] Test payment event processes successfully
- [ ] Client outcome updates to "paid" status
- [ ] Payment amount and timestamp are recorded

## 🎯 What You've Unlocked

After completing this setup, your Revenue Intelligence Engine can:

✅ **Automatic Learning**: Stripe payments instantly update journey outcomes  
✅ **Revenue Correlation**: Real-time connection between content and payments  
✅ **Time-to-Conversion**: Track how long from hypothesis to payment  
✅ **Pattern Recognition**: Data foundation for systematic optimization  
✅ **Admin Efficiency**: Reduced manual outcome tracking  

## 🚀 Next Steps

1. **Complete Epic 2**: [Configure Webhook Endpoints](./webhook-endpoints-setup.md)
2. **Optional Database**: [Set up Supabase](./supabase-setup.md)
3. **Begin Epic 3**: Payment Intelligence Integration (now ready!)

---

**🎉 Congratulations!** You've unlocked automatic payment-outcome correlation. Your system now learns from every payment event, transforming client interactions into systematic conversion intelligence.