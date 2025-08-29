-- Migration: Create journey_pages table for multi-page journey system
-- Story 1.2: Multi-Page Journey Infrastructure
-- Builds on Story 1.1 client creation with hypothesis tracking

-- Create journey_pages table
CREATE TABLE IF NOT EXISTS journey_pages (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  page_type VARCHAR(20) NOT NULL CHECK (page_type IN ('activation', 'agreement', 'confirmation', 'processing')),
  page_order INTEGER NOT NULL CHECK (page_order BETWEEN 1 AND 4),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create unique constraint to prevent duplicate page types per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_pages_client_page_type 
ON journey_pages(client_id, page_type);

-- Create unique constraint to prevent duplicate page orders per client
CREATE UNIQUE INDEX IF NOT EXISTS idx_journey_pages_client_order 
ON journey_pages(client_id, page_order);

-- Create index for efficient querying by client
CREATE INDEX IF NOT EXISTS idx_journey_pages_client_id 
ON journey_pages(client_id);

-- Create index for querying by status
CREATE INDEX IF NOT EXISTS idx_journey_pages_status 
ON journey_pages(status);

-- Create index for ordering pages
CREATE INDEX IF NOT EXISTS idx_journey_pages_order 
ON journey_pages(client_id, page_order);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journey_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journey_pages_updated_at_trigger
    BEFORE UPDATE ON journey_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_journey_pages_updated_at();

-- Insert default journey page templates (these will be used when creating clients)
-- Note: These are templates, actual pages will be created per client
INSERT INTO journey_pages (client_id, page_type, page_order, title, content, status) VALUES 
-- Template entries (client_id = 0 for templates, will be filtered out in queries)
(0, 'activation', 1, 'Welcome to Template Genius', 'Begin your personalized template journey with us.', 'pending'),
(0, 'agreement', 2, 'Service Agreement', 'Review and accept our service terms and your project scope.', 'pending'),
(0, 'confirmation', 3, 'Project Confirmation', 'Confirm your project details and timeline.', 'pending'),
(0, 'processing', 4, 'Processing Your Request', 'We are preparing your custom templates.', 'pending');

COMMENT ON TABLE journey_pages IS 'Tracks the 4-page journey system for each client (activation, agreement, confirmation, processing)';
COMMENT ON COLUMN journey_pages.client_id IS 'References the client this journey page belongs to';
COMMENT ON COLUMN journey_pages.page_type IS 'Type of page: activation, agreement, confirmation, or processing';
COMMENT ON COLUMN journey_pages.page_order IS 'Order of page in journey (1-4)';
COMMENT ON COLUMN journey_pages.status IS 'Current status: pending, active, completed, or skipped';
COMMENT ON COLUMN journey_pages.metadata IS 'JSON metadata for page-specific configuration and tracking';