-- Add default constraint to is_active column in lead_sources table
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'lead_sources'
  ) THEN
    -- Check if the column exists
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'lead_sources' AND column_name = 'is_active'
    ) THEN
      -- Check if the default constraint already exists
      IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'lead_sources' 
        AND column_name = 'is_active'
        AND column_default = 'true'
      ) THEN
        -- Add the default constraint
        ALTER TABLE lead_sources ALTER COLUMN is_active SET DEFAULT true;
        RAISE NOTICE 'Default constraint added to is_active column in lead_sources table';
      ELSE
        RAISE NOTICE 'Default constraint already exists on is_active column in lead_sources table';
      END IF;
    ELSE
      RAISE NOTICE 'is_active column does not exist in lead_sources table';
    END IF;
  ELSE
    RAISE NOTICE 'lead_sources table does not exist';
  END IF;
END $$;
