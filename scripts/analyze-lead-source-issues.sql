-- Examine the specific leads in question
SELECT 
  id, 
  lead_number, 
  client_name, 
  lead_source, 
  lead_source_id, 
  created_at, 
  updated_at
FROM leads
WHERE lead_number IN ('L0013', 'L0014');

-- Check available lead sources in the lead_sources table
SELECT id, name, is_active, created_at, updated_at
FROM lead_sources
ORDER BY name;

-- Check if there are any leads with properly assigned lead_source_id values
SELECT 
  COUNT(*) as total_leads,
  COUNT(lead_source_id) as leads_with_source_id,
  COUNT(lead_source) as leads_with_source_text
FROM leads;

-- Check for potential text matches between lead_source and lead_sources.name
SELECT 
  l.id, 
  l.lead_number, 
  l.lead_source, 
  ls.id as matching_source_id, 
  ls.name as matching_source_name
FROM leads l
LEFT JOIN lead_sources ls ON LOWER(l.lead_source) = LOWER(ls.name)
WHERE l.lead_number IN ('L0013', 'L0014');
