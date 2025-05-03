-- Add dummy lead source if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM lead_sources WHERE name = 'Website') THEN
    INSERT INTO lead_sources (name, description) VALUES ('Website', 'Leads from website contact form');
  END IF;
  
  IF NOT EXISTS (SELECT FROM lead_sources WHERE name = 'Phone Call') THEN
    INSERT INTO lead_sources (name, description) VALUES ('Phone Call', 'Leads from direct phone calls');
  END IF;
  
  IF NOT EXISTS (SELECT FROM lead_sources WHERE name = 'Referral') THEN
    INSERT INTO lead_sources (name, description) VALUES ('Referral', 'Leads from customer referrals');
  END IF;
END
$$;

-- Update any leads that have no source to a default source
DO $$
DECLARE
  default_source_id INTEGER;
BEGIN
  -- Get the Website source ID or the first source if Website doesn't exist
  SELECT id INTO default_source_id FROM lead_sources WHERE name = 'Website' LIMIT 1;
  
  IF default_source_id IS NULL THEN
    SELECT id INTO default_source_id FROM lead_sources LIMIT 1;
  END IF;
  
  -- Only proceed if we have a valid source
  IF default_source_id IS NOT NULL THEN
    -- Update leads with no source
    UPDATE leads
    SET lead_source_id = default_source_id
    WHERE lead_source_id IS NULL OR lead_source_id = 0;
    
    RAISE NOTICE 'Updated leads with default source ID: %', default_source_id;
  END IF;
END
$$;
