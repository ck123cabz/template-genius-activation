-- Migration: Add hypothesis and token fields to clients table
-- Story 1.1: Client Creation with Journey Hypothesis Tracking

-- Add hypothesis field (required)
ALTER TABLE clients 
ADD COLUMN hypothesis TEXT NOT NULL DEFAULT '';

-- Add token field with unique constraint
ALTER TABLE clients 
ADD COLUMN token TEXT NOT NULL DEFAULT '';

-- Add unique index on token field
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_token ON clients(token);

-- Update the default value constraint to remove empty strings
ALTER TABLE clients 
ALTER COLUMN hypothesis DROP DEFAULT;

ALTER TABLE clients 
ALTER COLUMN token DROP DEFAULT;

-- Add constraint to ensure hypothesis is not empty
ALTER TABLE clients 
ADD CONSTRAINT chk_clients_hypothesis_not_empty CHECK (length(trim(hypothesis)) > 0);

-- Add constraint to ensure token matches G[4-digit] format
ALTER TABLE clients 
ADD CONSTRAINT chk_clients_token_format CHECK (token ~ '^G[0-9]{4}$');

-- Create index for hypothesis field for potential full-text search
CREATE INDEX IF NOT EXISTS idx_clients_hypothesis ON clients USING gin(to_tsvector('english', hypothesis));