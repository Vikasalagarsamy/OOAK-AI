-- Add unique constraint for upsert operations on sales_performance_metrics
-- This enables the real-time sync to properly update existing records

CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_performance_metrics_unique 
  ON sales_performance_metrics(employee_id, metric_period);

-- Add a comment to document the constraint
COMMENT ON INDEX idx_sales_performance_metrics_unique IS 
  'Unique constraint to allow upsert operations for real-time performance syncing'; 