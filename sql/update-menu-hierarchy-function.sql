-- Update the function to handle both UUID and integer IDs
CREATE OR REPLACE FUNCTION get_complete_menu_hierarchy(p_user_id TEXT)
RETURNS TABLE (
  id INTEGER,
  parent_id INTEGER,
  name TEXT,
  path TEXT,
  icon TEXT,
  is_visible BOOLEAN,
  sort_order INTEGER,
  can_view BOOLEAN,
  can_add BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN
) AS $$
DECLARE
  v_role_id INTEGER;
  v_is_admin BOOLEAN := FALSE;
BEGIN
  -- Try to get the user's role, handling both UUID and integer IDs
  BEGIN
    -- First try to get role_id assuming p_user_id is a UUID
    SELECT role_id INTO v_role_id 
    FROM user_accounts 
    WHERE id::TEXT = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, try to get role_id assuming p_user_id is an integer
    BEGIN
      SELECT role_id INTO v_role_id 
      FROM user_accounts 
      WHERE id::TEXT = p_user_id OR employee_id::TEXT = p_user_id;
    EXCEPTION WHEN OTHERS THEN
      -- If both attempts fail, log the error
      RAISE NOTICE 'Could not find user with ID: %', p_user_id;
    END;
  END;
  
  -- If we couldn't find the user, check if p_user_id is '1' which indicates admin
  IF v_role_id IS NULL AND p_user_id = '1' THEN
    v_is_admin := TRUE;
  ELSE
    -- Check if the role is Administrator
    v_is_admin := EXISTS (
      SELECT 1 FROM roles 
      WHERE id = v_role_id AND (title = 'Administrator' OR id = 1)
    );
  END IF;
  
  -- Handle administrator role specially to ensure they see EVERYTHING
  IF v_is_admin THEN
    -- Administrator role - show all menu items with full permissions
    RETURN QUERY
    SELECT 
      mi.id,
      mi.parent_id,
      mi.name,
      mi.path,
      mi.icon,
      mi.is_visible,
      mi.sort_order,
      TRUE as can_view,  -- Administrators always have all permissions
      TRUE as can_add,
      TRUE as can_edit,
      TRUE as can_delete
    FROM 
      menu_items mi
    ORDER BY 
      mi.parent_id NULLS FIRST, mi.sort_order;
  ELSE
    -- For non-administrators, use regular permissions
    RETURN QUERY
    SELECT 
      mi.id,
      mi.parent_id,
      mi.name,
      mi.path,
      mi.icon,
      mi.is_visible,
      mi.sort_order,
      COALESCE(rmp.can_view, FALSE),
      COALESCE(rmp.can_add, FALSE),
      COALESCE(rmp.can_edit, FALSE),
      COALESCE(rmp.can_delete, FALSE)
    FROM 
      menu_items mi
    LEFT JOIN 
      role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = v_role_id
    WHERE
      mi.is_visible = TRUE AND COALESCE(rmp.can_view, FALSE) = TRUE
    ORDER BY 
      mi.parent_id NULLS FIRST, mi.sort_order;
  END IF;
END;
$$ LANGUAGE plpgsql;
