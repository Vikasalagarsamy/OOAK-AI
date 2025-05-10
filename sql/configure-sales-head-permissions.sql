-- First, check if the 'sales head' role exists, create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(title) = 'sales head') THEN
        INSERT INTO roles (title, description)
        VALUES ('Sales Head', 'Manages sales team and operations');
    END IF;
END $$;

-- Get the ID of the 'sales head' role
WITH sales_head_role AS (
    SELECT id FROM roles WHERE LOWER(title) = 'sales head'
)

-- Clear existing permissions for the 'sales head' role
DELETE FROM role_menu_permissions
WHERE role_id = (SELECT id FROM sales_head_role);

-- Insert appropriate permissions for the 'sales head' role
-- First, identify the menu items that the sales head should have access to
WITH sales_head_role AS (
    SELECT id FROM roles WHERE LOWER(title) = 'sales head'
),
sales_menus AS (
    -- Dashboard
    SELECT id FROM menu_items WHERE path = '/' OR path LIKE '/dashboard%'
    UNION
    -- Sales related menus
    SELECT id FROM menu_items WHERE path LIKE '/sales%'
    UNION
    -- Reports related to sales
    SELECT id FROM menu_items WHERE path LIKE '/reports/lead-sources%'
    UNION
    -- Profile and account settings
    SELECT id FROM menu_items WHERE path LIKE '/profile%' OR path LIKE '/account%'
)

-- Insert permissions for these menus
INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
SELECT 
    (SELECT id FROM sales_head_role),
    id,
    TRUE, -- can_view
    TRUE, -- can_add
    TRUE, -- can_edit
    FALSE -- can_delete (restrict deletion for safety)
FROM sales_menus;

-- Explicitly deny access to administrative menus
WITH sales_head_role AS (
    SELECT id FROM roles WHERE LOWER(title) = 'sales head'
),
admin_menus AS (
    -- Administrative menus
    SELECT id FROM menu_items WHERE path LIKE '/admin%'
    UNION
    -- Organization management
    SELECT id FROM menu_items WHERE path LIKE '/organization/roles%' OR path LIKE '/organization/account-creation%'
)

-- Ensure these menus are explicitly denied
INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
SELECT 
    (SELECT id FROM sales_head_role),
    id,
    FALSE, -- can_view
    FALSE, -- can_add
    FALSE, -- can_edit
    FALSE  -- can_delete
FROM admin_menus
ON CONFLICT (role_id, menu_item_id) DO UPDATE
SET can_view = FALSE, can_add = FALSE, can_edit = FALSE, can_delete = FALSE;
