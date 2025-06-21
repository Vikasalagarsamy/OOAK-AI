-- Fix Task Visibility Issue: Move Deepika Devi to Sales Department
-- This ensures quotation rejection tasks are visible to the Sales Head

-- Step 1: Check current department assignments
SELECT 
  id,
  first_name,
  last_name,
  job_title,
  department_id,
  (SELECT name FROM departments WHERE id = employees.department_id) as department_name
FROM employees 
WHERE first_name ILIKE '%deepika%' OR first_name ILIKE '%durga%';

-- Step 2: Get Sales department ID (where Durga is)
WITH sales_dept AS (
  SELECT department_id 
  FROM employees 
  WHERE first_name ILIKE '%durga%' 
    AND job_title ILIKE '%sales%head%'
  LIMIT 1
)
-- Step 3: Move Deepika Devi to Sales department
UPDATE employees 
SET 
  department_id = (SELECT department_id FROM sales_dept),
  updated_at = NOW()
WHERE first_name ILIKE '%deepika%' 
  AND last_name ILIKE '%devi%';

-- Step 4: Verify the change
SELECT 
  id,
  first_name,
  last_name,
  job_title,
  department_id,
  (SELECT name FROM departments WHERE id = employees.department_id) as department_name
FROM employees 
WHERE first_name ILIKE '%deepika%' OR first_name ILIKE '%durga%';

-- Step 5: Test query - Check if Sales Head can now see Deepika's tasks
WITH sales_head_dept AS (
  SELECT department_id 
  FROM employees 
  WHERE first_name ILIKE '%durga%' 
    AND job_title ILIKE '%sales%head%'
  LIMIT 1
),
dept_employees AS (
  SELECT id 
  FROM employees 
  WHERE department_id = (SELECT department_id FROM sales_head_dept)
)
SELECT 
  t.id,
  t.task_title,
  t.task_type,
  t.assigned_to,
  e.first_name,
  e.last_name,
  e.department_id
FROM ai_tasks t
JOIN employees e ON t.assigned_to_employee_id = e.id
WHERE t.assigned_to_employee_id IN (SELECT id FROM dept_employees)
  AND t.task_type = 'quotation_revision'
ORDER BY t.created_at DESC
LIMIT 5; 