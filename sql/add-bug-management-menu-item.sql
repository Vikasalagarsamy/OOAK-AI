-- Add the bug management menu item if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM menu_items WHERE path = '/admin/bugs') THEN
        INSERT INTO menu_items (name, description, path, icon, parent_id, sort_order)
        SELECT 'Bug Management', 'Track and manage system bugs', '/admin/bugs', 'bug', id, 
               (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM menu_items WHERE parent_id = menu_items.id)
        FROM menu_items
        WHERE name = 'Admin' OR path = '/admin'
        LIMIT 1;
        
        -- If we inserted the menu item, set permissions for administrators
        IF FOUND THEN
            INSERT INTO menu_permissions (menu_item_id, role_id, can_view, can_create, can_edit, can_delete)
            SELECT 
                (SELECT id FROM menu_items WHERE path = '/admin/bugs'),
                id,
                TRUE, TRUE, TRUE, TRUE
            FROM user_roles
            WHERE name = 'Administrator';
        END IF;
    END IF;
END $$;
