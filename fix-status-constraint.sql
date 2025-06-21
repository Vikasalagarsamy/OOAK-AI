-- Fix ai_tasks status constraint issue
-- The constraint is rejecting 'IN_PROGRESS' status, so we need to fix it

-- First, let's see what the current constraint allows
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%status%' 
    AND constraint_schema = 'public';

-- Drop the existing problematic constraint
ALTER TABLE ai_tasks DROP CONSTRAINT IF EXISTS ai_tasks_status_check;

-- Create a new constraint that allows the status values our API uses
ALTER TABLE ai_tasks ADD CONSTRAINT ai_tasks_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));

-- Also ensure priority constraint allows the values we use
ALTER TABLE ai_tasks DROP CONSTRAINT IF EXISTS ai_tasks_priority_check;
ALTER TABLE ai_tasks ADD CONSTRAINT ai_tasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'));

-- Check current status values in the table to see what we're working with
SELECT DISTINCT status, COUNT(*) 
FROM ai_tasks 
GROUP BY status 
ORDER BY status;

-- Check current priority values too
SELECT DISTINCT priority, COUNT(*) 
FROM ai_tasks 
GROUP BY priority 
ORDER BY priority;

-- Success message
SELECT 'Status constraint updated successfully! Task updates should now work.' as status; 