-- Create a simplified function to get sales employees for a lead
CREATE OR REPLACE FUNCTION get_simple_sales_employees(
  lead_company_id INTEGER
)
RETURNS TABLE (
  id INTEGER,
  employee_id VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  status VARCHAR,
  company_id INTEGER,
  role VARCHAR,
  job_title VARCHAR,
  department VARCHAR,
  location VARCHAR
) AS $$
BEGIN
  -- Return employees who match the company directly
  RETURN QUERY
  SELECT DISTINCT 
    e.id,
    e.employee_id,
    e.first_name,
    e.last_name,
    e.status,
    e.company_id,
    e.role,
    e.job_title,
    e.department,
    e.location
  FROM employees e
  WHERE 
    e.status = 'active'
    AND e.company_id = lead_company_id
    AND (
      -- Match sales-related roles
      e.job_title ILIKE '%sales%'
      OR e.role ILIKE '%sales%'
      OR e.department ILIKE '%sales%'
      OR e.job_title ILIKE '%account%'
      OR e.role ILIKE '%account%'
      OR e.job_title ILIKE '%business development%'
      OR e.role ILIKE '%business development%'
    )
  ORDER BY
    e.first_name;
END;
$$ LANGUAGE plpgsql;
