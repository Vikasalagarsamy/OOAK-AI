-- Fix employee ID mismatch for user rasvickys
-- Current situation: user has employeeId=6, but tasks are assigned to employee_id=22

-- Option 1: Update user account to match task assignments (employee_id = 22)
UPDATE user_accounts 
SET employee_id = 22 
WHERE username = 'rasvickys' OR email LIKE '%rasvickys%';

-- Option 2: Alternative - Update tasks to match current user (employee_id = 6)
-- UPDATE ai_tasks 
-- SET assigned_to_employee_id = 6 
-- WHERE assigned_to_employee_id = 22;

-- Check the results
SELECT 'User Account After Update:' as info;
SELECT id, username, email, employee_id 
FROM user_accounts 
WHERE username = 'rasvickys' OR email LIKE '%rasvickys%';

SELECT 'Task Assignments:' as info;
SELECT assigned_to_employee_id, COUNT(*) as task_count
FROM ai_tasks 
WHERE assigned_to_employee_id IS NOT NULL
GROUP BY assigned_to_employee_id;

SELECT 'Employee Records:' as info;
SELECT id, employee_id, first_name, last_name
FROM employees 
WHERE id IN (6, 22); 