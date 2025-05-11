-- Add last_contacted_at column to leads table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'last_contacted_at'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_contacted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added last_contacted_at column to leads table';
  ELSE
    RAISE NOTICE 'last_contacted_at column already exists in leads table';
  END IF;
END
$$;
