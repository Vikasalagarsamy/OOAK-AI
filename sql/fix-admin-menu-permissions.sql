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
        
        RAISE NOTICE 'Administrator permissions reset successfully';
    ELSE
        RAISE NOTICE 'Administrator role not found';
    END IF;
END
$$;
