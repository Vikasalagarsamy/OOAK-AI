-- First check if the menu_items table exists, create it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'menu_items') THEN
        CREATE TABLE menu_items (
            id SERIAL PRIMARY KEY,
            parent_id INTEGER REFERENCES menu_items(id),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            icon VARCHAR(100),
            path VARCHAR(255),
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_visible BOOLEAN NOT NULL DEFAULT true
        );
    END IF;
    
    -- Create role_menu_permissions table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_menu_permissions') THEN
        CREATE TABLE role_menu_permissions (
            id SERIAL PRIMARY KEY,
            role_id INTEGER NOT NULL,
            menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
            can_view BOOLEAN NOT NULL DEFAULT false,
            can_add BOOLEAN NOT NULL DEFAULT false,
            can_edit BOOLEAN NOT NULL DEFAULT false,
            can_delete BOOLEAN NOT NULL DEFAULT false,
            UNIQUE(role_id, menu_item_id)
        );
    END IF;
END
$$;

-- Insert default menu items if they don't exist
INSERT INTO menu_items (id, parent_id, name, icon, path, sort_order, is_visible)
VALUES 
    (1, NULL, 'Dashboard', 'LayoutDashboard', '/dashboard', 10, true),
    (2, NULL, 'Organization', 'Building2', NULL, 20, true),
    (3, 2, 'Companies', 'Building', '/organization/companies', 10, true),
    (4, 2, 'Branches', 'GitBranch', '/organization/branches', 20, true),
    (5, 2, 'Roles', 'Shield', '/organization/roles', 30, true),
    (6, 2, 'User Accounts', 'Users', '/organization/user-accounts', 40, true),
    (7, NULL, 'People', 'Users', NULL, 30, true),
    (8, 7, 'Dashboard', 'LayoutDashboard', '/people/dashboard', 10, true),
    (9, 7, 'Employees', 'User', '/people/employees', 20, true),
    (10, 7, 'Departments', 'Briefcase', '/people/departments', 30, true),
    (11, 7, 'Designations', 'BadgeCheck', '/people/designations', 40, true),
    (12, NULL, 'Sales', 'TrendingUp', NULL, 40, true),
    (13, 12, 'Dashboard', 'LayoutDashboard', '/sales', 10, true),
    (14, 12, 'Create Lead', 'FilePlus', '/sales/create-lead', 20, true),
    (15, 12, 'My Leads', 'ListChecks', '/sales/my-leads', 30, true),
    (16, 12, 'Unassigned Leads', 'List', '/sales/unassigned-lead', 40, true),
    (17, 12, 'Follow Up', 'Calendar', '/sales/follow-up', 50, true),
    (18, 12, 'Quotation', 'FileText', '/sales/quotation', 60, true),
    (19, 12, 'Order Confirmation', 'CheckCircle', '/sales/order-confirmation', 70, true),
    (20, 12, 'Rejected Leads', 'XCircle', '/sales/rejected-leads', 80, true),
    (21, 12, 'Lead Sources', 'Globe', '/sales/lead-sources', 90, true),
    (22, NULL, 'Admin', 'Settings', NULL, 999, true),
    (23, 22, 'Menu Permissions', 'Menu', '/admin/menu-permissions', 10, true),
    (24, 22, 'Menu Debug', 'Bug', '/admin/menu-debug', 20, true)
ON CONFLICT (id) DO NOTHING;

-- Get Administrator role ID
DO $$
DECLARE
    admin_role_id INTEGER;
BEGIN
    -- Find the Administrator role ID
    SELECT id INTO admin_role_id FROM roles WHERE title = 'Administrator' LIMIT 1;
    
    -- If Administrator role exists, grant all permissions
    IF admin_role_id IS NOT NULL THEN
        -- First delete any existing permissions for Administrator to avoid conflicts
        DELETE FROM role_menu_permissions WHERE role_id = admin_role_id;
        
        -- Insert permissions granting Administrator access to all menu items
        INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
        SELECT admin_role_id, id, true, true, true, true
        FROM menu_items;
        
        RAISE NOTICE 'Administrator permissions seeded successfully';
    ELSE
        RAISE NOTICE 'Administrator role not found';
    END IF;
END
$$;

-- Create a basic user role if it doesn't exist
DO $$
DECLARE
    basic_role_id INTEGER;
BEGIN
    -- Check if Basic User role exists, create if not
    IF NOT EXISTS (SELECT 1 FROM roles WHERE title = 'Basic User') THEN
        INSERT INTO roles (title, description) VALUES ('Basic User', 'Basic access with limited permissions');
        RAISE NOTICE 'Basic User role created';
    END IF;
    
    -- Get the Basic User role ID
    SELECT id INTO basic_role_id FROM roles WHERE title = 'Basic User' LIMIT 1;
    
    -- Grant basic permissions
    DELETE FROM role_menu_permissions WHERE role_id = basic_role_id;
    
    -- Dashboard access
    INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
    SELECT basic_role_id, id, true, false, false, false
    FROM menu_items 
    WHERE name = 'Dashboard' AND parent_id IS NULL;
    
    RAISE NOTICE 'Basic User permissions seeded successfully';
END
$$;
