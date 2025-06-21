-- Fix task_type for existing quotation approval tasks
UPDATE ai_tasks 
SET task_type = 'quotation_approval'
WHERE task_title ILIKE '%review%approval%' 
   OR task_title ILIKE '%approve%quotation%'
   OR task_title ILIKE '%quotation%approval%'
   OR (quotation_id IS NOT NULL AND task_title ILIKE '%review%');

-- Also update any tasks that have quotation_id and are clearly approval tasks
UPDATE ai_tasks 
SET task_type = 'quotation_approval'
WHERE quotation_id IS NOT NULL 
  AND status = 'pending'
  AND (assigned_to ILIKE '%CTO%' OR assigned_to ILIKE '%manager%' OR assigned_to ILIKE '%head%');

-- Mark original completed tasks as 'quotation_generation' instead
UPDATE ai_tasks 
SET task_type = 'quotation_generation'
WHERE status = 'completed' 
  AND quotation_id IS NOT NULL
  AND task_type IS NULL;

-- Verify the updates
SELECT 
  id, 
  task_title, 
  task_type, 
  status, 
  quotation_id, 
  assigned_to
FROM ai_tasks 
WHERE quotation_id IS NOT NULL 
ORDER BY id; 