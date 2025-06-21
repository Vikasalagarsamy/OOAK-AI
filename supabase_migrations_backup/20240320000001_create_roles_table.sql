-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS roles_name_idx ON roles(name);

-- Add RLS policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins can do everything" ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      JOIN role_menu_permissions rmp ON r.id = rmp.role_id
      JOIN menu_items mi ON rmp.menu_item_id = mi.id
      WHERE mi.path = '/organization/roles'
      AND r.id IN (
        SELECT role_id FROM user_roles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Allow users to view roles
CREATE POLICY "Users can view roles" ON roles
  FOR SELECT
  TO authenticated
  USING (true); 