-- Check the actual column names in the leads table related to rejection
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns
WHERE 
  table_name = 'leads' 
  AND column_name LIKE '%reject%';

-- Check the specific lead L0017 to see its current state
SELECT 
  id, 
  lead_number, 
  client_name, 
  status, 
  rejection_reason, 
  rejected_at, 
  rejected_by
FROM 
  leads
WHERE 
  lead_number = 'L0017';
