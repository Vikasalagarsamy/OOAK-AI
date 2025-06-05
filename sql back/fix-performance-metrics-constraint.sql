-- Fix for sales_performance_metrics table constraint issue
-- Run this script in your database to enable real-time sync

-- Step 1: Drop existing performance metrics to avoid conflicts
DELETE FROM sales_performance_metrics;

-- Step 2: Add unique constraint for upsert operations
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_performance_metrics_unique 
  ON sales_performance_metrics(employee_id, metric_period);

-- Step 3: Verify the constraint exists
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'sales_performance_metrics' 
  AND indexname = 'idx_sales_performance_metrics_unique';

-- Step 4: Re-insert sample data
INSERT INTO sales_performance_metrics (employee_id, metric_period, quotations_created, quotations_converted, total_revenue_generated, avg_deal_size, conversion_rate, activity_score, performance_score) VALUES
('EMP001', '2024-03-01', 15, 8, 450000, 56250, 0.5333, 7.5, 7.8),
('EMP002', '2024-03-01', 22, 16, 890000, 55625, 0.7273, 9.2, 9.5),
('EMP003', '2024-03-01', 12, 5, 280000, 56000, 0.4167, 6.8, 6.2),
('EMP004', '2024-03-01', 8, 6, 650000, 108333, 0.7500, 8.5, 8.9),
('EMP005', '2024-03-01', 10, 4, 220000, 55000, 0.4000, 5.5, 5.8)
ON CONFLICT (employee_id, metric_period) DO UPDATE SET
  quotations_created = EXCLUDED.quotations_created,
  quotations_converted = EXCLUDED.quotations_converted,
  total_revenue_generated = EXCLUDED.total_revenue_generated,
  avg_deal_size = EXCLUDED.avg_deal_size,
  conversion_rate = EXCLUDED.conversion_rate,
  activity_score = EXCLUDED.activity_score,
  performance_score = EXCLUDED.performance_score;

-- Success message
SELECT 'Database constraint fix completed successfully!' as status; 