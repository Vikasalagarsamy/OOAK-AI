-- 🚀 Quotation Performance Optimization Script
-- Run this to improve quotation creation and task management performance

-- ============================
-- 1. CREATE PERFORMANCE INDEXES
-- ============================

-- Quotations table indexes
CREATE INDEX IF NOT EXISTS idx_quotations_lead_id ON quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at);
CREATE INDEX IF NOT EXISTS idx_quotations_total_amount ON quotations(total_amount);
CREATE INDEX IF NOT EXISTS idx_quotations_client_name ON quotations(client_name);

-- AI Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_ai_tasks_assigned_to_employee_id ON ai_tasks(assigned_to_employee_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_quotation_id ON ai_tasks(quotation_id);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_task_type ON ai_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_created_at ON ai_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_estimated_value ON ai_tasks(estimated_value);

-- Quotation Events table indexes
CREATE INDEX IF NOT EXISTS idx_quotation_events_quotation_id ON quotation_events(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_events_event_date ON quotation_events(event_date);

-- Quotation Approvals table indexes
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_quotation_id ON quotation_approvals(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_status ON quotation_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_quotation_approvals_created_at ON quotation_approvals(created_at);

-- Employees table indexes
CREATE INDEX IF NOT EXISTS idx_employees_job_title ON employees(job_title);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);

-- ============================
-- 2. CREATE COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================

-- Task filtering by employee and status
CREATE INDEX IF NOT EXISTS idx_ai_tasks_employee_status ON ai_tasks(assigned_to_employee_id, status);

-- Task filtering by status and quotation
CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_quotation ON ai_tasks(status, quotation_id);

-- Quotation workflow tracking
CREATE INDEX IF NOT EXISTS idx_quotations_status_created ON quotations(status, created_at);

-- ============================
-- 3. UPDATE EXISTING DATA FOR CONSISTENCY
-- ============================

-- Update task values to match quotation amounts where missing
UPDATE ai_tasks 
SET estimated_value = q.total_amount
FROM quotations q 
WHERE ai_tasks.quotation_id = q.id 
  AND (ai_tasks.estimated_value IS NULL OR ai_tasks.estimated_value != q.total_amount);

-- Mark completed tasks with quotations as 'quotation_generation' type
UPDATE ai_tasks 
SET task_type = 'quotation_generation'
WHERE status = 'completed' 
  AND quotation_id IS NOT NULL
  AND task_type IS NULL;

-- Mark pending approval tasks as 'quotation_approval' type
UPDATE ai_tasks 
SET task_type = 'quotation_approval'
WHERE task_title ILIKE '%review%approval%' 
   OR task_title ILIKE '%approve%quotation%'
   OR task_title ILIKE '%quotation%approval%'
   OR (quotation_id IS NOT NULL AND task_title ILIKE '%review%');

-- ============================
-- 4. CREATE MATERIALIZED VIEW FOR DASHBOARD PERFORMANCE
-- ============================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS task_dashboard_summary;

-- Create materialized view for fast dashboard queries
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

-- ============================
-- 5. CREATE FUNCTION TO REFRESH DASHBOARD DATA
-- ============================

CREATE OR REPLACE FUNCTION refresh_task_dashboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW task_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================
-- 6. CREATE TRIGGER TO AUTO-UPDATE TASK VALUES
-- ============================

-- Function to sync task values with quotation amounts
CREATE OR REPLACE FUNCTION sync_task_quotation_value()
RETURNS TRIGGER AS $$
BEGIN
    -- When a quotation is created or updated, update related task values
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE ai_tasks 
        SET estimated_value = NEW.total_amount
        WHERE quotation_id = NEW.id 
          AND (estimated_value IS NULL OR estimated_value != NEW.total_amount);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on quotations table
DROP TRIGGER IF EXISTS trigger_sync_task_quotation_value ON quotations;
CREATE TRIGGER trigger_sync_task_quotation_value
    AFTER INSERT OR UPDATE OF total_amount ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION sync_task_quotation_value();

-- ============================
-- 7. ANALYZE TABLES FOR QUERY OPTIMIZATION
-- ============================

ANALYZE quotations;
ANALYZE ai_tasks;
ANALYZE quotation_events;
ANALYZE quotation_approvals;
ANALYZE employees;

-- ============================
-- 8. PERFORMANCE MONITORING QUERIES
-- ============================

-- Query to check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- Query to check slow queries
-- SELECT query, mean_time, calls, total_time 
-- FROM pg_stat_statements 
-- WHERE query LIKE '%quotations%' OR query LIKE '%ai_tasks%'
-- ORDER BY mean_time DESC;

-- ============================
-- 🎉 OPTIMIZATION COMPLETE!
-- ============================

SELECT 'Quotation Performance Optimization Complete! 🚀' as status,
       'Database indexes created, triggers installed, materialized views ready' as details; 