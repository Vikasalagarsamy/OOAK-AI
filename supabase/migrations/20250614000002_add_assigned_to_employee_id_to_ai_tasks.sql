-- Add assigned_to_employee_id column to ai_tasks table
-- This column is needed for proper task assignment to employees

-- Add the column if it doesn't exist
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS assigned_to_employee_id INTEGER;

-- Add foreign key constraint
ALTER TABLE ai_tasks 
ADD CONSTRAINT IF NOT EXISTS fk_ai_tasks_assigned_to_employee 
FOREIGN KEY (assigned_to_employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to_employee_id 
ON ai_tasks(assigned_to_employee_id);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_ai_tasks_employee_status 
ON ai_tasks(assigned_to_employee_id, status);

-- Add comment
COMMENT ON COLUMN ai_tasks.assigned_to_employee_id IS 'Employee ID that the task is assigned to';

-- Add task_type column if it doesn't exist (also needed)
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50);

-- Add completion_notes column if it doesn't exist (also needed)
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS completion_notes TEXT; 