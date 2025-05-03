-- Add lead_source_id column to leads table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leads' 
    AND column_name = 'lead_source_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_source_id INTEGER;
    
    -- Add a foreign key constraint if lead_sources table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'lead_sources'
    ) THEN
      ALTER TABLE leads 
      ADD CONSTRAINT fk_lead_source 
      FOREIGN KEY (lead_source_id) 
      REFERENCES lead_sources(id);
    END IF;
    
    RAISE NOTICE 'Added lead_source_id column to leads table';
  ELSE
    RAISE NOTICE 'lead_source_id column already exists in leads table';
  END IF;
END
$$;
