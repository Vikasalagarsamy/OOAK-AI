-- Function to add lead_source column to leads table if it doesn't exist
CREATE OR REPLACE FUNCTION add_lead_source_column()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  column_exists boolean;
BEGIN
  -- Check if the column already exists
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'lead_source'
  ) INTO column_exists;
  
  -- If the column doesn't exist, add it
  IF NOT column_exists THEN
    EXECUTE 'ALTER TABLE leads ADD COLUMN lead_source text';
    RETURN true;
  END IF;
  
  RETURN column_exists;
END;
$$;
