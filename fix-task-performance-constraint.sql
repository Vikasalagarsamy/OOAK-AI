-- Fix Task Performance Metrics Constraint Issue
-- This fixes the "ON CONFLICT" error by ensuring the proper unique constraint exists

-- Check if task_performance_metrics table exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_performance_metrics') 
    THEN 'TABLE_EXISTS'
    ELSE 'TABLE_MISSING'
  END as table_status;

-- Add the missing unique constraint if the table exists
DO $$
BEGIN
  -- Check if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_performance_metrics') THEN
    
    -- Drop existing constraint if it exists (in case it's named differently)
    BEGIN
      ALTER TABLE task_performance_metrics DROP CONSTRAINT IF EXISTS task_performance_metrics_task_id_key;
      ALTER TABLE task_performance_metrics DROP CONSTRAINT IF EXISTS unique_task_id;
      ALTER TABLE task_performance_metrics DROP CONSTRAINT IF EXISTS task_performance_metrics_task_id_unique;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors if constraints don't exist
      NULL;
    END;
    
    -- Add the unique constraint
    BEGIN
      ALTER TABLE task_performance_metrics ADD CONSTRAINT task_performance_metrics_task_id_unique UNIQUE (task_id);
      RAISE NOTICE 'Added unique constraint on task_performance_metrics.task_id';
    EXCEPTION WHEN duplicate_table THEN
      RAISE NOTICE 'Unique constraint already exists on task_performance_metrics.task_id';
    END;
    
  ELSE
    RAISE NOTICE 'task_performance_metrics table does not exist - will create it';
    
    -- Create the table with the proper constraint
    CREATE TABLE task_performance_metrics (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL UNIQUE,
      lead_id INTEGER,
      quotation_id INTEGER,
      assigned_to INTEGER,
      created_date DATE NOT NULL,
      due_date DATE,
      completed_date DATE,
      days_to_complete INTEGER,
      hours_estimated DECIMAL(5,2),
      hours_actual DECIMAL(5,2),
      efficiency_ratio DECIMAL(5,2),
      priority_level VARCHAR(20),
      was_overdue BOOLEAN DEFAULT FALSE,
      quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
      revenue_impact DECIMAL(15,2),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add foreign key reference if ai_tasks exists
    BEGIN
      ALTER TABLE task_performance_metrics 
      ADD CONSTRAINT fk_task_performance_metrics_task_id 
      FOREIGN KEY (task_id) REFERENCES ai_tasks(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add foreign key constraint - ai_tasks table may not exist';
    END;
    
    RAISE NOTICE 'Created task_performance_metrics table with unique constraint';
  END IF;
END $$;

-- Verify the constraint exists
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'task_performance_metrics'::regclass 
  AND contype = 'u';

-- Success message
SELECT 'Task performance metrics constraint fix completed successfully!' as status; 