-- Fix the type mismatch in the get_employee_department_counts function
CREATE OR REPLACE FUNCTION get_employee_department_counts()
RETURNS TABLE (
  department_id TEXT,  -- Changed from UUID to TEXT to handle NULL values better
  department_name TEXT,
  employee_count BIGINT
) AS $$
BEGIN
  -- Return counts for employees with departments
  RETURN QUERY
  SELECT 
    d.id::TEXT AS department_id,  -- Cast UUID to TEXT
    d.name AS department_name,
    COUNT(e.id)::BIGINT AS employee_count
  FROM 
    departments d
  LEFT JOIN 
    employees e ON e.department_id = d.id
  GROUP BY 
    d.id, d.name
  
  UNION ALL
  
  -- Return count for employees with no department
  SELECT 
    'no-department' AS department_id,  -- Use a string instead of NULL
    'No Department' AS department_name,
    COUNT(e.id)::BIGINT AS employee_count
  FROM 
    employees e
  WHERE 
    e.department_id IS NULL;
END;
$$ LANGUAGE plpgsql;
