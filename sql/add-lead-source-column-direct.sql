-- Add lead_source column to leads table if it doesn't exist
DO $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'lead_source'
  ) THEN
    -- Add the column
    ALTER TABLE leads ADD COLUMN lead_source TEXT;
  END IF;
END $$;
