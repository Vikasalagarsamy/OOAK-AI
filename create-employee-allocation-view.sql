-- Create a view for employee allocations to make querying easier
CREATE OR REPLACE VIEW employee_allocations_view AS
SELECT 
  e.id as employee_id,
  e.employee_id as employee_code,
  e.first_name,
  e.last_name,
  e.status,
  e.job_title,
  e.department_id,
  d.name as department_name,
  ec.company_id,
  c.name as company_name,
  ec.branch_id,
  b.name as branch_name,
  ec.allocation_percentage,
  ec.is_primary
FROM 
  employees e
LEFT JOIN 
  employee_companies ec ON e.id = ec.employee_id
LEFT JOIN 
  companies c ON ec.company_id = c.id
LEFT JOIN 
  branches b ON ec.branch_id = b.id
LEFT JOIN
  departments d ON e.department_id = d.id
WHERE 
  e.status = 'active';
