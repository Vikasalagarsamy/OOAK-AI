-- Create a function to add lead_source_id column to leads table
CREATE OR REPLACE FUNCTION add_lead_source_id_column()
RETURNS VOID AS $$
BEGIN
  -- Check if the column already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'lead_source_id'
  ) THEN
    -- Add the column
    EXECUTE 'ALTER TABLE leads ADD COLUMN lead_source_id INTEGER';
    
    -- Add a foreign key constraint if lead_sources table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'lead_sources'
    ) THEN
      EXECUTE 'ALTER TABLE leads 
               ADD CONSTRAINT fk_lead_source 
               FOREIGN KEY (lead_source_id) 
               REFERENCES lead_sources(id)';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if a table exists
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
