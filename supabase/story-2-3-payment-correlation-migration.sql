-- Story 2.3 Payment Correlation Migration
-- Adds payment-outcome correlation tracking to Template Genius Revenue Intelligence Engine
-- 
-- This migration:
-- 1. Adds missing Story 2.2 outcome tracking fields to clients table  
-- 2. Creates payment_outcome_correlations table for detailed correlation tracking
-- 3. Adds Story 2.3 correlation fields to clients table
-- 4. Creates performance indexes and constraints
-- 
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- PHASE 1: Add missing Story 2.2 outcome tracking fields to clients table
-- ============================================================================

-- Add Story 2.2 outcome tracking fields (if they don't exist)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS token TEXT,
ADD COLUMN IF NOT EXISTS hypothesis TEXT,
ADD COLUMN IF NOT EXISTS journey_outcome TEXT CHECK (journey_outcome IN ('paid', 'ghosted', 'pending', 'responded')),
ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
ADD COLUMN IF NOT EXISTS outcome_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_timestamp TIMESTAMPTZ;

-- Add unique constraint on token
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_token ON clients(token) WHERE token IS NOT NULL;

-- ============================================================================
-- PHASE 2: Create payment_outcome_correlations table for Story 2.3
-- ============================================================================

-- Create the correlation tracking table
CREATE TABLE IF NOT EXISTS payment_outcome_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe payment references
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  stripe_session_id VARCHAR(255),
  
  -- Client and journey references  
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  journey_id BIGINT, -- References journey_pages when available
  content_version_id UUID, -- References content versions when available
  
  -- Outcome correlation data
  outcome_type VARCHAR(20) NOT NULL CHECK (outcome_type IN ('paid', 'failed', 'pending', 'cancelled')),
  correlation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  conversion_duration INTEGER, -- milliseconds from journey start to outcome
  
  -- Rich metadata storage
  payment_metadata JSONB DEFAULT '{}',
  journey_context JSONB DEFAULT '{}',
  
  -- Manual override capability
  manual_override JSONB, -- Stores admin override details when applicable
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on correlation table
ALTER TABLE payment_outcome_correlations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for correlation table (adjust based on auth requirements)
CREATE POLICY "Allow all operations on payment_outcome_correlations" ON payment_outcome_correlations
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PHASE 3: Add Story 2.3 correlation fields to clients table
-- ============================================================================

-- Add correlation tracking fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS auto_correlation_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_correlation_id UUID REFERENCES payment_outcome_correlations(id),
ADD COLUMN IF NOT EXISTS conversion_duration INTEGER, -- cached for dashboard performance
ADD COLUMN IF NOT EXISTS payment_correlation_count INTEGER DEFAULT 0;

-- ============================================================================
-- PHASE 4: Create performance indexes and constraints
-- ============================================================================

-- Primary lookup indexes for correlation queries
CREATE INDEX IF NOT EXISTS idx_correlations_stripe_payment ON payment_outcome_correlations(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_correlations_client ON payment_outcome_correlations(client_id);
CREATE INDEX IF NOT EXISTS idx_correlations_timestamp ON payment_outcome_correlations(correlation_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_correlations_outcome_type ON payment_outcome_correlations(outcome_type);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_correlations_client_outcome ON payment_outcome_correlations(client_id, outcome_type);
CREATE INDEX IF NOT EXISTS idx_correlations_client_timestamp ON payment_outcome_correlations(client_id, correlation_timestamp DESC);

-- Unique constraint to prevent duplicate correlations per payment intent
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_correlation_per_payment ON payment_outcome_correlations(stripe_payment_intent_id, client_id);

-- Client table indexes for correlation performance
CREATE INDEX IF NOT EXISTS idx_clients_correlation_enabled ON clients(auto_correlation_enabled) WHERE auto_correlation_enabled = true;
CREATE INDEX IF NOT EXISTS idx_clients_last_correlation ON clients(last_correlation_id) WHERE last_correlation_id IS NOT NULL;

-- ============================================================================
-- PHASE 5: Create update trigger for correlation timestamps
-- ============================================================================

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_correlation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamps
DROP TRIGGER IF EXISTS trigger_update_correlation_timestamp ON payment_outcome_correlations;
CREATE TRIGGER trigger_update_correlation_timestamp
  BEFORE UPDATE ON payment_outcome_correlations
  FOR EACH ROW EXECUTE FUNCTION update_correlation_updated_at();

-- ============================================================================
-- PHASE 6: Insert sample correlation data for development/testing
-- ============================================================================

-- Insert sample correlation record for existing mock client
INSERT INTO payment_outcome_correlations (
  stripe_payment_intent_id,
  stripe_session_id,
  client_id,
  outcome_type,
  correlation_timestamp,
  conversion_duration,
  payment_metadata,
  journey_context
) VALUES (
  'pi_sample_test_payment_intent',
  'cs_sample_checkout_session',
  1, -- Assumes client with ID 1 exists (TechCorp Solutions from mock data)
  'paid',
  '2024-01-17T15:00:00Z',
  1800000, -- 30 minutes in milliseconds
  '{
    "amount": 50000,
    "currency": "usd",
    "payment_method": "card",
    "client_token": "G1001",
    "client_id": "1",
    "journey_id": "1",
    "content_version_id": "content_v1_123",
    "journey_start_time": "2024-01-17T14:30:00Z",
    "conversion_duration": 1800000,
    "page_sequence": ["activation", "agreement", "payment"],
    "journey_hypothesis": "John values career advancement and remote flexibility",
    "referrer": "direct",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
  }'::jsonb,
  '{
    "pages_visited": ["activation", "agreement", "payment"],
    "time_on_activation": 600000,
    "time_on_agreement": 900000,
    "payment_method_selected": "card",
    "hypothesis_context": "Premium placement service emphasis on career advancement"
  }'::jsonb
) ON CONFLICT (stripe_payment_intent_id, client_id) DO NOTHING;

-- Update the sample client with correlation data
UPDATE clients 
SET 
  token = 'G1001',
  hypothesis = 'John''s current role lacks growth opportunities and he values work-life balance and remote flexibility. Our premium placement service should emphasize career advancement and flexible work arrangements to drive conversion.',
  journey_outcome = 'paid',
  outcome_notes = 'Payment successful via Stripe. Client completed full journey with strong engagement. Conversion achieved through emphasis on career advancement opportunities.',
  outcome_timestamp = '2024-01-17T15:00:00Z',
  payment_received = true,
  payment_amount = 500.00,
  payment_timestamp = '2024-01-17T15:00:00Z',
  last_correlation_id = (SELECT id FROM payment_outcome_correlations WHERE stripe_payment_intent_id = 'pi_sample_test_payment_intent' LIMIT 1),
  conversion_duration = 1800000,
  payment_correlation_count = 1
WHERE id = 1;

-- ============================================================================
-- VERIFICATION QUERIES (commented out for production)
-- ============================================================================

-- Uncomment these queries to verify the migration:

-- Check clients table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'clients' 
-- ORDER BY ordinal_position;

-- Check correlation table structure  
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'payment_outcome_correlations' 
-- ORDER BY ordinal_position;

-- Verify sample data
-- SELECT c.id, c.company, c.journey_outcome, c.payment_correlation_count, 
--        pc.outcome_type, pc.stripe_payment_intent_id
-- FROM clients c 
-- LEFT JOIN payment_outcome_correlations pc ON c.last_correlation_id = pc.id
-- WHERE c.id = 1;

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('clients', 'payment_outcome_correlations')
-- ORDER BY tablename, indexname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Story 2.3 Payment Correlation Migration completed successfully!
-- 
-- Created:
-- ✓ payment_outcome_correlations table with full correlation tracking
-- ✓ Enhanced clients table with correlation fields
-- ✓ Performance indexes for correlation queries  
-- ✓ RLS policies and constraints
-- ✓ Update triggers for timestamp management
-- ✓ Sample correlation data for development
--
-- Ready for:
-- ✓ Stripe webhook correlation integration
-- ✓ Server action correlation management
-- ✓ UI correlation display and override
-- ✓ Performance monitoring and analytics