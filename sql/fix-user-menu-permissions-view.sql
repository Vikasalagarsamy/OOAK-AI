-- First, check if the user_menu_permissions view exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'user_menu_permissions') THEN
    -- Drop the existing view
    DROP VIEW user_menu_permissions;
  END IF;
  
  -- Create a new view with proper permission filtering
  CREATE OR REPLACE VIEW user_menu_permissions AS
  SELECT 
    ua.id AS user_id,
    ua.username,
    r.id AS role_id,
    r.title AS role_title,
    mi.id AS menu_item_id,
    mi.name AS menu_name,
    mi.path AS menu_path,
    mi.parent_id,
    mi.icon,
    mi.is_visible,
    rmp.can_view,
    rmp.can_add,
    rmp.can_edit,
    rmp.can_delete
  FROM 
    user_accounts ua
    JOIN roles r ON ua.role_id = r.id
    JOIN role_menu_permissions rmp ON r.id = rmp.role_id
    JOIN menu_items mi ON rmp.menu_item_id = mi.id
  WHERE 
    ua.is_active = true 
    AND mi.is_visible = true
    AND rmp.can_view = true;  -- Only include items the user can view
END $$;

-- Create or replace the get_user_menu_permissions function to use the updated view
CREATE OR REPLACE FUNCTION get_user_menu_permissions(p_user_id TEXT)
RETURNS TABLE (
  menu_item_id INTEGER,
  menu_name TEXT,
  menu_path TEXT,
  parent_id INTEGER,
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
    ump.menu_item_id,
    ump.menu_name,
    ump.menu_path,
    ump.parent_id,
    ump.icon,
    ump.is_visible,
    ump.can_view,
    ump.can_add,
    ump.can_edit,
    ump.can_delete
  FROM 
    user_menu_permissions ump
  WHERE 
    ump.user_id = p_user_id
  ORDER BY 
    ump.parent_id NULLS FIRST, 
    ump.menu_name;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the check_user_menu_permission function
CREATE OR REPLACE FUNCTION check_user_menu_permission(
  p_user_id TEXT,
  p_menu_path TEXT,
  p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is an administrator (role_id = 1 or title = 'Administrator')
  SELECT EXISTS (
    SELECT 1 FROM user_accounts ua
    JOIN roles r ON ua.role_id = r.id
    WHERE ua.id = p_user_id AND (r.id = 1 OR LOWER(r.title) = 'administrator')
  ) INTO v_is_admin;
  
  -- Administrators have all permissions
  IF v_is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  CASE p_permission
    WHEN 'view' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_view = TRUE
      ) INTO v_has_permission;
    WHEN 'add' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_add = TRUE
      ) INTO v_has_permission;
    WHEN 'edit' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_edit = TRUE
      ) INTO v_has_permission;
    WHEN 'delete' THEN
      SELECT EXISTS (
        SELECT 1 FROM user_menu_permissions
        WHERE user_id = p_user_id AND menu_path = p_menu_path AND can_delete = TRUE
      ) INTO v_has_permission;
    ELSE
      v_has_permission := FALSE;
  END CASE;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;
