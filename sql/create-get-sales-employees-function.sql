CREATE OR REPLACE FUNCTION get_sales_employees_for_lead(
  lead_company_id INTEGER,
  lead_location VARCHAR
)
RETURNS TABLE (
  id INTEGER,
  employee_id VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  status VARCHAR,
  company_id INTEGER,
  branch_id INTEGER,
  department_id INTEGER,
  role VARCHAR,
  job_title VARCHAR,
  department VARCHAR,
  location VARCHAR,
  match_score INTEGER
) AS $$
BEGIN
  -- Return employees who match the company directly OR through the junction table
  RETURN QUERY
  SELECT DISTINCT 
    e.id,
    e.employee_id,
    e.first_name,
    e.last_name,
    e.status,
    e.company_id,
    e.branch_id,
    e.department_id,
    e.role,
    e.job_title,
    e.department,
    e.location,
    CASE WHEN e.location = lead_location THEN 0
         WHEN e.location ILIKE '%' || lead_location || '%' THEN 1
         WHEN b.location = lead_location THEN 2
         WHEN b.location ILIKE '%' || lead_location || '%' THEN 3
         ELSE 4
    END AS match_score
  FROM employees e
  LEFT JOIN employee_companies ec ON e.id = ec.employee_id
  LEFT JOIN branches b ON e.branch_id = b.id
  WHERE 
    e.status = 'active'
    AND (
      -- Match by direct company_id
      e.company_id = lead_company_id
      OR
      -- Match by junction table
      (e.company_id IS NULL AND ec.company_id = lead_company_id)
    )
    AND (
      -- Match sales-related roles
      e.job_title ILIKE '%sales%'
      OR e.role ILIKE '%sales%'
      OR e.department ILIKE '%sales%'
      OR e.job_title ILIKE '%account manager%'
      OR e.role ILIKE '%account manager%'
      OR e.job_title ILIKE '%business development%'
      OR e.role ILIKE '%business development%'
    )
    -- Exclude executive roles
    AND NOT (
      e.role ILIKE '%ceo%'
      OR e.role ILIKE '%cto%'
      OR e.role ILIKE '%cfo%'
      OR e.role ILIKE '%coo%'
      OR e.role ILIKE '%president%'
      OR e.role ILIKE '%vice president%'
      OR e.role ILIKE '%vp%'
      OR e.role ILIKE '%chief%'
      OR e.role ILIKE '%director%'
      OR e.role ILIKE '%head of%'
      OR e.role ILIKE '%founder%'
      OR e.role ILIKE '%owner%'
      OR e.job_title ILIKE '%ceo%'
      OR e.job_title ILIKE '%cto%'
      OR e.job_title ILIKE '%cfo%'
      OR e.job_title ILIKE '%coo%'
      OR e.job_title ILIKE '%president%'
      OR e.job_title ILIKE '%vice president%'
      OR e.job_title ILIKE '%vp%'
      OR e.job_title ILIKE '%chief%'
      OR e.job_title ILIKE '%director%'
      OR e.job_title ILIKE '%head of%'
      OR e.job_title ILIKE '%founder%'
      OR e.job_title ILIKE '%owner%'
    )
  ORDER BY
    -- Prioritize by location match
    match_score,
    -- Then by name
    e.first_name;
END;
$$ LANGUAGE plpgsql;
