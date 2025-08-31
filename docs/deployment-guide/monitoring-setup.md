# Monitoring and Analytics Setup Guide

## 🎯 Overview

Set up comprehensive monitoring for your Revenue Intelligence Engine to track system health, business metrics, and user behavior. This guide covers both technical monitoring and business intelligence tracking.

## ⚡ Quick Setup (20 minutes)

### Step 1: Error Tracking with Sentry (Recommended)

1. **Create Sentry Account**
   - Go to [sentry.io](https://sentry.io)
   - Create account and new project
   - Choose "Next.js" as platform

2. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

3. **Configure Sentry**
   ```bash
   # Add to .env.local
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

4. **Initialize Sentry**
   Create `sentry.config.js`:
   ```javascript
   import { init } from '@sentry/nextjs';

   init({
     dsn: process.env.SENTRY_DSN,
     tracesSampleRate: 1.0,
     environment: process.env.NODE_ENV,
   });
   ```

### Step 2: Business Analytics

1. **Google Analytics 4 Setup**
   ```bash
   # Add to .env.local
   NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
   ```

2. **Add Analytics Component**
   Create `components/Analytics.tsx`:
   ```typescript
   import Script from 'next/script'

   export default function Analytics() {
     const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID

     if (!GA_TRACKING_ID) return null

     return (
       <>
         <Script
           src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
           strategy="afterInteractive"
         />
         <Script id="google-analytics" strategy="afterInteractive">
           {`
             window.dataLayer = window.dataLayer || [];
             function gtag(){dataLayer.push(arguments);}
             gtag('js', new Date());
             gtag('config', '${GA_TRACKING_ID}');
           `}
         </Script>
       </>
     )
   }
   ```

## 📊 Business Intelligence Tracking

### Revenue Intelligence Metrics

**Key Performance Indicators (KPIs)**:
- Client conversion rate (pending → activated → paid)
- Hypothesis accuracy rate (successful vs failed predictions)
- Time-to-payment (journey start to payment completion)
- Content iteration velocity (changes per client)
- Admin efficiency (time spent on manual tasks)

**Custom Event Tracking**:
```typescript
// Add to your server actions
export async function trackBusinessEvent(
  eventName: string,
  properties: Record<string, any>
) {
  // Google Analytics Custom Event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      custom_parameter_1: properties.value1,
      custom_parameter_2: properties.value2,
    });
  }

  // Sentry Custom Event
  Sentry.addBreadcrumb({
    message: eventName,
    category: 'business',
    data: properties,
  });
}

// Usage in client actions
await trackBusinessEvent('client_created', {
  client_id: client.id,
  has_hypothesis: !!client.hypothesis,
  token: client.token
});

await trackBusinessEvent('payment_received', {
  client_id: client.id,
  amount: paymentAmount,
  journey_outcome: 'paid'
});
```

### Conversion Funnel Tracking

**Journey Stage Events**:
```typescript
// Track journey progression
const journeyEvents = {
  'journey_started': { client_token, page_type: 'activation' },
  'page_completed': { client_token, page_type, time_spent },
  'journey_completed': { client_token, total_time, outcome },
  'payment_initiated': { client_token, amount, method },
  'payment_completed': { client_token, amount, success: true },
  'hypothesis_added': { admin_id, page_type, hypothesis_type },
  'outcome_marked': { admin_id, client_id, outcome_type }
};
```

## 🔧 Technical Monitoring

### System Health Monitoring

**Uptime Monitoring**:
- Use [UptimeRobot](https://uptimerobot.com) (free tier available)
- Monitor main dashboard URL
- Monitor webhook endpoint
- Alert on downtime via email/SMS

**Performance Monitoring**:
```typescript
// Add to your Next.js config
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  // Enable performance metrics
  reactStrictMode: true,
  poweredByHeader: false,
}
```

**Database Performance** (if using Supabase):
```sql
-- Create performance monitoring views
CREATE OR REPLACE VIEW client_performance_metrics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as clients_created,
  COUNT(CASE WHEN journey_outcome = 'paid' THEN 1 END) as payments_received,
  AVG(CASE WHEN payment_timestamp IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (payment_timestamp - created_at))/3600 
    END) as avg_hours_to_payment
FROM clients 
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### Webhook Monitoring

**Stripe Webhook Health Check**:
```typescript
// Add webhook health endpoint
// pages/api/health/webhooks.ts
export default async function handler(req, res) {
  const checks = {
    stripe_configured: !!process.env.STRIPE_SECRET_KEY,
    webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    endpoint_accessible: true,
    database_connected: false
  };

  // Test database connection
  try {
    // Test your database connection here
    checks.database_connected = true;
  } catch (error) {
    checks.database_connected = false;
  }

  const allHealthy = Object.values(checks).every(check => check === true);
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
}
```

**Monitor Webhook Delivery**:
```typescript
// Add webhook processing metrics
let webhookMetrics = {
  total_received: 0,
  successful_processed: 0,
  failed_processed: 0,
  last_processed: null
};

// In your webhook handler
export async function POST(request: NextRequest) {
  webhookMetrics.total_received++;
  webhookMetrics.last_processed = new Date().toISOString();

  try {
    // ... webhook processing logic
    webhookMetrics.successful_processed++;
  } catch (error) {
    webhookMetrics.failed_processed++;
    Sentry.captureException(error);
  }
}
```

## 📈 Analytics Dashboard Setup

### Custom Analytics Dashboard

Create `pages/api/analytics/summary.ts`:
```typescript
export default async function handler(req, res) {
  const summary = {
    clients: {
      total: await getClientCount(),
      activated: await getClientCount('activated'),
      paid: await getClientCount('paid'),
      conversion_rate: await getConversionRate()
    },
    revenue: {
      total_payments: await getTotalRevenue(),
      average_payment: await getAveragePayment(),
      monthly_revenue: await getMonthlyRevenue()
    },
    learning: {
      hypotheses_tracked: await getHypothesesCount(),
      successful_predictions: await getSuccessfulPredictions(),
      accuracy_rate: await getPredictionAccuracy()
    },
    system: {
      uptime: await getSystemUptime(),
      response_time: await getAverageResponseTime(),
      error_rate: await getErrorRate()
    }
  };

  res.json(summary);
}
```

### Real-time Metrics Component

```typescript
// components/MetricsDashboard.tsx
export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/analytics/summary');
      const data = await response.json();
      setMetrics(data);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div>Loading metrics...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        title="Total Revenue"
        value={`$${metrics.revenue.total_payments}`}
        change={metrics.revenue.monthly_change}
      />
      <MetricCard
        title="Conversion Rate"
        value={`${metrics.clients.conversion_rate}%`}
        change={metrics.clients.conversion_change}
      />
      <MetricCard
        title="Prediction Accuracy"
        value={`${metrics.learning.accuracy_rate}%`}
        change={metrics.learning.accuracy_change}
      />
      <MetricCard
        title="System Health"
        value="Healthy"
        status={metrics.system.error_rate < 0.1 ? 'green' : 'red'}
      />
    </div>
  );
}
```

## 🚨 Alerting and Notifications

### Critical Alerts Setup

**System Health Alerts**:
- Webhook delivery failures > 5% in 1 hour
- Response time > 5 seconds for 5 minutes
- Error rate > 1% in 15 minutes
- Database connection failures
- Payment processing failures

**Business Alerts**:
- Daily revenue drops > 20% from previous day
- Conversion rate drops > 10% from previous week
- No new clients created in 24 hours (for active campaigns)
- High-value client marked as "ghosted"

**Notification Channels**:
```typescript
// Slack webhook notification
async function sendSlackAlert(message: string, severity: 'info' | 'warning' | 'error') {
  if (!process.env.SLACK_WEBHOOK_URL) return;

  const color = severity === 'error' ? 'danger' : 
                severity === 'warning' ? 'warning' : 'good';

  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color,
        title: 'Revenue Intelligence Alert',
        text: message,
        ts: Math.floor(Date.now() / 1000)
      }]
    })
  });
}

// Email notification (using your email service)
async function sendEmailAlert(subject: string, message: string) {
  // Implementation depends on your email service
  // Could be SendGrid, AWS SES, etc.
}
```

## 📊 Performance Monitoring

### Core Web Vitals Tracking

```typescript
// pages/_app.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  window.gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}

export function reportWebVitals(metric) {
  sendToAnalytics(metric);
  
  // Also send to your custom analytics
  if (metric.value > getThreshold(metric.name)) {
    Sentry.captureMessage(`Poor ${metric.name}: ${metric.value}`, 'warning');
  }
}

// In your app component
useEffect(() => {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}, []);
```

### Database Performance Monitoring

```sql
-- Add to your Supabase database for monitoring
CREATE OR REPLACE FUNCTION track_query_performance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO query_performance_log (
    table_name,
    operation_type,
    execution_time,
    row_count,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    EXTRACT(EPOCH FROM (clock_timestamp() - statement_timestamp())),
    CASE WHEN TG_OP = 'DELETE' THEN 0 ELSE 1 END,
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER clients_performance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION track_query_performance();
```

## 📋 Monitoring Checklist

### Setup Verification
- [ ] Error tracking configured (Sentry)
- [ ] Analytics tracking implemented (Google Analytics)
- [ ] Uptime monitoring active (UptimeRobot)
- [ ] Webhook delivery monitoring setup
- [ ] Database performance tracking configured
- [ ] Custom business metrics implemented

### Alert Configuration
- [ ] Critical system alerts configured
- [ ] Business metric alerts setup
- [ ] Notification channels tested
- [ ] Alert thresholds validated
- [ ] Team notification preferences set

### Dashboard Creation
- [ ] System health dashboard accessible
- [ ] Business metrics dashboard created
- [ ] Real-time monitoring active
- [ ] Historical trend analysis available
- [ ] Mobile-responsive monitoring interface

## 🎯 Success Metrics

Your monitoring setup is successful when you can answer:

✅ **System Health**: Is the application running optimally?  
✅ **Business Performance**: Are conversions and revenue trending positively?  
✅ **User Experience**: Are clients and admins having smooth experiences?  
✅ **Prediction Accuracy**: Are your hypotheses proving correct over time?  
✅ **Operational Efficiency**: Is the system reducing manual work as expected?  

## 🚀 What's Next

After monitoring setup:

1. **Monitor for 1 week**: Establish baseline metrics
2. **Optimize based on data**: Address performance bottlenecks
3. **Set up automated reports**: Weekly/monthly business intelligence
4. **Plan Epic 3**: Use monitoring data to inform next features
5. **Scale monitoring**: Add more sophisticated analytics as you grow

---

**📊 Monitoring Active!** Your Revenue Intelligence Engine now provides comprehensive visibility into both technical performance and business outcomes. Use these insights to optimize the system and drive systematic conversion improvements.