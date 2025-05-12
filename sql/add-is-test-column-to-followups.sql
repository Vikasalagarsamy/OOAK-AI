-- Check if the is_test column exists in the lead_followups table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'lead_followups'
        AND column_name = 'is_test'
    ) THEN
        -- Add the is_test column with a default value of false
        ALTER TABLE lead_followups ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
        
        -- Add an index to improve performance when querying test records
        CREATE INDEX idx_lead_followups_is_test ON lead_followups(is_test);
        
        RAISE NOTICE 'Added is_test column to lead_followups table';
    ELSE
        RAISE NOTICE 'is_test column already exists in lead_followups table';
    END IF;
END $$;
