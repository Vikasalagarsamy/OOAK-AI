-- Migration script to add rejection-related columns to the leads table
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if rejection_reason column already exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'rejection_reason'
  ) INTO column_exists;

  IF NOT column_exists THEN
    -- Add rejection_reason column
    ALTER TABLE leads ADD COLUMN rejection_reason TEXT;
    RAISE NOTICE 'Added rejection_reason column to leads table';
  ELSE
    RAISE NOTICE 'rejection_reason column already exists in leads table';
  END IF;

  -- Check if rejected_at column already exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'rejected_at'
  ) INTO column_exists;

  IF NOT column_exists THEN
    -- Add rejected_at column
    ALTER TABLE leads ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added rejected_at column to leads table';
  ELSE
    RAISE NOTICE 'rejected_at column already exists in leads table';
  END IF;

  -- Check if rejected_by column already exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'rejected_by'
  ) INTO column_exists;

  IF NOT column_exists THEN
    -- Add rejected_by column
    ALTER TABLE leads ADD COLUMN rejected_by TEXT;
    RAISE NOTICE 'Added rejected_by column to leads table';
  ELSE
    RAISE NOTICE 'rejected_by column already exists in leads table';
  END IF;

  -- Create an index on rejection_reason for faster searches
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_rejection_reason ON leads (rejection_reason) WHERE rejection_reason IS NOT NULL';
  RAISE NOTICE 'Created index on rejection_reason column';

  -- Create an index on status for faster filtering of rejected leads
  EXECUTE 'CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status)';
  RAISE NOTICE 'Created index on status column';
END $$;
