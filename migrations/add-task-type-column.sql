-- Add task_type column to ai_tasks table
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_type ON ai_tasks(task_type);

-- Update existing quotation approval tasks
UPDATE ai_tasks 
SET task_type = 'quotation_approval'
WHERE task_title ILIKE '%review%quotation%' 
   OR task_title ILIKE '%approve%quotation%'
   OR (quotation_id IS NOT NULL AND task_title ILIKE '%review%');

-- Update completed quotation generation tasks  
UPDATE ai_tasks 
SET task_type = 'quotation_generation'
WHERE status = 'completed' 
  AND quotation_id IS NOT NULL
  AND task_type IS NULL;

-- Update follow-up tasks
UPDATE ai_tasks 
SET task_type = 'quotation_follow_up'
WHERE task_title ILIKE '%follow%up%quotation%'
   OR task_title ILIKE '%follow%up%quote%';

-- Update payment follow-up tasks
UPDATE ai_tasks 
SET task_type = 'payment_follow_up'
WHERE task_title ILIKE '%payment%follow%'
   OR category = 'payment_follow_up';

-- Update lead contact tasks
UPDATE ai_tasks 
SET task_type = 'lead_contact'
WHERE task_title ILIKE '%initial%contact%'
   OR task_title ILIKE '%contact%lead%'
   OR category = 'sales_followup';

-- Verify the updates
SELECT 
  task_type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT status, ', ') as statuses
FROM ai_tasks 
WHERE task_type IS NOT NULL
GROUP BY task_type
ORDER BY count DESC; 