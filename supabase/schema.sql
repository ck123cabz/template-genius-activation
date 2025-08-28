-- Create the clients table
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  company TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  position TEXT NOT NULL,
  salary TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'activated')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  logo TEXT
);

-- Create the activation_content table
CREATE TABLE IF NOT EXISTS activation_content (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  benefits JSONB NOT NULL DEFAULT '[]',
  payment_options JSONB NOT NULL DEFAULT '{}',
  investment_details JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_content ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
-- Allow all operations for authenticated users (you can make this more restrictive)
CREATE POLICY "Allow all operations on clients for authenticated users" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow read access for anonymous users (for activation pages)
CREATE POLICY "Allow read access to clients for anonymous users" ON clients
  FOR SELECT USING (true);

-- Create policies for activation_content table
-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations on activation_content for authenticated users" ON activation_content
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow read access for anonymous users (for activation pages)
CREATE POLICY "Allow read access to activation_content for anonymous users" ON activation_content
  FOR SELECT USING (true);

-- Insert default activation content
INSERT INTO activation_content (title, subtitle, benefits, payment_options, investment_details) 
VALUES (
  'Activate Priority Access',
  'Get first access to top talent and enhanced recruitment support',
  '[
    {
      "title": "Priority Talent Access",
      "description": "First look at pre-vetted candidates from our premium pool",
      "icon": "star"
    },
    {
      "title": "Accelerated Timeline",
      "description": "Dedicated 14-day search period with faster results",
      "icon": "clock"
    },
    {
      "title": "Dedicated Support",
      "description": "Personal talent specialist and enhanced screening",
      "icon": "users"
    },
    {
      "title": "Committed Search",
      "description": "Focused 14-day search period for optimal results",
      "icon": "check"
    }
  ]'::jsonb,
  '{
    "optionA": {
      "title": "Traditional Placement",
      "description": "25% placement fee upon successful hire",
      "fee": "$500"
    },
    "optionB": {
      "title": "Monthly Retainer",
      "description": "Monthly retainer acts as placement fee with future buyout option",
      "fee": "$500"
    }
  }'::jsonb,
  '[
    "Your $500 activation fee is fully credited towards your placement fee or first month'\''s retainer",
    "No hidden costs or additional fees during the search process",
    "Transparent pricing with clear value delivery milestones"
  ]'::jsonb
) ON CONFLICT DO NOTHING;

-- Insert sample clients
INSERT INTO clients (company, contact, email, position, salary, status, created_at, activated_at, logo) VALUES
('TechCorp', 'Sarah Johnson', 'sarah@techcorp.com', 'Senior Frontend Developer', '$2,000 - $3,000/month', 'activated', '2024-01-15', '2024-01-16', '/techcorp-logo.png'),
('StartupXYZ', 'Mike Chen', 'mike@startupxyz.com', 'Full Stack Developer', '$3,500 - $5,000/month', 'pending', '2024-01-18', null, '/abstract-startup-logo.png'),
('InnovateLabs', 'Lisa Rodriguez', 'lisa@innovatelabs.com', 'React Developer', '$2,500 - $4,000/month', 'activated', '2024-01-20', '2024-01-21', '/innovate-logo.png')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_activation_content_updated_at ON activation_content(updated_at DESC);