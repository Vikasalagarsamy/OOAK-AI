-- Create a simpler version of the employee allocations function
CREATE OR REPLACE FUNCTION get_employee_allocations(p_employee_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  employee_id INTEGER,
  company_id INTEGER,
  company_name TEXT,
  branch_id INTEGER,
  branch_name TEXT,
  project_id INTEGER,
  project_name TEXT,
  allocation_percentage INTEGER,
  is_primary BOOLEAN,
  start_date DATE,
  end_date DATE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    ec.employee_id,
    ec.company_id,
    c.name AS company_name,
    ec.branch_id,
    b.name AS branch_name,
    ec.project_id,
    p.name AS project_name,
    ec.allocation_percentage,
    ec.is_primary,
    ec.start_date,
    ec.end_date,
    COALESCE(ec.status, 'active') AS status,
    ec.created_at,
    ec.updated_at
  FROM 
    employee_companies ec
  JOIN 
    companies c ON ec.company_id = c.id
  JOIN 
    branches b ON ec.branch_id = b.id
  LEFT JOIN 
    projects p ON ec.project_id = p.id
  WHERE 
    ec.employee_id = p_employee_id
  ORDER BY 
    ec.is_primary DESC;
END;
$$ LANGUAGE plpgsql;
