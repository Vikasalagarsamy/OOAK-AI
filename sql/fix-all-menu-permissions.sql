-- Step 1: Ensure all menu items are visible
UPDATE menu_items SET is_visible = TRUE WHERE is_visible = FALSE;

-- Step 2: Ensure Administrator role (ID 1) has ALL permissions for ALL menu items
-- First, delete any existing permissions to start fresh
DELETE FROM role_menu_permissions WHERE role_id = 1;

-- Then insert full permissions for all menu items
INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
SELECT 
    1 as role_id, 
    id as menu_item_id, 
    TRUE as can_view,
    TRUE as can_add,
    TRUE as can_edit,
    TRUE as can_delete
FROM 
    menu_items;

-- Step 3: Fix any broken parent-child relationships
-- Find orphaned menu items (items with non-existent parent_id)
UPDATE menu_items 
SET parent_id = NULL
WHERE parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM menu_items p WHERE p.id = menu_items.parent_id
);

-- Step 4: Ensure all menu items have a proper sort_order
UPDATE menu_items mi
SET sort_order = subquery.new_sort
FROM (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY COALESCE(parent_id, 0) 
        ORDER BY COALESCE(sort_order, 999999), name
    ) as new_sort
    FROM menu_items
) as subquery
WHERE mi.id = subquery.id;

-- Step 5: Create a function to get user menu permissions that bypasses caching
CREATE OR REPLACE FUNCTION get_admin_menu_permissions()
RETURNS TABLE (
    menu_item_id INTEGER,
    parent_id INTEGER,
    menu_name TEXT,
    menu_path TEXT,
    icon TEXT,
    is_visible BOOLEAN,
    can_view BOOLEAN,
    can_add BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mi.id as menu_item_id,
        mi.parent_id,
        mi.name as menu_name,
        mi.path as menu_path,
        mi.icon,
        mi.is_visible,
        TRUE as can_view,
        TRUE as can_add,
        TRUE as can_edit,
        TRUE as can_delete
    FROM 
        menu_items mi
    ORDER BY
        COALESCE(mi.parent_id, 0), mi.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create a direct function to get all menu items for a specific user
CREATE OR REPLACE FUNCTION get_direct_user_menu(p_user_id INTEGER)
RETURNS TABLE (
    menu_item_id INTEGER,
    parent_id INTEGER,
    menu_name TEXT,
    menu_path TEXT,
    icon TEXT,
    is_visible BOOLEAN,
    can_view BOOLEAN,
    can_add BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN
) AS $$
DECLARE
    v_role_id INTEGER;
    v_is_admin BOOLEAN;
BEGIN
    -- Get the user's role
    SELECT role_id INTO v_role_id
    FROM user_accounts
    WHERE id = p_user_id;
    
    -- Check if user is admin
    SELECT (title = 'Administrator' OR id = 1) INTO v_is_admin
    FROM roles
    WHERE id = v_role_id;
    
    -- If admin, return all menu items with full permissions
    IF v_is_admin THEN
        RETURN QUERY
        SELECT * FROM get_admin_menu_permissions();
    ELSE
        -- For non-admin users, return items based on role permissions
        RETURN QUERY
        SELECT 
            mi.id as menu_item_id,
            mi.parent_id,
            mi.name as menu_name,
            mi.path as menu_path,
            mi.icon,
            mi.is_visible,
            COALESCE(rmp.can_view, FALSE) as can_view,
            COALESCE(rmp.can_add, FALSE) as can_add,
            COALESCE(rmp.can_edit, FALSE) as can_edit,
            COALESCE(rmp.can_delete, FALSE) as can_delete
        FROM 
            menu_items mi
        LEFT JOIN 
            role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = v_role_id
        WHERE 
            mi.is_visible = TRUE
            AND COALESCE(rmp.can_view, FALSE) = TRUE
        ORDER BY
            COALESCE(mi.parent_id, 0), mi.sort_order;
    END IF;
END;
$$ LANGUAGE plpgsql;
