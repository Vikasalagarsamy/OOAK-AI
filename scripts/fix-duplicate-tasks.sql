-- ===============================================
-- 🔧 FIX DUPLICATE TASKS SCRIPT
-- ===============================================
-- This script removes duplicate tasks and adds constraints
-- to prevent future duplicate task creation

BEGIN;

-- 1. IDENTIFY AND REMOVE DUPLICATE TASKS
-- ===============================================

-- Find duplicate tasks (same lead_id, task_title, assigned_to_employee_id)
WITH duplicate_tasks AS (
  SELECT 
    id,
    task_title,
    lead_id,
    assigned_to_employee_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY lead_id, task_title, assigned_to_employee_id 
      ORDER BY created_at ASC
    ) as row_num
  FROM ai_tasks 
  WHERE lead_id IS NOT NULL
    AND task_title IS NOT NULL
    AND assigned_to_employee_id IS NOT NULL
),
tasks_to_delete AS (
  SELECT id, task_title, lead_id, assigned_to_employee_id, created_at
  FROM duplicate_tasks 
  WHERE row_num > 1
)
SELECT 
  COUNT(*) as duplicate_count,
  'Duplicate tasks found' as status
FROM tasks_to_delete;

-- Show the duplicates before deletion
SELECT 
  dt.id,
  dt.task_title,
  dt.lead_id,
  l.client_name,
  dt.assigned_to_employee_id,
  e.first_name || ' ' || e.last_name as assigned_to_name,
  dt.created_at,
  'WILL BE DELETED' as action
FROM (
  SELECT 
    id,
    task_title,
    lead_id,
    assigned_to_employee_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY lead_id, task_title, assigned_to_employee_id 
      ORDER BY created_at ASC
    ) as row_num
  FROM ai_tasks 
  WHERE lead_id IS NOT NULL
    AND task_title IS NOT NULL
    AND assigned_to_employee_id IS NOT NULL
) dt
LEFT JOIN leads l ON dt.lead_id = l.id
LEFT JOIN employees e ON dt.assigned_to_employee_id = e.id
WHERE dt.row_num > 1
ORDER BY dt.lead_id, dt.created_at;

-- Delete the duplicate tasks (keep the first one created)
DELETE FROM ai_tasks 
WHERE id IN (
  SELECT id FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY lead_id, task_title, assigned_to_employee_id 
        ORDER BY created_at ASC
      ) as row_num
    FROM ai_tasks 
    WHERE lead_id IS NOT NULL
      AND task_title IS NOT NULL
      AND assigned_to_employee_id IS NOT NULL
  ) ranked_tasks
  WHERE row_num > 1
);

-- 2. ADD UNIQUE CONSTRAINT TO PREVENT FUTURE DUPLICATES
-- ===============================================

-- Create a unique index to prevent duplicate tasks for the same lead and employee
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_tasks_unique_lead_assignment 
ON ai_tasks (lead_id, assigned_to_employee_id, task_title) 
WHERE lead_id IS NOT NULL 
  AND assigned_to_employee_id IS NOT NULL 
  AND task_title IS NOT NULL
  AND status != 'completed';

-- 3. ADD TASK DEDUPLICATION FUNCTION
-- ===============================================

CREATE OR REPLACE FUNCTION prevent_duplicate_lead_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a similar task already exists for this lead and employee
  IF EXISTS (
    SELECT 1 FROM ai_tasks 
    WHERE lead_id = NEW.lead_id 
      AND assigned_to_employee_id = NEW.assigned_to_employee_id
      AND task_title = NEW.task_title
      AND status != 'completed'
      AND id != COALESCE(NEW.id, 0)
  ) THEN
    RAISE NOTICE 'Duplicate task prevented: % for lead % assigned to employee %', 
      NEW.task_title, NEW.lead_id, NEW.assigned_to_employee_id;
    RETURN NULL; -- Prevent the insert
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicates
DROP TRIGGER IF EXISTS trigger_prevent_duplicate_lead_tasks ON ai_tasks;
CREATE TRIGGER trigger_prevent_duplicate_lead_tasks
  BEFORE INSERT ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION prevent_duplicate_lead_tasks();

-- 4. VERIFICATION QUERIES
-- ===============================================

-- Show remaining tasks after cleanup
SELECT 
  t.id,
  t.task_title,
  t.lead_id,
  l.client_name,
  t.assigned_to_employee_id,
  e.first_name || ' ' || e.last_name as assigned_to_name,
  t.status,
  t.created_at
FROM ai_tasks t
LEFT JOIN leads l ON t.lead_id = l.id
LEFT JOIN employees e ON t.assigned_to_employee_id = e.id
WHERE t.lead_id IS NOT NULL
ORDER BY t.lead_id, t.created_at;

-- Check for any remaining duplicates
SELECT 
  lead_id,
  task_title,
  assigned_to_employee_id,
  COUNT(*) as task_count
FROM ai_tasks 
WHERE lead_id IS NOT NULL
  AND task_title IS NOT NULL
  AND assigned_to_employee_id IS NOT NULL
  AND status != 'completed'
GROUP BY lead_id, task_title, assigned_to_employee_id
HAVING COUNT(*) > 1;

COMMIT;

-- Final success message
SELECT '🎯 Duplicate Task Cleanup Complete!' as status; 