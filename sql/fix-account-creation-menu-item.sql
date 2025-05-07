-- Check if the account creation menu item exists
DO $$
DECLARE
    organization_id INT;
    account_creation_id INT;
BEGIN
    -- Get the organization menu item ID
    SELECT id INTO organization_id FROM menu_items WHERE name = 'Organization' OR path = '/organization';
    
    -- Check if account creation menu item exists
    SELECT id INTO account_creation_id FROM menu_items 
    WHERE (name = 'Account Creation' OR name LIKE '%Account Creation%') 
    AND (parent_id = organization_id OR path LIKE '/organization/%');
    
    -- If account creation menu item doesn't exist, create it
    IF account_creation_id IS NULL THEN
        INSERT INTO menu_items (
            parent_id, 
            name, 
            path, 
            icon, 
            is_visible, 
            sort_order
        ) VALUES (
            organization_id,
            'Account Creation',
            '/organization/account-creation',
            'user-plus',
            true,
            70
        )
        RETURNING id INTO account_creation_id;
        
        RAISE NOTICE 'Created Account Creation menu item with ID %', account_creation_id;
    ELSE
        -- Update the existing account creation menu item to ensure it's visible
        UPDATE menu_items
        SET 
            is_visible = true,
            path = '/organization/account-creation',
            icon = COALESCE(icon, 'user-plus')
        WHERE id = account_creation_id;
        
        RAISE NOTICE 'Updated Account Creation menu item with ID %', account_creation_id;
    END IF;
    
    -- Ensure Administrator role has permissions for this menu item
    -- First, get the Administrator role ID
    DECLARE
        admin_role_id INT;
    BEGIN
        SELECT id INTO admin_role_id FROM roles WHERE title = 'Administrator' OR title = 'Admin';
        
        IF admin_role_id IS NOT NULL THEN
            -- Check if permission exists
            IF NOT EXISTS (
                SELECT 1 FROM role_menu_permissions 
                WHERE role_id = admin_role_id AND menu_item_id = account_creation_id
            ) THEN
                -- Insert permission
                INSERT INTO role_menu_permissions (
                    role_id,
                    menu_item_id,
                    can_view,
                    can_add,
                    can_edit,
                    can_delete
                ) VALUES (
                    admin_role_id,
                    account_creation_id,
                    true,
                    true,
                    true,
                    true
                );
                
                RAISE NOTICE 'Added permissions for Administrator role';
            ELSE
                -- Update permission
                UPDATE role_menu_permissions
                SET 
                    can_view = true,
                    can_add = true,
                    can_edit = true,
                    can_delete = true
                WHERE role_id = admin_role_id AND menu_item_id = account_creation_id;
                
                RAISE NOTICE 'Updated permissions for Administrator role';
            END IF;
        ELSE
            RAISE NOTICE 'Administrator role not found';
        END IF;
    END;
END $$;
