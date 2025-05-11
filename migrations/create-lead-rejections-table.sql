-- Create lead_rejections table to store rejection information
CREATE TABLE IF NOT EXISTS lead_rejections (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  rejected_by INTEGER REFERENCES employees(id),
  rejected_from_company_id INTEGER REFERENCES companies(id),
  rejected_from_branch_id INTEGER REFERENCES branches(id),
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_rejections_lead_id ON lead_rejections(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_rejections_rejected_by ON lead_rejections(rejected_by);
CREATE INDEX IF NOT EXISTS idx_lead_rejections_rejected_at ON lead_rejections(rejected_at);

-- Add new columns to leads table for rejection tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES employees(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_from_company_id INTEGER REFERENCES companies(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS rejected_from_branch_id INTEGER REFERENCES branches(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS reassigned_by INTEGER REFERENCES employees(id);

-- Add comment to explain the purpose of the table
COMMENT ON TABLE lead_rejections IS 'Stores information about rejected leads, including the reason for rejection and who rejected it';
