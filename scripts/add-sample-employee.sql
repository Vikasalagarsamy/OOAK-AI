-- Add a sample employee for testing
INSERT INTO employees (
    employee_id,
    first_name,
    last_name,
    email,
    phone,
    status,
    job_title,
    department_id,
    created_at,
    updated_at
) VALUES (
    'EMP001',
    'John',
    'Doe',
    'john.doe@example.com',
    '1234567890',
    'active',
    'Sales Representative',
    (SELECT id FROM departments WHERE name = 'Sales' LIMIT 1),
    NOW(),
    NOW()
)
ON CONFLICT (employee_id) DO NOTHING;

-- Add department if it doesn't exist
INSERT INTO departments (name, description)
VALUES ('Sales', 'Sales Department')
ON CONFLICT (name) DO NOTHING; 