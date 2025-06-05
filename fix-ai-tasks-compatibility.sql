-- Fix AI Tasks Compatibility Issues
-- This script handles the schema mismatch between different table structures

-- First, let's check what columns exist in ai_tasks
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ai_tasks' 
ORDER BY ordinal_position;

-- Check if we have the UUID-based schema or INTEGER-based schema
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tasks' AND column_name = 'task_number') 
    THEN 'INTEGER_SCHEMA'
    ELSE 'UUID_SCHEMA'
  END as schema_type;

-- Handle UUID schema (from original migration)
DO $$
BEGIN
  -- If we have UUID schema, add missing columns for compatibility
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_tasks' AND column_name = 'ai_generated' AND data_type = 'boolean') THEN
    -- This is the UUID-based schema from the original migration
    RAISE NOTICE 'Detected UUID-based schema, adding compatibility columns...';
    
    -- Add compatibility columns if they don't exist
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS task_number VARCHAR(50);
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS company_id INTEGER DEFAULT 1;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS branch_id INTEGER DEFAULT 1;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'AI_GENERATED';
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2);
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS automation_source VARCHAR(100);
    
    -- Generate task numbers for existing tasks
    UPDATE ai_tasks 
    SET task_number = 'TASK-' || EXTRACT(EPOCH FROM created_at)::BIGINT || '-' || SUBSTRING(id::text, 1, 8)
    WHERE task_number IS NULL;
    
  ELSE
    -- This is the INTEGER-based schema
    RAISE NOTICE 'Detected INTEGER-based schema, ensuring compatibility...';
    
    -- Add UUID compatibility columns if needed
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT TRUE;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2) DEFAULT 0.8;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS ai_reasoning TEXT;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12,2);
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER DEFAULT 30;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'general';
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS assigned_to_employee_id INTEGER;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS assigned_by_user_id INTEGER DEFAULT 1;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS optimal_time_start INTEGER DEFAULT 9;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS optimal_time_end INTEGER DEFAULT 17;
    ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
    
  END IF;
END $$;

-- Ensure both schemas have the production columns we added
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5);
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create a unified view for both schemas
CREATE OR REPLACE VIEW ai_tasks_unified AS
SELECT 
  id,
  COALESCE(task_number, 'TASK-' || id::text) as task_number,
  title,
  description,
  COALESCE(task_type, 'general') as task_type,
  priority,
  status,
  COALESCE(assigned_to_employee_id, assigned_to) as assigned_to_employee_id,
  COALESCE(assigned_by_user_id, created_by, 1) as assigned_by_user_id,
  due_date,
  created_at,
  updated_at,
  completed_at,
  lead_id,
  quotation_id,
  COALESCE(client_name, '') as client_name,
  COALESCE(ai_generated, TRUE) as ai_generated,
  COALESCE(ai_confidence_score, 0.8) as ai_confidence_score,
  ai_reasoning,
  business_impact,
  estimated_value,
  COALESCE(estimated_duration_minutes, estimated_hours * 60, 30) as estimated_duration_minutes,
  COALESCE(estimated_hours, estimated_duration_minutes / 60.0) as estimated_hours,
  actual_hours,
  quality_rating,
  archived,
  archived_at,
  COALESCE(company_id, 1) as company_id,
  COALESCE(branch_id, 1) as branch_id,
  COALESCE(category, 'GENERAL') as category,
  automation_source,
  COALESCE(optimal_time_start, 9) as optimal_time_start,
  COALESCE(optimal_time_end, 17) as optimal_time_end,
  COALESCE(timezone, 'UTC') as timezone
FROM ai_tasks;

-- Success message
SELECT 'AI Tasks compatibility fix completed successfully!' as status; 