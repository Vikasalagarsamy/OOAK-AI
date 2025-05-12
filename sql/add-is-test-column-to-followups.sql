-- First, create the column_exists function if it doesn't exist
CREATE OR REPLACE FUNCTION column_exists(table_name text, column_name text)
RETURNS boolean AS $$
DECLARE
  exists_bool boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  ) INTO exists_bool;
  
  RETURN exists_bool;
END;
$$ LANGUAGE plpgsql;

-- Then, add the is_test column if it doesn't exist
DO $$
BEGIN
  IF NOT column_exists('lead_followups', 'is_test') THEN
    ALTER TABLE lead_followups 
    ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
    
    CREATE INDEX idx_lead_followups_is_test 
    ON lead_followups(is_test);
  END IF;
END $$;
