-- Check the current function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'get_employee_department_counts';

-- Drop the existing function
DROP FUNCTION IF EXISTS get_employee_department_counts();

-- Recreate the function with a simpler structure
CREATE OR REPLACE FUNCTION get_employee_department_counts()
RETURNS TABLE (
  department_name TEXT,
  employee_count BIGINT
) AS $$
BEGIN
  -- Return counts for employees with departments
  RETURN QUERY
  SELECT 
    d.name AS department_name,
    COUNT(e.id)::BIGINT AS employee_count
  FROM 
    departments d
  LEFT JOIN 
    employees e ON e.department_id = d.id
  GROUP BY 
    d.name
  
  UNION ALL
  
  -- Return count for employees with no department
  SELECT 
    'No Department' AS department_name,
    COUNT(e.id)::BIGINT AS employee_count
  FROM 
    employees e
  WHERE 
    e.department_id IS NULL;
END;
$$ LANGUAGE plpgsql;
