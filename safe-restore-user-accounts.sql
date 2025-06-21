-- Safe Emergency Restore - Only add missing essential data

-- Check current state
SELECT 'Current database state:' as info;
SELECT 'roles' as table_name, COUNT(*) as count FROM roles
UNION ALL
SELECT 'user_accounts', COUNT(*) FROM user_accounts
UNION ALL  
SELECT 'departments', COUNT(*) FROM departments
ORDER BY table_name;

-- Step 1: Create essential roles first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id = 1) THEN
        INSERT INTO roles (id, title, name, description, is_system_role, is_admin, created_at, updated_at) 
        VALUES (1, 'Administrator', 'administrator', 'Full system access', true, true, NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id = 2) THEN
        INSERT INTO roles (id, title, name, description, is_system_role, is_admin, created_at, updated_at) 
        VALUES (2, 'Sales Executive', 'sales_executive', 'Sales team member with limited access', true, false, NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM roles WHERE id = 3) THEN
        INSERT INTO roles (id, title, name, description, is_system_role, is_admin, created_at, updated_at) 
        VALUES (3, 'Sales Manager', 'sales_manager', 'Sales team manager with expanded access', true, false, NOW(), NOW());
    END IF;
END $$;

-- Step 2: Ensure departments exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM departments WHERE id = 1) THEN
        INSERT INTO departments (id, name, description, created_at, updated_at) 
        VALUES (1, 'Administration', 'Administrative department', NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM departments WHERE id = 2) THEN
        INSERT INTO departments (id, name, description, created_at, updated_at) 
        VALUES (2, 'Sales', 'Sales and marketing department', NOW(), NOW());
    END IF;
END $$;

-- Step 3: Ensure designations exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM designations WHERE id = 1) THEN
        INSERT INTO designations (id, name, department_id, description, created_at, updated_at) 
        VALUES (1, 'Administrator', 1, 'System administrator', NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM designations WHERE id = 2) THEN
        INSERT INTO designations (id, name, department_id, description, created_at, updated_at) 
        VALUES (2, 'Sales Executive', 2, 'Sales team member', NOW(), NOW());
    END IF;
END $$;

-- Step 4: Ensure companies exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM companies WHERE id = 1) THEN
        INSERT INTO companies (id, name, address, phone, email, created_at, updated_at) 
        VALUES (1, 'Main Company', '123 Business St', '+1234567890', 'info@company.com', NOW(), NOW());
    END IF;
END $$;

-- Step 5: Ensure branches exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM branches WHERE id = 1) THEN
        INSERT INTO branches (id, name, company_id, address, phone, created_at, updated_at) 
        VALUES (1, 'Main Branch', 1, '123 Business St', '+1234567890', NOW(), NOW());
    END IF;
END $$;

-- Step 6: Create employees first (needed for user_accounts foreign key)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP001') THEN
        INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, job_title, department_id, designation_id, primary_company_id, home_branch_id, hire_date, status, created_at, updated_at) 
        VALUES (1, 'EMP001', 'Vikas', 'Alagarsamy', 'vikas.alagarsamy1987@example.com', '+1234567890', 'Administrator', 1, 1, 1, 1, '2024-01-01', 'active', NOW(), NOW());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = 'EMP007') THEN
        INSERT INTO employees (id, employee_id, first_name, last_name, email, phone, job_title, department_id, designation_id, primary_company_id, home_branch_id, hire_date, status, created_at, updated_at) 
        VALUES (7, 'EMP007', 'Pradeep', 'Kumar', 'pradeep@example.com', '+1234567891', 'Sales Executive', 2, 2, 1, 1, '2024-01-01', 'active', NOW(), NOW());
    END IF;
END $$;

-- Step 7: Now create user accounts with proper employee_id references
DO $$
BEGIN
    -- Admin account
    IF NOT EXISTS (SELECT 1 FROM user_accounts WHERE username = 'vikas.alagarsamy1987') THEN
        INSERT INTO user_accounts (id, employee_id, username, email, password_hash, role_id, is_active, created_at, updated_at) 
        VALUES (1, 1, 'vikas.alagarsamy1987', 'vikas.alagarsamy1987@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthJOFKdjpEMHvS', 1, true, NOW(), NOW());
    ELSE
        UPDATE user_accounts SET 
            employee_id = 1,
            email = 'vikas.alagarsamy1987@example.com',
            password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthJOFKdjpEMHvS',
            role_id = 1,
            is_active = true,
            updated_at = NOW()
        WHERE username = 'vikas.alagarsamy1987';
    END IF;
    
    -- Sales executive account
    IF NOT EXISTS (SELECT 1 FROM user_accounts WHERE username = 'pradeep') THEN
        INSERT INTO user_accounts (id, employee_id, username, email, password_hash, role_id, is_active, created_at, updated_at) 
        VALUES (7, 7, 'pradeep', 'pradeep@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthJOFKdjpEMHvS', 2, true, NOW(), NOW());
    ELSE
        UPDATE user_accounts SET 
            employee_id = 7,
            email = 'pradeep@example.com',
            password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewthJOFKdjpEMHvS',
            role_id = 2,
            is_active = true,
            updated_at = NOW()
        WHERE username = 'pradeep';
    END IF;
END $$;

-- Final verification
SELECT 'Verification results:' as info;
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

-- Show restored accounts
SELECT 'Restored accounts:' as info, ua.id, ua.username, ua.email, ua.role_id, r.title as role_title, ua.is_active 
FROM user_accounts ua
JOIN roles r ON ua.role_id = r.id
WHERE ua.username IN ('vikas.alagarsamy1987', 'pradeep')
ORDER BY ua.id; 