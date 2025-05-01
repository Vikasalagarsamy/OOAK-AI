-- Create a function to retrieve comprehensive employee data
CREATE OR REPLACE FUNCTION get_comprehensive_employee_data()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT 
    json_build_object(
      'id', e.id,
      'employee_id', e.employee_id,
      'first_name', e.first_name,
      'last_name', e.last_name,
      'email', e.email,
      'phone', e.phone,
      'job_title', e.job_title,
      'hire_date', e.hire_date,
      'status', e.status,
      'notes', e.notes,
      'created_at', e.created_at,
      'updated_at', e.updated_at,
      
      'department_id', d.id,
      'department_name', d.name,
      
      'designation_id', des.id,
      'designation_title', des.name,
      
      'branch_id', b.id,
      'branch_name', b.name,
      'branch_location', b.location,
      
      'primary_company_name', (
        SELECT c.name
        FROM employee_companies ec
        JOIN companies c ON ec.company_id = c.id
        WHERE ec.employee_id = e.id AND ec.is_primary = true
        LIMIT 1
      ),
      
      'company_associations', (
        SELECT 
          json_agg(
            json_build_object(
              'id', ec.id,
              'company_id', ec.company_id,
              'company_name', c.name,
              'is_primary', ec.is_primary,
              'role_title', ec.role_title,
              'responsibilities', ec.responsibilities,
              'start_date', ec.start_date,
              'end_date', ec.end_date,
              'percentage', ec.percentage
            )
          )
        FROM employee_companies ec
        JOIN companies c ON ec.company_id = c.id
        WHERE ec.employee_id = e.id
      )
    )
  FROM 
    employees e
  LEFT JOIN 
    departments d ON e.department_id = d.id
  LEFT JOIN 
    designations des ON e.designation_id = des.id
  LEFT JOIN 
    branches b ON e.branch_id = b.id
  ORDER BY 
    e.first_name, e.last_name;
END;
$$ LANGUAGE plpgsql;
