-- Migration to update activation_content table
-- Run this in your Supabase SQL Editor

-- First, check if table exists and drop it if needed to recreate with proper structure
DROP TABLE IF EXISTS activation_content CASCADE;

-- Recreate activation_content table with all required fields
CREATE TABLE activation_content (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  benefits JSONB NOT NULL DEFAULT '[]',
  payment_options JSONB NOT NULL DEFAULT '{}',
  investment_details JSONB NOT NULL DEFAULT '[]',
  guarantee_info JSONB DEFAULT '{}',
  search_period TEXT DEFAULT '14-day priority access',
  activation_fee TEXT DEFAULT '$500',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE activation_content ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on activation_content" ON activation_content
  FOR ALL USING (true) WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activation_content_updated_at ON activation_content(updated_at DESC);

-- Insert default content that matches the expected structure
INSERT INTO activation_content (
  title,
  subtitle,
  benefits,
  payment_options,
  investment_details,
  guarantee_info,
  search_period,
  activation_fee
) VALUES (
  'Activate Your Priority Access',
  'Complete your activation to unlock exclusive opportunities',
  '[
    {
      "title": "Priority Access",
      "description": "Get first access to exclusive opportunities",
      "icon": "star"
    },
    {
      "title": "Expert Network", 
      "description": "Connect with industry leaders and experts",
      "icon": "users"
    }
  ]'::jsonb,
  '{
    "optionA": {
      "title": "One-Time Activation",
      "description": "Single payment to activate your account",
      "fee": "$2,500",
      "details": "",
      "additionalInfo": ""
    },
    "optionB": {
      "title": "Monthly Plan",
      "description": "Spread the cost over 12 months", 
      "fee": "$250/month",
      "details": "",
      "additionalInfo": ""
    }
  }'::jsonb,
  '[
    "Minimum investment starting at $10,000",
    "Diversified portfolio management",
    "Quarterly performance reports"
  ]'::jsonb,
  '{
    "period": "6-month replacement coverage",
    "description": "Free replacement if hired candidate doesn'\''t work out within 6 months"
  }'::jsonb,
  '14-day priority access',
  '$500'
);

-- Also ensure clients table exists
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL,
  salary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'activated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  logo TEXT
);

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy for clients
CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample client data
INSERT INTO clients (company, contact, email, position, salary, status, created_at, activated_at, logo) VALUES
('TechCorp Solutions', 'John Smith', 'john@techcorp.com', 'Senior Software Engineer', '$120,000 - $150,000', 'pending', NOW(), null, '/techcorp-logo.png')
ON CONFLICT (email) DO NOTHING;