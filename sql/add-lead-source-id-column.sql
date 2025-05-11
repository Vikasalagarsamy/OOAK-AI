-- Check if lead_source_id column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'lead_source_id'
  ) THEN
    -- Add lead_source_id column
    ALTER TABLE leads ADD COLUMN lead_source_id INTEGER;
    
    -- Create a function to update lead_source_id based on lead_source
    CREATE OR REPLACE FUNCTION update_lead_source_ids() RETURNS void AS $$
    DECLARE
      source_record RECORD;
    BEGIN
      -- For each lead source in the lead_sources table
      FOR source_record IN SELECT id, name FROM lead_sources LOOP
        -- Update leads where lead_source matches the name
        UPDATE leads 
        SET lead_source_id = source_record.id 
        WHERE LOWER(lead_source) = LOWER(source_record.name)
        AND lead_source_id IS NULL;
      END LOOP;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Execute the function to populate lead_source_id values
    SELECT update_lead_source_ids();
    
    -- Drop the function as it's no longer needed
    DROP FUNCTION update_lead_source_ids();
    
    -- Add a foreign key constraint
    ALTER TABLE leads 
    ADD CONSTRAINT fk_lead_source 
    FOREIGN KEY (lead_source_id) 
    REFERENCES lead_sources(id);
  END IF;
END
$$;
