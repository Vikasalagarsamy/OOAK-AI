-- Function to get menu permissions for a specific user
CREATE OR REPLACE FUNCTION get_user_menu_permissions(p_user_id INTEGER)
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
  -- Get the user's role
  DECLARE v_role_id INTEGER;
  
  SELECT role_id INTO v_role_id
  FROM user_accounts
  WHERE id = p_user_id;
  
  -- Return menu items with permissions for this role
  RETURN QUERY
  SELECT 
    mi.id AS menu_item_id,
    mi.parent_id,
    mi.name AS menu_name,
    mi.path AS menu_path,
    mi.icon,
    mi.is_visible,
    COALESCE(rmp.can_view, FALSE) AS can_view,
    COALESCE(rmp.can_add, FALSE) AS can_add,
    COALESCE(rmp.can_edit, FALSE) AS can_edit,
    COALESCE(rmp.can_delete, FALSE) AS can_delete
  FROM 
    menu_items mi
  LEFT JOIN 
    role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = v_role_id
  WHERE
    -- For admin role (usually ID 1), show all menu items
    (v_role_id = 1 OR COALESCE(rmp.can_view, FALSE) = TRUE)
  ORDER BY 
    mi.sort_order;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a user has a specific permission for a menu path
CREATE OR REPLACE FUNCTION check_user_menu_permission(
  p_user_id INTEGER,
  p_menu_path TEXT,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_role_id INTEGER;
  v_has_permission BOOLEAN;
BEGIN
  -- Get the user's role
  SELECT role_id INTO v_role_id
  FROM user_accounts
  WHERE id = p_user_id;
  
  -- Check if the user has the specified permission for the menu path
  SELECT 
    CASE 
      WHEN p_permission = 'view' THEN COALESCE(rmp.can_view, FALSE)
      WHEN p_permission = 'add' THEN COALESCE(rmp.can_add, FALSE)
      WHEN p_permission = 'edit' THEN COALESCE(rmp.can_edit, FALSE)
      WHEN p_permission = 'delete' THEN COALESCE(rmp.can_delete, FALSE)
      ELSE FALSE
    END INTO v_has_permission
  FROM 
    menu_items mi
  LEFT JOIN 
    role_menu_permissions rmp ON mi.id = rmp.menu_item_id AND rmp.role_id = v_role_id
  WHERE 
    mi.path = p_menu_path;
    
  -- Admin role (usually ID 1) has all permissions
  IF v_role_id = 1 THEN
    RETURN TRUE;
  END IF;
  
  RETURN COALESCE(v_has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;
