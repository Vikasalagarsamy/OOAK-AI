-- Add missing columns to leads table that APIs expect
-- This migration adds fields for better lead management and tracking

-- Add priority column for lead prioritization
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add expected_value column for lead value tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS expected_value DECIMAL(15, 2) DEFAULT 0;

-- Add last_contact_date column for tracking last interaction
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS last_contact_date TIMESTAMP;

-- Add next_follow_up_date column for scheduling follow-ups
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMP;

-- Add lead_source_id column for better lead source tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_source_id INTEGER;

-- Add conversion_stage column for tracking lead progression
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS conversion_stage VARCHAR(50) DEFAULT 'new' 
CHECK (conversion_stage IN ('new', 'contacted', 'interested', 'quotation_sent', 'negotiation', 'won', 'lost'));

-- Add lead_score column for AI-based lead scoring
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 50 
CHECK (lead_score >= 0 AND lead_score <= 100);

-- Add tags column for categorizing leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add budget_range column for lead qualification
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS budget_range VARCHAR(50);

-- Add wedding_date column for wedding-specific leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS wedding_date DATE;

-- Add venue_preference column for event planning
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS venue_preference TEXT;

-- Add guest_count column for capacity planning
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS guest_count INTEGER;

-- Add description column for detailed lead information
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add rejection_reason column for tracking why leads were rejected
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add rejection_date column for tracking when leads were rejected
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS rejection_date TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_expected_value ON leads(expected_value);
CREATE INDEX IF NOT EXISTS idx_leads_last_contact_date ON leads(last_contact_date);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up_date ON leads(next_follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_conversion_stage ON leads(conversion_stage);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_wedding_date ON leads(wedding_date);

-- Update existing leads with default values based on current status
UPDATE leads 
SET 
    priority = CASE 
        WHEN status = 'NEW' THEN 'high'
        WHEN status = 'CONTACTED' THEN 'medium'
        ELSE 'low'
    END,
    conversion_stage = CASE 
        WHEN status = 'NEW' THEN 'new'
        WHEN status = 'CONTACTED' THEN 'contacted'
        WHEN status = 'QUALIFIED' THEN 'interested'
        ELSE 'new'
    END,
    lead_score = CASE 
        WHEN status = 'QUALIFIED' THEN 80
        WHEN status = 'CONTACTED' THEN 60
        WHEN status = 'NEW' THEN 40
        ELSE 30
    END
WHERE priority IS NULL OR conversion_stage IS NULL OR lead_score IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN leads.priority IS 'Lead priority level: low, medium, high, urgent';
COMMENT ON COLUMN leads.expected_value IS 'Expected monetary value of the lead';
COMMENT ON COLUMN leads.last_contact_date IS 'Date of last contact with the lead';
COMMENT ON COLUMN leads.next_follow_up_date IS 'Scheduled date for next follow-up';
COMMENT ON COLUMN leads.lead_source_id IS 'Reference to lead_sources table';
COMMENT ON COLUMN leads.conversion_stage IS 'Current stage in the conversion funnel';
COMMENT ON COLUMN leads.lead_score IS 'AI-calculated lead score (0-100)';
COMMENT ON COLUMN leads.tags IS 'Array of tags for lead categorization';
COMMENT ON COLUMN leads.budget_range IS 'Client budget range (e.g., 50k-100k)';
COMMENT ON COLUMN leads.wedding_date IS 'Wedding date for wedding-related leads';
COMMENT ON COLUMN leads.venue_preference IS 'Preferred venue or location';
COMMENT ON COLUMN leads.guest_count IS 'Expected number of guests';
COMMENT ON COLUMN leads.description IS 'Detailed description of lead requirements';
COMMENT ON COLUMN leads.rejection_reason IS 'Reason for lead rejection';
COMMENT ON COLUMN leads.rejection_date IS 'Date when lead was rejected';

-- Log the migration
INSERT INTO migration_log (migration_name, executed_at, description) 
VALUES (
    'add_missing_leads_columns', 
    NOW(), 
    'Added priority, expected_value, contact dates, conversion_stage, lead_score, and other missing columns to leads table'
) ON CONFLICT DO NOTHING; 