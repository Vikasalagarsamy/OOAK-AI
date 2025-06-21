-- 🚨 EMERGENCY: Restore Essential User Accounts and Roles
-- This restores the basic data needed for authentication

-- 1. Clean up any problematic roles first
DELETE FROM roles WHERE title IS NULL OR title = '';
UPDATE roles SET title = 'Unknown Role' WHERE title IS NULL;

-- 1. Restore Roles (using UPSERT to handle existing data)
INSERT INTO roles (id, title, description, created_at, updated_at) VALUES
(1, 'Administrator', 'Full system access', NOW(), NOW()),
(2, 'Sales Executive', 'Sales team member with limited access', NOW(), NOW()),
(3, 'Sales Manager', 'Sales team manager with expanded access', NOW(), NOW()),
(4, 'Employee', 'Basic employee access', NOW(), NOW()),
(5, 'CTO', 'Chief Technology Officer', NOW(), NOW()),
(10, 'Manager', 'Department manager', NOW(), NOW()),
(11, 'Team Leader', 'Team leadership role', NOW(), NOW()),
(12, 'PP Manager', 'Project/Product manager', NOW(), NOW()),
(13, 'Sales Head', 'Head of sales department', NOW(), NOW()),
(14, 'HR Admin', 'Human resources administrator', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 2. Restore Essential User Accounts
INSERT INTO user_accounts (id, username, email, password_hash, role_id, is_active, created_at, updated_at) VALUES
(1, 'vikas.alagarsamy1987', 'vikas.alagarsamy1987@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthJOFKdjpEMHvS', 1, true, NOW(), NOW()),
(7, 'pradeep', 'pradeep@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthJOFKdjpEMHvS', 2, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. Restore Basic Departments (needed for employees)
INSERT INTO departments (id, name, description, created_at, updated_at) VALUES
(1, 'Administration', 'Administrative department', NOW(), NOW()),
(2, 'Sales', 'Sales and marketing department', NOW(), NOW()),
(3, 'Technology', 'IT and development department', NOW(), NOW()),
(4, 'Human Resources', 'HR department', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 4. Restore Basic Designations (needed for employees)
INSERT INTO designations (id, title, department_id, description, created_at, updated_at) VALUES
(1, 'Administrator', 1, 'System administrator', NOW(), NOW()),
(2, 'Sales Executive', 2, 'Sales team member', NOW(), NOW()),
(3, 'Sales Manager', 2, 'Sales team manager', NOW(), NOW()),
(4, 'CTO', 3, 'Chief Technology Officer', NOW(), NOW()),
(5, 'HR Manager', 4, 'Human Resources Manager', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  department_id = EXCLUDED.department_id,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 5. Restore Basic Companies (needed for employees)
INSERT INTO companies (id, name, address, phone, email, created_at, updated_at) VALUES
(1, 'Main Company', '123 Business St', '+1234567890', 'info@company.com', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  updated_at = NOW();

-- 6. Restore Basic Branches (needed for employees)
INSERT INTO branches (id, name, company_id, address, phone, created_at, updated_at) VALUES
(1, 'Main Branch', 1, '123 Business St', '+1234567890', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  company_id = EXCLUDED.company_id,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- 7. Restore Basic Employees (linked to user accounts)
INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, job_title, department_id, designation_id, company_id, branch_id, hire_date, status, created_at, updated_at) VALUES
(1, 'EMP001', 'Vikas', 'Alagarsamy', 'vikas.alagarsamy1987@example.com', '+1234567890', 'Administrator', 1, 1, 1, 1, '2024-01-01', 'active', NOW(), NOW()),
(2, 'EMP007', 'Pradeep', 'Kumar', 'pradeep@example.com', '+1234567891', 'Sales Executive', 2, 2, 1, 1, '2024-01-01', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  employee_id = EXCLUDED.employee_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  job_title = EXCLUDED.job_title,
  department_id = EXCLUDED.department_id,
  designation_id = EXCLUDED.designation_id,
  company_id = EXCLUDED.company_id,
  branch_id = EXCLUDED.branch_id,
  hire_date = EXCLUDED.hire_date,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 8. Verify restoration
SELECT 'roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'user_accounts', COUNT(*) FROM user_accounts
UNION ALL  
SELECT 'departments', COUNT(*) FROM departments
UNION ALL
SELECT 'designations', COUNT(*) FROM designations
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'branches', COUNT(*) FROM branches
UNION ALL
SELECT 'employees', COUNT(*) FROM employees;

-- Show user accounts
SELECT 'User Accounts:' as info, id, username, email, role_id, is_active FROM user_accounts ORDER BY id; 