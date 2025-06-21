-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_id BIGINT REFERENCES roles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS employees_email_idx ON employees(email);

-- Create index on role_id for faster joins
CREATE INDEX IF NOT EXISTS employees_role_id_idx ON employees(role_id);

-- Add RLS policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins can do everything" ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN role_menu_permissions rmp ON r.id = rmp.role_id
      JOIN menu_items mi ON rmp.menu_item_id = mi.id
      WHERE mi.path = '/admin/employee-roles'
      AND r.id IN (
        SELECT role_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow users to view their own role
CREATE POLICY "Users can view their own role" ON employees
  FOR SELECT
  TO authenticated
  USING (
    email = (
      SELECT email FROM auth.users
      WHERE id = auth.uid()
    )
  ); 