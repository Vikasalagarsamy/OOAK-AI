-- Check if the menu_items table exists
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check if the table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Update the menu item for 'Menu Permissions'
        UPDATE menu_items
        SET 
            title = 'Menu & Role Permissions',
            description = 'Configure role-based menu permissions and access controls'
        WHERE url = '/admin/menu-permissions';
        
        -- Delete the 'Role Permissions' menu item
        DELETE FROM menu_items
        WHERE url = '/admin/role-permissions';
        
        RAISE NOTICE 'Menu items updated successfully.';
    ELSE
        RAISE NOTICE 'The menu_items table does not exist.';
    END IF;
END $$;
