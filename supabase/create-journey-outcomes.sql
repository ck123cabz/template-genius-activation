-- Migration: Create journey_outcomes table for Story 2.2
-- Story 2.2: Journey Outcome Marking System  
-- Epic 2: Learning Capture System

-- Add outcome tracking fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS journey_outcome VARCHAR(20) CHECK (journey_outcome IN ('paid', 'ghosted', 'pending', 'negotiating', 'declined')) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS outcome_recorded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS outcome_notes TEXT,
ADD COLUMN IF NOT EXISTS revenue_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS outcome_recorded_by TEXT;

-- Create journey_outcomes table for detailed outcome tracking and correlation
CREATE TABLE IF NOT EXISTS journey_outcomes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  journey_outcome VARCHAR(20) NOT NULL CHECK (journey_outcome IN ('paid', 'ghosted', 'pending', 'negotiating', 'declined')),
  outcome_notes TEXT,
  revenue_amount DECIMAL(10,2),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recorded_by TEXT, -- Admin user identifier
  
  -- Journey correlation data
  journey_duration_days INTEGER,
  pages_viewed INTEGER DEFAULT 0,
  last_page_viewed VARCHAR(50),
  conversion_funnel_data JSONB DEFAULT '{}',
  
  -- Hypothesis correlation (link to client's initial hypothesis)
  original_hypothesis TEXT, -- Copy from clients.hypothesis at time of outcome
  hypothesis_accuracy VARCHAR(20) CHECK (hypothesis_accuracy IN ('accurate', 'partially_accurate', 'inaccurate', 'unknown')) DEFAULT 'unknown',
  
  -- Content hypothesis correlation (link to content_hypotheses if any changes were made)
  content_hypothesis_ids INTEGER[],
  content_changes_impact JSONB DEFAULT '{}',
  
  -- Learning metadata
  conversion_factors TEXT, -- What drove the outcome
  missed_opportunities TEXT, -- What could have been improved
  next_time_improvements TEXT, -- Learnings for future clients
  confidence_in_analysis INTEGER CHECK (confidence_in_analysis BETWEEN 1 AND 10),
  
  -- Metadata for analysis
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_journey_outcomes_client_id 
ON journey_outcomes(client_id);

CREATE INDEX IF NOT EXISTS idx_journey_outcomes_recorded_at 
ON journey_outcomes(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_journey_outcomes_journey_outcome 
ON journey_outcomes(journey_outcome);

CREATE INDEX IF NOT EXISTS idx_journey_outcomes_revenue 
ON journey_outcomes(revenue_amount DESC) WHERE revenue_amount IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_journey_outcome 
ON clients(journey_outcome);

CREATE INDEX IF NOT EXISTS idx_clients_outcome_recorded_at 
ON clients(outcome_recorded_at DESC) WHERE outcome_recorded_at IS NOT NULL;

-- Add trigger to sync client outcome with journey_outcomes table
CREATE OR REPLACE FUNCTION sync_client_outcome()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the clients table when a new outcome is recorded
    UPDATE clients 
    SET 
        journey_outcome = NEW.journey_outcome,
        outcome_recorded_at = NEW.recorded_at,
        outcome_notes = NEW.outcome_notes,
        revenue_amount = NEW.revenue_amount,
        outcome_recorded_by = NEW.recorded_by
    WHERE id = NEW.client_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER journey_outcomes_sync_trigger
    AFTER INSERT ON journey_outcomes
    FOR EACH ROW
    EXECUTE FUNCTION sync_client_outcome();

-- Function to calculate journey duration
CREATE OR REPLACE FUNCTION calculate_journey_duration(client_id_param INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT EXTRACT(DAY FROM (NOW() - created_at))::INTEGER
        FROM clients 
        WHERE id = client_id_param
    );
END;
$$ LANGUAGE 'plpgsql';

-- Enable Row Level Security
ALTER TABLE journey_outcomes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all operations for authenticated users (admins)
CREATE POLICY "Allow all operations on journey_outcomes for authenticated users" ON journey_outcomes
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow read access for service role (for internal operations)
CREATE POLICY "Allow all operations on journey_outcomes for service role" ON journey_outcomes
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE journey_outcomes IS 'Tracks journey outcomes (paid/ghosted) and correlates with hypotheses for learning';
COMMENT ON COLUMN journey_outcomes.client_id IS 'References the client whose journey outcome is being tracked';
COMMENT ON COLUMN journey_outcomes.journey_outcome IS 'Final outcome of the client journey: paid, ghosted, pending, negotiating, or declined';
COMMENT ON COLUMN journey_outcomes.revenue_amount IS 'Revenue generated if outcome was paid';
COMMENT ON COLUMN journey_outcomes.original_hypothesis IS 'Copy of client hypothesis at time of outcome for correlation';
COMMENT ON COLUMN journey_outcomes.hypothesis_accuracy IS 'Assessment of how accurate the original hypothesis was';
COMMENT ON COLUMN journey_outcomes.content_hypothesis_ids IS 'Array of content_hypotheses.id that were tested during this journey';
COMMENT ON COLUMN journey_outcomes.conversion_factors IS 'Analysis of what factors led to conversion or loss';
COMMENT ON COLUMN journey_outcomes.confidence_in_analysis IS 'Confidence level in the outcome analysis (1-10 scale)';

-- Create view for outcome analytics
CREATE OR REPLACE VIEW journey_outcome_analytics AS
SELECT 
    jo.journey_outcome,
    COUNT(*) as outcome_count,
    AVG(jo.revenue_amount) as avg_revenue,
    SUM(jo.revenue_amount) as total_revenue,
    AVG(jo.journey_duration_days) as avg_journey_duration,
    AVG(jo.pages_viewed) as avg_pages_viewed,
    COUNT(CASE WHEN jo.hypothesis_accuracy = 'accurate' THEN 1 END) as accurate_hypotheses,
    COUNT(CASE WHEN jo.hypothesis_accuracy = 'inaccurate' THEN 1 END) as inaccurate_hypotheses,
    AVG(jo.confidence_in_analysis) as avg_confidence
FROM journey_outcomes jo
GROUP BY jo.journey_outcome
ORDER BY outcome_count DESC;

-- Create view for hypothesis accuracy analysis
CREATE OR REPLACE VIEW hypothesis_accuracy_analysis AS
SELECT 
    c.hypothesis,
    jo.hypothesis_accuracy,
    jo.journey_outcome,
    COUNT(*) as occurrence_count,
    AVG(jo.revenue_amount) as avg_revenue,
    AVG(jo.journey_duration_days) as avg_duration
FROM journey_outcomes jo
JOIN clients c ON jo.client_id = c.id
WHERE jo.hypothesis_accuracy != 'unknown'
GROUP BY c.hypothesis, jo.hypothesis_accuracy, jo.journey_outcome
ORDER BY occurrence_count DESC;

COMMENT ON VIEW journey_outcome_analytics IS 'Analytics view for understanding journey outcomes and performance';
COMMENT ON VIEW hypothesis_accuracy_analysis IS 'Analysis view for evaluating hypothesis accuracy across different outcomes';