-- Function to automatically set lead_source_id based on lead_source name
CREATE OR REPLACE FUNCTION set_lead_source_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if lead_source has a value but lead_source_id is null
  IF NEW.lead_source IS NOT NULL AND NEW.lead_source_id IS NULL THEN
    -- Look up the lead_source_id from the lead_sources table
    SELECT id INTO NEW.lead_source_id 
    FROM lead_sources 
    WHERE LOWER(name) = LOWER(NEW.lead_source);
    
    -- Log if we couldn't find a matching source
    IF NEW.lead_source_id IS NULL THEN
      RAISE NOTICE 'No matching lead source found for: %', NEW.lead_source;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS ensure_lead_source_id ON leads;

-- Create trigger to run before insert or update
CREATE TRIGGER ensure_lead_source_id
BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION set_lead_source_id();

-- Ensure the trigger works with existing data
WITH updated_leads AS (
  SELECT l.id, l.lead_number, l.lead_source, ls.id as lead_source_id
  FROM leads l
  LEFT JOIN lead_sources ls ON LOWER(l.lead_source) = LOWER(ls.name)
  WHERE l.lead_source IS NOT NULL 
    AND l.lead_source_id IS NULL
    AND ls.id IS NOT NULL
)
UPDATE leads
SET lead_source_id = ul.lead_source_id
FROM updated_leads ul
WHERE leads.id = ul.id;

-- Report on any remaining leads with missing IDs
SELECT lead_number, lead_source
FROM leads
WHERE lead_source IS NOT NULL 
  AND lead_source_id IS NULL;
