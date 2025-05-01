-- Function to get sales employees with their company-branch allocations
CREATE OR REPLACE FUNCTION get_sales_employees_with_allocations()
RETURNS TABLE (
  id INTEGER,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  job_title TEXT,
  companies JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employee_id,
    e.first_name,
    e.last_name,
    e.job_title,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'company_id', c.id,
          'company_name', c.name,
          'branch_id', b.id,
          'branch_name', b.name,
          'percentage', ec.percentage
        )
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    ) AS companies
  FROM 
    employees e
  LEFT JOIN 
    employee_companies ec ON e.id = ec.employee_id
  LEFT JOIN 
    companies c ON ec.company_id = c.id
  LEFT JOIN 
    branches b ON ec.branch_id = b.id
  WHERE 
    e.status = 'active'
    AND (
      e.job_title ILIKE '%sales%' 
      OR e.job_title ILIKE '%account%' 
      OR e.job_title ILIKE '%business development%'
    )
  GROUP BY 
    e.id, e.employee_id, e.first_name, e.last_name, e.job_title;
END;
$$ LANGUAGE plpgsql;
