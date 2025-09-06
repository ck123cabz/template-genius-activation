-- Create test client data for payment integration validation
-- This SQL can be run directly in Supabase SQL editor

-- Insert test client (matching the mock data structure)
INSERT INTO clients (
  id,
  company,
  contact, 
  email,
  position,
  salary,
  hypothesis,
  token,
  status,
  logo,
  journey_outcome,
  outcome_notes,
  outcome_timestamp,
  payment_received,
  payment_amount,
  payment_timestamp,
  payment_status,
  created_at,
  activated_at
) VALUES (
  1,
  'TechCorp Solutions',
  'John Smith', 
  'john@techcorp.com',
  'Senior Software Engineer',
  '$120,000 - $150,000',
  'John''s current role lacks growth opportunities and he values work-life balance and remote flexibility. Our premium placement service should emphasize career advancement and flexible work arrangements to drive conversion.',
  'G1001',
  'pending',
  '/techcorp-logo.png',
  'responded',
  'Client responded positively to proposal and requested additional information about timeline. Showing strong interest in premium service package.',
  '2024-01-17T14:30:00Z',
  false,
  null,
  null,
  'unpaid',
  '2024-01-15T00:00:00Z',
  null
) ON CONFLICT (id) DO UPDATE SET
  company = EXCLUDED.company,
  contact = EXCLUDED.contact,
  email = EXCLUDED.email,
  position = EXCLUDED.position,
  salary = EXCLUDED.salary,
  hypothesis = EXCLUDED.hypothesis,
  token = EXCLUDED.token,
  status = EXCLUDED.status,
  logo = EXCLUDED.logo,
  journey_outcome = EXCLUDED.journey_outcome,
  outcome_notes = EXCLUDED.outcome_notes,
  outcome_timestamp = EXCLUDED.outcome_timestamp,
  payment_received = EXCLUDED.payment_received,
  payment_amount = EXCLUDED.payment_amount,
  payment_timestamp = EXCLUDED.payment_timestamp,
  payment_status = EXCLUDED.payment_status;

-- Insert additional test clients for comprehensive testing
INSERT INTO clients (
  company,
  contact,
  email,
  position,
  salary,
  hypothesis,
  token,
  status,
  payment_status,
  created_at
) VALUES 
(
  'StartupCo',
  'Jane Doe',
  'jane@startupco.com',
  'Frontend Developer',
  '$90,000 - $110,000',
  'Jane is seeking growth opportunities in a dynamic startup environment with modern tech stack.',
  'G2001',
  'pending',
  'unpaid',
  NOW() - INTERVAL '2 days'
),
(
  'Enterprise Inc',
  'Bob Wilson',
  'bob@enterprise.com',
  'DevOps Engineer',
  '$140,000 - $160,000',
  'Bob values stability and comprehensive benefits package while wanting technical challenges.',
  'G3001',
  'active',
  'unpaid',
  NOW() - INTERVAL '1 day'
),
(
  'ScaleUp LLC',
  'Alice Johnson',
  'alice@scaleup.com',
  'Product Manager',
  '$130,000 - $150,000',
  'Alice is looking for leadership opportunities and equity upside in growing company.',
  'G4001',
  'pending',
  'unpaid',
  NOW()
)
ON CONFLICT (token) DO NOTHING;

-- Verify the inserts
SELECT 
  id,
  company,
  contact,
  token,
  status,
  payment_status,
  created_at
FROM clients 
ORDER BY created_at DESC;