-- Create a function to add lead_source column to leads table
CREATE OR REPLACE FUNCTION add_lead_source_column()
RETURNS VOID AS $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'lead_source'
  ) THEN
    -- Add the column
    EXECUTE 'ALTER TABLE leads ADD COLUMN lead_source TEXT';
    
    -- Add a foreign key constraint if lead_sources table exists
    -- Note: We don't add a foreign key here since it's a text field
    -- and may not directly reference the id column in lead_sources
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a table exists if not already created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_proc WHERE proname = 'table_exists'
  ) THEN
    CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
      table_exists BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) INTO table_exists;
      
      RETURN table_exists;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;
