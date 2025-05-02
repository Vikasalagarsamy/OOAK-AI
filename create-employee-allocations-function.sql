-- Create a function to get employee allocations with project information
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
  created_at TIMESTAMP,
  updated_at TIMESTAMP
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
    CASE
      WHEN ec.start_date > CURRENT_DATE THEN 'pending'
      WHEN ec.end_date IS NOT NULL AND ec.end_date < CURRENT_DATE THEN 'expired'
      ELSE 'active'
    END AS status,
    ec.created_at,
    ec.updated_at
  FROM 
    employee_companies ec
  JOIN 
    companies c ON ec.company_id = c.id
  LEFT JOIN 
    branches b ON ec.branch_id = b.id
  LEFT JOIN 
    projects p ON ec.project_id = p.id
  WHERE 
    ec.employee_id = p_employee_id
  ORDER BY 
    ec.is_primary DESC,
    status,
    ec.start_date;
END;
$$ LANGUAGE plpgsql;
