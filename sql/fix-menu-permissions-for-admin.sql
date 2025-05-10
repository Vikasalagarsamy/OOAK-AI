-- This script fixes menu permissions for the Administrator role
-- First, identify the Administrator role
DO $$
DECLARE
    admin_role_id INTEGER;
BEGIN
    -- Get the Administrator role ID
    SELECT id INTO admin_role_id FROM roles WHERE title = 'Administrator' LIMIT 1;
    
    IF admin_role_id IS NULL THEN
        RAISE EXCEPTION 'Administrator role not found';
    END IF;
    
    -- Delete existing permissions for Administrator
    DELETE FROM role_menu_permissions WHERE role_id = admin_role_id;
    
    -- Insert full permissions for all menu items
    INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
    SELECT 
        admin_role_id,
        id,
        TRUE,
        TRUE,
        TRUE,
        TRUE
    FROM menu_items;
    
    -- Make sure all menu items are visible
    UPDATE menu_items SET is_visible = TRUE WHERE is_visible = FALSE;
    
    -- Ensure the Account Creation menu item exists and is visible
    IF EXISTS (SELECT 1 FROM menu_items WHERE name = 'Account Creation' OR path = '/organization/account-creation') THEN
        UPDATE menu_items 
        SET is_visible = TRUE 
        WHERE name = 'Account Creation' OR path = '/organization/account-creation';
    END IF;
    
    -- Ensure the User Accounts menu item exists and is visible
    IF EXISTS (SELECT 1 FROM menu_items WHERE name = 'User Accounts' OR path = '/organization/user-accounts') THEN
        UPDATE menu_items 
        SET is_visible = TRUE 
        WHERE name = 'User Accounts' OR path = '/organization/user-accounts';
    END IF;
    
    -- Ensure the Event Co-ordination menu exists and is visible
    IF EXISTS (SELECT 1 FROM menu_items WHERE name = 'Event Co-ordination') THEN
        UPDATE menu_items 
        SET is_visible = TRUE 
        WHERE name = 'Event Co-ordination';
    END IF;
    
    RAISE NOTICE 'Menu permissions fixed for Administrator role (ID: %)', admin_role_id;
END $$;
