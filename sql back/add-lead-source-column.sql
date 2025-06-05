-- Check if leads table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'leads'
  ) THEN
    -- Check if lead_source column exists in leads table
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'lead_source'
    ) THEN
      -- Add lead_source column to leads table
      ALTER TABLE leads ADD COLUMN lead_source VARCHAR(100);
    END IF;
  END IF;
END $$;
