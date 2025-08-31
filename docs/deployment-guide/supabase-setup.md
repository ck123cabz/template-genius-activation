# Supabase Database Setup Guide

## 🎯 Overview

**Important**: This setup is **optional**. Your Revenue Intelligence Engine works perfectly with mock data during development. Set up Supabase when you're ready for production or want persistent data storage.

Your system includes a comprehensive mock data fallback that provides full functionality without any database dependency.

## ⚡ When to Set Up Supabase

**Set up now if:**
- You want persistent data storage
- You're deploying to production
- Multiple people need access to the same data
- You want to import/export client data

**Skip for now if:**
- You're still in development/testing
- You want to iterate quickly without database constraints
- You're evaluating the system functionality
- You prefer the zero-configuration development experience

## 🚀 Quick Setup (20 minutes)

### Step 1: Create Supabase Project

1. **Go to [supabase.com](https://supabase.com)**
   - Click "Start your project"
   - Sign up or log in

2. **Create New Project**
   ```
   Organization: Your Organization
   Project Name: template-genius-revenue-intelligence
   Database Password: [Generate strong password]
   Region: Choose closest to your users
   ```

3. **Save Your Credentials**
   After project creation, go to Settings → API:
   ```bash
   Project URL: https://yourproject.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 2: Configure Environment Variables

Add to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Create Database Schema

1. **Go to SQL Editor** in Supabase Dashboard
2. **Run Database Schema Creation**:

```sql
-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create clients table with Epic 2 outcome tracking fields
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  position TEXT NOT NULL,
  salary TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'activated')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  logo TEXT,
  -- Epic 2: Journey Outcome Tracking fields
  journey_outcome TEXT CHECK (journey_outcome IN ('pending', 'paid', 'ghosted', 'responded')) DEFAULT 'pending',
  outcome_notes TEXT,
  outcome_timestamp TIMESTAMPTZ,
  payment_received BOOLEAN DEFAULT FALSE,
  payment_amount NUMERIC(10, 2),
  payment_timestamp TIMESTAMPTZ
);

-- Create journey_pages table
CREATE TABLE IF NOT EXISTS journey_pages (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  page_type TEXT CHECK (page_type IN ('activation', 'agreement', 'confirmation', 'processing')) NOT NULL,
  page_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'skipped')) DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create content tables for different page types
CREATE TABLE IF NOT EXISTS activation_content (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  benefits JSONB DEFAULT '[]',
  payment_options JSONB DEFAULT '{}',
  investment_details JSONB DEFAULT '[]',
  guarantee_info JSONB DEFAULT '{}',
  search_period TEXT DEFAULT '14-day priority access',
  activation_fee TEXT DEFAULT '$500',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreement_content (
  id BIGSERIAL PRIMARY KEY,
  page_title TEXT NOT NULL,
  main_title TEXT NOT NULL,
  company_info JSONB DEFAULT '{}',
  definitions JSONB DEFAULT '[]',
  sections JSONB DEFAULT '[]',
  contact_info JSONB DEFAULT '{}',
  footer_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS confirmation_content (
  id BIGSERIAL PRIMARY KEY,
  page_title TEXT NOT NULL,
  success_title TEXT NOT NULL,
  success_subtitle TEXT NOT NULL,
  details_section_title TEXT,
  next_steps_title TEXT,
  next_steps JSONB DEFAULT '[]',
  contact_section JSONB DEFAULT '{}',
  download_button_text TEXT DEFAULT 'Download Agreement (PDF)',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS clients_token_idx ON clients(token);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS clients_journey_outcome_idx ON clients(journey_outcome);
CREATE INDEX IF NOT EXISTS clients_payment_received_idx ON clients(payment_received);
CREATE INDEX IF NOT EXISTS journey_pages_client_id_idx ON journey_pages(client_id);
CREATE INDEX IF NOT EXISTS journey_pages_type_idx ON journey_pages(page_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_journey_pages_updated_at 
  BEFORE UPDATE ON journey_pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activation_content_updated_at 
  BEFORE UPDATE ON activation_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agreement_content_updated_at 
  BEFORE UPDATE ON agreement_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_confirmation_content_updated_at 
  BEFORE UPDATE ON confirmation_content 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 4: Insert Initial Test Data

```sql
-- Insert test client with Epic 2 outcome tracking data
INSERT INTO clients (
  company, contact, email, position, salary, hypothesis, token, status,
  journey_outcome, outcome_notes, outcome_timestamp, payment_received,
  created_at
) VALUES (
  'TechCorp Solutions',
  'John Smith', 
  'john@techcorp.com',
  'Senior Software Engineer',
  '$120,000 - $150,000',
  'John''s current role lacks growth opportunities and he values work-life balance and remote flexibility. Our premium placement service should emphasize career advancement and flexible work arrangements to drive conversion.',
  'G1001',
  'pending',
  'responded',
  'Client responded positively to proposal and requested additional information about timeline. Showing strong interest in premium service package.',
  NOW() - INTERVAL '2 days',
  false,
  NOW() - INTERVAL '7 days'
) ON CONFLICT (token) DO NOTHING;

-- Create journey pages for the test client
WITH client_data AS (
  SELECT id FROM clients WHERE token = 'G1001' LIMIT 1
)
INSERT INTO journey_pages (client_id, page_type, page_order, title, content, status, metadata)
SELECT 
  client_data.id,
  page_type,
  page_order,
  title,
  content,
  CASE WHEN page_order <= 1 THEN 'completed'::TEXT
       WHEN page_order = 2 THEN 'active'::TEXT
       ELSE 'pending'::TEXT END,
  metadata
FROM client_data,
(VALUES 
  ('activation', 1, 'Welcome to Template Genius', 'Begin your personalized template journey with us.', '{"estimated_time": "5 minutes", "completed_by": "john@techcorp.com"}'::jsonb),
  ('agreement', 2, 'Service Agreement', 'Review and accept our service terms and project scope.', '{"estimated_time": "10 minutes", "requires_signature": true}'::jsonb),
  ('confirmation', 3, 'Project Confirmation', 'Confirm your project details and timeline.', '{"estimated_time": "7 minutes"}'::jsonb),
  ('processing', 4, 'Processing Your Request', 'We are preparing your custom templates.', '{"estimated_time": "2-5 business days"}'::jsonb)
) AS pages(page_type, page_order, title, content, metadata)
ON CONFLICT DO NOTHING;

-- Insert default content
INSERT INTO activation_content (title, subtitle, benefits, payment_options, investment_details)
VALUES (
  'Activate Priority Access',
  'Get first access to top talent and enhanced recruitment support',
  '[
    {"title": "Priority Talent Access", "description": "First look at pre-vetted candidates", "icon": "star"},
    {"title": "Accelerated Timeline", "description": "Dedicated 14-day search period", "icon": "clock"}
  ]'::jsonb,
  '{
    "optionA": {"title": "Traditional Placement", "description": "25% placement fee upon hire", "fee": "$500"},
    "optionB": {"title": "Monthly Retainer", "description": "Monthly retainer model", "fee": "$500", "popular": true}
  }'::jsonb,
  '["Your $500 activation fee is fully credited", "No hidden costs", "Transparent pricing"]'::jsonb
) ON CONFLICT DO NOTHING;
```

## 🔧 Row Level Security (RLS) Configuration

**Important**: Enable RLS for production security:

```sql
-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE confirmation_content ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allow all operations with service role
CREATE POLICY "Allow service role full access" ON clients
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON journey_pages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON activation_content
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON agreement_content
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access" ON confirmation_content
  FOR ALL USING (auth.role() = 'service_role');
```

## 🧪 Testing Your Database Connection

1. **Restart Your Development Server**
   ```bash
   npm run dev
   ```

2. **Check Startup Messages**
   You should **NOT** see:
   ```
   Supabase environment variables not found, using mock data
   Supabase client creation failed, using mock data
   ```

3. **Test Dashboard**
   - Go to `http://localhost:3000/dashboard`
   - Should load client data from Supabase
   - Create a new client to test database writes

4. **Verify in Supabase Dashboard**
   - Go to Table Editor in Supabase
   - Check `clients` table for your data
   - Verify new clients appear after creation

## 📊 Data Migration from Mock to Database

If you have been using the system with mock data and want to preserve test data:

```sql
-- Run this if you want to keep existing test scenarios
-- This adds more realistic test data for development

INSERT INTO clients (company, contact, email, position, salary, hypothesis, token, status, journey_outcome, outcome_notes, payment_received, payment_amount) VALUES
('InnovateTech Inc', 'Sarah Johnson', 'sarah@innovatetech.com', 'Product Manager', '$95,000 - $115,000', 'Sarah is looking for opportunities with more strategic impact and equity upside. Emphasize leadership growth and startup potential.', 'G1002', 'activated', 'paid', 'Successfully converted after emphasizing equity potential and leadership opportunities.', true, 500.00),
('DataFlow Systems', 'Michael Chen', 'mchen@dataflow.com', 'Data Engineer', '$110,000 - $140,000', 'Michael values technical challenges and remote work flexibility. Focus on complex problem-solving roles and work-life balance.', 'G1003', 'pending', 'ghosted', 'Initial interest but stopped responding after proposal. May have found other opportunity.', false, null),
('CloudScale Ventures', 'Emma Williams', 'emma@cloudscale.com', 'DevOps Engineer', '$105,000 - $130,000', 'Emma is interested in cloud-native technologies and scaling challenges. Highlight modern tech stack and growth opportunities.', 'G1004', 'activated', 'responded', 'Very positive response, currently reviewing proposals. High conversion probability.', false, null);
```

## 🔍 Troubleshooting

### Common Issues

**Issue**: "Supabase client creation failed"
```bash
Supabase client creation failed, using mock data: Error: Invalid API key
```
**Solution**: 
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Verify you copied the full anon key from Supabase Dashboard → Settings → API

**Issue**: "Permission denied" errors
```sql
permission denied for table clients
```
**Solution**:
- Ensure RLS policies are configured correctly
- Use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
- Check that your service role key is correct

**Issue**: Database connection timeout
```bash
Error: connect ETIMEDOUT
```
**Solution**:
- Check your internet connection
- Verify Supabase project URL is correct
- Ensure Supabase project is not paused (free tier auto-pauses)

### Performance Optimization

```sql
-- Add additional indexes for common queries
CREATE INDEX IF NOT EXISTS clients_created_at_idx ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS clients_outcome_timestamp_idx ON clients(outcome_timestamp DESC);
CREATE INDEX IF NOT EXISTS journey_pages_status_idx ON journey_pages(status);

-- Add partial indexes for common filters
CREATE INDEX IF NOT EXISTS clients_pending_idx ON clients(id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS clients_paid_idx ON clients(id) WHERE journey_outcome = 'paid';
```

## 📋 Verification Checklist

Before proceeding:

- [ ] Supabase project created and configured
- [ ] Environment variables added to `.env.local`
- [ ] Database schema created successfully
- [ ] Test data inserted
- [ ] Row Level Security configured
- [ ] Development server connects without warnings
- [ ] Dashboard loads data from Supabase
- [ ] Can create new clients successfully
- [ ] New data appears in Supabase Table Editor

## 🎯 Benefits After Setup

With Supabase configured:

✅ **Persistent Data**: Client information survives server restarts  
✅ **Multi-User Access**: Multiple people can access the same data  
✅ **Production Ready**: Scalable database for growth  
✅ **Data Export**: Easy backup and migration capabilities  
✅ **Advanced Queries**: Complex analytics and reporting  
✅ **Real-time Updates**: Live data synchronization  

## 🚀 Next Steps

1. **Deploy to Production**: [Production Deployment Guide](./production-deployment.md)
2. **Set Up Monitoring**: [Monitoring Setup](./monitoring-setup.md)
3. **Begin Epic 3**: Payment Intelligence Integration (database ready!)

---

**🗄️ Database Ready!** Your Revenue Intelligence Engine now has persistent storage and is ready for production deployment. The system gracefully falls back to mock data when Supabase isn't available, ensuring development flexibility.