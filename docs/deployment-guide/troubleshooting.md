# Troubleshooting Guide

## 🎯 Overview

This guide helps you diagnose and resolve common issues with your Revenue Intelligence Engine. Issues are organized by category with step-by-step solutions and prevention strategies.

## ⚡ Quick Diagnosis

### System Health Check

Run this quick diagnostic to identify issues:

```bash
# 1. Check if server starts
npm run dev
# Look for: ✓ Ready in [time]ms
# Red flags: Port already in use, module not found, compilation errors

# 2. Check environment variables
node -e "
console.log('Stripe configured:', !!process.env.STRIPE_SECRET_KEY);
console.log('Webhook configured:', !!process.env.STRIPE_WEBHOOK_SECRET);
console.log('Auth configured:', !!process.env.NEXTAUTH_SECRET);
"

# 3. Test core endpoints
curl http://localhost:3000/dashboard
curl -X POST http://localhost:3000/api/webhooks/stripe
```

### Common Issue Quick Fixes

**Server won't start**: Check port 3000 usage, run `lsof -i :3000` and kill conflicting processes  
**Dashboard shows error**: Check browser console and server logs  
**Webhook returns 503**: Missing Stripe environment variables  
**Database errors**: System falls back to mock data - check Supabase configuration

## 🔧 Environment and Configuration Issues

### Issue: Stripe Configuration Warnings

**Symptoms**:
```bash
STRIPE_SECRET_KEY not found - webhook handler will return 503
STRIPE_WEBHOOK_SECRET not found - webhook handler will return 503
```

**Diagnosis**:
1. Check if `.env.local` exists: `ls -la .env.local`
2. Check file contents: `cat .env.local | grep STRIPE`
3. Verify variable format: Should start with `sk_test_` or `sk_live_`

**Solution**:
```bash
# 1. Create/update .env.local
echo "STRIPE_SECRET_KEY=sk_test_your_key_here" >> .env.local
echo "STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret" >> .env.local

# 2. Restart development server
npm run dev
```

**Prevention**: Use environment variable validation in development

### Issue: NextAuth Configuration Error

**Symptoms**:
```bash
[next-auth][error][MISSING_NEXTAUTH_SECRET]
```

**Solution**:
```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env.local
echo "NEXTAUTH_SECRET=your_generated_secret_here" >> .env.local
echo "NEXTAUTH_URL=http://localhost:3000" >> .env.local
```

### Issue: Database Connection Problems

**Symptoms**:
```bash
Supabase client creation failed, using mock data
Connection timeout
Permission denied for table clients
```

**Diagnosis**:
1. Check Supabase environment variables
2. Verify project URL format: `https://yourproject.supabase.co`
3. Test connection: Visit Supabase dashboard to ensure project is active

**Solution**:
```bash
# 1. Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Test connection manually
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/clients?select=*&limit=1"
```

## 🌐 API and Webhook Issues

### Issue: Webhook Endpoint Returns 404

**Symptoms**:
```bash
GET /api/webhooks/stripe 404
Webhook endpoint not found
```

**Diagnosis**:
1. Check if route file exists: `ls app/api/webhooks/stripe/route.ts`
2. Verify route structure matches Next.js 13+ App Router
3. Check for TypeScript compilation errors

**Solution**:
1. Ensure file is at correct path: `app/api/webhooks/stripe/route.ts`
2. Export `POST` function (webhooks only use POST)
3. Restart development server after route changes

### Issue: Webhook Signature Verification Fails

**Symptoms**:
```bash
Webhook signature verification failed: Invalid signature
400 Bad Request: {"error":"Invalid signature"}
```

**Diagnosis**:
1. Check if `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Verify webhook secret format: starts with `whsec_`
3. Ensure webhook endpoint URL is correct

**Solution**:
```bash
# 1. Get fresh webhook secret from Stripe Dashboard
# Developers → Webhooks → Your Endpoint → Reveal signing secret

# 2. Update environment variable
# Copy EXACTLY including whsec_ prefix

# 3. Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Issue: Webhook Processing but No Client Updates

**Symptoms**:
```bash
Processing Stripe webhook event: payment_intent.succeeded
Client not found for payment: {clientId: undefined, clientToken: undefined}
```

**Diagnosis**: Payment metadata missing required fields

**Solution**:
```typescript
// When creating payments, ensure metadata includes:
const paymentIntent = await stripe.paymentIntents.create({
  amount: 50000,
  currency: 'usd',
  metadata: {
    client_id: '1',           // Required
    client_token: 'G1001',    // Required  
    journey_type: 'template_genius_activation'
  }
});
```

## 💻 Frontend and UI Issues

### Issue: Dashboard Doesn't Load

**Symptoms**:
- Blank page or loading spinner
- JavaScript errors in browser console
- Network errors in developer tools

**Diagnosis**:
1. Check browser console: `F12 → Console`
2. Check network tab: `F12 → Network`
3. Check server logs for errors

**Common Solutions**:

**Client-side Error**:
```bash
# Clear browser cache and cookies
# Hard refresh: Ctrl+F5 or Cmd+Shift+R
# Check for JavaScript errors in console
```

**Server-side Error**:
```bash
# Check server logs for compilation errors
npm run dev
# Look for TypeScript errors or missing modules
```

**Environment Variable Issues**:
```bash
# Ensure public environment variables are prefixed with NEXT_PUBLIC_
# Check that all required variables are set
```

### Issue: Client Creation Form Errors

**Symptoms**:
- Form doesn't submit
- Validation errors don't clear
- Server action errors

**Solution**:
```typescript
// Check form action configuration
<form action={createAction}>
  {/* Ensure all required fields have 'name' attributes */}
  <input name="company" required />
  <input name="hypothesis" required />
</form>

// Check server action error handling
if (!result.success) {
  return { success: false, error: result.error };
}
```

### Issue: Journey Navigation Problems

**Symptoms**:
- Pages don't load: `/journey/G1001`
- Navigation between pages broken
- Token not recognized

**Diagnosis**:
1. Verify token format: Should be `G[4-digit]` (e.g., G1001)
2. Check if client exists in database/mock data
3. Verify route file structure

**Solution**:
```bash
# 1. Test token directly
curl http://localhost:3000/journey/G1001

# 2. Check token in database
# Look for client with matching token

# 3. Verify route file exists
ls app/journey/[gToken]/page.tsx
```

## 📊 Data and Business Logic Issues

### Issue: Statistics Don't Update

**Symptoms**:
- Dashboard statistics show outdated numbers
- New clients don't appear in counts
- Outcome changes not reflected

**Solution**:
```typescript
// Add revalidatePath to server actions
import { revalidatePath } from 'next/cache';

export async function updateClientOutcome(...) {
  // ... update logic
  revalidatePath('/dashboard');  // Add this line
  return { success: true };
}
```

### Issue: Mock Data vs Database Confusion

**Symptoms**:
- Changes don't persist between sessions
- Different data on different machines
- Test data inconsistencies

**Diagnosis**: System using mock data instead of database

**Solution**:
```bash
# Check which data source is active
# Look for console messages:
# "Supabase environment variables not found, using mock data"
# "Loading content from localStorage"

# To use database:
# Configure Supabase environment variables

# To use mock data:
# Remove or comment out Supabase environment variables
```

### Issue: Payment Amounts Not Displaying

**Symptoms**:
- Payment amount shows as `null` or `undefined`
- Currency formatting errors
- Payment timestamp missing

**Solution**:
```typescript
// Ensure payment amount is stored in cents, displayed in dollars
const displayAmount = paymentAmount ? (paymentAmount / 100).toFixed(2) : '0.00';

// Handle null/undefined cases
{client.payment_amount && (
  <p>Payment: ${client.payment_amount.toFixed(2)}</p>
)}
```

## 🚀 Production and Deployment Issues

### Issue: Production Build Failures

**Symptoms**:
```bash
Type error: Property 'x' does not exist on type 'y'
Module not found: Can't resolve 'path/to/module'
```

**Solution**:
```bash
# 1. Check TypeScript errors locally
npx tsc --noEmit

# 2. Fix all TypeScript errors
# 3. Test build locally
npm run build

# 4. Check for missing dependencies
npm install
```

### Issue: Environment Variables Not Loading in Production

**Symptoms**:
- Features work locally but not in production
- Stripe/database connections fail in production

**Solution**:
```bash
# For Vercel
vercel env ls                    # List current variables
vercel env add STRIPE_SECRET_KEY # Add missing variables

# For other platforms
# Check platform-specific environment variable configuration
```

### Issue: Webhook Delivery Failures in Production

**Symptoms**:
- Stripe Dashboard shows failed webhook deliveries
- Webhook events timing out
- 500 errors on webhook endpoint

**Diagnosis**:
1. Check webhook endpoint is accessible: `curl https://yourdomain.com/api/webhooks/stripe`
2. Verify HTTPS certificate is valid
3. Check server logs for errors

**Solution**:
```bash
# 1. Test webhook endpoint accessibility
curl -X POST https://yourdomain.com/api/webhooks/stripe

# Should return: {"error":"Missing signature"} (not 500/timeout)

# 2. Check Stripe webhook configuration
# Ensure URL is correct: https://yourdomain.com/api/webhooks/stripe
# Verify events are selected: payment_intent.succeeded, etc.

# 3. Monitor webhook delivery in Stripe Dashboard
# Webhooks → Your Endpoint → Events tab
```

## 🔍 Debugging Tools and Commands

### Server-side Debugging

```bash
# Enable debug mode
DEBUG=* npm run dev

# Check server logs in production
# Vercel: vercel logs
# Netlify: netlify logs
# Docker: docker logs container_name

# Test API endpoints
curl -v http://localhost:3000/api/webhooks/stripe
curl -v http://localhost:3000/dashboard
```

### Database Debugging

```sql
-- Check database connection and table structure
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify client data
SELECT id, company, token, journey_outcome, payment_received 
FROM clients LIMIT 5;

-- Check recent client activity
SELECT * FROM clients 
WHERE created_at > NOW() - INTERVAL '24 hours' 
ORDER BY created_at DESC;
```

### Browser Debugging

```javascript
// Check client-side environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Test client-side API calls
fetch('/api/webhooks/stripe', { method: 'POST' })
  .then(r => r.json())
  .then(console.log);

// Check local storage (for mock data)
console.log('Stored content:', localStorage.getItem('activation_content_cache'));
```

## 📋 Troubleshooting Checklist

### Before Asking for Help

- [ ] Checked browser console for JavaScript errors
- [ ] Verified all environment variables are set correctly
- [ ] Tested with a fresh browser session (cleared cache/cookies)
- [ ] Confirmed server starts without errors
- [ ] Verified database/API connections are working
- [ ] Checked recent changes that might have caused the issue
- [ ] Tested the specific feature that's failing
- [ ] Reviewed server logs for error messages

### Information to Gather

When reporting issues, include:
- **Error message** (full text)
- **Steps to reproduce** the issue
- **Environment** (development/production)
- **Browser** and version (if frontend issue)
- **Server logs** (if available)
- **Environment variables** status (configured/missing)
- **Recent changes** made to the system

## 🆘 Getting Additional Help

### Documentation Resources

1. **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
2. **Stripe Documentation**: [stripe.com/docs](https://stripe.com/docs)
3. **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
4. **TypeScript Handbook**: [typescriptlang.org/docs](https://typescriptlang.org/docs)

### Community Support

1. **Stack Overflow**: Tag questions with `next.js`, `stripe`, `typescript`
2. **GitHub Issues**: Check repository issues for similar problems
3. **Discord/Slack**: Join relevant developer communities

### Professional Support

Consider professional support if:
- Issues affect production business operations
- Multiple complex systems are involved
- You need custom feature development
- Performance optimization is critical

---

**🔧 Troubleshooting Complete!** Most issues with your Revenue Intelligence Engine can be resolved using this guide. The system is designed for resilience and provides clear error messages to help diagnose problems quickly.