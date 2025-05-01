-- Insert sample departments
INSERT INTO departments (name, description)
VALUES 
  ('Engineering', 'Software development and engineering team'),
  ('Marketing', 'Marketing and communications team'),
  ('Sales', 'Sales and business development team'),
  ('Human Resources', 'HR and recruitment team'),
  ('Finance', 'Finance and accounting team')
ON CONFLICT (name) DO NOTHING;

-- Insert sample designations
INSERT INTO designations (name, description)
VALUES 
  ('Junior Developer', 'Entry-level software developer'),
  ('Senior Developer', 'Experienced software developer'),
  ('Team Lead', 'Technical team leader'),
  ('Manager', 'Department manager'),
  ('Director', 'Department director'),
  ('VP', 'Vice President'),
  ('C-Level', 'Executive leadership')
ON CONFLICT (name) DO NOTHING;

-- Insert sample employees
INSERT INTO employees (
  employee_id, first_name, last_name, email, phone, 
  address, city, state, zip_code, country, 
  hire_date, status, department_id, designation_id, job_title, 
  home_branch_id, primary_company_id
)
SELECT
  'EMP-23-' || LPAD(CAST(n AS TEXT), 4, '0'),
  CASE 
    WHEN n % 10 = 1 THEN 'John'
    WHEN n % 10 = 2 THEN 'Jane'
    WHEN n % 10 = 3 THEN 'Michael'
    WHEN n % 10 = 4 THEN 'Emily'
    WHEN n % 10 = 5 THEN 'David'
    WHEN n % 10 = 6 THEN 'Sarah'
    WHEN n % 10 = 7 THEN 'Robert'
    WHEN n % 10 = 8 THEN 'Lisa'
    WHEN n % 10 = 9 THEN 'William'
    ELSE 'Jennifer'
  END,
  CASE 
    WHEN n % 8 = 1 THEN 'Smith'
    WHEN n % 8 = 2 THEN 'Johnson'
    WHEN n % 8 = 3 THEN 'Williams'
    WHEN n % 8 = 4 THEN 'Brown'
    WHEN n % 8 = 5 THEN 'Jones'
    WHEN n % 8 = 6 THEN 'Miller'
    WHEN n % 8 = 7 THEN 'Davis'
    ELSE 'Wilson'
  END,
  LOWER(
    CASE 
      WHEN n % 10 = 1 THEN 'john'
      WHEN n % 10 = 2 THEN 'jane'
      WHEN n % 10 = 3 THEN 'michael'
      WHEN n % 10 = 4 THEN 'emily'
      WHEN n % 10 = 5 THEN 'david'
      WHEN n % 10 = 6 THEN 'sarah'
      WHEN n % 10 = 7 THEN 'robert'
      WHEN n % 10 = 8 THEN 'lisa'
      WHEN n % 10 = 9 THEN 'william'
      ELSE 'jennifer'
    END || '.' ||
    CASE 
      WHEN n % 8 = 1 THEN 'smith'
      WHEN n % 8 = 2 THEN 'johnson'
      WHEN n % 8 = 3 THEN 'williams'
      WHEN n % 8 = 4 THEN 'brown'
      WHEN n % 8 = 5 THEN 'jones'
      WHEN n % 8 = 6 THEN 'miller'
      WHEN n % 8 = 7 THEN 'davis'
      ELSE 'wilson'
    END || n || '@example.com'
  ),
  '+1-555-' || LPAD(CAST(n * 123 % 10000 AS TEXT), 4, '0'),
  '123 Main St, Apt ' || n,
  CASE 
    WHEN n % 5 = 0 THEN 'New York'
    WHEN n % 5 = 1 THEN 'Los Angeles'
    WHEN n % 5 = 2 THEN 'Chicago'
    WHEN n % 5 = 3 THEN 'Houston'
    ELSE 'Phoenix'
  END,
  CASE 
    WHEN n % 5 = 0 THEN 'NY'
    WHEN n % 5 = 1 THEN 'CA'
    WHEN n % 5 = 2 THEN 'IL'
    WHEN n % 5 = 3 THEN 'TX'
    ELSE 'AZ'
  END,
  LPAD(CAST(n * 10000 % 100000 AS TEXT), 5, '0'),
  'USA',
  CASE 
    WHEN n % 4 = 0 THEN '2023-01-15'
    WHEN n % 4 = 1 THEN '2022-06-20'
    WHEN n % 4 = 2 THEN '2021-11-05'
    ELSE '2023-03-10'
  END,
  CASE 
    WHEN n % 10 = 0 THEN 'active'
    WHEN n % 10 = 1 THEN 'active'
    WHEN n % 10 = 2 THEN 'active'
    WHEN n % 10 = 3 THEN 'active'
    WHEN n % 10 = 4 THEN 'active'
    WHEN n % 10 = 5 THEN 'active'
    WHEN n % 10 = 6 THEN 'active'
    WHEN n % 10 = 7 THEN 'inactive'
    WHEN n % 10 = 8 THEN 'on_leave'
    ELSE 'terminated'
  END,
  (n % 5) + 1,
  (n % 7) + 1,
  CASE 
    WHEN n % 5 = 0 AND n % 7 = 0 THEN 'Software Engineer'
    WHEN n % 5 = 0 AND n % 7 = 1 THEN 'Senior Software Engineer'
    WHEN n % 5 = 0 AND n % 7 = 2 THEN 'Tech Lead'
    WHEN n % 5 = 1 AND n % 7 = 0 THEN 'Marketing Specialist'
    WHEN n % 5 = 1 AND n % 7 = 1 THEN 'Marketing Manager'
    WHEN n % 5 = 2 AND n % 7 = 0 THEN 'Sales Representative'
    WHEN n % 5 = 2 AND n % 7 = 1 THEN 'Sales Manager'
    WHEN n % 5 = 3 AND n % 7 = 0 THEN 'HR Specialist'
    WHEN n % 5 = 3 AND n % 7 = 1 THEN 'HR Manager'
    WHEN n % 5 = 4 AND n % 7 = 0 THEN 'Financial Analyst'
    WHEN n % 5 = 4 AND n % 7 = 1 THEN 'Finance Manager'
    ELSE 'Associate'
  END,
  (n % 3) + 1,
  (n % 2) + 1
FROM generate_series(1, 50) AS n
ON CONFLICT (employee_id) DO NOTHING;

-- Insert employee company allocations
INSERT INTO employee_companies (
  employee_id, company_id, branch_id, allocation_percentage, is_primary
)
SELECT 
  e.id,
  e.primary_company_id,
  e.home_branch_id,
  100,
  TRUE
FROM employees e
WHERE NOT EXISTS (
  SELECT 1 FROM employee_companies ec WHERE ec.employee_id = e.id
)
AND e.primary_company_id IS NOT NULL
AND e.home_branch_id IS NOT NULL;
