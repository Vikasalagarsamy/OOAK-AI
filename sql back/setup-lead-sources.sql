-- Check if lead_sources table exists, if not create it
CREATE TABLE IF NOT EXISTS lead_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add lead_source_id column to leads table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'lead_source_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN lead_source_id INTEGER REFERENCES lead_sources(id);
    END IF;
END $$;

-- Insert default lead sources if the table is empty
INSERT INTO lead_sources (name, description)
SELECT * FROM (
    VALUES 
    ('Website', 'Leads generated from the company website'),
    ('Referral', 'Leads referred by existing customers or partners'),
    ('Social Media', 'Leads from social media platforms'),
    ('Email Campaign', 'Leads from email marketing campaigns'),
    ('Cold Call', 'Leads from cold calling efforts'),
    ('Trade Show', 'Leads from trade shows and exhibitions'),
    ('Partner', 'Leads from partner organizations'),
    ('Advertisement', 'Leads from paid advertisements'),
    ('Other', 'Other lead sources not categorized')
) AS source_data(name, description)
WHERE NOT EXISTS (SELECT 1 FROM lead_sources LIMIT 1);
