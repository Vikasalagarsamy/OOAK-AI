-- Check lead 18 data
SELECT 
  l.id, 
  l.lead_number, 
  l.client_name, 
  l.assigned_to,
  l.lead_source_id,
  ls.name AS lead_source_name,
  e.first_name || ' ' || e.last_name AS assigned_to_name,
  e.role AS assigned_role
FROM 
  leads l
LEFT JOIN 
  lead_sources ls ON l.lead_source_id = ls.id
LEFT JOIN 
  employees e ON l.assigned_to = e.id
WHERE 
  l.id = 18;
