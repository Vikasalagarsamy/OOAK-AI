-- Check if User Accounts menu item exists
SELECT * FROM menu_items WHERE path = '/organization/user-accounts';

-- If it doesn't exist, create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM menu_items WHERE path = '/organization/user-accounts') THEN
        -- Find the Organization parent ID
        DECLARE org_id INTEGER;
        BEGIN
            SELECT id INTO org_id FROM menu_items WHERE name = 'Organization' AND parent_id IS NULL;
            
            -- Insert User Accounts menu item
            INSERT INTO menu_items (parent_id, name, icon, path, sort_order, is_visible)
            VALUES (org_id, 'User Accounts', 'Users', '/organization/user-accounts', 40, true);
        END;
    ELSE
        -- Update existing User Accounts menu item to ensure it's visible
        UPDATE menu_items 
        SET is_visible = true, 
            icon = 'Users'
        WHERE path = '/organization/user-accounts';
    END IF;
END
$$;

-- Ensure Administrator role has permissions for User Accounts menu item
DO $$
DECLARE
    admin_role_id INTEGER;
    user_accounts_menu_id INTEGER;
BEGIN
    -- Get Administrator role ID
    SELECT id INTO admin_role_id FROM roles WHERE title = 'Administrator';
    
    -- Get User Accounts menu item ID
    SELECT id INTO user_accounts_menu_id FROM menu_items WHERE path = '/organization/user-accounts';
    
    -- If both exist, ensure permissions are set
    IF admin_role_id IS NOT NULL AND user_accounts_menu_id IS NOT NULL THEN
        -- Delete any existing permissions to avoid conflicts
        DELETE FROM role_menu_permissions 
        WHERE role_id = admin_role_id AND menu_item_id = user_accounts_menu_id;
        
        -- Insert full permissions
        INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
        VALUES (admin_role_id, user_accounts_menu_id, true, true, true, true);
    END IF;
END
$$;

-- Check if Account Creation menu item exists and update it
UPDATE menu_items 
SET is_visible = false
WHERE path = '/organization/account-creation';

-- Show the updated menu items
SELECT id, parent_id, name, path, icon, is_visible, sort_order 
FROM menu_items 
WHERE path IN ('/organization/user-accounts', '/organization/account-creation')
OR name IN ('User Accounts', 'Account Creation');
