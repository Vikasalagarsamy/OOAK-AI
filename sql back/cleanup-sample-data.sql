-- Clean up sample data to show only real performance data
-- Run this script to remove dummy data and keep only your real quotation data
-- IMPORTANT: Delete in correct order to respect foreign key constraints

-- Step 1: Remove sample performance metrics FIRST (due to foreign key constraints)
DELETE FROM sales_performance_metrics 
WHERE employee_id IN ('EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005')
AND metric_period = '2024-03-01';

-- Step 2: Remove old management insights based on sample data
DELETE FROM management_insights 
WHERE employee_id IN ('EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005')
OR created_at < NOW() - INTERVAL '1 hour';

-- Step 3: Remove sample activities (if any)
DELETE FROM sales_activities 
WHERE employee_id IN ('EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005');

-- Step 4: NOW remove sample team members (after removing all references)
DELETE FROM sales_team_members 
WHERE employee_id IN ('EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005');

-- Step 5: Verify what data remains
SELECT 'Team Members' as table_name, employee_id, full_name 
FROM sales_team_members
UNION ALL
SELECT 'Performance Metrics' as table_name, employee_id, metric_period::text 
FROM sales_performance_metrics
ORDER BY table_name, employee_id;

-- Success message
SELECT 'Sample data cleanup completed! Only real data should remain.' as status; 