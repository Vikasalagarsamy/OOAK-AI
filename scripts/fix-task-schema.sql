-- Fix AI Tasks Schema and Data Synchronization

-- Add task_type column if it doesn't exist
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50);

-- Update task types based on existing data
UPDATE ai_tasks 
SET task_type = 'quotation_generation'
WHERE status = 'completed' 
  AND quotation_id IS NOT NULL
  AND task_type IS NULL;

UPDATE ai_tasks 
SET task_type = 'quotation_approval'
WHERE task_title ILIKE '%review%approval%' 
   OR task_title ILIKE '%approve%quotation%'
   OR task_title ILIKE '%quotation%approval%'
   OR (quotation_id IS NOT NULL AND task_title ILIKE '%review%');

-- Update task values to match quotation amounts
UPDATE ai_tasks 
SET estimated_value = q.total_amount
FROM quotations q 
WHERE ai_tasks.quotation_id = q.id 
  AND (ai_tasks.estimated_value IS NULL OR ai_tasks.estimated_value != q.total_amount);

-- Create index on task_type
CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_type ON ai_tasks(task_type);

-- Create materialized view for dashboard performance
DROP MATERIALIZED VIEW IF EXISTS task_dashboard_summary;

CREATE MATERIALIZED VIEW task_dashboard_summary AS
SELECT 
    t.assigned_to_employee_id,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.quotation_id IS NOT NULL THEN 1 END) as tasks_with_quotations,
    COALESCE(SUM(t.estimated_value), 0) as total_value,
    COALESCE(SUM(CASE WHEN t.status = 'completed' THEN t.estimated_value ELSE 0 END), 0) as completed_value,
    COUNT(CASE WHEN t.task_type = 'quotation_approval' AND t.status = 'pending' THEN 1 END) as pending_approvals
FROM ai_tasks t
WHERE t.assigned_to_employee_id IS NOT NULL
GROUP BY t.assigned_to_employee_id;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_task_dashboard_summary_employee ON task_dashboard_summary(assigned_to_employee_id);

SELECT 'Task schema updated and data synchronized!' as status; 