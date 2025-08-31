# Production Deployment Guide

## 🎯 Overview

This guide covers deploying your Revenue Intelligence Engine to production. Your system is designed for easy deployment to any hosting platform with automatic scaling and robust error handling.

## 🚀 Recommended Hosting Platforms

### Vercel (Recommended) - Zero Configuration

**Why Vercel**:
- ✅ Built for Next.js applications
- ✅ Automatic HTTPS and CDN
- ✅ Environment variable management
- ✅ Preview deployments
- ✅ Webhook endpoints work out-of-the-box

**Deployment Steps**:

1. **Connect Repository**
   ```bash
   # Install Vercel CLI (optional)
   npm install -g vercel
   
   # Connect your GitHub repo to Vercel
   # Go to vercel.com → Add New Project → Import Git Repository
   ```

2. **Configure Environment Variables**
   ```bash
   # In Vercel Dashboard → Project Settings → Environment Variables
   
   # Required for production
   STRIPE_SECRET_KEY=sk_live_your_production_key
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=your-production-secret-32-chars-min
   
   # Optional (if using Supabase)
   NEXT_PUBLIC_SUPABASE_URL=https://yourprod.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key
   ```

3. **Deploy**
   ```bash
   # Automatic deployment on push to main branch
   git push origin main
   
   # Or deploy manually
   vercel --prod
   ```

4. **Update Webhook URLs**
   - Go to Stripe Dashboard → Webhooks
   - Update endpoint URL to `https://yourdomain.vercel.app/api/webhooks/stripe`

### Netlify - Alternative Option

**Deployment Steps**:

1. **Build Configuration**
   Create `netlify.toml`:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [build.environment]
     NODE_VERSION = "18"
   
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200
   ```

2. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all production environment variables

3. **Deploy**
   - Connect GitHub repository
   - Deploy automatically on push

### Self-Hosted (Advanced)

**Docker Deployment**:

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build
COPY . .
RUN npm run build

# Production
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose**:
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped
```

## 🔧 Production Configuration

### Environment Variables Checklist

**Required Variables**:
```bash
# Core functionality
STRIPE_SECRET_KEY=sk_live_...           # Live Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # Production webhook secret
NEXTAUTH_URL=https://yourdomain.com     # Your production domain
NEXTAUTH_SECRET=crypto-secure-32-char   # Unique production secret

# Database (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://yourprod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
```

**Optional Variables**:
```bash
# Analytics and monitoring
NEXT_PUBLIC_GA_TRACKING_ID=G-...        # Google Analytics
SENTRY_DSN=https://...                  # Error tracking

# Performance
NODE_ENV=production                     # Production mode
DEBUG_STRIPE_WEBHOOKS=false            # Disable debug logs
```

### Security Configuration

**HTTPS Setup**:
- Vercel/Netlify: Automatic HTTPS
- Self-hosted: Use Let's Encrypt or CloudFlare

**Content Security Policy** (Optional):
```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}
```

## 🧪 Pre-Deployment Testing

### Production Build Test

```bash
# Test production build locally
npm run build
npm start

# Verify all functionality works
curl http://localhost:3000/api/webhooks/stripe
curl http://localhost:3000/dashboard
```

### Environment Variable Validation

```bash
# Create a simple test script
# test-env.js
const requiredVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET', 
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`❌ Missing ${varName}`);
  } else {
    console.log(`✅ ${varName} configured`);
  }
});

# Run the test
node test-env.js
```

### Webhook Endpoint Testing

```bash
# Test production webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{}'

# Should return: {"error":"Missing signature"}
# This confirms endpoint is accessible
```

## 🔍 Post-Deployment Verification

### Functionality Checklist

**Core Features**:
- [ ] Dashboard loads successfully (`/dashboard`)
- [ ] Client creation works
- [ ] Client journey navigation works (`/journey/G1001`)
- [ ] Admin content editing functions
- [ ] Outcome tracking displays correctly

**Integration Features**:
- [ ] Webhook endpoint responds (`/api/webhooks/stripe`)
- [ ] Stripe webhook delivery succeeds (check Stripe Dashboard)
- [ ] Payment events update client outcomes
- [ ] Database operations complete (if using Supabase)

**Performance**:
- [ ] Initial page load < 3 seconds
- [ ] Dashboard interactions responsive
- [ ] No console errors in browser
- [ ] Webhook processing < 1 second

### Monitoring Setup

**Error Tracking** (Optional but Recommended):

1. **Sentry Setup**
   ```bash
   npm install @sentry/nextjs
   ```

   ```javascript
   // sentry.config.js
   import { init } from '@sentry/nextjs';
   
   init({
     dsn: process.env.SENTRY_DSN,
     tracesSampleRate: 1.0,
   });
   ```

2. **Webhook Monitoring**
   Monitor webhook delivery in Stripe Dashboard:
   - Go to Webhooks → Your endpoint
   - Check "Events" tab for delivery status
   - Set up alerts for failed deliveries

**Performance Monitoring**:

1. **Built-in Next.js Analytics**
   ```bash
   # Add to package.json scripts
   "analyze": "cross-env ANALYZE=true next build"
   ```

2. **Vercel Analytics** (if using Vercel)
   - Automatic performance monitoring
   - Real user metrics
   - Core Web Vitals tracking

## 🔄 Deployment Workflow

### Continuous Deployment Setup

**GitHub Actions** (for non-Vercel deployments):

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build application
      run: npm run build
      
    - name: Deploy to production
      run: |
        # Your deployment commands here
```

**Branch Protection**:
- Require PR reviews before merging to main
- Require status checks to pass
- Use preview deployments for testing

### Rollback Procedure

**Vercel**:
```bash
# Rollback to previous deployment
vercel rollback
```

**Manual Rollback**:
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

## 🔧 Production Troubleshooting

### Common Production Issues

**Issue**: Webhook delivery failures
```
Webhook endpoint returned HTTP 500
```
**Debug Steps**:
1. Check application logs for errors
2. Verify environment variables in production
3. Test webhook endpoint directly
4. Check Stripe webhook secret matches

**Issue**: Database connection errors
```
Error: Connection timeout
```  
**Debug Steps**:
1. Verify Supabase project is not paused
2. Check Supabase connection limits
3. Verify environment variables
4. Test database connection

**Issue**: Client-side JavaScript errors
```
Uncaught TypeError: Cannot read property...
```
**Debug Steps**:
1. Check browser console for errors
2. Verify all environment variables with NEXT_PUBLIC_ prefix
3. Test production build locally
4. Check for missing dependencies

### Performance Optimization

**Database Optimization**:
```sql
-- Add indexes for production performance
CREATE INDEX IF NOT EXISTS clients_search_idx 
  ON clients USING GIN(to_tsvector('english', company || ' ' || contact || ' ' || email));

-- Analyze table statistics
ANALYZE clients;
ANALYZE journey_pages;
```

**Caching Strategy**:
```typescript
// next.config.js
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['stripe']
  },
  headers: async () => {
    return [
      {
        source: '/api/webhooks/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }
        ]
      }
    ]
  }
}
```

## 📋 Production Readiness Checklist

### Security
- [ ] HTTPS enabled and working
- [ ] Environment variables secured
- [ ] Webhook signature verification active
- [ ] Database access properly secured
- [ ] No secrets in client-side code

### Performance  
- [ ] Production build optimized
- [ ] Database queries indexed
- [ ] CDN configured (automatic with Vercel/Netlify)
- [ ] Images optimized
- [ ] Bundle size analyzed

### Monitoring
- [ ] Error tracking configured
- [ ] Webhook delivery monitoring active
- [ ] Performance metrics tracking
- [ ] Database health monitoring
- [ ] Uptime monitoring configured

### Business Continuity
- [ ] Backup strategy implemented
- [ ] Rollback procedure tested
- [ ] Database migrations ready
- [ ] Team access configured
- [ ] Documentation updated

## 🎯 Success Metrics

After successful deployment:

**Technical Metrics**:
- Uptime > 99.5%
- Response time < 2 seconds
- Webhook processing < 1 second
- Error rate < 0.1%

**Business Metrics**:
- Client onboarding flow completion rate
- Payment correlation success rate
- Admin productivity (time to mark outcomes)
- System learning capture rate

## 🚀 What's Next

After production deployment:

1. **Monitor for 24 hours**: Watch error rates and performance
2. **Test with real clients**: Process actual client journeys
3. **Gather feedback**: Get admin user experience feedback
4. **Plan Epic 3**: Begin Payment Intelligence Integration
5. **Scale considerations**: Plan for growth and additional features

---

**🚀 Production Success!** Your Revenue Intelligence Engine is now live and ready to transform every client interaction into systematic conversion intelligence. Monitor the initial deployment and prepare for the next phase of intelligent optimization features.