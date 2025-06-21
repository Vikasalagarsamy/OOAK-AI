-- Setup sample team data for testing team performance features
-- This script adds sample employees and departments if they don't exist

-- Insert departments if they don't exist
INSERT INTO departments (id, name, description) 
SELECT 1, 'Administration', 'Administrative department'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 1);

INSERT INTO departments (id, name, description) 
SELECT 2, 'Sales', 'Sales department'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 2);

INSERT INTO departments (id, name, description) 
SELECT 3, 'HR', 'Human Resources department'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE id = 3);

-- Insert sample employees if none exist
INSERT INTO employees (name, email, department_id, created_at, updated_at)
SELECT 'Vikas Alagarsamy', 'vikas@example.com', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'vikas@example.com');

INSERT INTO employees (name, email, department_id, created_at, updated_at)
SELECT 'Sarah Johnson', 'sarah@example.com', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'sarah@example.com');

INSERT INTO employees (name, email, department_id, created_at, updated_at)
SELECT 'Mike Chen', 'mike@example.com', 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'mike@example.com');

-- Display current employee count
SELECT 
    d.name as department,
    COUNT(e.id) as employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY d.id;

-- Show all employees with their departments
SELECT 
    e.id,
    e.name,
    e.email,
    d.name as department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY e.id; 