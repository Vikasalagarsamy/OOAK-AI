-- First, check if the 'Accountant' role exists, create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM roles WHERE LOWER(title) = 'accountant') THEN
        INSERT INTO roles (title, description)
        VALUES ('Accountant', 'Manages financial accounts and transactions');
    END IF;
END $$;

-- Get the ID of the 'Accountant' role
WITH accountant_role AS (
    SELECT id FROM roles WHERE LOWER(title) = 'accountant'
)

-- Clear existing permissions for the 'Accountant' role
DELETE FROM role_menu_permissions
WHERE role_id = (SELECT id FROM accountant_role);

-- Insert appropriate permissions for the 'Accountant' role
-- First, identify the menu items that the accountant should have access to
WITH accountant_role AS (
    SELECT id FROM roles WHERE LOWER(title) = 'accountant'
),
accounting_menus AS (
    -- Dashboard
    SELECT id FROM menu_items WHERE path = '/' OR path LIKE '/dashboard%'
    UNION
    -- Accounting & Finance menus
    SELECT id FROM menu_items WHERE path LIKE '/accounting%'
    UNION
    -- Financial reports
    SELECT id FROM menu_items WHERE path LIKE '/reports/financial%'
    UNION
    -- Profile and account settings
    SELECT id FROM menu_items WHERE path LIKE '/profile%' OR path LIKE '/account%'
)

-- Insert permissions for these menus
INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
SELECT 
    (SELECT id FROM accountant_role),
    id,
    TRUE, -- can_view
    TRUE, -- can_add
    TRUE, -- can_edit
    TRUE  -- can_delete (accountants need full control over financial records)
FROM accounting_menus;

-- Explicitly deny access to non-accounting menus
WITH accountant_role AS (
    SELECT id FROM roles WHERE LOWER(title) = 'accountant'
),
non_accounting_menus AS (
    -- Sales menus
    SELECT id FROM menu_items WHERE path LIKE '/sales%'
    UNION
    -- Organization management
    SELECT id FROM menu_items WHERE path LIKE '/organization%'
    UNION
    -- People management
    SELECT id FROM menu_items WHERE path LIKE '/people%'
    UNION
    -- Administrative menus
    SELECT id FROM menu_items WHERE path LIKE '/admin%'
    UNION
    -- Event coordination
    SELECT id FROM menu_items WHERE path LIKE '/events%'
)

-- Ensure these menus are explicitly denied
INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
SELECT 
    (SELECT id FROM accountant_role),
    id,
    FALSE, -- can_view
    FALSE, -- can_add
    FALSE, -- can_edit
    FALSE  -- can_delete
FROM non_accounting_menus
ON CONFLICT (role_id, menu_item_id) DO UPDATE
SET can_view = FALSE, can_add = FALSE, can_edit = FALSE, can_delete = FALSE; 