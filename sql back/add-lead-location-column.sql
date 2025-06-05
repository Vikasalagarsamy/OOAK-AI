-- Check if location column exists in leads table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'location'
    ) THEN
        -- Add location column if it doesn't exist
        ALTER TABLE leads ADD COLUMN location VARCHAR(255);
        
        -- Update existing leads with location from their branch
        UPDATE leads l
        SET location = b.address
        FROM branches b
        WHERE l.branch_id = b.id AND b.address IS NOT NULL;
        
        -- For leads in Chennai branches, explicitly set location
        UPDATE leads l
        SET location = 'Chennai'
        FROM branches b
        WHERE l.branch_id = b.id AND (
            b.address ILIKE '%chennai%' OR 
            b.name ILIKE '%chennai%'
        );
    END IF;
END $$;

-- Verify the column exists and show sample data
SELECT id, lead_number, client_name, location 
FROM leads 
WHERE location IS NOT NULL
LIMIT 10;
