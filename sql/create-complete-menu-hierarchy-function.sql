-- Function to get complete menu hierarchy with proper permissions
CREATE OR REPLACE FUNCTION get_complete_menu_hierarchy(p_user_id UUID)
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
  v_role_id UUID;
BEGIN
  -- Get the user's role
  SELECT role_id INTO v_role_id FROM user_accounts WHERE id = p_user_id;
  
  -- Handle administrator role specially to ensure they see EVERYTHING
  IF v_role_id = 1 OR EXISTS (SELECT 1 FROM roles WHERE id = v_role_id AND title = 'Administrator') THEN
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
