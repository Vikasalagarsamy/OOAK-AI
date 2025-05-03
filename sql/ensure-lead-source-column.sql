-- Check if lead_source_id column exists in leads table
DO $$
BEGIN
  -- Check if lead_source_id column exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'lead_source_id'
  ) THEN
    -- Add the lead_source_id column if it doesn't exist
    EXECUTE 'ALTER TABLE leads ADD COLUMN lead_source_id INTEGER REFERENCES lead_sources(id)';
    RAISE NOTICE 'Added lead_source_id column to leads table';
  ELSE
    RAISE NOTICE 'lead_source_id column already exists in leads table';
  END IF;
END
$$;

-- Create an update function to simplify adding source to existing records
CREATE OR REPLACE FUNCTION update_lead_source(
  p_lead_id INTEGER,
  p_source_id INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE leads
  SET lead_source_id = p_source_id
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;
