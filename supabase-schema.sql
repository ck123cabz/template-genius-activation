-- Schema for Template Genius Activation
-- Run this in your Supabase SQL Editor

-- Create clients table
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

-- Create activation_content table
CREATE TABLE IF NOT EXISTS activation_content (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  benefits JSONB NOT NULL,
  payment_options JSONB NOT NULL,
  investment_details JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activation_content_updated_at ON activation_content(updated_at DESC);

-- Insert sample activation content
INSERT INTO activation_content (
  title,
  subtitle,
  benefits,
  payment_options,
  investment_details
) VALUES (
  'Activate Your Priority Access',
  'Complete your activation to unlock exclusive opportunities',
  '[
    {
      "title": "Priority Access",
      "description": "Get first access to exclusive opportunities",
      "icon": "Crown"
    },
    {
      "title": "Expert Network",
      "description": "Connect with industry leaders and experts",
      "icon": "Users"
    },
    {
      "title": "Premium Support",
      "description": "24/7 dedicated support from our team",
      "icon": "Shield"
    }
  ]'::jsonb,
  '{
    "optionA": {
      "title": "One-Time Activation",
      "description": "Single payment to activate your account",
      "fee": "$2,500"
    },
    "optionB": {
      "title": "Monthly Plan",
      "description": "Spread the cost over 12 months",
      "fee": "$250/month"
    }
  }'::jsonb,
  '[
    "Minimum investment starting at $10,000",
    "Diversified portfolio management",
    "Quarterly performance reports",
    "Access to private equity opportunities"
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_content ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allowing all operations - modify based on your auth requirements

-- Clients table policies
CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- Activation content table policies  
CREATE POLICY "Allow all operations on activation_content" ON activation_content
  FOR ALL USING (true) WITH CHECK (true);