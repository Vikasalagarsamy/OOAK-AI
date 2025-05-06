-- First, check if we have menu items
SELECT COUNT(*) FROM menu_items;

-- If no menu items exist, create some basic ones
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM menu_items) = 0 THEN
    -- Insert parent menu items
    INSERT INTO menu_items (name, description, icon, path, sort_order, is_visible)
    VALUES 
      ('Dashboard', 'Main dashboard', 'LayoutDashboard', '/', 10, true),
      ('Organization', 'Organization management', 'Building2', '/organization', 20, true),
      ('People', 'People management', 'Users', '/people', 30, true),
      ('Sales', 'Sales management', 'BarChart', '/sales', 40, true);
      
    -- Insert child menu items for Organization
    INSERT INTO menu_items (parent_id, name, description, icon, path, sort_order, is_visible)
    VALUES 
      ((SELECT id FROM menu_items WHERE name = 'Organization' LIMIT 1), 'Companies', 'Manage companies', 'Building', '/organization/companies', 10, true),
      ((SELECT id FROM menu_items WHERE name = 'Organization' LIMIT 1), 'Branches', 'Manage branches', 'GitBranch', '/organization/branches', 20, true),
      ((SELECT id FROM menu_items WHERE name = 'Organization' LIMIT 1), 'Clients', 'Manage clients', 'Users', '/organization/clients', 30, true),
      ((SELECT id FROM menu_items WHERE name = 'Organization' LIMIT 1), 'Vendors', 'Manage vendors', 'Truck', '/organization/vendors', 40, true),
      ((SELECT id FROM menu_items WHERE name = 'Organization' LIMIT 1), 'Suppliers', 'Manage suppliers', 'Package', '/organization/suppliers', 50, true),
      ((SELECT id FROM menu_items WHERE name = 'Organization' LIMIT 1), 'Roles', 'Manage roles', 'Shield', '/organization/roles', 60, true),
      ((SELECT id FROM menu_items WHERE name = 'Organization' LIMIT 1), 'User Accounts', 'Manage user accounts', 'UserCog', '/organization/user-accounts', 70, true);
      
    -- Insert child menu items for People
    INSERT INTO menu_items (parent_id, name, description, icon, path, sort_order, is_visible)
    VALUES 
      ((SELECT id FROM menu_items WHERE name = 'People' LIMIT 1), 'Dashboard', 'People dashboard', 'LayoutDashboard', '/people/dashboard', 10, true),
      ((SELECT id FROM menu_items WHERE name = 'People' LIMIT 1), 'Employees', 'Manage employees', 'Users', '/people/employees', 20, true),
      ((SELECT id FROM menu_items WHERE name = 'People' LIMIT 1), 'Departments', 'Manage departments', 'FolderKanban', '/people/departments', 30, true),
      ((SELECT id FROM menu_items WHERE name = 'People' LIMIT 1), 'Designations', 'Manage designations', 'BadgeCheck', '/people/designations', 40, true);
      
    -- Insert child menu items for Sales
    INSERT INTO menu_items (parent_id, name, description, icon, path, sort_order, is_visible)
    VALUES 
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Dashboard', 'Sales dashboard', 'LayoutDashboard', '/sales', 10, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Create Lead', 'Create new lead', 'UserPlus', '/sales/create-lead', 20, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'My Leads', 'View my leads', 'ListChecks', '/sales/my-leads', 30, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Unassigned Leads', 'View unassigned leads', 'UserMinus', '/sales/unassigned-lead', 40, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Follow Up', 'Lead follow ups', 'PhoneCall', '/sales/follow-up', 50, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Quotation', 'Manage quotations', 'FileText', '/sales/quotation', 60, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Order Confirmation', 'Manage order confirmations', 'CheckCircle', '/sales/order-confirmation', 70, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Rejected Leads', 'View rejected leads', 'XCircle', '/sales/rejected-leads', 80, true),
      ((SELECT id FROM menu_items WHERE name = 'Sales' LIMIT 1), 'Lead Sources', 'Manage lead sources', 'Database', '/sales/lead-sources', 90, true);
  END IF;
END $$;

-- Ensure Administrator role exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Administrator') THEN
    INSERT INTO roles (name, description, is_system_role)
    VALUES ('Administrator', 'System administrator with all permissions', true);
  END IF;
END $$;

-- Get Administrator role ID
DO $$
DECLARE
  admin_role_id INT;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'Administrator' LIMIT 1;
  
  -- Clear existing menu permissions for Administrator
  DELETE FROM role_menu_permissions WHERE role_id = admin_role_id;
  
  -- Grant all permissions to all menu items for Administrator
  INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
  SELECT 
    admin_role_id, 
    id, 
    true, 
    true, 
    true, 
    true
  FROM 
    menu_items;
    
  -- Ensure the user with ID 1 has Administrator role
  UPDATE user_accounts 
  SET role_id = admin_role_id
  WHERE id = 1;
END $$;

-- Check if the menu permissions are set correctly
SELECT 
  r.name AS role_name,
  mi.name AS menu_item,
  rmp.can_view,
  rmp.can_add,
  rmp.can_edit,
  rmp.can_delete
FROM 
  role_menu_permissions rmp
JOIN 
  roles r ON rmp.role_id = r.id
JOIN 
  menu_items mi ON rmp.menu_item_id = mi.id
WHERE 
  r.name = 'Administrator'
ORDER BY 
  mi.sort_order;
