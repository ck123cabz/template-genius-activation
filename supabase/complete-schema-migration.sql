-- =============================================================================
-- TEMPLATE GENIUS REVENUE INTELLIGENCE ENGINE - COMPLETE SCHEMA MIGRATION
-- =============================================================================
-- This migration creates ALL missing tables required for the complete user flow
-- from client creation → activation → payment → analytics
-- 
-- Run this in Supabase SQL Editor to create the full database schema
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CLIENTS TABLE - Core client management
-- =============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company VARCHAR NOT NULL,
  contact VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  position VARCHAR NOT NULL,
  salary VARCHAR,
  hypothesis TEXT NOT NULL,
  token VARCHAR UNIQUE NOT NULL, -- G0001 format for client activation
  logo TEXT,
  status VARCHAR DEFAULT 'pending', -- pending, active, cancelled
  payment_status VARCHAR DEFAULT 'unpaid', -- unpaid, pending, paid, failed
  payment_session_id VARCHAR, -- References Stripe session
  content_snapshot_id UUID, -- References content_snapshots table
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create index on token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS clients_token_idx ON clients(token);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS clients_payment_status_idx ON clients(payment_status);

-- =============================================================================
-- 2. JOURNEY PAGES - Journey page content management
-- =============================================================================
CREATE TABLE IF NOT EXISTS journey_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  page_type VARCHAR NOT NULL, -- activation, agreement, confirmation, processing
  content_version VARCHAR DEFAULT '1.0',
  hypothesis TEXT,
  page_content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE journey_pages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS journey_pages_client_id_idx ON journey_pages(client_id);
CREATE INDEX IF NOT EXISTS journey_pages_page_type_idx ON journey_pages(page_type);

-- =============================================================================
-- 3. JOURNEY CONTENT VERSIONS - Content versioning for A/B testing
-- =============================================================================
CREATE TABLE IF NOT EXISTS journey_content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  page_type VARCHAR NOT NULL,
  version_number VARCHAR NOT NULL,
  is_current BOOLEAN DEFAULT false,
  hypothesis TEXT,
  content_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE journey_content_versions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS journey_content_versions_client_id_idx ON journey_content_versions(client_id);
CREATE INDEX IF NOT EXISTS journey_content_versions_is_current_idx ON journey_content_versions(is_current);

-- =============================================================================
-- 4. ACTIVATION CONTENT - Static activation content templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS activation_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name VARCHAR NOT NULL,
  content_data JSONB DEFAULT '{}',
  guarantee_info JSONB DEFAULT '{"period": "6-month replacement coverage", "description": "Free replacement if hired candidate doesn'\''t work out within 6 months"}',
  search_period TEXT DEFAULT '14-day priority access',
  activation_fee TEXT DEFAULT '$500',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activation_content ENABLE ROW LEVEL SECURITY;

-- Insert default activation content
INSERT INTO activation_content (template_name, content_data, guarantee_info, search_period, activation_fee)
VALUES (
  'default',
  '{"title": "Template Genius Revenue Intelligence", "description": "Priority access to our revenue intelligence engine"}',
  '{"period": "6-month replacement coverage", "description": "Free replacement if hired candidate doesn'\''t work out within 6 months"}',
  '14-day priority access',
  '$500'
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 5. PAYMENT SESSIONS - Stripe payment tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR,
  amount_cents INTEGER NOT NULL DEFAULT 50000, -- $500.00
  currency VARCHAR DEFAULT 'usd',
  status VARCHAR DEFAULT 'pending', -- pending, completed, failed, cancelled
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS payment_sessions_stripe_session_id_idx ON payment_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS payment_sessions_client_id_idx ON payment_sessions(client_id);
CREATE INDEX IF NOT EXISTS payment_sessions_status_idx ON payment_sessions(status);

-- =============================================================================
-- 6. PAYMENT EVENTS - Stripe webhook event tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  payment_session_id UUID REFERENCES payment_sessions(id),
  stripe_event_id VARCHAR UNIQUE NOT NULL,
  event_type VARCHAR NOT NULL,
  event_data JSONB DEFAULT '{}',
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS payment_events_stripe_event_id_idx ON payment_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS payment_events_client_id_idx ON payment_events(client_id);
CREATE INDEX IF NOT EXISTS payment_events_event_type_idx ON payment_events(event_type);

-- =============================================================================
-- 7. CONTENT SNAPSHOTS - A/B testing content snapshots
-- =============================================================================
CREATE TABLE IF NOT EXISTS content_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  session_id VARCHAR NOT NULL,
  payment_session_id VARCHAR,
  snapshot_type VARCHAR DEFAULT 'payment_initiation',
  content_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_snapshots ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS content_snapshots_client_id_idx ON content_snapshots(client_id);
CREATE INDEX IF NOT EXISTS content_snapshots_session_id_idx ON content_snapshots(session_id);
CREATE INDEX IF NOT EXISTS content_snapshots_payment_session_id_idx ON content_snapshots(payment_session_id);

-- =============================================================================
-- 8. PAYMENT TIMING ANALYTICS - Timing correlation data
-- =============================================================================
CREATE TABLE IF NOT EXISTS payment_timing_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  content_snapshot_id UUID REFERENCES content_snapshots(id),
  journey_start_time TIMESTAMPTZ NOT NULL,
  content_last_change TIMESTAMPTZ NOT NULL,
  payment_initiation_time TIMESTAMPTZ NOT NULL,
  time_to_payment INTEGER, -- seconds from journey start to payment
  content_freshness_score NUMERIC,
  engagement_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_timing_analytics ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS payment_timing_analytics_client_id_idx ON payment_timing_analytics(client_id);
CREATE INDEX IF NOT EXISTS payment_timing_analytics_content_snapshot_id_idx ON payment_timing_analytics(content_snapshot_id);

-- =============================================================================
-- 9. UPDATE EXISTING TABLES - Add foreign key relationships
-- =============================================================================

-- Add client_id reference to journey_sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journey_sessions' AND column_name = 'client_id') THEN
        ALTER TABLE journey_sessions ADD COLUMN client_id UUID REFERENCES clients(id);
        CREATE INDEX journey_sessions_client_id_idx ON journey_sessions(client_id);
    END IF;
END $$;

-- =============================================================================
-- 10. ROW LEVEL SECURITY POLICIES (Basic - customize as needed)
-- =============================================================================

-- Clients: Public read access for activation flows
CREATE POLICY IF NOT EXISTS "Public can read clients by token" ON clients
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can update client status" ON clients
  FOR UPDATE USING (true);

-- Journey pages: Public access for client journey flows
CREATE POLICY IF NOT EXISTS "Public can read journey pages" ON journey_pages
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can update journey pages" ON journey_pages
  FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert journey pages" ON journey_pages
  FOR INSERT WITH CHECK (true);

-- Content versions: Public read access
CREATE POLICY IF NOT EXISTS "Public can read content versions" ON journey_content_versions
  FOR SELECT USING (true);

-- Activation content: Public read access
CREATE POLICY IF NOT EXISTS "Public can read activation content" ON activation_content
  FOR SELECT USING (true);

-- Payment sessions: Public access for payment flows
CREATE POLICY IF NOT EXISTS "Public can read payment sessions" ON payment_sessions
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert payment sessions" ON payment_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Public can update payment sessions" ON payment_sessions
  FOR UPDATE USING (true);

-- Payment events: Insert-only for webhooks
CREATE POLICY IF NOT EXISTS "Public can insert payment events" ON payment_events
  FOR INSERT WITH CHECK (true);

-- Content snapshots: Public access for analytics
CREATE POLICY IF NOT EXISTS "Public can read content snapshots" ON content_snapshots
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert content snapshots" ON content_snapshots
  FOR INSERT WITH CHECK (true);

-- Payment timing analytics: Public access
CREATE POLICY IF NOT EXISTS "Public can read payment timing analytics" ON payment_timing_analytics
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Public can insert payment timing analytics" ON payment_timing_analytics
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 11. VERIFICATION QUERIES
-- =============================================================================

-- Verify all tables were created
DO $$
DECLARE
    tables_created INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_created
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'clients', 'journey_pages', 'journey_content_versions',
        'activation_content', 'payment_sessions', 'payment_events',
        'content_snapshots', 'payment_timing_analytics'
    );
    
    RAISE NOTICE 'Migration complete! Created/verified % tables', tables_created;
    
    IF tables_created < 8 THEN
        RAISE WARNING 'Expected 8 new tables, but only found %. Please check for errors.', tables_created;
    END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- 
-- This migration provides the complete database schema for:
-- 
-- ✅ Client Management (clients table)
-- ✅ Journey Content Management (journey_pages, journey_content_versions)
-- ✅ Payment Processing (payment_sessions, payment_events)  
-- ✅ Revenue Intelligence (content_snapshots, payment_timing_analytics)
-- ✅ A/B Testing Support (content snapshots, versioning)
-- ✅ Analytics & Correlation (timing analytics, pattern insights)
-- 
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Test the complete user flow: Create client → Activate → Pay → Analytics
-- 3. Verify all foreign key relationships are working
-- 4. Update RLS policies as needed for your security requirements
-- 
-- =============================================================================