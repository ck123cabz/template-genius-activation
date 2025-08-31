-- Story 3.3 Content-Payment Correlation Database Migration
-- Extends Story 2.3 payment correlation with content intelligence tracking
-- 
-- This migration:
-- 1. Creates content snapshots table for payment-time content freezing
-- 2. Creates content payment correlations table for performance tracking
-- 3. Creates content variations table for A/B testing
-- 4. Creates payment timing analytics table
-- 5. Adds performance indexes and constraints
-- 
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- PHASE 1: Content Snapshots Table (Task 1)
-- ============================================================================

-- Create table for content snapshots at payment initiation
CREATE TABLE IF NOT EXISTS content_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Payment correlation references
  payment_session_id VARCHAR(255) NOT NULL,
  stripe_session_id VARCHAR(255),
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Content version references
  activation_content_id BIGINT REFERENCES activation_content(id),
  content_version_hash VARCHAR(64), -- SHA256 hash for content comparison
  
  -- Snapshot metadata
  snapshot_timestamp TIMESTAMPTZ DEFAULT NOW(),
  content_last_modified TIMESTAMPTZ NOT NULL,
  
  -- Frozen content data at payment time
  content_data JSONB NOT NULL DEFAULT '{}',
  
  -- Payment timing data
  payment_timing JSONB NOT NULL DEFAULT '{}',
  
  -- Content variation tracking for A/B tests
  content_variation_id UUID, -- References content_variations table
  variation_name VARCHAR(255),
  
  -- Performance metadata
  performance_metrics JSONB DEFAULT '{}',
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on content_snapshots" ON content_snapshots
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASE 2: Content Payment Correlations Table (Task 3)
-- ============================================================================

-- Create comprehensive content-payment correlation tracking
CREATE TABLE IF NOT EXISTS content_payment_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship references
  content_snapshot_id UUID REFERENCES content_snapshots(id) ON DELETE CASCADE NOT NULL,
  payment_correlation_id UUID REFERENCES payment_outcome_correlations(id) ON DELETE CASCADE,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  
  -- Content performance metrics
  correlation_metrics JSONB NOT NULL DEFAULT '{}',
  performance_data JSONB NOT NULL DEFAULT '{}',
  
  -- Time-to-payment analytics
  time_to_payment INTEGER, -- milliseconds from content change to payment
  content_change_timestamp TIMESTAMPTZ,
  payment_completion_timestamp TIMESTAMPTZ,
  
  -- Conversion analysis
  conversion_outcome VARCHAR(20) NOT NULL CHECK (conversion_outcome IN ('succeeded', 'failed', 'abandoned')),
  content_variation VARCHAR(100) DEFAULT 'baseline',
  hypothesis_accuracy DECIMAL(3,2), -- 0.00 to 1.00 score
  
  -- Performance scoring
  content_score DECIMAL(5,2) DEFAULT 0.0,
  comparison_baseline DECIMAL(5,2) DEFAULT 0.0,
  improvement_factor DECIMAL(5,2) DEFAULT 0.0,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_payment_correlations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on content_payment_correlations" ON content_payment_correlations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASE 3: Content Variations Table (Task 4 - A/B Testing)
-- ============================================================================

-- Create A/B testing content variations management
CREATE TABLE IF NOT EXISTS content_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Base content reference
  base_activation_content_id BIGINT REFERENCES activation_content(id) ON DELETE CASCADE NOT NULL,
  
  -- Variation metadata
  variation_name VARCHAR(255) NOT NULL,
  test_hypothesis TEXT,
  variation_description TEXT,
  
  -- Content changes definition
  content_changes JSONB NOT NULL DEFAULT '{}',
  
  -- A/B test configuration
  test_configuration JSONB NOT NULL DEFAULT '{}',
  
  -- Test results and statistics
  results JSONB DEFAULT '{}',
  
  -- Test status and control
  test_status VARCHAR(20) DEFAULT 'draft' CHECK (test_status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  traffic_allocation DECIMAL(3,2) DEFAULT 0.50, -- 0.00 to 1.00
  
  -- Statistical analysis
  sample_size INTEGER DEFAULT 0,
  confidence_level DECIMAL(3,2) DEFAULT 0.95,
  statistical_significance DECIMAL(5,4),
  is_winner BOOLEAN DEFAULT FALSE,
  
  -- Date controls
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255), -- Could reference auth.users in future
  
  CONSTRAINT valid_traffic_allocation CHECK (traffic_allocation >= 0.0 AND traffic_allocation <= 1.0),
  CONSTRAINT valid_confidence_level CHECK (confidence_level >= 0.0 AND confidence_level <= 1.0)
);

-- Enable RLS
ALTER TABLE content_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on content_variations" ON content_variations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASE 4: Payment Timing Analytics Table (Task 2)
-- ============================================================================

-- Create payment timing analytics for content performance
CREATE TABLE IF NOT EXISTS payment_timing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  content_snapshot_id UUID REFERENCES content_snapshots(id) ON DELETE CASCADE,
  payment_correlation_id UUID REFERENCES payment_outcome_correlations(id) ON DELETE CASCADE,
  
  -- Timing measurements (all in milliseconds)
  journey_start_time TIMESTAMPTZ NOT NULL,
  content_last_change_time TIMESTAMPTZ NOT NULL,
  payment_initiation_time TIMESTAMPTZ,
  payment_completion_time TIMESTAMPTZ,
  
  -- Calculated durations
  content_viewing_duration INTEGER, -- time viewing content before payment
  payment_process_duration INTEGER, -- time from payment initiation to completion
  total_journey_duration INTEGER, -- total time from journey start to payment completion
  time_to_payment INTEGER, -- key metric: content change to payment completion
  
  -- Page interaction analytics
  page_interactions JSONB DEFAULT '{}',
  engagement_metrics JSONB DEFAULT '{}',
  
  -- Content performance scoring
  conversion_velocity_score DECIMAL(5,2) DEFAULT 0.0, -- higher is better
  content_effectiveness_score DECIMAL(5,2) DEFAULT 0.0, -- 0-100 scale
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_timing_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on payment_timing_analytics" ON payment_timing_analytics
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASE 5: A/B Test Assignments Table
-- ============================================================================

-- Track A/B test assignments per client
CREATE TABLE IF NOT EXISTS ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Assignment references
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  content_variation_id UUID REFERENCES content_variations(id) ON DELETE CASCADE NOT NULL,
  
  -- Assignment metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assignment_method VARCHAR(50) DEFAULT 'random', -- 'random', 'manual', 'targeted'
  
  -- Tracking data
  impressions INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  converted BOOLEAN DEFAULT FALSE,
  conversion_timestamp TIMESTAMPTZ,
  
  -- Performance metrics
  engagement_score DECIMAL(5,2) DEFAULT 0.0,
  time_on_page INTEGER, -- milliseconds
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on ab_test_assignments" ON ab_test_assignments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASE 6: Performance Indexes
-- ============================================================================

-- Content Snapshots Indexes
CREATE INDEX IF NOT EXISTS idx_content_snapshots_payment_session ON content_snapshots(payment_session_id);
CREATE INDEX IF NOT EXISTS idx_content_snapshots_client ON content_snapshots(client_id);
CREATE INDEX IF NOT EXISTS idx_content_snapshots_timestamp ON content_snapshots(snapshot_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_content_snapshots_variation ON content_snapshots(content_variation_id) WHERE content_variation_id IS NOT NULL;

-- Content Payment Correlations Indexes
CREATE INDEX IF NOT EXISTS idx_content_correlations_snapshot ON content_payment_correlations(content_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_content_correlations_client ON content_payment_correlations(client_id);
CREATE INDEX IF NOT EXISTS idx_content_correlations_outcome ON content_payment_correlations(conversion_outcome);
CREATE INDEX IF NOT EXISTS idx_content_correlations_time_to_payment ON content_payment_correlations(time_to_payment);
CREATE INDEX IF NOT EXISTS idx_content_correlations_score ON content_payment_correlations(content_score DESC);

-- Content Variations Indexes
CREATE INDEX IF NOT EXISTS idx_content_variations_base ON content_variations(base_activation_content_id);
CREATE INDEX IF NOT EXISTS idx_content_variations_status ON content_variations(test_status);
CREATE INDEX IF NOT EXISTS idx_content_variations_active ON content_variations(start_date, end_date) WHERE test_status = 'active';
CREATE INDEX IF NOT EXISTS idx_content_variations_winner ON content_variations(is_winner) WHERE is_winner = TRUE;

-- Payment Timing Analytics Indexes
CREATE INDEX IF NOT EXISTS idx_timing_analytics_client ON payment_timing_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_timing_analytics_content_snapshot ON payment_timing_analytics(content_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_timing_analytics_time_to_payment ON payment_timing_analytics(time_to_payment);
CREATE INDEX IF NOT EXISTS idx_timing_analytics_journey_start ON payment_timing_analytics(journey_start_time DESC);

-- A/B Test Assignments Indexes
CREATE INDEX IF NOT EXISTS idx_ab_assignments_client ON ab_test_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_variation ON ab_test_assignments(content_variation_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_converted ON ab_test_assignments(converted, conversion_timestamp) WHERE converted = TRUE;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_content_correlations_client_outcome_time ON content_payment_correlations(client_id, conversion_outcome, time_to_payment);
CREATE INDEX IF NOT EXISTS idx_content_snapshots_client_timestamp ON content_snapshots(client_id, snapshot_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_timing_analytics_client_time ON payment_timing_analytics(client_id, time_to_payment);

-- ============================================================================
-- PHASE 7: Update Triggers
-- ============================================================================

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_content_correlation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER trigger_update_content_snapshots_timestamp
  BEFORE UPDATE ON content_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_content_correlation_updated_at();

CREATE TRIGGER trigger_update_content_correlations_timestamp
  BEFORE UPDATE ON content_payment_correlations
  FOR EACH ROW EXECUTE FUNCTION update_content_correlation_updated_at();

CREATE TRIGGER trigger_update_content_variations_timestamp
  BEFORE UPDATE ON content_variations
  FOR EACH ROW EXECUTE FUNCTION update_content_correlation_updated_at();

CREATE TRIGGER trigger_update_timing_analytics_timestamp
  BEFORE UPDATE ON payment_timing_analytics
  FOR EACH ROW EXECUTE FUNCTION update_content_correlation_updated_at();

CREATE TRIGGER trigger_update_ab_assignments_timestamp
  BEFORE UPDATE ON ab_test_assignments
  FOR EACH ROW EXECUTE FUNCTION update_content_correlation_updated_at();

-- ============================================================================
-- PHASE 8: Sample Data for Development
-- ============================================================================

-- Insert sample content variation for A/B testing
INSERT INTO content_variations (
  base_activation_content_id,
  variation_name,
  test_hypothesis,
  variation_description,
  content_changes,
  test_configuration,
  test_status,
  traffic_allocation,
  start_date,
  end_date
) VALUES (
  (SELECT id FROM activation_content ORDER BY updated_at DESC LIMIT 1),
  'Career Advancement Focus',
  'Emphasizing career advancement opportunities will increase conversion rates by 15%',
  'Modified activation page to emphasize career growth, leadership development, and advancement opportunities',
  '{
    "title": "Unlock Your Executive Career Potential",
    "subtitle": "Fast-track your journey to senior leadership with our executive placement network",
    "benefits": [
      {"title": "Executive-Level Opportunities", "description": "Access to C-suite, VP, and director positions not publicly advertised", "icon": "crown"},
      {"title": "Career Acceleration", "description": "Skip years of traditional networking with direct access to decision makers", "icon": "trending-up"},
      {"title": "Leadership Development", "description": "Strategic guidance for transitioning to executive leadership roles", "icon": "users"}
    ]
  }'::jsonb,
  '{
    "target_sample_size": 100,
    "significance_threshold": 0.05,
    "min_runtime_days": 14,
    "max_runtime_days": 60,
    "success_metric": "conversion_rate",
    "secondary_metrics": ["time_to_payment", "engagement_score"]
  }'::jsonb,
  'active',
  0.50,
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '30 days'
) ON CONFLICT DO NOTHING;

-- Insert sample content snapshot
INSERT INTO content_snapshots (
  payment_session_id,
  stripe_session_id,
  client_id,
  activation_content_id,
  content_version_hash,
  snapshot_timestamp,
  content_last_modified,
  content_data,
  payment_timing,
  content_variation_id,
  variation_name
) VALUES (
  'cs_sample_session_123',
  'cs_sample_stripe_session_123',
  1,
  (SELECT id FROM activation_content ORDER BY updated_at DESC LIMIT 1),
  'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '2 hours',
  '{
    "title": "Unlock Your Executive Career Potential",
    "subtitle": "Fast-track your journey to senior leadership with our executive placement network",
    "benefits": [
      {"title": "Executive-Level Opportunities", "description": "Access to C-suite, VP, and director positions not publicly advertised", "icon": "crown"},
      {"title": "Career Acceleration", "description": "Skip years of traditional networking with direct access to decision makers", "icon": "trending-up"},
      {"title": "Leadership Development", "description": "Strategic guidance for transitioning to executive leadership roles", "icon": "users"}
    ],
    "payment_options": {
      "optionA": {"title": "Priority Access", "description": "14-day executive search activation", "fee": "$500"}
    },
    "hypothesis": "Career advancement focus will resonate with senior professionals"
  }'::jsonb,
  '{
    "content_last_modified": "' || (NOW() - INTERVAL '2 hours')::text || '",
    "payment_initiated": "' || (NOW() - INTERVAL '1 hour')::text || '",
    "time_to_payment": 3600000
  }'::jsonb,
  (SELECT id FROM content_variations WHERE variation_name = 'Career Advancement Focus' LIMIT 1),
  'Career Advancement Focus'
) ON CONFLICT DO NOTHING;

-- Insert sample payment timing analytics
INSERT INTO payment_timing_analytics (
  client_id,
  content_snapshot_id,
  journey_start_time,
  content_last_change_time,
  payment_initiation_time,
  payment_completion_time,
  content_viewing_duration,
  payment_process_duration,
  total_journey_duration,
  time_to_payment,
  page_interactions,
  engagement_metrics,
  conversion_velocity_score,
  content_effectiveness_score
) VALUES (
  1,
  (SELECT id FROM content_snapshots WHERE payment_session_id = 'cs_sample_session_123' LIMIT 1),
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '30 minutes',
  7200000, -- 2 hours viewing content
  1800000, -- 30 minutes payment process
  10800000, -- 3 hours total journey
  3600000, -- 1 hour from content change to payment
  '{
    "page_views": 3,
    "scroll_depth": 0.85,
    "time_on_activation": 4800000,
    "time_on_agreement": 2400000,
    "clicks": 7,
    "form_interactions": 2
  }'::jsonb,
  '{
    "engagement_score": 87.5,
    "attention_span": "high",
    "interaction_quality": "strong",
    "decision_confidence": 0.92
  }'::jsonb,
  92.5,
  88.3
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- PHASE 9: Verification Queries (for development)
-- ============================================================================

-- Verify table creation
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('content_snapshots', 'content_payment_correlations', 'content_variations', 'payment_timing_analytics', 'ab_test_assignments')
-- ORDER BY table_name, ordinal_position;

-- Verify sample data
-- SELECT 
--   cs.payment_session_id,
--   cv.variation_name,
--   pta.time_to_payment,
--   pta.conversion_velocity_score
-- FROM content_snapshots cs
-- LEFT JOIN content_variations cv ON cs.content_variation_id = cv.id
-- LEFT JOIN payment_timing_analytics pta ON cs.id = pta.content_snapshot_id;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Story 3.3 Content-Payment Correlation Migration completed successfully!
-- 
-- Created:
-- ✓ content_snapshots table for payment-time content freezing
-- ✓ content_payment_correlations table for performance tracking  
-- ✓ content_variations table for A/B testing management
-- ✓ payment_timing_analytics table for timing analysis
-- ✓ ab_test_assignments table for A/B test tracking
-- ✓ Performance indexes for all correlation queries
-- ✓ RLS policies and constraints
-- ✓ Update triggers for timestamp management
-- ✓ Sample data for development and testing
--
-- Ready for:
-- ✓ Content snapshot creation at payment initiation
-- ✓ A/B testing workflow and assignment
-- ✓ Content performance analytics and optimization
-- ✓ Time-to-payment correlation tracking
-- ✓ Content recommendation engine development