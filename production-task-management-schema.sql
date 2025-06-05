-- Production Task Management Schema Update
-- This ensures proper task lifecycle management with audit trails and data integrity

-- 1. Ensure ai_tasks table has all required columns for production
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5);
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- 2. Update task_generation_log to support status updates and audit trail
ALTER TABLE task_generation_log ADD COLUMN IF NOT EXISTS task_id INTEGER;
ALTER TABLE task_generation_log ADD COLUMN IF NOT EXISTS triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Create task_status_history table for detailed audit trail
CREATE TABLE IF NOT EXISTS public.task_status_history (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by VARCHAR(100),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create task_performance_metrics table for analytics
CREATE TABLE IF NOT EXISTS public.task_performance_metrics (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES ai_tasks(id) ON DELETE CASCADE,
    lead_id INTEGER,
    quotation_id INTEGER,
    assigned_to INTEGER,
    created_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    days_to_complete INTEGER,
    hours_estimated DECIMAL(5,2),
    hours_actual DECIMAL(5,2),
    efficiency_ratio DECIMAL(5,2), -- actual/estimated
    priority_level VARCHAR(20),
    was_overdue BOOLEAN DEFAULT FALSE,
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    revenue_impact DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_archived ON ai_tasks(status, archived);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_completed_at ON ai_tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to_status ON ai_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_task_status_history_task_id ON task_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_history_changed_at ON task_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_task_performance_metrics_created_date ON task_performance_metrics(created_date);
CREATE INDEX IF NOT EXISTS idx_task_performance_metrics_assigned_to ON task_performance_metrics(assigned_to);

-- 6. Create function to automatically log status changes
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_status_history (
      task_id,
      from_status,
      to_status,
      changed_at,
      changed_by,
      notes,
      metadata
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NOW(),
      COALESCE(NEW.metadata->>'last_updated_by', 'system'),
      NEW.metadata->>'completion_notes',
      jsonb_build_object(
        'task_number', NEW.task_number,
        'lead_id', NEW.lead_id,
        'estimated_hours', NEW.estimated_hours,
        'actual_hours', NEW.actual_hours,
        'due_date', NEW.due_date,
        'completed_at', NEW.completed_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger for automatic status change logging
DROP TRIGGER IF EXISTS trigger_log_task_status_change ON ai_tasks;
CREATE TRIGGER trigger_log_task_status_change
  AFTER UPDATE ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_status_change();

-- 8. Create function to update performance metrics on task completion
CREATE OR REPLACE FUNCTION update_task_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when task is completed
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    INSERT INTO task_performance_metrics (
      task_id,
      lead_id,
      quotation_id,
      assigned_to,
      created_date,
      due_date,
      completed_date,
      days_to_complete,
      hours_estimated,
      hours_actual,
      efficiency_ratio,
      priority_level,
      was_overdue,
      quality_rating,
      revenue_impact
    ) VALUES (
      NEW.id,
      NEW.lead_id,
      NEW.quotation_id,
      NEW.assigned_to,
      NEW.created_at::DATE,
      NEW.due_date::DATE,
      NEW.completed_at::DATE,
      CASE 
        WHEN NEW.completed_at IS NOT NULL THEN 
          EXTRACT(DAY FROM NEW.completed_at - NEW.created_at)
        ELSE NULL 
      END,
      NEW.estimated_hours,
      NEW.actual_hours,
      CASE 
        WHEN NEW.estimated_hours > 0 AND NEW.actual_hours IS NOT NULL THEN 
          NEW.actual_hours / NEW.estimated_hours
        ELSE NULL 
      END,
      NEW.priority,
      CASE 
        WHEN NEW.due_date IS NOT NULL AND NEW.completed_at IS NOT NULL THEN 
          NEW.completed_at > NEW.due_date
        ELSE FALSE 
      END,
      (NEW.metadata->>'quality_rating')::INTEGER,
      (NEW.metadata->>'estimated_value')::DECIMAL
    )
    ON CONFLICT (task_id) DO UPDATE SET
      completed_date = EXCLUDED.completed_date,
      days_to_complete = EXCLUDED.days_to_complete,
      hours_actual = EXCLUDED.hours_actual,
      efficiency_ratio = EXCLUDED.efficiency_ratio,
      was_overdue = EXCLUDED.was_overdue,
      quality_rating = EXCLUDED.quality_rating,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for performance metrics
DROP TRIGGER IF EXISTS trigger_update_task_performance_metrics ON ai_tasks;
CREATE TRIGGER trigger_update_task_performance_metrics
  AFTER UPDATE ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_performance_metrics();

-- 10. Create comprehensive task analytics view
CREATE OR REPLACE VIEW task_analytics_dashboard AS
SELECT 
  'overall' as period,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN due_date < NOW() AND status != 'COMPLETED' THEN 1 END) as overdue_tasks,
  ROUND(
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*)::DECIMAL, 0) * 100, 2
  ) as completion_rate,
  ROUND(AVG(estimated_hours), 2) as avg_estimated_hours,
  ROUND(AVG(actual_hours), 2) as avg_actual_hours,
  SUM(COALESCE((metadata->>'estimated_value')::DECIMAL, 0)) as total_revenue_impact
FROM ai_tasks 
WHERE archived = FALSE

UNION ALL

SELECT 
  'last_30_days' as period,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN due_date < NOW() AND status != 'COMPLETED' THEN 1 END) as overdue_tasks,
  ROUND(
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*)::DECIMAL, 0) * 100, 2
  ) as completion_rate,
  ROUND(AVG(estimated_hours), 2) as avg_estimated_hours,
  ROUND(AVG(actual_hours), 2) as avg_actual_hours,
  SUM(COALESCE((metadata->>'estimated_value')::DECIMAL, 0)) as total_revenue_impact
FROM ai_tasks 
WHERE created_at >= NOW() - INTERVAL '30 days' 
  AND archived = FALSE;

-- 11. Add RLS policies for new tables
ALTER TABLE task_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to task_status_history" ON task_status_history FOR ALL USING (true);
CREATE POLICY "Allow all access to task_performance_metrics" ON task_performance_metrics FOR ALL USING (true);

-- 12. Add constraint to ensure task status integrity
ALTER TABLE ai_tasks DROP CONSTRAINT IF EXISTS check_status_values;
ALTER TABLE ai_tasks ADD CONSTRAINT check_status_values 
  CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'));

-- 13. Add constraint to ensure completion_at is set when status is COMPLETED
CREATE OR REPLACE FUNCTION check_completion_consistency()
RETURNS TRIGGER AS $$
BEGIN
  -- If status is COMPLETED, ensure completed_at is set
  IF NEW.status = 'COMPLETED' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- If status is not COMPLETED, clear completed_at
  IF NEW.status != 'COMPLETED' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_completion_consistency ON ai_tasks;
CREATE TRIGGER trigger_check_completion_consistency
  BEFORE UPDATE ON ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_completion_consistency();

-- 14. Create function for task archival (soft delete)
CREATE OR REPLACE FUNCTION archive_completed_tasks(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE ai_tasks 
  SET 
    archived = TRUE,
    archived_at = NOW()
  WHERE 
    status = 'COMPLETED' 
    AND completed_at < NOW() - INTERVAL '1 day' * days_old
    AND archived = FALSE;
    
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Production Task Management Schema updated successfully! 
✅ Status change audit trail
✅ Performance metrics tracking  
✅ Data integrity constraints
✅ Automatic archival support
✅ Analytics dashboard views' as status; 