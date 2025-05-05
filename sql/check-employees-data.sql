-- Check if there are any employees in the database
SELECT 
  id, 
  employee_id, 
  first_name, 
  last_name, 
  email, 
  status,
  department_id,
  designation_id 
FROM employees 
LIMIT 10;

-- Check if there are any roles in the database
SELECT 
  id, 
  title, 
  description 
FROM roles 
LIMIT 10;
