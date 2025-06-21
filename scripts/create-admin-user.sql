-- Create Administrator role if it doesn't exist
INSERT INTO roles (id, title, description, is_admin, permissions)
VALUES (1, 'Administrator', 'Full system access', true, '["*"]')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_admin = EXCLUDED.is_admin,
  permissions = EXCLUDED.permissions;

-- Create admin employee if it doesn't exist
INSERT INTO employees (
  id,
  employee_id,
  first_name,
  last_name,
  email,
  username,
  password_hash,
  role_id,
  is_active,
  status
)
VALUES (
  1,
  'EMP001',
  'Admin',
  'User',
  'admin@example.com',
  'admin',
  '$2b$10$sEIIqddCmP8fP3vEy14mWODe6mXQ2ZZIp.NmaCBYJf8n2k2VqLRZ6', -- This is the hash for 'password123'
  1,
  true,
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active; 