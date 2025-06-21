-- Add completion_notes column to ai_tasks table
ALTER TABLE ai_tasks 
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add comment to document the column
COMMENT ON COLUMN ai_tasks.completion_notes IS 'Notes added when the task is completed, explaining the outcome or resolution'; 