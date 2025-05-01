-- Create a function to get employees with their company-branch allocations
CREATE OR REPLACE FUNCTION get_employees_with_allocations()
RETURNS TABLE (
  id INTEGER,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  job_title TEXT,
  role TEXT,
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
  WHERE 
    e.status = 'active';
END;
$$ LANGUAGE plpgsql;
