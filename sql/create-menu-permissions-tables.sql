-- Create a table for menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES menu_items(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  path VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a table for role permissions on menu items
CREATE TABLE IF NOT EXISTS role_menu_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, menu_item_id)
);

-- Add some default menu items
INSERT INTO menu_items (id, parent_id, name, description, icon, path, sort_order, is_visible)
VALUES 
  (1, NULL, 'Dashboard', 'Main dashboard', 'dashboard', '/', 10, true),
  (2, NULL, 'Organization', 'Organization management', 'building', '/organization', 20, true),
  (3, 2, 'Companies', 'Manage companies', 'building-2', '/organization/companies', 10, true),
  (4, 2, 'Branches', 'Manage branches', 'git-branch', '/organization/branches', 20, true),
  (5, 2, 'Vendors', 'Manage vendors', 'truck', '/organization/vendors', 30, true),
  (6, 2, 'Suppliers', 'Manage suppliers', 'package', '/organization/suppliers', 40, true),
  (7, 2, 'Clients', 'Manage clients', 'users', '/organization/clients', 50, true),
  (8, 2, 'User Roles', 'Manage user roles', 'shield', '/organization/roles', 60, true),
  (9, 2, 'Account Creation', 'Create user accounts', 'user-plus', '/organization/account-creation', 70, true),
  (10, NULL, 'People', 'People management', 'users', '/people', 30, true),
  (11, 10, 'Employees', 'Manage employees', 'user', '/people/employees', 10, true),
  (12, 10, 'Departments', 'Manage departments', 'boxes', '/people/departments', 20, true),
  (13, 10, 'Designations', 'Manage designations', 'award', '/people/designations', 30, true),
  (14, NULL, 'Sales', 'Sales management', 'shopping-cart', '/sales', 40, true),
  (15, 14, 'My Leads', 'View my leads', 'list-checks', '/sales/my-leads', 10, true),
  (16, 14, 'Create Lead', 'Create a new lead', 'plus-circle', '/sales/create-lead', 20, true),
  (17, 14, 'Manage Lead', 'Manage leads', 'clipboard-list', '/sales/manage-lead', 30, true),
  (18, 14, 'Unassigned Lead', 'Unassigned leads', 'clipboard', '/sales/unassigned-lead', 40, true),
  (19, 14, 'Lead Sources', 'Manage lead sources', 'filter', '/sales/lead-sources', 50, true)
ON CONFLICT (id) DO NOTHING;

-- Ensure Administrator role has all permissions
DO $$
DECLARE
  admin_role_id INTEGER;
BEGIN
  -- Find the Administrator role ID
  SELECT id INTO admin_role_id FROM roles WHERE title = 'Administrator' LIMIT 1;
  
  -- If Administrator role exists, grant all permissions
  IF admin_role_id IS NOT NULL THEN
    INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
    SELECT 
      admin_role_id,
      id,
      true, -- can_view
      true, -- can_add
      true, -- can_edit
      true  -- can_delete
    FROM menu_items
    ON CONFLICT (role_id, menu_item_id) 
    DO UPDATE SET 
      can_view = true,
      can_add = true,
      can_edit = true,
      can_delete = true,
      updated_at = CURRENT_TIMESTAMP;
  END IF;
END $$;
