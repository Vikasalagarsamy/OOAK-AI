-- Create a function to get accurate employee department counts
CREATE OR REPLACE FUNCTION get_employee_department_counts()
RETURNS TABLE (
  department_id UUID,
  department_name TEXT,
  employee_count BIGINT
) AS $$
BEGIN
  -- Return counts for employees with departments
  RETURN QUERY
  SELECT 
    d.id AS department_id,
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
    NULL::UUID AS department_id,
    'No Department' AS department_name,
    COUNT(e.id)::BIGINT AS employee_count
  FROM 
    employees e
  WHERE 
    e.department_id IS NULL;
END;
$$ LANGUAGE plpgsql;
