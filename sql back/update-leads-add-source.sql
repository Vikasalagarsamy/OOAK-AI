-- Add lead_source column to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);

-- Create lead_sources table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Insert default lead sources
INSERT INTO lead_sources (name, description)
VALUES 
  ('Website', 'Leads generated through the company website'),
  ('Referral', 'Leads referred by existing customers or partners'),
  ('Social Media', 'Leads from social media platforms'),
  ('Email Campaign', 'Leads from email marketing campaigns'),
  ('Trade Show', 'Leads from trade shows and exhibitions'),
  ('Cold Call', 'Leads from cold calling efforts'),
  ('Advertising', 'Leads from paid advertising'),
  ('Partner', 'Leads from partner organizations'),
  ('Other', 'Leads from other sources')
ON CONFLICT (name) DO NOTHING;
