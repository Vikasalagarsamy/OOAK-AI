-- Function to add lead_source column to leads table
CREATE OR REPLACE FUNCTION add_lead_source_column() 
RETURNS boolean AS $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leads'
      AND column_name = 'lead_source'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE leads ADD COLUMN lead_source TEXT;
  END IF;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error adding lead_source column: %', SQLERRM;
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
