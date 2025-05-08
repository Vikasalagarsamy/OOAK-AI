-- Check if we need to add any columns to the role_menu_permissions table
DO $$
BEGIN
  -- Add created_by and updated_by columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'role_menu_permissions' 
                AND column_name = 'created_by') THEN
    ALTER TABLE role_menu_permissions ADD COLUMN created_by UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'role_menu_permissions' 
                AND column_name = 'updated_by') THEN
    ALTER TABLE role_menu_permissions ADD COLUMN updated_by UUID;
  END IF;
  
  -- Add a description column to role_menu_permissions if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'role_menu_permissions' 
                AND column_name = 'description') THEN
    ALTER TABLE role_menu_permissions ADD COLUMN description TEXT;
  END IF;
END
$$;

-- Create a function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers exist for timestamp updates
DO $$
BEGIN
  -- For role_menu_permissions
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_role_menu_permissions_timestamp') THEN
    CREATE TRIGGER update_role_menu_permissions_timestamp
    BEFORE UPDATE ON role_menu_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  END IF;
  
  -- For menu_items
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_items_timestamp') THEN
    CREATE TRIGGER update_menu_items_timestamp
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  END IF;
  
  -- For roles
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_roles_timestamp') THEN
    CREATE TRIGGER update_roles_timestamp
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
  END IF;
END
$$;

-- Create a view to simplify permission queries
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
JOIN 
  roles r ON ua.role_id = r.id
JOIN 
  role_menu_permissions rmp ON r.id = rmp.role_id
JOIN 
  menu_items mi ON rmp.menu_item_id = mi.id
WHERE 
  ua.is_active = true
  AND mi.is_visible = true;

-- Create a function to get all menu items with permissions for a specific user
CREATE OR REPLACE FUNCTION get_user_menu_permissions(p_user_id UUID)
RETURNS TABLE (
  menu_item_id INTEGER,
  menu_name VARCHAR,
  menu_path VARCHAR,
  parent_id INTEGER,
  icon VARCHAR,
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

-- Create a function to check if a user has permission for a specific menu item
CREATE OR REPLACE FUNCTION check_user_menu_permission(
  p_user_id UUID,
  p_menu_path VARCHAR,
  p_permission VARCHAR DEFAULT 'view'
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
    WHERE ua.id = p_user_id AND (r.id = 1 OR r.title = 'Administrator')
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

-- Ensure all roles have permissions for all menu items
DO $$
DECLARE
  v_role RECORD;
  v_menu_item RECORD;
BEGIN
  -- For each role
  FOR v_role IN SELECT id FROM roles LOOP
    -- For each menu item
    FOR v_menu_item IN SELECT id FROM menu_items LOOP
      -- Check if permission exists
      IF NOT EXISTS (
        SELECT 1 FROM role_menu_permissions 
        WHERE role_id = v_role.id AND menu_item_id = v_menu_item.id
      ) THEN
        -- Insert default permission (only view for non-admin roles)
        INSERT INTO role_menu_permissions (
          role_id, 
          menu_item_id, 
          can_view, 
          can_add, 
          can_edit, 
          can_delete,
          created_at,
          updated_at
        )
        VALUES (
          v_role.id,
          v_menu_item.id,
          v_role.id = 1, -- Only admin gets view by default
          v_role.id = 1, -- Only admin gets add by default
          v_role.id = 1, -- Only admin gets edit by default
          v_role.id = 1, -- Only admin gets delete by default
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      END IF;
    END LOOP;
  END LOOP;
END
$$;
