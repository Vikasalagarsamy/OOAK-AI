-- Add status column to call_transcriptions table
-- This allows tracking the processing state of calls

-- Add status column with default value
ALTER TABLE call_transcriptions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'processing';

-- Add task_id column to link calls to tasks
ALTER TABLE call_transcriptions 
ADD COLUMN IF NOT EXISTS task_id VARCHAR(50);

-- Add notes column for employee notes
ALTER TABLE call_transcriptions 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_status 
ON call_transcriptions(status);

-- Create index for task_id lookups
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_task_id 
ON call_transcriptions(task_id);

-- Update existing records to have 'completed' status if they have transcripts
UPDATE call_transcriptions 
SET status = 'completed' 
WHERE transcript IS NOT NULL 
  AND transcript != '' 
  AND transcript != 'Processing...'
  AND status IS NULL;

-- Add check constraint for valid status values
ALTER TABLE call_transcriptions 
ADD CONSTRAINT check_status_valid 
CHECK (status IN ('processing', 'transcribing', 'completed', 'error'));

-- Comment on the table
COMMENT ON COLUMN call_transcriptions.status IS 'Processing status: processing, transcribing, completed, error';
COMMENT ON COLUMN call_transcriptions.task_id IS 'Related task ID from ai_tasks table';
COMMENT ON COLUMN call_transcriptions.notes IS 'Employee notes about the call'; 