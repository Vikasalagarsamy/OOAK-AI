-- Create a simple function that doesn't use any potentially problematic columns
CREATE OR REPLACE FUNCTION get_simple_employee_data()
RETURNS TABLE (
  id INTEGER,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  status TEXT,
  department_id INTEGER,
  department TEXT,
  designation_id INTEGER,
  designation TEXT,
  primary_company_id INTEGER,
  primary_company TEXT,
  home_branch_id INTEGER,
  home_branch TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.employee_id,
    e.first_name,
    e.last_name,
    e.email,
    e.phone,
    e.job_title,
    e.status,
    e.department_id,
    d.name AS department,
    e.designation_id,
    des.name AS designation,
    e.primary_company_id,
    c.name AS primary_company,
    e.home_branch_id,
    b.name AS home_branch,
    e.location,
    e.created_at,
    e.updated_at
  FROM
    employees e
  LEFT JOIN
    departments d ON e.department_id = d.id
  LEFT JOIN
    designations des ON e.designation_id = des.id
  LEFT JOIN
    companies c ON e.primary_company_id = c.id
  LEFT JOIN
    branches b ON e.home_branch_id = b.id
  ORDER BY
    e.created_at DESC;
END;
$$ LANGUAGE plpgsql;
