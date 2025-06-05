-- Check if the table exists first
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        -- Check if the lead_time column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'suppliers' AND column_name = 'lead_time') THEN
            -- Add the missing column
            ALTER TABLE suppliers ADD COLUMN lead_time VARCHAR(100);
        END IF;
    END IF;
END $$;
