-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_comprehensive_employee_data();

-- Create the updated function with the correct column references
CREATE OR REPLACE FUNCTION get_comprehensive_employee_data()
RETURNS TABLE (
  id INTEGER,
  employee_id TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT,
  hire_date DATE,
  termination_date DATE,
  job_title TEXT,
  department_id INTEGER,
  designation_id INTEGER,
  primary_company_id INTEGER,
  home_branch_id INTEGER,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  department TEXT,
  designation TEXT,
  primary_company TEXT,
  home_branch TEXT,
  location TEXT
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
    e.address,
    e.city,
    e.state,
    e.zip_code,
    e.country,
    e.hire_date,
    e.termination_date,
    e.job_title,
    e.department_id,
    e.designation_id,
    e.primary_company_id,
    e.home_branch_id,
    e.status,
    e.created_at,
    e.updated_at,
    d.name AS department,
    des.name AS designation,
    c.name AS primary_company,
    b.name AS home_branch,
    e.location
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
