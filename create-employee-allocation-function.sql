-- Create a function to get employees with their company-branch allocations filtered by company and branch
CREATE OR REPLACE FUNCTION get_employees_by_company_branch(
  p_company_id INTEGER,
  p_branch_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  job_title TEXT,
  role TEXT,
  department TEXT,
  companies JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employee_id,
    e.first_name,
    e.last_name,
    e.first_name || ' ' || e.last_name AS full_name,
    e.job_title,
    r.name AS role,
    d.name AS department,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'company_id', c.id,
          'company_name', c.name,
          'branch_id', b.id,
          'branch_name', b.name,
          'allocation_percentage', ec.allocation_percentage,
          'is_primary', ec.is_primary
        )
      )
      FROM employee_companies ec
      JOIN companies c ON ec.company_id = c.id
      LEFT JOIN branches b ON ec.branch_id = b.id
      WHERE ec.employee_id = e.id
    ) AS companies
  FROM 
    employees e
  LEFT JOIN
    roles r ON e.role_id = r.id
  LEFT JOIN
    departments d ON e.department_id = d.id
  WHERE 
    e.status = 'active'
    AND EXISTS (
      SELECT 1 
      FROM employee_companies ec 
      WHERE ec.employee_id = e.id 
        AND ec.company_id = p_company_id
        AND (p_branch_id IS NULL OR ec.branch_id = p_branch_id)
    );
END;
$$ LANGUAGE plpgsql;
