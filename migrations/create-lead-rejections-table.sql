-- Create lead_rejections table to store rejection information
CREATE TABLE IF NOT EXISTS lead_rejections (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  rejected_by VARCHAR(255) NOT NULL,
  rejected_from_company_id INTEGER NOT NULL REFERENCES companies(id),
  rejected_from_branch_id INTEGER REFERENCES branches(id),
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS lead_rejections_lead_id_idx ON lead_rejections(lead_id);
CREATE INDEX IF NOT EXISTS lead_rejections_rejected_by_idx ON lead_rejections(rejected_by);
CREATE INDEX IF NOT EXISTS lead_rejections_rejected_from_company_id_idx ON lead_rejections(rejected_from_company_id);

-- Add comment to table
COMMENT ON TABLE lead_rejections IS 'Stores information about rejected leads including the reason for rejection';
