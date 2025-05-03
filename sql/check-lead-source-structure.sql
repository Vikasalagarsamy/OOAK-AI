-- Check if lead_sources table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'lead_sources'
);

-- Check lead_sources table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lead_sources';

-- Check leads table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'leads';

-- Check sample lead source data
SELECT * FROM lead_sources LIMIT 5;

-- Check sample leads data with focus on source fields
SELECT id, lead_number, lead_source_id, client_name 
FROM leads 
ORDER BY created_at DESC 
LIMIT 5;
