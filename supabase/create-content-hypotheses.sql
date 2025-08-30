-- Migration: Create content_hypotheses table for Story 2.1
-- Story 2.1: Pre-Edit Hypothesis Capture Interface
-- Epic 2: Learning Capture System

-- Create content_hypotheses table for dedicated hypothesis tracking
CREATE TABLE IF NOT EXISTS content_hypotheses (
  id SERIAL PRIMARY KEY,
  journey_page_id INTEGER NOT NULL REFERENCES journey_pages(id) ON DELETE CASCADE,
  hypothesis TEXT NOT NULL,
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('content', 'title', 'both', 'structure')),
  predicted_outcome TEXT,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
  previous_content TEXT,
  new_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT, -- Admin user identifier
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'validated', 'invalidated', 'pending')),
  outcome_recorded_at TIMESTAMP WITH TIME ZONE,
  actual_outcome TEXT,
  conversion_impact JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_content_hypotheses_journey_page 
ON content_hypotheses(journey_page_id);

CREATE INDEX IF NOT EXISTS idx_content_hypotheses_created_at 
ON content_hypotheses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_hypotheses_status 
ON content_hypotheses(status);

CREATE INDEX IF NOT EXISTS idx_content_hypotheses_change_type 
ON content_hypotheses(change_type);

-- Add trigger to update journey_pages metadata when hypothesis is created
CREATE OR REPLACE FUNCTION update_journey_page_hypothesis_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE journey_pages 
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'),
            '{hypothesis_count}',
            COALESCE((metadata->>'hypothesis_count')::integer, 0) + 1
        )
        WHERE id = NEW.journey_page_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE journey_pages 
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'),
            '{hypothesis_count}',
            GREATEST(COALESCE((metadata->>'hypothesis_count')::integer, 0) - 1, 0)
        )
        WHERE id = OLD.journey_page_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER content_hypotheses_count_trigger
    AFTER INSERT OR DELETE ON content_hypotheses
    FOR EACH ROW
    EXECUTE FUNCTION update_journey_page_hypothesis_count();

-- Enable Row Level Security
ALTER TABLE content_hypotheses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all operations for authenticated users (admins)
CREATE POLICY "Allow all operations on content_hypotheses for authenticated users" ON content_hypotheses
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow read access for service role (for internal operations)
CREATE POLICY "Allow all operations on content_hypotheses for service role" ON content_hypotheses
  FOR ALL USING (auth.role() = 'service_role');

-- Add comments for documentation
COMMENT ON TABLE content_hypotheses IS 'Tracks hypotheses made before editing journey page content for learning and optimization';
COMMENT ON COLUMN content_hypotheses.journey_page_id IS 'References the journey page being edited';
COMMENT ON COLUMN content_hypotheses.hypothesis IS 'The hypothesis about why this change will improve conversion';
COMMENT ON COLUMN content_hypotheses.change_type IS 'Type of change being made: content, title, both, or structure';
COMMENT ON COLUMN content_hypotheses.predicted_outcome IS 'Expected outcome from this change';
COMMENT ON COLUMN content_hypotheses.confidence_level IS 'Confidence level in hypothesis (1-10 scale)';
COMMENT ON COLUMN content_hypotheses.previous_content IS 'Content before the change for comparison';
COMMENT ON COLUMN content_hypotheses.new_content IS 'New content being implemented';
COMMENT ON COLUMN content_hypotheses.conversion_impact IS 'JSON data about actual conversion impact when measured';
COMMENT ON COLUMN content_hypotheses.metadata IS 'Additional tracking data for hypothesis analysis';