# Environment Configuration Guide

## 🎯 Overview

This guide covers all environment variables needed for your Revenue Intelligence Engine to function in development, staging, and production environments. Proper configuration ensures seamless operation across all features.

## 🔧 Environment Variables Reference

### Required Variables (Core Functionality)

```bash
# Stripe Integration (Epic 2 - Payment Correlation)
STRIPE_SECRET_KEY=sk_test_...                    # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...                  # Webhook signing secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000               # Base URL for your app
NEXTAUTH_SECRET=your-random-32-character-secret  # JWT signing secret
```

### Optional Variables (Enhanced Features)

```bash
# Supabase Database (Optional - Mock data works without)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Analytics and Monitoring (Optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-...                # Google Analytics
SENTRY_DSN=https://...                          # Error tracking

# Development and Debugging
DEBUG_STRIPE_WEBHOOKS=true                      # Enable webhook debug logs
NODE_ENV=development                            # Environment mode
```

## 📂 Environment Files Setup

### Development (.env.local)

Create `.env.local` in your project root:

```bash
# .env.local (for local development)

# Stripe Integration (Required for payment correlation)
STRIPE_SECRET_KEY=sk_test_51AbC...your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-jwt-key-min-32-chars

# Supabase Database (Optional - system works with mocks)
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Debug flags
DEBUG_STRIPE_WEBHOOKS=true
```

### Production (.env.production)

```bash
# .env.production (for production deployment)

# Stripe Integration (Live keys)
STRIPE_SECRET_KEY=sk_live_51AbC...your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_...your_live_webhook_secret

# Next.js Configuration (Production)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-jwt-secret-32-chars-min

# Supabase Database (Production)
NEXT_PUBLIC_SUPABASE_URL=https://yourprodproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_role_key

# Analytics
NEXT_PUBLIC_GA_TRACKING_ID=G-YOURTRACKINGID
SENTRY_DSN=https://your-sentry-dsn

# Production settings
NODE_ENV=production
DEBUG_STRIPE_WEBHOOKS=false
```

### Testing (.env.test)

```bash
# .env.test (for automated testing)

# Test configuration
NODE_ENV=test
STRIPE_SECRET_KEY=sk_test_...test_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=test-secret-key-32-characters-long

# Mock everything in tests
USE_MOCK_DATA=true
DISABLE_EXTERNAL_APIS=true
```

## 🏗️ Platform-Specific Configuration

### Vercel Deployment

```bash
# Using Vercel CLI
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Set environment for each deployment stage
vercel env add NEXTAUTH_URL development   # http://localhost:3000
vercel env add NEXTAUTH_URL preview       # https://your-app-preview.vercel.app
vercel env add NEXTAUTH_URL production    # https://your-domain.com
```

### Netlify Deployment

1. **Go to Site Dashboard**
   - Navigate to Site settings → Environment variables

2. **Add Variables**
   ```
   STRIPE_SECRET_KEY = sk_live_...
   STRIPE_WEBHOOK_SECRET = whsec_...
   NEXTAUTH_URL = https://yoursite.netlify.app
   NEXTAUTH_SECRET = your-secret-key
   ```

### Railway Deployment

```bash
# Using Railway CLI
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set NEXTAUTH_SECRET=your-secret-key
```

### Docker Deployment

```dockerfile
# In your Dockerfile or docker-compose.yml
ENV STRIPE_SECRET_KEY=sk_live_...
ENV STRIPE_WEBHOOK_SECRET=whsec_...
ENV NEXTAUTH_URL=https://yourdomain.com
ENV NEXTAUTH_SECRET=your-secret-key
```

## 🔐 Security Best Practices

### Secret Generation

**NEXTAUTH_SECRET**: Generate a secure random string:
```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 32

# Option 3: Online generator
# https://generate-secret.vercel.app/32
```

**Webhook Secrets**: Always use the exact value from Stripe Dashboard
- Copy exactly including `whsec_` prefix
- Don't modify or truncate the secret

### Environment Security

1. **Never Commit Secrets**
   ```bash
   # Add to .gitignore
   .env.local
   .env.production
   .env.*.local
   ```

2. **Use Different Secrets Per Environment**
   - Development: Test keys and random secrets
   - Production: Live keys and crypto-secure secrets

3. **Rotate Secrets Regularly**
   - Generate new NEXTAUTH_SECRET every 90 days
   - Update webhook secrets when changing endpoints

## 🧪 Testing Your Configuration

### Development Environment Test

```bash
# 1. Start your development server
npm run dev

# 2. Check startup messages
# Should see:
✓ Ready in 1607ms
# Should NOT see:
STRIPE_SECRET_KEY not found
STRIPE_WEBHOOK_SECRET not found

# 3. Test API endpoint
curl http://localhost:3000/api/webhooks/stripe
# Should return: {"error":"Missing signature"}
```

### Production Environment Test

```bash
# 1. Build production version
npm run build

# 2. Start production server
npm start

# 3. Test webhook endpoint
curl https://yourdomain.com/api/webhooks/stripe
# Should return: {"error":"Missing signature"}
```

## 🔍 Troubleshooting

### Common Issues

**Issue**: Environment variables not loading
```bash
# Check if file exists and has correct name
ls -la .env*

# Verify file contents (be careful not to expose secrets)
head -1 .env.local
```

**Solution**: 
- Ensure file is named exactly `.env.local`
- Restart development server after changes
- Check for typos in variable names

**Issue**: Stripe configuration warnings persist
```bash
STRIPE_SECRET_KEY not found - webhook handler will return 503
```

**Solution**:
- Verify `STRIPE_SECRET_KEY` is set in environment file
- Ensure it starts with `sk_test_` or `sk_live_`
- Restart server after adding variables

**Issue**: NextAuth configuration errors
```bash
[next-auth][error][MISSING_NEXTAUTH_SECRET]
```

**Solution**:
- Add `NEXTAUTH_SECRET` with at least 32 characters
- Ensure `NEXTAUTH_URL` matches your app's URL

### Debug Commands

```bash
# Check environment variables (in development)
node -e "console.log(process.env.STRIPE_SECRET_KEY ? 'Stripe configured' : 'Stripe missing')"

# Test Next.js configuration
npx next info
```

## 📋 Configuration Checklist

### Development Setup
- [ ] `.env.local` file created in project root
- [ ] `STRIPE_SECRET_KEY` configured (starts with `sk_test_`)
- [ ] `STRIPE_WEBHOOK_SECRET` configured (starts with `whsec_`)  
- [ ] `NEXTAUTH_SECRET` generated and configured (32+ characters)
- [ ] `NEXTAUTH_URL` set to `http://localhost:3000`
- [ ] Development server starts without warnings
- [ ] Webhook endpoint responds to test requests

### Production Setup
- [ ] Production environment variables configured in hosting platform
- [ ] Live Stripe keys configured (starts with `sk_live_`)
- [ ] Production webhook secret configured
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] Unique production `NEXTAUTH_SECRET` generated
- [ ] Production build completes successfully
- [ ] Production webhook endpoint accessible

### Optional Enhancements
- [ ] Supabase configuration (if not using mock data)
- [ ] Analytics tracking configured
- [ ] Error monitoring setup
- [ ] Debug flags configured for development

## 🚀 What's Next

After completing environment configuration:

1. **Test Your Setup**: [Testing Procedures](./testing-procedures.md)
2. **Configure Webhooks**: [Webhook Endpoints Setup](./webhook-endpoints-setup.md)  
3. **Optional Database**: [Supabase Setup](./supabase-setup.md)
4. **Production Deploy**: [Production Deployment](./production-deployment.md)

---

**🔧 Environment Ready!** Your Revenue Intelligence Engine now has all the configuration needed to operate in any environment. The system will gracefully handle missing optional variables while requiring only the essential ones for core functionality.